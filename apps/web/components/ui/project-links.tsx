import { ExternalLink, Globe, Store, BookOpen, PlayCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { PublicProjectSummary } from '@devprofile/shared';
import { GithubIcon } from '@/components/ui/brand-icons';
import { trackClick } from '@/lib/analytics';

type ProjectLink = PublicProjectSummary['links'][number];

function LinkIcon({ kind }: { kind: ProjectLink['kind'] }) {
  const className = 'size-3.5';
  switch (kind) {
    case 'REPOSITORY':
      return <GithubIcon className={className} />;
    case 'WEBSITE':
      return <Globe className={className} aria-hidden />;
    case 'STORE':
      return <Store className={className} aria-hidden />;
    case 'DOCS':
      return <BookOpen className={className} aria-hidden />;
    case 'DEMO':
      return <PlayCircle className={className} aria-hidden />;
    default:
      return <ExternalLink className={className} aria-hidden />;
  }
}

export async function ProjectLinks({
  project,
  links,
}: {
  project: string;
  links: ProjectLink[];
}) {
  const t = await getTranslations('projects');
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer"
            {...trackClick('project-link', { project, kind: link.kind })}
            className="relative z-10 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
          >
            <LinkIcon kind={link.kind} />
            {/* Repo links with a generic label read better as "Código"/"Code". */}
            {link.kind === 'REPOSITORY' && link.label === 'GitHub'
              ? t('linkKinds.REPOSITORY')
              : link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
