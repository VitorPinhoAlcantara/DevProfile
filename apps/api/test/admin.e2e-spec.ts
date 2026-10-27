import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Secret, TOTP } from 'otpauth';
import request from 'supertest';
import {
  ADMIN_HEADER,
  type AdminContent,
  adminContentSchema,
  apiErrorSchema,
  historyEntrySchema,
  mediaItemSchema,
  totpSetupSchema,
} from '@devprofile/shared';
import { hashPassword } from '../src/auth/crypto.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { createTestApp, createTestPrisma, loadSeed } from './utils.js';

const EMAIL = 'admin@example.com';
const PASSWORD = 'uma-senha-bem-comprida';
const seedImage = join(
  import.meta.dirname,
  '../prisma/seed-media/grafeno-home.jpg',
);

describe('admin API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaClient;
  let cookie: string;

  const http = () => request(app.getHttpServer());
  const authed = {
    get: (path: string) => http().get(path).set('Cookie', cookie),
    put: (path: string) =>
      http().put(path).set('Cookie', cookie).set(ADMIN_HEADER, '1'),
    post: (path: string) =>
      http().post(path).set('Cookie', cookie).set(ADMIN_HEADER, '1'),
    patch: (path: string) =>
      http().patch(path).set('Cookie', cookie).set(ADMIN_HEADER, '1'),
    delete: (path: string) =>
      http().delete(path).set('Cookie', cookie).set(ADMIN_HEADER, '1'),
  };

  const login = (body: object) =>
    http()
      .post('/api/admin/auth/login')
      .set('CF-Connecting-IP', `198.51.100.${Math.floor(Math.random() * 200)}`)
      .send(body);

  beforeAll(async () => {
    prisma = createTestPrisma();
    await loadSeed(prisma);
    await prisma.session.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.user.create({
      data: { email: EMAIL, passwordHash: await hashPassword(PASSWORD) },
    });
    app = await createTestApp();

    const res = await login({ email: EMAIL, password: PASSWORD }).expect(200);
    const setCookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    cookie = setCookie.find((c) => c.startsWith('dp_session='))!.split(';')[0]!;
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  describe('authentication', () => {
    it('rejects a wrong password without saying which part was wrong', async () => {
      const res = await login({ email: EMAIL, password: 'errada' }).expect(401);
      expect(apiErrorSchema.parse(res.body).error.code).toBe(
        'INVALID_CREDENTIALS',
      );

      const unknown = await login({
        email: 'x@y.com',
        password: 'errada',
      }).expect(401);
      expect(unknown.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('sets an httpOnly session cookie scoped to the API', async () => {
      const res = await login({ email: EMAIL, password: PASSWORD }).expect(200);
      const setCookie = ([] as string[])
        .concat(res.headers['set-cookie'] ?? [])
        .join(';');

      expect(setCookie).toMatch(/HttpOnly/i);
      expect(setCookie).toMatch(/SameSite=Lax/i);
      expect(setCookie).toMatch(/Path=\/api/i);
    });

    it('blocks admin routes without a session', async () => {
      const res = await http().get('/api/admin/content').expect(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('requires the CSRF header on writes', async () => {
      const res = await http()
        .put('/api/admin/content')
        .set('Cookie', cookie)
        .send({})
        .expect(403);
      expect(res.body.error.code).toBe('CSRF_HEADER_MISSING');
    });

    it('returns the logged-in admin', async () => {
      const res = await authed.get('/api/admin/auth/me').expect(200);
      expect(res.body).toEqual({ email: EMAIL, totpEnabled: false });
    });
  });

  describe('content', () => {
    let current: AdminContent;

    beforeEach(async () => {
      const res = await authed.get('/api/admin/content').expect(200);
      current = adminContentSchema.parse(res.body);
    });

    it('round-trips the whole portfolio without changes', async () => {
      const saved = await authed
        .put('/api/admin/content')
        .send({ content: current.content, version: current.version });
      expect(saved.body).toEqual({ version: expect.any(String) });
      const again = adminContentSchema.parse(
        (await authed.get('/api/admin/content').expect(200)).body,
      );

      expect(again.content).toEqual(current.content);
    });

    it('saves edits, shows them on the public API and records history', async () => {
      const edited = structuredClone(current.content);
      edited.profile.headline.pt = 'Desenvolvedor Back-end';

      const saved = await authed
        .put('/api/admin/content')
        .send({ content: edited, version: current.version })
        .expect(200);
      expect(saved.body.version).not.toBe(current.version);

      const profile = await http().get('/api/v1/profile').expect(200);
      expect(profile.body.data.headline).toBe('Desenvolvedor Back-end');

      const history = historyEntrySchema
        .array()
        .parse((await authed.get('/api/admin/history').expect(200)).body);
      expect(history[0]).toMatchObject({
        action: 'UPDATE',
        actor: EMAIL,
        changed: ['profile'],
      });

      // Undo brings the old headline back.
      await authed
        .post(`/api/admin/history/${history[0]!.id}/restore`)
        .expect(201);
      const restored = await http().get('/api/v1/profile').expect(200);
      expect(restored.body.data.headline).toBe(
        current.content.profile.headline.pt,
      );
    });

    it('refuses a save based on an outdated version', async () => {
      const res = await authed
        .put('/api/admin/content')
        .send({ content: current.content, version: '2000-01-01T00:00:00.000Z' })
        .expect(409);
      expect(res.body.error.code).toBe('VERSION_CONFLICT');
    });

    it('validates the document with the shared schema', async () => {
      const broken = structuredClone(current.content);
      broken.projects[0]!.skills = ['Cobol'];

      const res = await authed
        .put('/api/admin/content')
        .send({ content: broken, version: current.version })
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('media', () => {
    it('uploads an image, uses it as a cover and refuses to delete it while in use', async () => {
      const upload = await authed
        .post('/api/admin/media')
        .attach('file', await readFile(seedImage), 'shot.jpg')
        .expect(201);
      const media = mediaItemSchema.parse(upload.body);

      const { content, version } = adminContentSchema.parse(
        (await authed.get('/api/admin/content').expect(200)).body,
      );
      content.projects[0]!.cover = media.ref;
      await authed
        .put('/api/admin/content')
        .send({ content, version })
        .expect(200);

      const project = await http()
        .get(`/api/v1/projects/${content.projects[0]!.slug}`)
        .expect(200);
      expect(project.body.data.coverUrl).toBe(media.url);

      const blocked = await authed
        .delete(`/api/admin/media/${media.key}`)
        .expect(409);
      expect(blocked.body.error.code).toBe('MEDIA_IN_USE');
    });

    it('rejects files that are not images', async () => {
      const res = await authed
        .post('/api/admin/media')
        .attach('file', Buffer.from('not an image'), 'notes.txt')
        .expect(400);
      expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA');
    });

    it('refuses covers that point at unknown images', async () => {
      const { content, version } = adminContentSchema.parse(
        (await authed.get('/api/admin/content').expect(200)).body,
      );
      content.projects[0]!.cover = `media:${'a'.repeat(32)}.jpg`;

      const res = await authed
        .put('/api/admin/content')
        .send({ content, version })
        .expect(400);
      expect(res.body.error.code).toBe('UNKNOWN_MEDIA');
    });
  });

  describe('messages', () => {
    it('lists, marks as read and deletes contact messages', async () => {
      const created = await prisma.contactMessage.create({
        data: {
          name: 'Ana',
          email: 'ana@empresa.com',
          message: 'Olá, tudo bem? Vamos conversar.',
        },
      });

      const list = await authed.get('/api/admin/messages').expect(200);
      expect(list.body.map((m: { id: string }) => m.id)).toContain(created.id);

      const read = await authed
        .patch(`/api/admin/messages/${created.id}`)
        .send({ read: true })
        .expect(200);
      expect(read.body.readAt).not.toBeNull();

      await authed.delete(`/api/admin/messages/${created.id}`).expect(204);
      expect(
        await prisma.contactMessage.count({ where: { id: created.id } }),
      ).toBe(0);
    });
  });

  describe('two-factor authentication', () => {
    it('enables TOTP and then requires a code to log in', async () => {
      const setup = totpSetupSchema.parse(
        (await authed.post('/api/admin/auth/totp/setup').expect(201)).body,
      );
      const totp = new TOTP({ secret: Secret.fromBase32(setup.secret) });

      await authed
        .post('/api/admin/auth/totp/enable')
        .send({ code: totp.generate() })
        .expect(204);

      const withoutCode = await login({
        email: EMAIL,
        password: PASSWORD,
      }).expect(401);
      expect(withoutCode.body.error.code).toBe('TOTP_REQUIRED');

      await login({
        email: EMAIL,
        password: PASSWORD,
        totp: totp.generate(),
      }).expect(200);

      const stored = await prisma.user.findUniqueOrThrow({
        where: { email: EMAIL },
      });
      expect(stored.totpSecret).not.toContain(setup.secret);
    });
  });
});
