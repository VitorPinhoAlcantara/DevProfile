import { z } from 'zod';
import {
  localizedListSchema,
  localizedTextSchema,
  partialDateSchema,
  slugSchema,
  visibilitySchema,
  yearMonthSchema,
} from './primitives.js';

// Canonical portfolio content, with every translatable field in both languages.
// The admin edits this shape and the seed is validated against it.

export const availabilityStatuses = ['OPEN_TO_WORK', 'NOT_LOOKING'] as const;
export const workModes = ['REMOTE', 'HYBRID', 'ONSITE'] as const;
export const contactKinds = [
  'EMAIL',
  'PHONE',
  'WHATSAPP',
  'LINKEDIN',
  'GITHUB',
  'WEBSITE',
  'OTHER',
] as const;
export const employmentTypes = [
  'INTERNSHIP',
  'FULL_TIME',
  'PART_TIME',
  'FREELANCE',
  'VOLUNTEER',
] as const;
export const projectLinkKinds = [
  'REPOSITORY',
  'WEBSITE',
  'DEMO',
  'STORE',
  'DOCS',
] as const;
export const languageLevels = [
  'BASIC',
  'INTERMEDIATE',
  'ADVANCED',
  'FLUENT',
  'NATIVE',
] as const;
export const cvProfiles = ['JUNIOR', 'INTERNSHIP'] as const;

export const profileSchema = z.object({
  fullName: z.string().trim().min(1),
  headline: localizedTextSchema,
  location: localizedTextSchema,
  /** Long text for the site. */
  summary: localizedTextSchema,
  /** At most ~50 words, used by the `JUNIOR` CV profile. */
  cvSummary: localizedTextSchema,
  /** One line, used by the `INTERNSHIP` CV profile. */
  cvObjective: localizedTextSchema,
  availability: z.enum(availabilityStatuses),
  workModes: z.array(z.enum(workModes)),
  availabilityNote: localizedTextSchema,
  /** Profile photo as a `media:<file>` reference (site only, never on the CV). */
  photo: z.string().nullable().default(null),
});
export type ProfileContent = z.infer<typeof profileSchema>;

export const contactChannelSchema = visibilitySchema.extend({
  kind: z.enum(contactKinds),
  label: z.string().trim().min(1),
  /** What gets printed, e.g. `linkedin.com/in/user`. */
  value: z.string().trim().min(1),
  href: z.string().trim().min(1),
});
export type ContactChannelContent = z.infer<typeof contactChannelSchema>;

export const skillCategorySchema = z.object({
  key: slugSchema,
  name: localizedTextSchema,
  skills: z.array(
    visibilitySchema.extend({
      /** Canonical name, also used to link skills to experiences and projects. */
      name: z.string().trim().min(1),
      /** Only for names that change in English (soft skills); tech names stay as-is. */
      nameEn: z.string().trim().min(1).nullable().default(null),
    }),
  ),
});
export type SkillCategoryContent = z.infer<typeof skillCategorySchema>;

const periodSchema = z
  .object({
    start: yearMonthSchema,
    /** `null` while ongoing; for studies it is the expected end. */
    end: yearMonthSchema.nullable(),
  })
  .refine((p) => p.end === null || p.end >= p.start, {
    message: 'A data final não pode ser anterior à inicial',
    path: ['end'],
  });

export const experienceSchema = visibilitySchema.extend({
  company: z.string().trim().min(1),
  companyUrl: z.url().nullable().default(null),
  role: localizedTextSchema,
  employmentType: z.enum(employmentTypes),
  location: z.string().trim().min(1).nullable().default(null),
  workMode: z.enum(workModes).nullable().default(null),
  period: periodSchema,
  summary: localizedTextSchema,
  cvBullets: localizedListSchema,
  /** Names that must exist in the skills catalog. */
  skills: z.array(z.string()),
});
export type ExperienceContent = z.infer<typeof experienceSchema>;

