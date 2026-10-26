import type { INestApplication } from '@nestjs/common';

// Shared by main.ts and the e2e tests so both expose the same routes.
// Caddy forwards /api/* untouched, so every route lives under this prefix.
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
}
