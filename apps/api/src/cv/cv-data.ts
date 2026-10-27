import type { cvProfiles, Locale, PortfolioContent } from '@devprofile/shared';

type CvProfile = (typeof cvProfiles)[number];

// Everything the CV template needs, already translated and formatted, so the
// Typst/DOCX templates only lay text out. Follows the spec in
// docs/research/modelos-de-curriculo/relatorio.md.

export type CvLink = { text: string; url: string | null };

export type CvSectionKey =
  | 'intro'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'languages';

export type CvData = {
  lang: 'pt' | 'en';
  font: 'sans' | 'serif';
  title: string;
  name: string;
  contacts: CvLink[];
  /** Order of the sections for the chosen profile (júnior or estágio). */
  order: CvSectionKey[];
  headings: Record<CvSectionKey, string>;
  intro: string;
  skills: { label: string; items: string }[];
  experience: {
    role: string;
    company: string;
    detail: string | null;
    period: string;
    bullets: string[];
  }[];
  projects: {
    name: string;
    stack: string | null;
    link: CvLink | null;
    period: string | null;
    bullets: string[];
  }[];
  education: { degree: string; institution: string; period: string }[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
    link: CvLink | null;
  }[];
  languages: string[];
};

export const sectionOrder: Record<CvProfile, CvSectionKey[]> = {
  JUNIOR: [
    'intro',
    'skills',
    'experience',
    'projects',
    'education',
    'certifications',
    'languages',
  ],
  INTERNSHIP: [
    'intro',
    'education',
    'experience',
    'projects',
    'skills',
    'certifications',
    'languages',
  ],
};

/** More than this turns the project line into a keyword list; the skills section has the rest. */
const MAX_STACK = 6;

const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** `2025-09` → `09/2025` (pt) or `Sep 2025` (en). Year-only stays as is. */
export function cvDate(value: string, lang: 'pt' | 'en') {
  const [year, month] = value.split('-');
  if (!month) return year!;
  return lang === 'en'
    ? `${MONTHS_EN[Number(month) - 1]} ${year}`
    : `${month}/${year}`;
}

export function cvPeriod(
  period: { start: string; end: string | null },
  lang: 'pt' | 'en',
) {
  if (period.end === period.start) return cvDate(period.start, lang);
  const end = period.end
    ? cvDate(period.end, lang)
    : lang === 'en'
      ? 'Present'
      : 'Atual';
  return `${cvDate(period.start, lang)} – ${end}`;
}

const LEVELS: Record<string, { pt: string; en: string }> = {
  BASIC: { pt: 'Básico', en: 'Basic' },
  INTERMEDIATE: { pt: 'Intermediário', en: 'Intermediate' },
  ADVANCED: { pt: 'Avançado', en: 'Advanced' },
  FLUENT: { pt: 'Fluente', en: 'Fluent' },
  NATIVE: { pt: 'Nativo', en: 'Native' },
};

const HEADINGS = {
  pt: {
    summary: 'Resumo',
    objective: 'Objetivo',
    skills: 'Habilidades Técnicas',
    experience: 'Experiência',
    projects: 'Projetos',
    education: 'Formação',
    certifications: 'Certificações',
    languages: 'Idiomas',
  },
  en: {
    summary: 'Summary',
    objective: 'Objective',
    skills: 'Technical Skills',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
    certifications: 'Certifications',
    languages: 'Languages',
  },
};

/** URLs print without the scheme (`github.com/user`), as the research recommends. */
const printable = (href: string) =>
  href
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

