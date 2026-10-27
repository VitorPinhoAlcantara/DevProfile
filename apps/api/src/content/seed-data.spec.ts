import { portfolioSchema } from '@devprofile/shared';
import { portfolioSeed } from '../../prisma/seed-data.js';

describe('portfolio seed', () => {
  it('matches the shared content schema', () => {
    const result = portfolioSchema.safeParse(portfolioSeed);

    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('never publishes the phone number on the site', () => {
    const content = portfolioSchema.parse(portfolioSeed);
    const phone = content.contacts.find((c) => c.kind === 'PHONE');

    expect(phone?.showOnSite).toBe(false);
  });
});

describe('portfolioSchema rules', () => {
  const base = portfolioSchema.parse(portfolioSeed);

  it('rejects skills that are not in the catalog', () => {
    const broken = structuredClone(base);
    broken.projects[0]!.skills = ['Cobol'];

    const issues = portfolioSchema.safeParse(broken).error?.issues ?? [];

    expect(issues.map((i) => i.message)).toContain(
      'Skill fora do catálogo: Cobol',
    );
  });

  it('rejects a period that ends before it starts', () => {
    const broken = structuredClone(base);
    broken.experiences[0]!.period = { start: '2026-06', end: '2025-09' };

    expect(portfolioSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects malformed dates', () => {
    const broken = structuredClone(base);
    broken.experiences[0]!.period = { start: '09/2025', end: null };

    expect(portfolioSchema.safeParse(broken).success).toBe(false);
  });
});
