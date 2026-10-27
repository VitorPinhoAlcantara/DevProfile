import { localized, versionTag } from './localize.js';

describe('localized', () => {
  const row = { headlinePt: 'Desenvolvedor', headlineEn: 'Developer' };

  it('picks the column for the requested language', () => {
    expect(localized(row, 'headline', 'pt-BR')).toBe('Desenvolvedor');
    expect(localized(row, 'headline', 'en')).toBe('Developer');
  });
});

describe('versionTag', () => {
  it('uses the date in Brazil, not UTC', () => {
    // 01:30 UTC on Oct 27 is still Oct 26 in São Paulo (UTC-3).
    expect(versionTag(new Date('2026-10-27T01:30:00Z'))).toBe('v2026.10.26');
  });
});
