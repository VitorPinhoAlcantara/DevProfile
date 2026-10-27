import type { PortfolioContent } from '@devprofile/shared';
import type { PrismaClient } from '../generated/prisma/client.js';

type Db = Pick<PrismaClient, '$transaction'>;

/** Turns a `media:<file>` reference into a stored image. */
export type MediaResolver = (
  file: string,
) => Promise<{ id: string; url: string }>;

const MEDIA_REF = /media:([\w.-]+)/g;
const refFile = (ref: string) => ref.replace(/^media:/, '');

async function resolveMarkdown(
  markdown: string | undefined,
  resolve: MediaResolver,
) {
  if (!markdown) return null;
  let result = markdown;
  for (const [token, file] of markdown.matchAll(MEDIA_REF)) {
    result = result.replaceAll(token, (await resolve(file!)).url);
  }
  return result;
}

/**
 * Replaces all portfolio content with `content` in one transaction.
 * Admin data (users, sessions, audit log) and media files are left alone.
 * Without `resolveMedia`, covers are dropped and Markdown keeps its `media:` references.
 */
export async function importPortfolio(
  db: Db,
  content: PortfolioContent,
  resolveMedia?: MediaResolver,
) {
  // Images are stored before the transaction; storing is idempotent (content hash).
  const projectMedia = await Promise.all(
    content.projects.map(async (project) => {
      if (!resolveMedia) {
        return {
          coverId: null,
          bodyPt: project.body?.pt ?? null,
          bodyEn: project.body?.en ?? null,
        };
      }
      return {
        coverId: project.cover
          ? (await resolveMedia(refFile(project.cover))).id
          : null,
        bodyPt: await resolveMarkdown(project.body?.pt, resolveMedia),
        bodyEn: await resolveMarkdown(project.body?.en, resolveMedia),
      };
    }),
  );

  const photoId =
    resolveMedia && content.profile.photo
      ? (await resolveMedia(refFile(content.profile.photo))).id
      : null;

  await db.$transaction(async (tx) => {
    await tx.projectLink.deleteMany();
    await tx.project.deleteMany();
    await tx.experience.deleteMany();
    await tx.skill.deleteMany();
    await tx.skillCategory.deleteMany();
    await tx.contactChannel.deleteMany();
    await tx.education.deleteMany();
    await tx.certification.deleteMany();
    await tx.language.deleteMany();

    const { profile } = content;
    const profileData = {
      fullName: profile.fullName,
      headlinePt: profile.headline.pt,
      headlineEn: profile.headline.en,
      locationPt: profile.location.pt,
      locationEn: profile.location.en,
      summaryPt: profile.summary.pt,
      summaryEn: profile.summary.en,
      cvSummaryPt: profile.cvSummary.pt,
      cvSummaryEn: profile.cvSummary.en,
      cvObjectivePt: profile.cvObjective.pt,
      cvObjectiveEn: profile.cvObjective.en,
      availability: profile.availability,
      workModes: profile.workModes,
      availabilityNotePt: profile.availabilityNote.pt,
      availabilityNoteEn: profile.availabilityNote.en,
      photoId,
    };
    await tx.profile.upsert({
      where: { id: 1 },
      create: { id: 1, ...profileData },
      update: profileData,
    });

    const settings = { ...content.settings, contentUpdatedAt: new Date() };
    await tx.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...settings },
      update: settings,
    });

    await tx.contactChannel.createMany({
      data: content.contacts.map((contact, position) => ({
        ...contact,
        position,
      })),
    });

    const skillIds = new Map<string, string>();
    for (const [position, category] of content.skillCategories.entries()) {
      const created = await tx.skillCategory.create({
        data: {
          key: category.key,
          namePt: category.name.pt,
          nameEn: category.name.en,
          kind: category.kind,
          position,
          skills: {
            create: category.skills.map((skill, skillPosition) => ({
              ...skill,
              position: skillPosition,
            })),
          },
        },
        include: { skills: { select: { id: true, name: true } } },
      });
      for (const skill of created.skills) {
        skillIds.set(skill.name, skill.id);
      }
    }
    // Names are checked against the catalog by portfolioSchema, so the lookup cannot miss.
    const connectSkills = (names: string[]) =>
      names.map((name) => ({ id: skillIds.get(name)! }));

    for (const [position, exp] of content.experiences.entries()) {
      await tx.experience.create({
        data: {
          company: exp.company,
          companyUrl: exp.companyUrl,
          rolePt: exp.role.pt,
          roleEn: exp.role.en,
          employmentType: exp.employmentType,
          location: exp.location,
          workMode: exp.workMode,
          startDate: exp.period.start,
          endDate: exp.period.end,
          summaryPt: exp.summary.pt,
          summaryEn: exp.summary.en,
          cvBulletsPt: exp.cvBullets.pt,
          cvBulletsEn: exp.cvBullets.en,
          showOnSite: exp.showOnSite,
          showOnCv: exp.showOnCv,
          position,
          skills: { connect: connectSkills(exp.skills) },
        },
      });
    }

    for (const [position, project] of content.projects.entries()) {
      await tx.project.create({
        data: {
          slug: project.slug,
          name: project.name,
          taglinePt: project.tagline.pt,
          taglineEn: project.tagline.en,
          summaryPt: project.summary.pt,
          summaryEn: project.summary.en,
          cvBulletsPt: project.cvBullets.pt,
          cvBulletsEn: project.cvBullets.en,
          ...projectMedia[position]!,
          startDate: project.period?.start ?? null,
          endDate: project.period?.end ?? null,
          featured: project.featured,
          showOnSite: project.showOnSite,
          showOnCv: project.showOnCv,
          position,
          links: {
            create: project.links.map((link, linkPosition) => ({
              ...link,
              position: linkPosition,
            })),
          },
          skills: { connect: connectSkills(project.skills) },
        },
      });
    }

    await tx.education.createMany({
      data: content.education.map((edu, position) => ({
        institution: edu.institution,
        institutionShort: edu.institutionShort,
        degreePt: edu.degree.pt,
        degreeEn: edu.degree.en,
        startDate: edu.period.start,
        endDate: edu.period.end,
        endIsExpected: edu.endIsExpected,
        summaryPt: edu.summary.pt,
        summaryEn: edu.summary.en,
        showOnSite: edu.showOnSite,
        showOnCv: edu.showOnCv,
        position,
      })),
    });

    await tx.certification.createMany({
      data: content.certifications.map((cert, position) => ({
        name: cert.name,
        issuer: cert.issuer,
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt,
        credentialUrl: cert.credentialUrl,
        notePt: cert.note.pt,
        noteEn: cert.note.en,
        showOnSite: cert.showOnSite,
        showOnCv: cert.showOnCv,
        position,
      })),
    });

    await tx.language.createMany({
      data: content.languages.map((lang, position) => ({
        namePt: lang.name.pt,
        nameEn: lang.name.en,
        level: lang.level,
        showOnSite: lang.showOnSite,
        showOnCv: lang.showOnCv,
        position,
      })),
    });
  });
}
