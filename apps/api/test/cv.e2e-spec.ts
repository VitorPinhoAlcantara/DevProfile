import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { extractText } from 'unpdf';
import { portfolioSchema } from '@devprofile/shared';
import { CvService } from '../src/cv/cv.service.js';
import { buildCvData, withCvRef } from '../src/cv/cv-data.js';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { portfolioSeed } from '../prisma/seed-data.js';
import { createTestApp, createTestPrisma, loadSeed } from './utils.js';

const binary = (
  res: request.Response,
  done: (err: Error | null, body: Buffer) => void,
) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => done(null, Buffer.concat(chunks)));
};

describe('CV (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrisma();
    await loadSeed(prisma);
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  it('downloads a one-page PDF whose text a parser can read, accents included', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/cv?lang=pt-BR')
      .buffer(true)
      .parse(binary)
      .expect(200);

    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain(
      'attachment; filename="Vitor-Pinho-Alcantara-CV-PT.pdf"',
    );
    const pdf = new Uint8Array(res.body as Buffer);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });

    expect(totalPages).toBeLessThanOrEqual(2);
    expect(text).toContain('Vitor Pinho Alcantara');
    expect(text.toUpperCase()).toContain('EXPERIÊNCIA');
    expect(text).toContain('Ciência da Computação');
  });

  it('serves the English resume as a Word file', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/cv?lang=en&format=docx')
      .buffer(true)
      .parse(binary)
      .expect(200);

    expect(res.headers['content-disposition']).toContain(
      'Vitor-Pinho-Alcantara-Resume-EN.docx',
    );
    // A .docx is a zip archive.
    expect((res.body as Buffer).subarray(0, 2).toString()).toBe('PK');
  });

  it('passes the automated checklist for both languages', async () => {
    const service = app.get(CvService);
    for (const locale of ['pt-BR', 'en'] as const) {
      const report = await service.report(locale);
      const failed = report.checks.filter((c) => c.status === 'fail');
      expect(failed).toEqual([]);
      expect(report.pages).toBeLessThanOrEqual(2);
    }
  });

  it('never puts the profile photo, hidden items or soft skills in project stacks', () => {
    const content = portfolioSchema.parse(portfolioSeed);
    const data = buildCvData(content, 'pt-BR');

    expect(JSON.stringify(data)).not.toContain('/api/media/');
    expect(data.projects.map((p) => p.name)).not.toContain(
      'CentralNovel Downloader',
    );
    expect(
      data.projects.every((p) => !p.stack?.includes('Trabalho em equipe')),
    ).toBe(true);
  });

  it('orders sections by the chosen CV profile', () => {
    const content = portfolioSchema.parse(portfolioSeed);
    content.settings.cvProfile = 'INTERNSHIP';
    const data = buildCvData(content, 'pt-BR');

    expect(data.order.slice(0, 2)).toEqual(['intro', 'education']);
    expect(data.headings.intro).toBe('Objetivo');
  });

  it('tags tracked links with the CV language and leaves the rest alone', () => {
    expect(withCvRef('https://alcantara.dev.br/?ref=curriculo', 'en')).toBe(
      'https://alcantara.dev.br/?ref=curriculo-en',
    );
    expect(withCvRef('https://github.com/user', 'pt')).toBe(
      'https://github.com/user',
    );
    expect(withCvRef('mailto:a@b.com', 'pt')).toBe('mailto:a@b.com');

    const content = portfolioSchema.parse(portfolioSeed);
    const site = content.contacts.find((c) => c.kind === 'WEBSITE')!;
    site.href = 'https://alcantara.dev.br/?ref=curriculo';
    site.showOnCv = true;
    const data = buildCvData(content, 'pt-BR');
    expect(data.contacts.map((c) => c.url)).toContain(
      'https://alcantara.dev.br/?ref=curriculo-pt',
    );
  });

  it('rejects an unknown format', async () => {
    await request(app.getHttpServer()).get('/api/v1/cv?format=odt').expect(400);
  });
});
