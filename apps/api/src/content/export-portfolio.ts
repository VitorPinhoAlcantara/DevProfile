import type { PortfolioContent } from '@devprofile/shared';
import type { PrismaClient } from '../generated/prisma/client.js';

type Db = Pick<
  PrismaClient,
  | 'profile'
  | 'siteSettings'
  | 'contactChannel'
  | 'skillCategory'
  | 'experience'
  | 'project'
  | 'education'
  | 'certification'
  | 'language'
>;

const byPosition = { position: 'asc' } as const;
const mediaRef = (media: { storageKey: string } | null) =>
  media ? `media:${media.storageKey}` : null;
const both = (pt: string, en: string) => ({ pt, en });

/**
 * Reads the whole portfolio back into the canonical document shape — the
 * inverse of `importPortfolio`. Images come back as `media:<storageKey>`.
 */
export async function exportPortfolio(db: Db): Promise<PortfolioContent> {
  const [
    profile,
    settings,
    contacts,
    categories,
    experiences,
    projects,
    education,
    certifications,
    languages,
  ] = await Promise.all([
    db.profile.findUniqueOrThrow({
      where: { id: 1 },
      include: { photo: { select: { storageKey: true } } },
    }),
    db.siteSettings.findUniqueOrThrow({ where: { id: 1 } }),
    db.contactChannel.findMany({ orderBy: byPosition }),
    db.skillCategory.findMany({
      orderBy: byPosition,
      include: { skills: { orderBy: byPosition } },
    }),
    db.experience.findMany({
      orderBy: byPosition,
      include: { skills: { select: { name: true }, orderBy: byPosition } },
    }),
    db.project.findMany({
      orderBy: byPosition,
      include: {
        cover: { select: { storageKey: true } },
        links: { orderBy: byPosition },
        skills: { select: { name: true }, orderBy: byPosition },
      },
    }),
    db.education.findMany({ orderBy: byPosition }),
    db.certification.findMany({ orderBy: byPosition }),
    db.language.findMany({ orderBy: byPosition }),
  ]);

  return {
    profile: {
      fullName: profile.fullName,
      headline: both(profile.headlinePt, profile.headlineEn),
      location: both(profile.locationPt, profile.locationEn),
      summary: both(profile.summaryPt, profile.summaryEn),
      cvSummary: both(profile.cvSummaryPt, profile.cvSummaryEn),
      cvObjective: both(profile.cvObjectivePt, profile.cvObjectiveEn),
      availability: profile.availability,
      workModes: profile.workModes,
      availabilityNote: both(
        profile.availabilityNotePt,
        profile.availabilityNoteEn,
      ),
      photo: mediaRef(profile.photo),
    },
    contacts: contacts.map((c) => ({
      kind: c.kind,
      label: c.label,
      value: c.value,
      href: c.href,
      showOnSite: c.showOnSite,
      showOnCv: c.showOnCv,
    })),
    skillCategories: categories.map((category) => ({
      key: category.key,
      name: both(category.namePt, category.nameEn),
      kind: category.kind,
      skills: category.skills.map((skill) => ({
        name: skill.name,
        nameEn: skill.nameEn,
        showOnSite: skill.showOnSite,
        showOnCv: skill.showOnCv,
      })),
    })),
    experiences: experiences.map((e) => ({
      company: e.company,
      companyUrl: e.companyUrl,
      role: both(e.rolePt, e.roleEn),
      employmentType: e.employmentType,
      location: e.location,
      workMode: e.workMode,
      period: { start: e.startDate, end: e.endDate },
      summary: both(e.summaryPt, e.summaryEn),
      cvBullets: { pt: e.cvBulletsPt, en: e.cvBulletsEn },
      skills: e.skills.map((s) => s.name),
      showOnSite: e.showOnSite,
      showOnCv: e.showOnCv,
    })),
    projects: projects.map((p) => ({
      slug: p.slug,
      name: p.name,
      tagline: both(p.taglinePt, p.taglineEn),
      summary: both(p.summaryPt, p.summaryEn),
      cvBullets: { pt: p.cvBulletsPt, en: p.cvBulletsEn },
      period: p.startDate ? { start: p.startDate, end: p.endDate } : null,
      featured: p.featured,
      body: p.bodyPt ? both(p.bodyPt, p.bodyEn ?? p.bodyPt) : null,
      cover: mediaRef(p.cover),
      links: p.links.map(({ kind, label, href }) => ({ kind, label, href })),
      skills: p.skills.map((s) => s.name),
      showOnSite: p.showOnSite,
      showOnCv: p.showOnCv,
    })),
    education: education.map((e) => ({
      institution: e.institution,
      institutionShort: e.institutionShort,
      degree: both(e.degreePt, e.degreeEn),
      period: { start: e.startDate, end: e.endDate },
      endIsExpected: e.endIsExpected,
      summary: both(e.summaryPt, e.summaryEn),
      showOnSite: e.showOnSite,
      showOnCv: e.showOnCv,
    })),
    certifications: certifications.map((c) => ({
      name: c.name,
      issuer: c.issuer,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      credentialUrl: c.credentialUrl,
      note: both(c.notePt, c.noteEn),
      showOnSite: c.showOnSite,
      showOnCv: c.showOnCv,
    })),
    languages: languages.map((l) => ({
      name: both(l.namePt, l.nameEn),
      level: l.level,
      showOnSite: l.showOnSite,
      showOnCv: l.showOnCv,
    })),
    settings: { cvProfile: settings.cvProfile, cvFont: settings.cvFont },
  };
}
