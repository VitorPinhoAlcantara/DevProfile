import type { Locale } from '@devprofile/shared';

const MONTHS: Record<Locale, string[]> = {
  'pt-BR': [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ],
  en: [
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
  ],
};

/** `2025-09` → `set/2025` (pt) or `Sep 2025` (en); `2025` stays `2025`. */
export function formatPartialDate(value: string, locale: Locale): string {
  const [year, month] = value.split('-');
  if (!month) return year!;
  const name = MONTHS[locale][Number(month) - 1];
  return locale === 'en' ? `${name} ${year}` : `${name}/${year}`;
}

export function formatPeriod(
  period: { start: string; end: string | null },
  locale: Locale,
  presentLabel: string,
): string {
  const end = period.end ? formatPartialDate(period.end, locale) : presentLabel;
  return `${formatPartialDate(period.start, locale)} – ${end}`;
}

const toMonthIndex = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  return year! * 12 + (month ?? 1) - 1;
};

/** Inclusive length of a period, e.g. `1 ano e 2 meses` / `1 yr 2 mos`. */
export function formatDuration(
  period: { start: string; end: string | null },
  locale: Locale,
  now = new Date(),
): string {
  const endIndex = period.end
    ? toMonthIndex(period.end)
    : now.getFullYear() * 12 + now.getMonth();
  const total = Math.max(1, endIndex - toMonthIndex(period.start) + 1);
  const years = Math.floor(total / 12);
  const months = total % 12;

  const parts =
    locale === 'en'
      ? [
          years ? `${years} ${years === 1 ? 'yr' : 'yrs'}` : '',
          months ? `${months} ${months === 1 ? 'mo' : 'mos'}` : '',
        ]
      : [
          years ? `${years} ${years === 1 ? 'ano' : 'anos'}` : '',
          months ? `${months} ${months === 1 ? 'mês' : 'meses'}` : '',
        ];
  return parts.filter(Boolean).join(locale === 'en' ? ' ' : ' e ');
}

/** Full date for "updated on", e.g. `26/10/2026` or `Oct 26, 2026`. */
export function formatDay(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: locale === 'en' ? 'medium' : 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase();
}
