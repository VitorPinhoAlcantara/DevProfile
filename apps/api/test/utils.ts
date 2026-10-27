import { mkdtempSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inject } from 'vitest';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaPg } from '@prisma/adapter-pg';
import { portfolioSchema } from '@devprofile/shared';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import {
  importPortfolio,
  type MediaResolver,
} from '../src/content/import-portfolio.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { MediaStorage, mediaUrl } from '../src/media/media-storage.js';
import { portfolioSeed } from '../prisma/seed-data.js';

// Uploaded files go to a throwaway folder, never to apps/api/uploads.
process.env.MEDIA_DIR ??= mkdtempSync(join(tmpdir(), 'devprofile-test-media-'));
// No site to refresh in tests: point revalidation at a closed port so it fails fast.
process.env.WEB_INTERNAL_URL ??= 'http://127.0.0.1:9';

/** Stores files from prisma/seed-media, like the real seed does. */
export function seedMediaResolver(prisma: PrismaClient): MediaResolver {
  const storage = new MediaStorage(prisma);
  return async (file) => {
    const media = await storage.save(
      await readFile(join(import.meta.dirname, '../prisma/seed-media', file)),
      file,
    );
    return { id: media.id, url: mediaUrl(media.storageKey) };
  };
}

/** Boots the real app against the Testcontainers database. */
export async function createTestApp() {
  process.env.DATABASE_URL = inject('databaseUrl');
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();
  return app;
}

export function createTestPrisma() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: inject('databaseUrl') }),
  });
}

export async function loadSeed(prisma: PrismaClient) {
  const content = portfolioSchema.parse(portfolioSeed);
  await importPortfolio(prisma, content, seedMediaResolver(prisma));
  return content;
}
