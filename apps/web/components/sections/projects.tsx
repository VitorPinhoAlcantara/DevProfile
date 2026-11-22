import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { PublicProjectSummary } from '@devprofile/shared';
import { ChipList } from '@/components/ui/chip';
import { ProjectLinks } from '@/components/ui/project-links';
import { Section } from '@/components/ui/section';
import { Link } from '@/i18n/navigation';
import { responsiveImage } from '@/lib/media';
import { sections } from '@/lib/sections';

export async function ProjectsSection({
  items,
}: {
  items: PublicProjectSummary[];
}) {
  const t = await getTranslations('projects');
  const tNav = await getTranslations('nav');
  const featured = items.filter((project) => project.featured);
  const others = items.filter((project) => !project.featured);

  return (
    <Section section={sections[2]} title={tNav('projects')}>
      {featured.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {featured.map((project) => (
            <li
              key={project.slug}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-panel p-5 transition hover:border-line-strong"
            >
              {project.coverUrl && (
                <img
                  alt=""
                  loading="lazy"
                  {...responsiveImage(
                    project.coverUrl,
                    '(min-width: 1280px) 30rem, (min-width: 768px) 50vw, 100vw',
                  )}
                  className="-mx-5 -mt-5 mb-5 aspect-[16/9] w-[calc(100%+2.5rem)] max-w-none border-b border-line object-cover object-top"
                />
              )}
              <h3 className="font-semibold text-fg">
                <Link
                  href={`/projects/${project.slug}`}
                  className="after:absolute after:inset-0 after:rounded-lg"
                >
                  {project.name}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {project.tagline}
              </p>
              <div className="mt-4">
                <ChipList items={project.skills.slice(0, 6)} />
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                <ProjectLinks project={project.slug} links={project.links} />
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
      )}

      {others.length > 0 && (
        <>
          {featured.length > 0 && (
            <h3 className="mt-10 mb-3 text-sm font-medium text-muted">
              {t('more')}
            </h3>
          )}
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
            {others.map((project) => (
              <li
                key={project.slug}
                className="group relative grid gap-x-6 gap-y-3 px-5 py-4 transition hover:bg-panel-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <h4 className="font-medium text-fg">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="after:absolute after:inset-0"
                    >
                      {project.name}
                    </Link>
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {project.tagline}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 md:justify-end">
                  <ChipList items={project.skills.slice(0, 3)} />
                  <ArrowRight
                    className="size-4 shrink-0 text-soft transition group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
