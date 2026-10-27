import 'server-only';
import {
  envelopeSchema,
  type Locale,
  publicPortfolioSchema,
  publicProjectSchema,
} from '@devprofile/shared';
import type { z } from 'zod';

// Server-side calls go straight to the api container, skipping Caddy.
const API_URL = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001';

/** Every content request carries this tag, so the admin can refresh pages on save. */
export const CONTENT_TAG = 'content';

export class ApiNotFoundError extends Error {}

async function getJson<T extends z.ZodType>(
  path: string,
  schema: T,
): Promise<z.output<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 60, tags: [CONTENT_TAG] },
  });
  if (res.status === 404) throw new ApiNotFoundError(path);
  if (!res.ok) throw new Error(`API ${path} answered ${res.status}`);
  return schema.parse(await res.json());
}

export function getPortfolio(locale: Locale) {
  return getJson(
    `/api/v1/portfolio?lang=${locale}`,
    envelopeSchema(publicPortfolioSchema),
  );
}

export function getProject(slug: string, locale: Locale) {
  return getJson(
    `/api/v1/projects/${encodeURIComponent(slug)}?lang=${locale}`,
    envelopeSchema(publicProjectSchema),
  );
}
