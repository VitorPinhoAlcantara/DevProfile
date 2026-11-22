import { Injectable, Logger } from '@nestjs/common';
import type { Locale, ShortLink as ShortLinkDto } from '@devprofile/shared';
import type { ShortLink } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CvLinker } from '../cv/cv-data.js';

/** The link the public CV download uses when no other is asked for. */
export const DEFAULT_CV_LINK = 'curriculo';

export const siteUrl = () =>
  (process.env.SITE_URL ?? 'http://localhost:7635').replace(/\/$/, '');

export const toShortLinkDto = (link: ShortLink): ShortLinkDto => ({
  id: link.id,
  slug: link.slug,
  source: link.source,
  medium: link.medium,
  campaign: link.campaign,
  destination: link.destination,
  note: link.note,
  clicks: link.clicks,
  url: `${siteUrl()}/r/${link.slug}`,
  createdAt: link.createdAt.toISOString(),
});

/** Landing address with the link's UTM parameters; `lang` picks the English site. */
export function landingUrl(link: ShortLink, lang?: 'pt' | 'en') {
  let path = link.destination;
  if (lang === 'en' && !/^\/en(\/|$|\?)/.test(path))
    path = path === '/' ? '/en' : `/en${path}`;
  const url = new URL(path, siteUrl());
  url.searchParams.set('utm_source', link.source);
  url.searchParams.set('utm_medium', link.medium);
  if (link.campaign) url.searchParams.set('utm_campaign', link.campaign);
  if (lang) url.searchParams.set('utm_content', lang);
  return url.toString();
}

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);

  constructor(private readonly prisma: PrismaService) {}

  find(slug: string) {
    return this.prisma.shortLink.findUnique({
      where: { slug: slug.toLowerCase() },
    });
  }

  /** Same-site links go to the landing page; the rest through `/r/<slug>/<key>`. */
  async cvLinker(slug: string | undefined, locale: Locale) {
    const link =
      (slug ? await this.find(slug) : null) ??
      (await this.find(DEFAULT_CV_LINK));
    if (!link) return { slug: null, linker: undefined };
    const site = new URL(siteUrl());
    const lang = locale === 'en' ? 'en' : 'pt';
    const linker: CvLinker = (key, href) => {
      if (!/^https?:\/\//.test(href)) return href;
      return new URL(href).host === site.host
        ? `${site.origin}/r/${link.slug}${lang === 'en' ? '/en' : ''}`
        : `${site.origin}/r/${link.slug}/${key}`;
    };
    return { slug: link.slug, linker };
  }

  countClick(id: string) {
    this.prisma.shortLink
      .update({ where: { id }, data: { clicks: { increment: 1 } } })
      .catch((error: unknown) =>
        this.logger.warn(`Could not count a click: ${String(error)}`),
      );
  }

  /**
   * External CV links never reach a page with the tracker, so the redirect reports
   * the click to Umami itself. Off when UMAMI_UPSTREAM/UMAMI_WEBSITE_ID are unset.
   */
  reportOutboundClick(
    link: ShortLink,
    key: string,
    visitor: { userAgent?: string; ip: string | null; language?: string },
  ) {
    const upstream = process.env.UMAMI_UPSTREAM;
    const website = process.env.UMAMI_WEBSITE_ID;
    if (!upstream || !website || !visitor.userAgent) return;
    const data: Record<string, string> = {
      source: link.source,
      medium: link.medium,
      to: key,
    };
    if (link.campaign) data.campaign = link.campaign;
    fetch(`http://${upstream}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': visitor.userAgent,
        ...(visitor.ip ? { 'X-Forwarded-For': visitor.ip } : {}),
      },
      body: JSON.stringify({
        type: 'event',
        payload: {
          website,
          hostname: new URL(siteUrl()).hostname,
          url: `/r/${link.slug}/${key}`,
          language: visitor.language?.split(',')[0] ?? '',
          name: 'cv-link',
          data,
        },
      }),
      signal: AbortSignal.timeout(3000),
    }).catch((error: unknown) =>
      this.logger.warn(`Umami did not take the click: ${String(error)}`),
    );
  }
}
