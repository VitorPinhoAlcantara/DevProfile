import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { clientIp } from './client-ip.js';

// Named limits, registered once in AppModule. Each guarded route skips the
// limits that aren't its own (see @SkipThrottle on the controllers).
export const CONTACT_LIMIT = { name: 'contact', ttl: 10 * 60_000, limit: 5 };
export const LOGIN_LIMIT = { name: 'login', ttl: 15 * 60_000, limit: 10 };

/** Rate limits by the visitor's real IP (Cloudflare-aware). */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: Record<string, any>): Promise<string> {
    return Promise.resolve(clientIp(req as Request) ?? 'unknown');
  }
}
