/** Public origin used for canonical URLs, sitemap and Open Graph. */
export const SITE_URL = (
  process.env.SITE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

/** Fallback photo until one is uploaded through the admin. */
export const DEFAULT_PHOTO = '/profile-photo.jpeg';
