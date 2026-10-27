import { ADMIN_HEADER, apiErrorSchema } from '@devprofile/shared';
import type { z } from 'zod';

/** An error answered by the API, with its machine-readable code. */
export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: { path: string; message: string }[] = [],
  ) {
    super(message);
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

/**
 * Browser-side calls to /api/admin/*. The session cookie travels on its own;
 * writes add the header the API's CSRF guard asks for.
 */
export async function adminFetch<T extends z.ZodType | undefined = undefined>(
  path: string,
  schema?: T,
  { method = 'GET', body }: Options = {},
): Promise<T extends z.ZodType ? z.output<T> : void> {
  const isForm = body instanceof FormData;
  const res = await fetch(`/api/admin${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(method === 'GET' ? {} : { [ADMIN_HEADER]: '1' }),
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
    },
    body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(await res.json().catch(() => null));
    throw new AdminApiError(
      res.status,
      parsed.data?.error.code ?? `HTTP_${res.status}`,
      parsed.data?.error.message ?? 'Algo deu errado. Tente de novo.',
      parsed.data?.error.details,
    );
  }
  if (!schema || res.status === 204) return undefined as never;
  return schema.parse(await res.json()) as never;
}