/** Builds the CV from the canonical content, keeping only what is marked for the CV. */
export function buildCvData(content: PortfolioContent, locale: Locale): CvData {
  const lang = locale === 'en' ? 'en' : 'pt';
  const h = HEADINGS[lang];
  const { profile, settings } = content;
  const cv = <T extends { showOnCv: boolean }>(items: T[]) =>
    items.filter((i) => i.showOnCv);

  const softCategories = content.skillCategories.filter(
    (c) => c.kind === 'SOFT',
  );
  const softNames = new Set(
    softCategories.flatMap((c) => c.skills.map((s) => s.name)),
  );
  const skillLabel = (name: string) => {
    const skill = content.skillCategories
      .flatMap((c) => c.skills)
      .find((s) => s.name === name);
    return lang === 'en' ? (skill?.nameEn ?? name) : name;
  };
  // Stack lines only list technologies that are themselves marked for the CV.
  const cvSkillNames = new Set(
    content.skillCategories.flatMap((c) =>
      c.skills.filter((s) => s.showOnCv).map((s) => s.name),
    ),
  );
  // Catalog order (languages first…), so stacks read the same way across projects.
  const catalogOrder = content.skillCategories.flatMap((c) =>
    c.skills.map((s) => s.name),
  );
  const techStack = (names: string[]) =>
    catalogOrder
      .filter(
        (n) => names.includes(n) && !softNames.has(n) && cvSkillNames.has(n),
      )
      .slice(0, MAX_STACK)
      .map(skillLabel);

  const skills = content.skillCategories
    .map((category) => ({
      label: category.name[lang],
      items: cv(category.skills).map((s) =>
        lang === 'en' ? (s.nameEn ?? s.name) : s.name,
      ),
    }))
    .filter((line) => line.items.length > 0)
    .map((line) => ({ label: line.label, items: line.items.join(', ') }));

  const contacts: CvLink[] = [
    { text: profile.location[lang], url: null },
    ...cv(content.contacts).map((c) => ({
      text: c.value,
      url:
        c.kind === 'PHONE' || c.kind === 'EMAIL'
          ? c.href
          : c.href.startsWith('http')
            ? c.href
            : null,
    })),
  ];

  return {
    lang,
    font: settings.cvFont === 'SERIF' ? 'serif' : 'sans',
    title:
      lang === 'en'
        ? `${profile.fullName} — Resume`
        : `${profile.fullName} — Currículo`,
    name: profile.fullName,
    contacts,
    order: sectionOrder[settings.cvProfile],
    headings: {
      intro: settings.cvProfile === 'INTERNSHIP' ? h.objective : h.summary,
      skills: h.skills,
      experience: h.experience,
      projects: h.projects,
      education: h.education,
      certifications: h.certifications,
      languages: h.languages,
    },
    intro:
      settings.cvProfile === 'INTERNSHIP'
        ? profile.cvObjective[lang]
        : profile.cvSummary[lang],
    skills,
    experience: cv(content.experiences).map((e) => ({
      role: e.role[lang],
      company: e.company,
      detail:
        e.employmentType === 'VOLUNTEER'
          ? lang === 'en'
            ? 'Volunteer'
            : 'Voluntário'
          : null,
      period: cvPeriod(e.period, lang),
      bullets: e.cvBullets[lang].length ? e.cvBullets[lang] : [e.summary[lang]],
    })),
    projects: cv(content.projects).map((p) => {
      const site = p.links.find((l) => l.kind === 'WEBSITE') ?? p.links[0];
      const stack = techStack(p.skills);
      return {
        name: p.name,
        stack: stack.length ? stack.join(', ') : null,
        link: site ? { text: printable(site.href), url: site.href } : null,
        period: p.period ? cvPeriod(p.period, lang) : null,
        bullets: p.cvBullets[lang].length
          ? p.cvBullets[lang]
          : [p.tagline[lang]],
      };
    }),
    education: cv(content.education).map((e) => ({
      degree: e.degree[lang],
      institution: e.institutionShort
        ? `${e.institution} (${e.institutionShort})`
        : e.institution,
      period:
        e.endIsExpected && e.period.end
          ? lang === 'en'
            ? `${cvDate(e.period.start, lang)} – Expected ${cvDate(e.period.end, lang)}`
            : `${cvDate(e.period.start, lang)} – Previsão ${cvDate(e.period.end, lang)}`
          : cvPeriod(e.period, lang),
    })),
    certifications: cv(content.certifications).map((c) => ({
      name: c.name,
      issuer: c.issuer,
      date: c.expiresAt
        ? `${cvDate(c.issuedAt, lang)} – ${cvDate(c.expiresAt, lang)}`
        : cvDate(c.issuedAt, lang),
      link: c.credentialUrl
        ? { text: lang === 'en' ? 'verify' : 'verificar', url: c.credentialUrl }
        : null,
    })),
    languages: cv(content.languages).map(
      (l) => `${l.name[lang]} (${LEVELS[l.level]![lang]})`,
    ),
  };
}
