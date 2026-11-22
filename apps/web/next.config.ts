import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const dev = process.env.NODE_ENV === 'development';

// Next.js hydrates with inline scripts, so script-src needs 'unsafe-inline' without nonces;
// everything else (Umami under /m, media under /api) is same-origin.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${dev ? ' ws:' : ''}`,
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  // Trace files from the monorepo root so workspace packages end up in the standalone bundle.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // Not `no-referrer` like the api: Umami needs it to see internal navigation.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  // In production Caddy sends /api/* to the api before it reaches Next.js.
  // `next dev` has no Caddy in front, so it proxies those calls itself.
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    const api = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';
    return [{ source: '/api/:path*', destination: `${api}/api/:path*` }];
  },
};

export default withNextIntl(nextConfig);
