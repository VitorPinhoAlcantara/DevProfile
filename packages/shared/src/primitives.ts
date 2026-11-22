import { z } from 'zod';

export const mediaWidths = [
  '320',
  '480',
  '640',
  '960',
  '1280',
  '1600',
] as const;

export const locales = ['pt-BR', 'en'] as const;
export const localeSchema = z.enum(locales);
export type Locale = z.infer<typeof localeSchema>;

export const localizedTextSchema = z.object({
  pt: z.string().trim().min(1),
  en: z.string().trim().min(1),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** Short CV bullets per language. Both lists may differ in length. */
export const localizedListSchema = z.object({
  pt: z.array(z.string().trim().min(1)),
  en: z.array(z.string().trim().min(1)),
});
export type LocalizedList = z.infer<typeof localizedListSchema>;

export const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use o formato AAAA-MM');
export type YearMonth = z.infer<typeof yearMonthSchema>;

/** Year or month precision (`2025` or `2025-02`), for dates whose month is not always known. */
export const partialDateSchema = z
  .string()
  .regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, 'Use o formato AAAA ou AAAA-MM');
export type PartialDate = z.infer<typeof partialDateSchema>;

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hífens');

export const visibilitySchema = z.object({
  showOnSite: z.boolean().default(true),
  showOnCv: z.boolean().default(true),
});
