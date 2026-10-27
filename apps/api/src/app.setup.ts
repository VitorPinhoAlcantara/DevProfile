import { Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { z } from 'zod';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { ResponseContractInterceptor } from './common/response-contract.interceptor.js';

/** Caddy forwards /api/* untouched, so every route lives under this prefix. */
export const API_PREFIX = 'api';

// Shared by main.ts and the e2e tests so both expose the same app.
export function configureApp(app: NestExpressApplication) {
  // Validation messages in Portuguese, matching the rest of the API's errors.
  z.config(z.locales.pt());
  app.setGlobalPrefix(API_PREFIX);
  // Requests arrive through Caddy (and the Cloudflare tunnel) on the Docker network.
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');
  // CSP is off because the docs page loads the Scalar bundle from its CDN; the rest is JSON.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.useGlobalFilters(new ApiExceptionFilter());
  if (process.env.NODE_ENV !== 'production') {
    app.useGlobalInterceptors(
      new ResponseContractInterceptor(app.get(Reflector)),
    );
  }
  app.use(
    `/${API_PREFIX}/docs`,
    apiReference({
      url: `/${API_PREFIX}/openapi.json`,
      pageTitle: 'Portfolio API — Vitor Pinho Alcantara',
      theme: 'deepSpace',
      darkMode: true,
      // Keep the page about this API: no Scalar cloud, AI or SDK upsells.
      showDeveloperTools: 'never',
      hideClientButton: true,
      agent: { disabled: true },
      mcp: { disabled: true },
    }),
  );
}
