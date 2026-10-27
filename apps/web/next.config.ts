import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  // Trace files from the monorepo root so workspace packages end up in the standalone bundle.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  poweredByHeader: false,
  // In production Caddy sends /api/* to the api before it reaches Next.js.
  // `next dev` has no Caddy in front, so it proxies those calls itself.
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    const api = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';
    return [{ source: '/api/:path*', destination: `${api}/api/:path*` }];
  },
};

export default withNextIntl(nextConfig);
