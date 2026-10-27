import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { healthResponseSchema } from '@devprofile/shared';
import { createTestApp } from './utils.js';

describe('GET /api/health (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('responds 200 with the database up', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(healthResponseSchema.parse(response.body)).toMatchObject({
      status: 'ok',
      checks: { database: 'up' },
    });
  });
});
