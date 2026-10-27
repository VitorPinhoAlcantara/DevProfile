import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { z } from 'zod';
import {
  apiErrorSchema,
  envelopeSchema,
  type PortfolioContent,
  publicPortfolioSchema,
  publicProjectSchema,
} from '@devprofile/shared';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { createTestApp, createTestPrisma, loadSeed } from './utils.js';

describe('public content API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaClient;
  let seed: PortfolioContent;

  beforeAll(async () => {
    prisma = createTestPrisma();
    seed = await loadSeed(prisma);
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  const get = (path: string) => request(app.getHttpServer()).get(path);

  it('returns the whole portfolio in Portuguese by default', async () => {
    const res = await get('/api/v1/portfolio').expect(200);
    const body = envelopeSchema(publicPortfolioSchema).parse(res.body);

    expect(body.meta.locale).toBe('pt-BR');
    expect(body.meta.version).toMatch(/^v\d{4}\.\d{2}\.\d{2}$/);
    expect(body.data.profile.headline).toBe(seed.profile.headline.pt);
  });

  it('switches language with ?lang=en', async () => {
    const res = await get('/api/v1/profile?lang=en').expect(200);

    expect(res.body.meta.locale).toBe('en');
    expect(res.body.data.headline).toBe(seed.profile.headline.en);
  });

  it('rejects an unknown language with a validation error', async () => {
    const res = await get('/api/v1/skills?lang=fr').expect(400);
    const body = apiErrorSchema.parse(res.body);

    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details?.[0]?.path).toBe('lang');
  });

  it('hides items marked as not shown on the site', async () => {
    const contacts = await get('/api/v1/contacts').expect(200);
    const kinds = (contacts.body.data as { kind: string }[]).map((c) => c.kind);

    expect(kinds).not.toContain('PHONE');
  });

  it('returns a project by slug and 404 for an unknown one', async () => {
    const res = await get('/api/v1/projects/streeturban?lang=en').expect(200);
    const project = envelopeSchema(publicProjectSchema).parse(res.body).data;

    expect(project.summary).toBe(
      seed.projects.find((p) => p.slug === 'streeturban')!.summary.en,
    );
    // Skills come back in catalog order, not insertion order.
    expect(project.skills.indexOf('TypeScript')).toBeLessThan(
      project.skills.indexOf('NestJS'),
    );

    const missing = await get('/api/v1/projects/does-not-exist').expect(404);
    expect(apiErrorSchema.parse(missing.body).error.code).toBe('NOT_FOUND');
  });

  it('answers unknown routes with the error envelope', async () => {
    const res = await get('/api/v1/nothing-here').expect(404);

    expect(apiErrorSchema.safeParse(res.body).success).toBe(true);
  });

  it('serves an OpenAPI document covering every public route', async () => {
    const res = await get('/api/openapi.json').expect(200);
    const doc = z
      .object({
        openapi: z.literal('3.1.0'),
        paths: z.record(z.string(), z.record(z.string(), z.unknown())),
        components: z.object({ schemas: z.record(z.string(), z.unknown()) }),
      })
      .parse(res.body);

    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining([
        '/api/health',
        '/api/v1/portfolio',
        '/api/v1/projects/{slug}',
        '/api/v1/contact',
      ]),
    );
    // Every $ref must point at a component that exists.
    const refs =
      JSON.stringify(doc).match(/#\/components\/schemas\/\w+/g) ?? [];
    for (const ref of new Set(refs)) {
      expect(doc.components.schemas).toHaveProperty(ref.split('/').pop()!);
    }
  });

  it('serves the interactive docs page', async () => {
    const res = await get('/api/docs').expect(200);

    expect(res.headers['content-type']).toContain('text/html');
  });
});
