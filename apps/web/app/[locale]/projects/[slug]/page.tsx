import { ArrowLeft } from 'lucide-react';
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
  return {
    title: project.name,
    description: project.tagline,
    alternates: {
      canonical: locale === 'en' ? `/en/projects/${slug}` : `/projects/${slug}`,
      languages: { 'pt-BR': `/projects/${slug}`, en: `/en/projects/${slug}` },
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

  return (
    <WorkspaceShell portfolio={portfolio} meta={meta} withSections={false}>
      <Link
        href="/#projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('back')}
      </Link>

      {/* GitHub-style: README on the left, "about" box on the right. */}
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
              src={project.coverUrl}
              alt=""
              className="mt-6 w-full rounded-lg border border-line"
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
              <ProjectLinks links={project.links} />
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
    </WorkspaceShell>
  );
}
