import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { CONTENT_TAG } from '@/lib/api';

// Called by the api after the admin saves. Caddy doesn't expose /internal/*, and
// the shared token keeps anything else on the Docker network from calling it.
const expectedToken = process.env.REVALIDATE_TOKEN ?? 'dev-revalidate-token';

function tokenMatches(received: string | null) {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expectedToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!tokenMatches(request.headers.get('x-revalidate-token'))) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  // Expire right away: the admin expects to see the change on the next visit.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return Response.json({ revalidated: true });
}
