import type { Locale } from '@devprofile/shared';

type Suffix = 'Pt' | 'En';

const suffixOf = (locale: Locale): Suffix => (locale === 'en' ? 'En' : 'Pt');

/** Reads `fooPt` or `fooEn` from a row, e.g. `localized(row, 'headline', 'en')`. */
export function localized<K extends string>(
  row: Record<`${K}${Suffix}`, string>,
  field: K,
  locale: Locale,
): string {
  return row[`${field}${suffixOf(locale)}`];
}

/** Formats the last content change as the `vAAAA.MM.DD` tag, in Brazil's time zone. */
export function versionTag(date: Date): string {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return `v${day.replaceAll('-', '.')}`;
}
