import { z } from 'zod';
import { portfolioSchema } from './content.js';

// Contracts for /api/admin/*. Every mutating request must also send the
// `X-DevProfile-Admin: 1` header (CSRF guard, see ADMIN_HEADER).

export const ADMIN_HEADER = 'x-devprofile-admin';

export const totpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Use os 6 dígitos do app autenticador.');

export const loginInputSchema = z
  .object({
    email: z.email('Informe um e-mail válido.'),
    password: z.string().min(1, 'Informe a senha.'),
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
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      ),
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
  .object({ code: totpCodeSchema, password: z.string().min(1) })
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