export const projectSchema = visibilitySchema.extend({
  slug: slugSchema,
  name: z.string().trim().min(1),
  tagline: localizedTextSchema,
  summary: localizedTextSchema,
  cvBullets: localizedListSchema,
  period: z
    .object({ start: yearMonthSchema, end: yearMonthSchema.nullable() })
    .nullable()
    .default(null),
  featured: z.boolean().default(false),
  /**
   * Long Markdown page (README-style). `media:<file>` references are resolved to
   * uploaded images when the content is imported.
   */
  body: localizedTextSchema.nullable().default(null),
  /** Card and header image, as a `media:<file>` reference. */
  cover: z.string().nullable().default(null),
  links: z.array(
    z.object({
      kind: z.enum(projectLinkKinds),
      label: z.string().trim().min(1),
      href: z.url(),
    }),
  ),
  skills: z.array(z.string()),
});
export type ProjectContent = z.infer<typeof projectSchema>;

export const educationSchema = visibilitySchema.extend({
  institution: z.string().trim().min(1),
  institutionShort: z.string().trim().min(1).nullable().default(null),
  degree: localizedTextSchema,
  period: periodSchema,
  /** True while the end date is a forecast ("previsão de conclusão"). */
  endIsExpected: z.boolean(),
  summary: localizedTextSchema,
});
export type EducationContent = z.infer<typeof educationSchema>;

export const certificationSchema = visibilitySchema.extend({
  name: z.string().trim().min(1),
  issuer: z.string().trim().min(1),
  issuedAt: partialDateSchema,
  expiresAt: partialDateSchema.nullable().default(null),
  credentialUrl: z.url().nullable().default(null),
  note: localizedTextSchema,
});
export type CertificationContent = z.infer<typeof certificationSchema>;

export const languageSchema = visibilitySchema.extend({
  name: localizedTextSchema,
  level: z.enum(languageLevels),
});
export type LanguageContent = z.infer<typeof languageSchema>;

export const siteSettingsSchema = z.object({
  cvProfile: z.enum(cvProfiles),
});
export type SiteSettingsContent = z.infer<typeof siteSettingsSchema>;

/** The whole portfolio in one document; array order is display order. */
export const portfolioSchema = z
  .object({
    profile: profileSchema,
    contacts: z.array(contactChannelSchema),
    skillCategories: z.array(skillCategorySchema),
    experiences: z.array(experienceSchema),
    projects: z.array(projectSchema),
    education: z.array(educationSchema),
    certifications: z.array(certificationSchema),
    languages: z.array(languageSchema),
    settings: siteSettingsSchema,
  })
  .superRefine((portfolio, ctx) => {
    const skillNames = portfolio.skillCategories.flatMap((c) =>
      c.skills.map((s) => s.name),
    );
    const known = new Set<string>();
    for (const name of skillNames) {
      if (known.has(name)) {
        ctx.addIssue({
          code: 'custom',
          message: `Skill duplicada: ${name}`,
          path: ['skillCategories'],
        });
      }
      known.add(name);
    }

    const checkRefs = (
      list: 'experiences' | 'projects',
      items: { skills: string[] }[],
    ) => {
      items.forEach((item, index) => {
        for (const skill of item.skills) {
          if (!known.has(skill)) {
            ctx.addIssue({
              code: 'custom',
              message: `Skill fora do catálogo: ${skill}`,
              path: [list, index, 'skills'],
            });
          }
        }
      });
    };
    checkRefs('experiences', portfolio.experiences);
    checkRefs('projects', portfolio.projects);

    const slugs = new Set<string>();
    portfolio.projects.forEach((project, index) => {
      if (slugs.has(project.slug)) {
        ctx.addIssue({
          code: 'custom',
          message: `Slug duplicado: ${project.slug}`,
          path: ['projects', index, 'slug'],
        });
      }
      slugs.add(project.slug);
    });
  });
export type PortfolioContent = z.infer<typeof portfolioSchema>;
/** Input shape (before defaults are applied), handy for writing seed data. */
export type PortfolioInput = z.input<typeof portfolioSchema>;
