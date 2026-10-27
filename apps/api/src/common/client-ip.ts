import type { Request } from 'express';

/**
 * The visitor's IP. Behind the Cloudflare tunnel every request reaches us from
 * cloudflared, so the real address comes from `CF-Connecting-IP`.
 */
export function clientIp(req: Request): string | null {
  const cloudflareIp = req.headers['cf-connecting-ip'];
  return typeof cloudflareIp === 'string' ? cloudflareIp : (req.ip ?? null);
}
