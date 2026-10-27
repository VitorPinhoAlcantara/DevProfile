import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { portfolioSchema } from '@devprofile/shared';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { importPortfolio } from '../src/content/import-portfolio.js';
import { MediaStorage, mediaUrl } from '../src/media/media-storage.js';
import { portfolioSeed } from './seed-data.js';

// Loads the initial content once. Refuses to overwrite a database that already has
// content (edited through the admin) unless SEED_FORCE=1 is set.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const storage = new MediaStorage(prisma);
const seedMediaDir = join(import.meta.dirname, 'seed-media');

try {
  const existing = await prisma.profile.count();
  if (existing > 0 && process.env.SEED_FORCE !== '1') {
    console.log(
      'Seed skipped: content already exists (set SEED_FORCE=1 to replace it).',
    );
  } else {
    await importPortfolio(
      prisma,
      portfolioSchema.parse(portfolioSeed),
      async (file) => {
        const media = await storage.save(
          await readFile(join(seedMediaDir, file)),
          file,
        );
        return { id: media.id, url: mediaUrl(media.storageKey) };
      },
    );
    console.log('Seed done: portfolio content loaded.');
  }
} finally {
  await prisma.$disconnect();
}
