import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { portfolioSchema } from '@devprofile/shared';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { importPortfolio } from '../src/content/import-portfolio.js';
import { MediaStorage, mediaUrl } from '../src/media/media-storage.js';
import { portfolioSeed } from '../prisma/seed-data.js';
import { createTestApp, createTestPrisma, seedMediaResolver } from './utils.js';

const seedImage = join(
  import.meta.dirname,
  '../prisma/seed-media/grafeno-home.jpg',
);

describe('media (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaClient;
  let storage: MediaStorage;

  beforeAll(async () => {
    prisma = createTestPrisma();
    // Start empty so stored files land in this run's media folder.
    await prisma.media.deleteMany();
    storage = new MediaStorage(prisma);
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('stores an image once, keyed by its content', async () => {
    const data = await readFile(seedImage);
    const first = await storage.save(data, 'a.jpg');
    const second = await storage.save(data, 'b.jpg');

    expect(second.id).toBe(first.id);
    expect(first.storageKey).toMatch(/^[a-f0-9]{32}\.jpg$/);
    expect(first).toMatchObject({
      mimeType: 'image/jpeg',
      width: 1440,
      height: 900,
    });
  });

  it('rejects files that are not images', async () => {
    await expect(storage.save(Buffer.from('hello'), 'x.txt')).rejects.toThrow();
  });

  it('serves stored images with long-lived caching', async () => {
    const media = await storage.save(await readFile(seedImage), 'a.jpg');

    const res = await request(app.getHttpServer())
      .get(mediaUrl(media.storageKey))
      .expect(200);

    expect(res.headers['content-type']).toBe('image/jpeg');
    expect(res.headers['cache-control']).toContain('immutable');
  });

  it('refuses keys that are not content hashes', async () => {
    await request(app.getHttpServer())
      .get('/api/media/..%2F..%2Fetc%2Fpasswd')
      .expect(400);
    await request(app.getHttpServer())
      .get(`/api/media/${'0'.repeat(32)}.jpg`)
      .expect(404);
  });

  it('resolves media references in project pages and covers on import', async () => {
    const content = portfolioSchema.parse(portfolioSeed);
    await importPortfolio(prisma, content, seedMediaResolver(prisma));

    const res = await request(app.getHttpServer())
      .get('/api/v1/projects/grafeno')
      .expect(200);
    const project = res.body.data as { coverUrl: string; body: string };

    expect(project.coverUrl).toMatch(/^\/api\/media\/[a-f0-9]{32}\.jpg$/);
    expect(project.body).not.toContain('media:');
    expect(project.body).toContain('/api/media/');
  });
});
