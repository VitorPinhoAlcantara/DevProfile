import { z } from 'zod';
import {
  skillKinds,
  availabilityStatuses,
  contactKinds,
  employmentTypes,
  languageLevels,
  projectLinkKinds,
  workModes,
} from './content.js';
import {
  localeSchema,
  partialDateSchema,
  yearMonthSchema,
} from './primitives.js';

// Shapes returned by the public API (`/api/v1/*`), already in the requested language.
// `.meta({ id })` names each schema in the generated OpenAPI document.

export const localeQuerySchema = z
  .object({
    lang: localeSchema
      .default('pt-BR')
      .meta({ description: 'Idioma da resposta' }),
  })
  .meta({ id: 'LocaleQuery' });
export type LocaleQuery = z.infer<typeof localeQuerySchema>;

export const responseMetaSchema = z
  .object({
    locale: localeSchema,
    /** `vAAAA.MM.DD` of the last content change. */
    version: z.string(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'ResponseMeta' });
export type ResponseMeta = z.infer<typeof responseMetaSchema>;

export const periodSchema = z
  .object({
    start: yearMonthSchema,
    end: yearMonthSchema.nullable(),
  })
  .meta({ id: 'Period' });

export const publicProfileSchema = z
  .object({
    fullName: z.string(),
    headline: z.string(),
    location: z.string(),
    summary: z.string(),
    photoUrl: z.string().nullable(),
    availability: z.object({
      status: z.enum(availabilityStatuses),
      workModes: z.array(z.enum(workModes)),
      note: z.string(),
    }),
  })
  .meta({ id: 'Profile' });
export type PublicProfile = z.infer<typeof publicProfileSchema>;

export const publicContactSchema = z
  .object({
    kind: z.enum(contactKinds),
    label: z.string(),
    value: z.string(),
    href: z.string(),
  })
  .meta({ id: 'Contact' });
export type PublicContact = z.infer<typeof publicContactSchema>;

export const publicSkillCategorySchema = z
  .object({
    key: z.string(),
    name: z.string(),
    kind: z.enum(skillKinds),
    skills: z.array(z.string()),
  })
  .meta({ id: 'SkillCategory' });
export type PublicSkillCategory = z.infer<typeof publicSkillCategorySchema>;

export const publicExperienceSchema = z
  .object({
    id: z.string(),
    company: z.string(),
    companyUrl: z.string().nullable(),
    role: z.string(),
    employmentType: z.enum(employmentTypes),
    location: z.string().nullable(),
    workMode: z.enum(workModes).nullable(),
    period: periodSchema,
    summary: z.string(),
    /** Technologies used. */
    skills: z.array(z.string()),
    /** Soft skills (teamwork, communication…), listed apart from technologies. */
    softSkills: z.array(z.string()),
  })
  .meta({ id: 'Experience' });
export type PublicExperience = z.infer<typeof publicExperienceSchema>;

export const publicProjectLinkSchema = z
  .object({
    kind: z.enum(projectLinkKinds),
    label: z.string(),
    href: z.string(),
  })
  .meta({ id: 'ProjectLink' });

export const publicProjectSummarySchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    tagline: z.string(),
    featured: z.boolean(),
    period: periodSchema.nullable(),
    coverUrl: z.string().nullable(),
    /** Technologies used. */
    skills: z.array(z.string()),
    /** Soft skills, listed apart from technologies. */
    softSkills: z.array(z.string()),
    links: z.array(publicProjectLinkSchema),
  })
  .meta({ id: 'ProjectSummary' });
export type PublicProjectSummary = z.infer<typeof publicProjectSummarySchema>;

export const publicProjectSchema = publicProjectSummarySchema
  .extend({
    summary: z.string(),
    /** Markdown, README-style. `null` when only the summary exists. */
    body: z.string().nullable(),
  })
  .meta({ id: 'Project' });
export type PublicProject = z.infer<typeof publicProjectSchema>;

export const publicEducationSchema = z
  .object({
    institution: z.string(),
    institutionShort: z.string().nullable(),
    degree: z.string(),
    period: periodSchema,
    endIsExpected: z.boolean(),
    summary: z.string(),
  })
  .meta({ id: 'Education' });
export type PublicEducation = z.infer<typeof publicEducationSchema>;

export const publicCertificationSchema = z
  .object({
    name: z.string(),
    issuer: z.string(),
    issuedAt: partialDateSchema,
    expiresAt: partialDateSchema.nullable(),
    credentialUrl: z.string().nullable(),
    note: z.string(),
  })
  .meta({ id: 'Certification' });
export type PublicCertification = z.infer<typeof publicCertificationSchema>;

export const publicLanguageSchema = z
  .object({
    name: z.string(),
    level: z.enum(languageLevels),
  })
  .meta({ id: 'Language' });
export type PublicLanguage = z.infer<typeof publicLanguageSchema>;

/** Everything the home page needs, in one request. */
export const publicPortfolioSchema = z
  .object({
    profile: publicProfileSchema,
    contacts: z.array(publicContactSchema),
    skills: z.array(publicSkillCategorySchema),
    experience: z.array(publicExperienceSchema),
    projects: z.array(publicProjectSummarySchema),
    education: z.array(publicEducationSchema),
    certifications: z.array(publicCertificationSchema),
    languages: z.array(publicLanguageSchema),
  })
  .meta({ id: 'Portfolio' });
export type PublicPortfolio = z.infer<typeof publicPortfolioSchema>;

/** Wraps a payload in the `{ data, meta }` envelope every GET returns. */
export function envelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({ data, meta: responseMetaSchema });
}
export type Envelope<T> = { data: T; meta: ResponseMeta };

export const contactMessageInputSchema = z
  .object({
    // Messages are shown as-is next to the form fields.
    name: z
      .string()
      .trim()
      .min(2, 'Informe seu nome.')
      .max(120, 'Use no máximo 120 caracteres.'),
    email: z
      .email('Informe um e-mail válido.')
      .max(254, 'Use no máximo 254 caracteres.'),
    message: z
      .string()
      .trim()
      .min(10, 'Escreva pelo menos 10 caracteres.')
      .max(5000, 'Use no máximo 5000 caracteres.'),
    /** Honeypot: hidden in the form, so only bots fill it. Must stay empty. */
    website: z.string().max(0).optional(),
  })
  .meta({ id: 'ContactMessageInput' });
export type ContactMessageInput = z.infer<typeof contactMessageInputSchema>;

export const contactMessageAcceptedSchema = z
  .object({ data: z.object({ received: z.literal(true) }) })
  .meta({ id: 'ContactMessageAccepted' });

export const apiErrorSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z
        .array(z.object({ path: z.string(), message: z.string() }))
        .optional(),
    }),
  })
  .meta({ id: 'ApiError' });
export type ApiError = z.infer<typeof apiErrorSchema>;
