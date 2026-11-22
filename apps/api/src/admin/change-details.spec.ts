import type { PortfolioContent } from '@devprofile/shared';
import { changeDetails } from './content-admin.service.js';

const project = (slug: string, name: string, tagline = 'x') => ({
  slug,
  name,
  tagline: { pt: tagline, en: tagline },
});

const content = (projects: unknown[], role = 'Dev') =>
  ({
    profile: { headline: { pt: 'a', en: 'a' } },
    experiences: [{ company: 'RCDNC', role: { pt: role, en: role } }],
    projects,
  }) as unknown as PortfolioContent;

describe('changeDetails', () => {
  it('names added, edited and removed items', () => {
    const before = content([project('a', 'Alpha'), project('b', 'Beta')]);
    const after = content(
      [project('a', 'Alpha', 'nova'), project('c', 'Gama')],
      'Estagiário',
    );
    expect(changeDetails(before, after)).toEqual([
      'RCDNC editado',
      'Alpha editado',
      'Gama adicionado',
      'Beta removido',
    ]);
  });

  it('reports a pure reorder', () => {
    const before = content([project('a', 'Alpha'), project('b', 'Beta')]);
    const after = content([project('b', 'Beta'), project('a', 'Alpha')]);
    expect(changeDetails(before, after)).toEqual(['ordem alterada']);
  });

  it('keeps a renamed project as one edit, matched by slug', () => {
    const before = content([project('a', 'Alpha')]);
    const after = content([project('a', 'Alfa')]);
    expect(changeDetails(before, after)).toEqual(['Alfa editado']);
  });
});
