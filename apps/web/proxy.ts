import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip the API, the admin (not translated), internal hooks, Next internals and
  // files with an extension (images, robots.txt...).
  matcher: ['/((?!api|admin|internal|_next|_vercel|.*\\..*).*)'],
};
