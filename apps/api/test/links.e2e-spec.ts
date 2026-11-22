import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { ADMIN_HEADER, shortLinkSchema } from '@devprofile/shared';
import { hashPassword } from '../src/auth/crypto.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { LinksService } from '../src/links/links.service.js';
import { createTestApp, createTestPrisma, loadSeed } from './utils.js';

const EMAIL = 'links@example.com';
const PASSWORD = 'uma-senha-bem-comprida';

describe('short links (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaClient;
  let cookie: string;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    process.env.SITE_URL = 'https://site.test';
    prisma = createTestPrisma();
    await loadSeed(prisma);
    await prisma.shortLink.deleteMany({ where: { slug: 'empresa-x' } });
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.user.create({
      data: { email: EMAIL, passwordHash: await hashPassword(PASSWORD) },
    });
    app = await createTestApp();
    const res = await http()
      .post('/api/admin/auth/login')
      .set('CF-Connecting-IP', '198.51.100.77')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
    const setCookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    cookie = setCookie.find((c) => c.startsWith('dp_session='))!.split(';')[0]!;
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('ships the default CV and profile links', async () => {
    const slugs = (await prisma.shortLink.findMany()).map((l) => l.slug);
    expect(slugs).toEqual(
      expect.arrayContaining(['curriculo', 'linkedin', 'github']),
    );
  });

  it('creates a CV link for a company from the admin', async () => {
    const res = await http()
      .post('/api/admin/links')
      .set('Cookie', cookie)
      .set(ADMIN_HEADER, '1')
      .send({
        slug: 'Empresa-X',
        source: 'empresa-x',
        medium: 'curriculo',
        campaign: 'vaga-backend',
      })
      .expect(201);
    const link = shortLinkSchema.parse(res.body);
    expect(link).toMatchObject({
      slug: 'empresa-x',
      destination: '/',
      url: 'https://site.test/r/empresa-x',
      clicks: 0,
    });

    await http()
      .post('/api/admin/links')
      .set('Cookie', cookie)
      .set(ADMIN_HEADER, '1')
      .send({ slug: 'empresa-x', source: 'a', medium: 'b' })
      .expect(409);
  });

  it('refuses destinations outside the site', async () => {
    await http()
      .post('/api/admin/links')
      .set('Cookie', cookie)
      .set(ADMIN_HEADER, '1')
      .send({
        slug: 'fora',
        source: 'a',
        medium: 'b',
        destination: '//evil.example',
      })
      .expect(400);
  });

  it('lands on the site with UTM parameters and counts the click', async () => {
    const res = await http().get('/api/r/empresa-x').expect(302);
    expect(res.headers.location).toBe(
      'https://site.test/?utm_source=empresa-x&utm_medium=curriculo&utm_campaign=vaga-backend',
    );
    const en = await http().get('/api/r/empresa-x/en').expect(302);
    expect(en.headers.location).toMatch(
      /^https:\/\/site\.test\/en\?.*utm_content=en/,
    );
    const link = await prisma.shortLink.findUnique({
      where: { slug: 'empresa-x' },
    });
    expect(link?.clicks).toBeGreaterThanOrEqual(1);
  });

  it('sends CV links to their real destination', async () => {
    const res = await http().get('/api/r/empresa-x/github').expect(302);
    expect(res.headers.location).toMatch(/^https:\/\/github\.com\//);
  });

  it('falls back to the home page for unknown slugs and keys', async () => {
    const unknown = await http().get('/api/r/nao-existe').expect(302);
    expect(unknown.headers.location).toBe('https://site.test/');
    const key = await http().get('/api/r/empresa-x/nada').expect(302);
    expect(key.headers.location).toMatch(/utm_source=empresa-x/);
  });

  it('routes a personalized CV through its link', async () => {
    await http().get('/api/v1/cv?format=docx&link=empresa-x').expect(200);
    const { linker } = await app.get(LinksService).cvLinker('empresa-x', 'en');
    expect(linker?.('github', 'https://github.com/u')).toBe(
      'https://site.test/r/empresa-x/github',
    );
    expect(linker?.('website', 'https://site.test/?ref=x')).toBe(
      'https://site.test/r/empresa-x/en',
    );
    expect(linker?.('email', 'mailto:a@b.com')).toBe('mailto:a@b.com');
  });
});
