import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { ApiRoute } from '../common/api-route.decorator.js';
import { clientIp } from '../common/client-ip.js';
import { ValidParams } from '../common/validation.js';
import { exportPortfolio } from '../content/export-portfolio.js';
import { cvLinkTargets } from '../cv/cv-data.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LinksService, landingUrl, siteUrl } from './links.service.js';

const segment = z.string().max(80);
const redirectParams = z.object({ slug: segment, key: segment.optional() });

/** Public short links, served at `/r/*` by Caddy (rewritten to `/api/r/*`). */
@Controller('r')
export class RedirectController {
  constructor(
    private readonly links: LinksService,
    private readonly prisma: PrismaService,
  ) {}

  @Get([':slug', ':slug/:key'])
  @ApiRoute({
    summary: 'Link curto',
    description:
      'Leva ao site com os parâmetros UTM do link. `/<slug>/en` abre o site em inglês; `/<slug>/<chave>` leva a um link externo do currículo (GitHub, LinkedIn, projetos) e conta o clique. Slug desconhecido leva à página inicial.',
    tags: ['Links'],
    responses: { 302: { description: 'Redirecionamento' } },
  })
  async go(
    @ValidParams(redirectParams) { slug, key }: z.infer<typeof redirectParams>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const link = await this.links.find(slug);
    if (!link) return res.redirect(302, `${siteUrl()}/`);
    this.links.countClick(link.id);

    if (!key) return res.redirect(302, landingUrl(link));
    if (key === 'pt' || key === 'en')
      return res.redirect(302, landingUrl(link, key));

    const target = cvLinkTargets(await exportPortfolio(this.prisma)).get(key);
    if (!target) return res.redirect(302, landingUrl(link));
    this.links.reportOutboundClick(link, key, {
      userAgent: req.headers['user-agent'],
      ip: clientIp(req),
      language: req.headers['accept-language'],
    });
    return res.redirect(302, target);
  }
}
