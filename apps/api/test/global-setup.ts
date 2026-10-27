import { execFileSync } from 'node:child_process';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

let container: StartedPostgreSqlContainer | undefined;

// One throwaway Postgres for the whole e2e run, migrated with the real migrations.
export async function setup(project: TestProject) {
  container = await new PostgreSqlContainer('postgres:18-alpine').start();
  const databaseUrl = container.getConnectionUri();

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  project.provide('databaseUrl', databaseUrl);
}

export async function teardown() {
  await container?.stop();
}
