import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Local development reads DATABASE_URL from apps/api/.env; Docker passes it as a real env var.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
