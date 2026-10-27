import { getLocale, getTranslations } from 'next-intl/server';
import type { Locale, PublicExperience } from '@devprofile/shared';
import { ChipList } from '@/components/ui/chip';
import { Section } from '@/components/ui/section';
import { SoftSkills } from '@/components/ui/soft-skills';
import { formatDuration, formatPeriod } from '@/lib/format';
import { sections } from '@/lib/sections';

export async function ExperienceSection({
  items,
}: {
  items: PublicExperience[];
}) {
  const t = await getTranslations('experience');
  const tNav = await getTranslations('nav');
  const locale = (await getLocale()) as Locale;

  return (
    <Section section={sections[1]} title={tNav('experience')}>
      <ol className="relative space-y-8 border-l border-line pl-6">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span
              className="absolute top-1.5 -left-[1.9rem] size-2.5 rounded-full border-2 border-bg bg-accent"
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-semibold text-fg">
                {item.role}{' '}
                <span className="font-normal text-muted">
                  ·{' '}
                  {item.companyUrl ? (
                    <a
                      href={item.companyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-fg hover:underline"
                    >
                      {item.company}
                    </a>
                  ) : (
                    item.company
                  )}
                </span>
              </h3>
              <p className="font-mono text-xs text-soft">
                {formatPeriod(item.period, locale, t('present'))}
                <span className="ml-2 text-soft/80">
                  ({formatDuration(item.period, locale)})
                </span>
              </p>
            </div>
            <p className="mt-1 text-xs text-soft">
              {t(`employmentTypes.${item.employmentType}`)}
              {item.location && ` · ${item.location}`}
            </p>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted">
              {item.summary}
            </p>
            <div className="mt-3 space-y-2">
              <ChipList items={item.skills} />
              <SoftSkills label={t('softSkills')} items={item.softSkills} />
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
