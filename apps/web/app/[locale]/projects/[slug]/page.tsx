import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@devprofile/shared';
import { Markdown } from '@/components/markdown';
import { ChipList } from '@/components/ui/chip';
import { MethodPill } from '@/components/ui/method-pill';
import { ProjectLinks } from '@/components/ui/project-links';
import { WorkspaceShell } from '@/components/workspace-shell';
import { Link } from '@/i18n/navigation';
import { ApiNotFoundError, getPortfolio, getProject } from '@/lib/api';
import { formatPeriod } from '@/lib/format';
import { responsiveImage } from '@/lib/media';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

async function loadProject(slug: string, locale: Locale) {
  try {
    return await getProject(slug, locale);
  } catch (error) {
    if (error instanceof ApiNotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const { data: project } = await loadProject(slug, locale);
  const path = locale === 'en' ? `/en/projects/${slug}` : `/projects/${slug}`;
  const images = project.coverUrl
    ? [{ url: `${project.coverUrl}?w=1280`, alt: project.name }]
    : undefined;
  return {
    title: project.name,
    description: project.tagline,
    openGraph: {
      type: 'article',
      title: project.name,
      description: project.tagline,
      url: path,
      locale: locale === 'en' ? 'en_US' : 'pt_BR',
      ...(images && { images }),
    },
    twitter: {
      card: 'summary_large_image',
      title: project.name,
      description: project.tagline,
      ...(images && { images }),
    },
    alternates: {
      canonical: path,
      languages: {
        'pt-BR': `/projects/${slug}`,
        en: `/en/projects/${slug}`,
        'x-default': `/projects/${slug}`,
      },
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('projects');
  const tExp = await getTranslations('experience');
  const [{ data: project }, { data: portfolio, meta }] = await Promise.all([
    loadProject(slug, locale),
    getPortfolio(locale),
  ]);
  const ordered = [
    ...portfolio.projects.filter((p) => p.featured),
    ...portfolio.projects.filter((p) => !p.featured),
  ];
  const index = ordered.findIndex((p) => p.slug === slug);
  const previous = index > 0 ? ordered[index - 1] : undefined;
  const next =
    index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined;

  return (
    <WorkspaceShell portfolio={portfolio} meta={meta} withSections={false}>
      <Link
        href="/#projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg pointer-coarse:min-h-11"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('back')}
      </Link>

      <article className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-soft">
            <MethodPill method="GET" />
            <code className="font-mono text-xs">/projects/{project.slug}</code>
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg">
            {project.name}
          </h1>
          <p className="mt-2 text-lg text-muted">{project.tagline}</p>

          {project.coverUrl && (
            // Uploaded screenshot served by the API; plain <img> since Next's
            // optimizer can't reach /api/* behind Caddy.
            <img
              alt=""
              {...responsiveImage(
                project.coverUrl,
                '(min-width: 1024px) 53rem, 100vw',
              )}
              // w-auto: small images (icons) keep their size instead of being upscaled.
              className="mt-6 h-auto w-auto max-w-full rounded-lg border border-line"
            />
          )}

          <div className="mt-8">
            {project.body ? (
              <Markdown>{project.body}</Markdown>
            ) : (
              <p className="leading-relaxed text-muted">{project.summary}</p>
            )}
          </div>
        </div>

        <aside className="mt-10 space-y-6 border-t border-line pt-6 lg:sticky lg:top-20 lg:mt-0 lg:self-start lg:border-t-0 lg:pt-0">
          {project.period && (
            <section>
              <h2 className="mb-1.5 text-sm font-medium text-fg">
                {t('period')}
              </h2>
              <p className="font-mono text-xs text-soft">
                {formatPeriod(project.period, locale, tExp('present'))}
              </p>
            </section>
          )}
          {project.links.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-fg">{t('links')}</h2>
              <ProjectLinks project={project.slug} links={project.links} />
            </section>
          )}
          {project.skills.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-fg">
                {t('technologies')}
              </h2>
              <ChipList items={project.skills} />
            </section>
          )}
          {project.softSkills.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-fg">
                {t('softSkills')}
              </h2>
              <ChipList items={project.softSkills} />
            </section>
          )}
        </aside>
      </article>

      {(previous || next) && (
        <nav
          aria-label={t('more')}
          className="mt-16 grid gap-3 border-t border-line pt-6 sm:grid-cols-2"
        >
          {previous && (
            <Link
              href={`/projects/${previous.slug}`}
              className="group rounded-lg border border-line px-4 py-3 transition hover:border-line-strong"
            >
              <span className="flex items-center gap-1 text-xs text-muted">
                <ArrowLeft
                  className="size-3.5 transition group-hover:-translate-x-0.5"
                  aria-hidden
                />
                {t('previous')}
              </span>
              <span className="mt-1 block font-medium text-fg">
                {previous.name}
              </span>
            </Link>
          )}
          {next && (
            <Link
              href={`/projects/${next.slug}`}
              className="group rounded-lg border border-line px-4 py-3 text-right transition hover:border-line-strong sm:col-start-2"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-muted">
                {t('next')}
                <ArrowRight
                  className="size-3.5 transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="mt-1 block font-medium text-fg">
                {next.name}
              </span>
            </Link>
          )}
        </nav>
      )}
    </WorkspaceShell>
  );
}
