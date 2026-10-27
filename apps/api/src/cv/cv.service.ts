import { Injectable } from '@nestjs/common';
import type { CvReport, Locale } from '@devprofile/shared';
import { exportPortfolio } from '../content/export-portfolio.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { checkCv } from './cv-checks.js';
import { buildCvData, type CvData } from './cv-data.js';
import { renderCvDocx } from './cv-docx.js';
import { renderCvPdf } from './cv-renderer.js';

type Generated = {
  data: CvData;
  pdf: Buffer;
  pages: number;
  generatedAt: Date;
  docx?: Promise<Buffer>;
  report?: Promise<CvReport>;
};

/**
 * Generates the CV from the current content. Results are cached per content
 * version, so the first request after an admin save rebuilds it (a few ms) and
 * every other request is served from memory.
 */
@Injectable()
export class CvService {
  private cache = new Map<string, Generated>();

  constructor(private readonly prisma: PrismaService) {}

  async pdf(locale: Locale) {
    return (await this.generate(locale)).pdf;
  }

  async docx(locale: Locale) {
    const generated = await this.generate(locale);
    generated.docx ??= renderCvDocx(generated.data);
    return generated.docx;
  }

  async report(locale: Locale): Promise<CvReport> {
    const generated = await this.generate(locale);
    generated.report ??= checkCv(
      generated.pdf,
      generated.pages,
      generated.data,
    ).then((checks) => ({
      locale,
      pages: generated.pages,
      generatedAt: generated.generatedAt.toISOString(),
      checks,
    }));
    return generated.report;
  }

  /** "Vitor-Pinho-Alcantara-CV-PT.pdf" / "Vitor-Pinho-Alcantara-Resume-EN.docx" */
  async fileName(locale: Locale, extension: 'pdf' | 'docx') {
    const { data } = await this.generate(locale);
    const name = data.name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-');
    return locale === 'en'
      ? `${name}-Resume-EN.${extension}`
      : `${name}-CV-PT.${extension}`;
  }

  private async generate(locale: Locale): Promise<Generated> {
    const settings = await this.prisma.siteSettings.findUniqueOrThrow({
      where: { id: 1 },
    });
    const key = `${settings.contentUpdatedAt.toISOString()}:${locale}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const data = buildCvData(await exportPortfolio(this.prisma), locale);
    const { pdf, pages } = renderCvPdf(data);
    const generated: Generated = { data, pdf, pages, generatedAt: new Date() };

    // Only the current version is worth keeping.
    for (const old of this.cache.keys()) {
      if (!old.startsWith(settings.contentUpdatedAt.toISOString()))
        this.cache.delete(old);
    }
    this.cache.set(key, generated);
    return generated;
  }
}
