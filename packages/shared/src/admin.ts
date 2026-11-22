import { z } from 'zod';
import { portfolioSchema } from './content.js';

// Contracts for /api/admin/*. Every mutating request must also send the
// `X-DevProfile-Admin: 1` header (CSRF guard, see ADMIN_HEADER).

export const ADMIN_HEADER = 'x-devprofile-admin';

export const totpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Use os 6 dígitos do app autenticador.');

// Argon2 hashes the whole input, so an unbounded password is a cheap way to burn CPU.
const MAX_PASSWORD_LENGTH = 256;
const passwordInput = (message: string) =>
  z.string().min(1, message).max(MAX_PASSWORD_LENGTH);

export const loginInputSchema = z
  .object({
    email: z.email('Informe um e-mail válido.'),
    password: passwordInput('Informe a senha.'),
    totp: totpCodeSchema.optional(),
  })
  .meta({ id: 'LoginInput' });
export type LoginInput = z.infer<typeof loginInputSchema>;

export const adminMeSchema = z
  .object({
    email: z.string(),
    totpEnabled: z.boolean(),
  })
  .meta({ id: 'AdminMe' });
export type AdminMe = z.infer<typeof adminMeSchema>;

export const MIN_PASSWORD_LENGTH = 12;

export const changePasswordInputSchema = z
  .object({
    currentPassword: passwordInput('Informe a senha atual.'),
    newPassword: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      )
      .max(MAX_PASSWORD_LENGTH),
  })
  .meta({ id: 'ChangePasswordInput' });
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const totpSetupSchema = z
  .object({
    secret: z.string(),
    otpauthUrl: z.string(),
    qrSvg: z.string(),
  })
  .meta({ id: 'TotpSetup' });
export type TotpSetup = z.infer<typeof totpSetupSchema>;

export const totpEnableInputSchema = z
  .object({ code: totpCodeSchema })
  .meta({ id: 'TotpEnableInput' });

export const totpDisableInputSchema = z
  .object({ code: totpCodeSchema, password: passwordInput('Informe a senha.') })
  .meta({ id: 'TotpDisableInput' });

/** The whole portfolio plus the version it was read at (optimistic locking). */
export const adminContentSchema = z
  .object({
    content: portfolioSchema,
    version: z.string(),
  })
  .meta({ id: 'AdminContent' });
export type AdminContent = z.infer<typeof adminContentSchema>;

export const saveContentInputSchema = z
  .object({
    content: portfolioSchema,
    /** The `version` the editor started from; 409 if someone saved in between. */
    version: z.string(),
  })
  .meta({ id: 'SaveContentInput' });
export type SaveContentInput = z.input<typeof saveContentInputSchema>;

export const savedContentSchema = z
  .object({ version: z.string() })
  .meta({ id: 'SavedContent' });

export const mediaItemSchema = z
  .object({
    id: z.string(),
    key: z.string(),
    url: z.string(),
    /** What goes into `cover`/`photo` fields: `media:<key>`. */
    ref: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'MediaItem' });
export type MediaItem = z.infer<typeof mediaItemSchema>;

export const contactMessageSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    message: z.string(),
    createdAt: z.iso.datetime(),
    readAt: z.iso.datetime().nullable(),
  })
  .meta({ id: 'ContactMessage' });
export type ContactMessage = z.infer<typeof contactMessageSchema>;

export const markMessageInputSchema = z
  .object({ read: z.boolean() })
  .meta({ id: 'MarkMessageInput' });

export const portfolioSections = [
  'profile',
  'contacts',
  'skillCategories',
  'experiences',
  'projects',
  'education',
  'certifications',
  'languages',
  'settings',
] as const;
export type PortfolioSection = (typeof portfolioSections)[number];

export const historyEntrySchema = z
  .object({
    id: z.string(),
    action: z.enum(['UPDATE', 'RESTORE']),
    createdAt: z.iso.datetime(),
    actor: z.string().nullable(),
    /** Top-level parts of the portfolio that changed in this save. */
    changed: z.array(z.enum(portfolioSections)),
    /** Item-level summary, e.g. `StreetUrban editado`. */
    details: z.array(z.string()),
  })
  .meta({ id: 'HistoryEntry' });
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export const dashboardSchema = z
  .object({
    version: z.string(),
    updatedAt: z.iso.datetime(),
    unreadMessages: z.number(),
    totalMessages: z.number(),
    counts: z.object({
      experiences: z.number(),
      projects: z.number(),
      skills: z.number(),
      certifications: z.number(),
      media: z.number(),
    }),
    recentChanges: z.array(historyEntrySchema),
  })
  .meta({ id: 'Dashboard' });
export type Dashboard = z.infer<typeof dashboardSchema>;

export const cvCheckSchema = z
  .object({
    id: z.string(),
    status: z.enum(['pass', 'warn', 'fail']),
    label: z.string(),
    detail: z.string().nullable(),
  })
  .meta({ id: 'CvCheck' });
export type CvCheck = z.infer<typeof cvCheckSchema>;

export const cvReportSchema = z
  .object({
    locale: z.enum(['pt-BR', 'en']),
    pages: z.number(),
    generatedAt: z.iso.datetime(),
    checks: z.array(cvCheckSchema),
  })
  .meta({ id: 'CvReport' });
export type CvReport = z.infer<typeof cvReportSchema>;

/** Values that go into UTM parameters and link slugs: lowercase, no spaces. */
const utmValue = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Preencha este campo.')
  .max(60)
  .regex(
    /^[a-z0-9][a-z0-9._-]*$/,
    'Use letras minúsculas, números, ponto, hífen ou sublinhado.',
  );

/** `utm_medium` suggestions; `curriculo` is the one the CV generator understands. */
export const linkMediums = [
  'curriculo',
  'social',
  'email',
  'mensagem',
  'evento',
  'outro',
] as const;

export const shortLinkInputSchema = z
  .object({
    slug: utmValue,
    source: utmValue,
    medium: utmValue,
    campaign: utmValue.nullable().default(null),
    destination: z
      .string()
      .trim()
      .max(200)
      .regex(/^\/(?!\/)\S*$/, 'Use um caminho do site, como / ou /projects/x.')
      .default('/'),
    note: z.string().trim().max(200).nullable().default(null),
  })
  .meta({ id: 'ShortLinkInput' });
export type ShortLinkInput = z.infer<typeof shortLinkInputSchema>;

export const shortLinkSchema = shortLinkInputSchema
  .extend({
    id: z.string(),
    /** The short address to share, e.g. `https://alcantara.dev.br/r/empresa-x`. */
    url: z.string(),
    clicks: z.number(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'ShortLink' });
export type ShortLink = z.infer<typeof shortLinkSchema>;
