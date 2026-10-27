import { getTranslations } from 'next-intl/server';
import type { Locale, ResponseMeta } from '@devprofile/shared';
import { formatDay } from '@/lib/format';

/** VS Code-style footer with availability, last update and links to the API docs. */
export async function StatusBar({
  meta,
  location,
  openToWork,
}: {
  meta: ResponseMeta;
  location: string;
  openToWork: boolean;
}) {
  const t = await getTranslations('status');
  const tHero = await getTranslations('hero');
  const tDev = await getTranslations('dev');
  const locale = meta.locale as Locale;

  return (
    <footer className="border-t border-line bg-panel">
      <div className="mx-auto flex max-w-[110rem] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 font-mono text-[0.6875rem] text-soft sm:px-6">
        <span className="flex items-center gap-1.5 text-get">
          <span className="size-1.5 rounded-full bg-get" aria-hidden />
          {t('online')}
        </span>
        <span>{openToWork ? tHero('openToWork') : tHero('notLooking')}</span>
        <span>{location}</span>
        <span className="sm:ml-auto">
          {t('updated', { date: formatDay(meta.updatedAt, locale) })}
        </span>
        <span>{meta.version}</span>
        <a href="/api/docs" className="hover:text-fg">
          {tDev('docs')}
        </a>
        <span className="hidden md:inline">{t('builtWith')}</span>
      </div>
    </footer>
  );
}
