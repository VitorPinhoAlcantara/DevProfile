import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import {
  apiErrorSchema,
  cvReportSchema,
  localeSchema,
} from '@devprofile/shared';
import { AdminGuard } from '../auth/admin.guard.js';
import { ApiRoute } from '../common/api-route.decorator.js';
import { ValidQuery } from '../common/validation.js';
import { CvService } from './cv.service.js';

const cvQuerySchema = z
  .object({
    lang: localeSchema
      .default('pt-BR')
      .meta({ description: 'Idioma do currículo' }),
    format: z
      .enum(['pdf', 'docx'])
      .default('pdf')
      .meta({ description: 'PDF ou Word (.docx)' }),
    /** `inline=true` opens in the browser (admin preview) instead of downloading. */
    inline: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true')
      .meta({ description: 'Abrir no navegador em vez de baixar' }),
  })
  .meta({ id: 'CvQuery' });

const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

@Controller()
export class CvController {
  constructor(private readonly cv: CvService) {}

  @Get('v1/cv')
  @ApiRoute({
    summary: 'Currículo (PDF ou Word)',
    description:
      'Gerado na hora a partir do mesmo conteúdo do site, com Typst. Uma página, coluna única, sem foto: o formato que os sistemas de triagem leem melhor.',
    tags: ['Currículo'],
    responses: {
      200: { description: 'O arquivo do currículo' },
      400: { description: 'Parâmetros inválidos', schema: apiErrorSchema },
    },
  })
  async download(
    @ValidQuery(cvQuerySchema) query: z.infer<typeof cvQuerySchema>,
    @Res() res: Response,
  ) {
    const file =
      query.format === 'pdf'
        ? await this.cv.pdf(query.lang)
        : await this.cv.docx(query.lang);
    const name = await this.cv.fileName(query.lang, query.format);
    res.setHeader('Content-Type', MIME[query.format]);
    res.setHeader(
      'Content-Disposition',
      `${query.inline ? 'inline' : 'attachment'}; filename="${name}"`,
    );
    // Always revalidated (ETag), so a download right after a save is up to date.
    res.setHeader('Cache-Control', 'no-cache');
    res.send(file);
  }

  @Get('admin/cv/report')
  @UseGuards(AdminGuard)
  @ApiRoute({
    summary: 'Checklist de qualidade do currículo',
    description:
      'Lê o PDF gerado como um sistema de triagem leria: páginas, texto extraído, acentos, dados pessoais e qualidade dos bullets.',
    tags: ['Admin · Currículo'],
    responses: {
      200: {
        description: 'Resultado das verificações',
        schema: cvReportSchema,
      },
      401: { description: 'Sem sessão válida', schema: apiErrorSchema },
    },
  })
  report(
    @ValidQuery(z.object({ lang: localeSchema.default('pt-BR') }))
    { lang }: { lang: 'pt-BR' | 'en' },
  ) {
    return this.cv.report(lang);
  }
}
