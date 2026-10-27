import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Envelope,
  Locale,
  PublicCertification,
  PublicContact,
  PublicEducation,
  PublicExperience,
  PublicLanguage,
  PublicPortfolio,
  PublicProfile,
  PublicProject,
  PublicProjectSummary,
  PublicSkillCategory,
  ResponseMeta,
} from '@devprofile/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { mediaUrl } from '../media/media-storage.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { localized, versionTag } from './localize.js';

const visible = { showOnSite: true } as const;
const byPosition = { position: 'asc' } as const;
// Skills follow the catalog order: category first, then position inside it.
const visibleSkillNames = {
  where: visible,
  orderBy: [{ category: byPosition }, byPosition],
  select: { name: true, nameEn: true, category: { select: { kind: true } } },
} satisfies Prisma.SkillFindManyArgs;
type SkillRow = Prisma.SkillGetPayload<{
  select: typeof visibleSkillNames.select;
}>;

const skillName = (
  skill: { name: string; nameEn: string | null },
  locale: Locale,
) => (locale === 'en' ? (skill.nameEn ?? skill.name) : skill.name);

/** Technologies and soft skills, kept apart for display. */
const splitSkills = (skills: SkillRow[], locale: Locale) => ({
  skills: skills
    .filter((skill) => skill.category.kind === 'TECHNICAL')
    .map((skill) => skillName(skill, locale)),
  softSkills: skills
    .filter((skill) => skill.category.kind === 'SOFT')
    .map((skill) => skillName(skill, locale)),
});

const projectInclude = {
  cover: { select: { storageKey: true } },
  links: { orderBy: byPosition },
  skills: visibleSkillNames,
} satisfies Prisma.ProjectInclude;
type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;

/** Read-only, already-translated content for the public site and API. Hidden items are left out. */
@Injectable()
export class PublicContentService {
  constructor(private readonly prisma: PrismaService) {}

  async wrap<T>(locale: Locale, load: () => Promise<T>): Promise<Envelope<T>> {
    const [data, meta] = await Promise.all([load(), this.meta(locale)]);
    return { data, meta };
  }

  async meta(locale: Locale): Promise<ResponseMeta> {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { id: 1 },
    });
    const updatedAt = settings?.contentUpdatedAt ?? new Date(0);
    return {
      locale,
      version: versionTag(updatedAt),
      updatedAt: updatedAt.toISOString(),
    };
  }

  async portfolio(locale: Locale): Promise<PublicPortfolio> {
    const [
      profile,
      contacts,
      skills,
      experience,
      projects,
      education,
      certifications,
      languages,
    ] = await Promise.all([
      this.profile(locale),
      this.contacts(),
      this.skills(locale),
      this.experience(locale),
      this.projects(locale),
      this.education(locale),
      this.certifications(locale),
      this.languages(locale),
    ]);
    return {
      profile,
      contacts,
      skills,
      experience,
      projects,
      education,
      certifications,
      languages,
    };
  }

  async profile(locale: Locale): Promise<PublicProfile> {
    const row = await this.prisma.profile.findUnique({
      where: { id: 1 },
      include: { photo: true },
    });
    if (!row) {
      throw new NotFoundException('O perfil ainda não foi cadastrado.');
    }
    return {
      fullName: row.fullName,
      headline: localized(row, 'headline', locale),
      location: localized(row, 'location', locale),
      summary: localized(row, 'summary', locale),
      photoUrl: row.photo ? mediaUrl(row.photo.storageKey) : null,
      availability: {
        status: row.availability,
        workModes: row.workModes,
        note: localized(row, 'availabilityNote', locale),
      },
    };
  }

  async contacts(): Promise<PublicContact[]> {
    return this.prisma.contactChannel.findMany({
      where: visible,
      orderBy: byPosition,
      select: { kind: true, label: true, value: true, href: true },
    });
  }

  async skills(locale: Locale): Promise<PublicSkillCategory[]> {
    const categories = await this.prisma.skillCategory.findMany({
      orderBy: byPosition,
      include: { skills: visibleSkillNames },
    });
    return categories
      .filter((category) => category.skills.length > 0)
      .map((category) => ({
        key: category.key,
        name: localized(category, 'name', locale),
        kind: category.kind,
        skills: category.skills.map((skill) => skillName(skill, locale)),
      }));
  }

  async experience(locale: Locale): Promise<PublicExperience[]> {
    const rows = await this.prisma.experience.findMany({
      where: visible,
      orderBy: byPosition,
      include: { skills: visibleSkillNames },
    });
    return rows.map((row) => ({
      id: row.id,
      company: row.company,
      companyUrl: row.companyUrl,
      role: localized(row, 'role', locale),
      employmentType: row.employmentType,
      location: row.location,
      workMode: row.workMode,
      period: { start: row.startDate, end: row.endDate },
      summary: localized(row, 'summary', locale),
      ...splitSkills(row.skills, locale),
    }));
  }

  async projects(locale: Locale): Promise<PublicProjectSummary[]> {
    const rows = await this.prisma.project.findMany({
      where: visible,
      orderBy: byPosition,
      include: projectInclude,
    });
    return rows.map((row) => this.toProjectSummary(row, locale));
  }

  async project(slug: string, locale: Locale): Promise<PublicProject> {
    const row = await this.prisma.project.findFirst({
      where: { slug, ...visible },
      include: projectInclude,
    });
    if (!row) {
      throw new NotFoundException(`Projeto "${slug}" não encontrado.`);
    }
    return {
      ...this.toProjectSummary(row, locale),
      summary: localized(row, 'summary', locale),
      body: locale === 'en' ? (row.bodyEn ?? row.bodyPt) : row.bodyPt,
    };
  }

  async education(locale: Locale): Promise<PublicEducation[]> {
    const rows = await this.prisma.education.findMany({
      where: visible,
      orderBy: byPosition,
    });
    return rows.map((row) => ({
      institution: row.institution,
      institutionShort: row.institutionShort,
      degree: localized(row, 'degree', locale),
      period: { start: row.startDate, end: row.endDate },
      endIsExpected: row.endIsExpected,
      summary: localized(row, 'summary', locale),
    }));
  }

  async certifications(locale: Locale): Promise<PublicCertification[]> {
    const rows = await this.prisma.certification.findMany({
      where: visible,
      orderBy: byPosition,
    });
    return rows.map((row) => ({
      name: row.name,
      issuer: row.issuer,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      credentialUrl: row.credentialUrl,
      note: localized(row, 'note', locale),
    }));
  }

  async languages(locale: Locale): Promise<PublicLanguage[]> {
    const rows = await this.prisma.language.findMany({
      where: visible,
      orderBy: byPosition,
    });
    return rows.map((row) => ({
      name: localized(row, 'name', locale),
      level: row.level,
    }));
  }

  private toProjectSummary(
    row: ProjectRow,
    locale: Locale,
  ): PublicProjectSummary {
    return {
      slug: row.slug,
      name: row.name,
      tagline: localized(row, 'tagline', locale),
      featured: row.featured,
      period: row.startDate ? { start: row.startDate, end: row.endDate } : null,
      coverUrl: row.cover ? mediaUrl(row.cover.storageKey) : null,
      ...splitSkills(row.skills, locale),
      links: row.links.map(({ kind, label, href }) => ({ kind, label, href })),
    };
  }
}
