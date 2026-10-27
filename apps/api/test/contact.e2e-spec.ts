import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { apiErrorSchema } from '@devprofile/shared';
import { CONTACT_LIMIT } from '../src/common/throttling.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { createTestApp, createTestPrisma } from './utils.js';

const validMessage = {
  name: 'Recrutadora Teste',
  email: 'rh@empresa.com.br',
  message: 'Olá! Gostaria de conversar sobre uma vaga de back-end.',
};

describe('POST /api/v1/contact (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrisma();
    app = await createTestApp();
  });

  beforeEach(async () => {
    await prisma.contactMessage.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  // Each test uses its own client IP so the rate limit doesn't leak between tests.
  const post = (body: object, ip: string) =>
    request(app.getHttpServer())
      .post('/api/v1/contact')
      .set('CF-Connecting-IP', ip)
      .send(body);

  it('stores a valid message and answers 202', async () => {
    const res = await post(validMessage, '203.0.113.1').expect(202);

    expect(res.body).toEqual({ data: { received: true } });
    const saved = await prisma.contactMessage.findMany();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ ...validMessage, ip: '203.0.113.1' });
  });

  it('returns field errors in Portuguese', async () => {
    const res = await post(
      { name: 'A', email: 'nope', message: 'oi' },
      '203.0.113.2',
    ).expect(400);
    const details = apiErrorSchema.parse(res.body).error.details ?? [];

    expect(details).toEqual(
      expect.arrayContaining([
        { path: 'email', message: 'Informe um e-mail válido.' },
      ]),
    );
    expect(await prisma.contactMessage.count()).toBe(0);
  });

  it('silently drops messages that fill the honeypot', async () => {
    await post({ ...validMessage, website: 'http://spam' }, '203.0.113.3');

    expect(await prisma.contactMessage.count()).toBe(0);
  });

  it('rate limits by client IP', async () => {
    for (let i = 0; i < CONTACT_LIMIT.limit; i++) {
      await post(validMessage, '203.0.113.4').expect(202);
    }
    const blocked = await post(validMessage, '203.0.113.4').expect(429);

    expect(apiErrorSchema.parse(blocked.body).error.code).toBe('RATE_LIMITED');
    // Another visitor is not affected.
    await post(validMessage, '203.0.113.5').expect(202);
  });
});
