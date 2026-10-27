import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // Specs share one database, so they run one file at a time.
    fileParallelism: false,
    hookTimeout: 120_000,
  },
});
