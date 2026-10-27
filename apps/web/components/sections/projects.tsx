import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { PublicProjectSummary } from '@devprofile/shared';
import { ChipList } from '@/components/ui/chip';
import { ProjectLinks } from '@/components/ui/project-links';
import { Section } from '@/components/ui/section';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { sections } from '@/lib/sections';

export async function ProjectsSection({
  items,
}: {
  items: PublicProjectSummary[];
}) {
  const t = await getTranslations('projects');
  const tNav = await getTranslations('nav');

  return (
    <Section section={sections[2]} title={tNav('projects')}>
      {/*
        Cards with a cover take two rows; cards without one take a single row.
        `grid-flow-row-dense` then backfills the gaps, so two short cards stack
        next to a tall one instead of a lone short card stretching to its height.
      */}
      <ul className="grid gap-4 md:grid-flow-row-dense md:grid-cols-2">
        {items.map((project) => (
          <li
            key={project.slug}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-lg border border-line bg-panel p-5 transition hover:border-line-strong',
              project.coverUrl && 'md:row-span-2',
            )}
          >
            {project.coverUrl && (
              <img
                src={project.coverUrl}
                alt=""
                loading="lazy"
                className="-mx-5 -mt-5 mb-5 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none border-b border-line object-cover object-top"
              />
            )}
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-fg">
                {/* The stretched link makes the whole card clickable. */}
                <Link
                  href={`/projects/${project.slug}`}
                  className="after:absolute after:inset-0 after:rounded-lg"
                >
                  {project.name}
                </Link>
              </h3>
              {project.featured && (
                <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-[0.6875rem] text-accent">
                  {t('featured')}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {project.tagline}
            </p>
            <div className="mt-4">
              <ChipList items={project.skills.slice(0, 6)} />
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
              <ProjectLinks links={project.links} />
              <span className="inline-flex items-center gap-1 text-sm text-accent">
                {t('details')}
                <ArrowRight
                  className="size-3.5 transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
