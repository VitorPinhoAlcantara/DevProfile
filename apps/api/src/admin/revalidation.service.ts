import { Injectable, Logger } from '@nestjs/common';

export const REVALIDATE_HEADER = 'x-revalidate-token';
export const DEV_REVALIDATE_TOKEN = 'dev-revalidate-token';

/** Asks the site to drop its cached content right after a save. */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  async refreshSite() {
    const base = process.env.WEB_INTERNAL_URL ?? 'http://127.0.0.1:3000';
    try {
      const res = await fetch(`${base}/internal/revalidate`, {
        method: 'POST',
        headers: {
          [REVALIDATE_HEADER]:
            process.env.REVALIDATE_TOKEN ?? DEV_REVALIDATE_TOKEN,
        },
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) throw new Error(`answered ${res.status}`);
    } catch (error) {
      // The site still refreshes on its own within a minute; a save never fails over this.
      this.logger.warn(`Site revalidation failed: ${(error as Error).message}`);
    }
  }
}
