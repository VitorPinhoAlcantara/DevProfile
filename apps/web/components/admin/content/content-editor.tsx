'use client';

import { ExternalLink, RotateCcw, Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  adminContentSchema,
  type PortfolioContent,
  type PortfolioSection,
  portfolioSchema,
  portfolioSections,
  savedContentSchema,
} from '@devprofile/shared';
import { Button, Notice, PageHeader } from '@/components/admin/ui';
import { AdminApiError, adminFetch } from '@/lib/admin-api';
import { cn } from '@/lib/cn';
import { sectionLabels } from './labels';
import {
  CertificationsSection,
  ContactsSection,
  EducationSection,
  ExperiencesSection,
  LanguagesSection,
  SettingsSection,
  SkillsSection,
} from './sections/list-sections';
import { ProfileSection } from './sections/profile-section';
import { ProjectsSection } from './sections/projects-section';
import type { SectionProps, Update } from './types';

const sectionViews: Record<
  PortfolioSection,
  (props: SectionProps) => React.ReactNode
> = {
  profile: ProfileSection,
  contacts: ContactsSection,
  skillCategories: SkillsSection,
  experiences: ExperiencesSection,
  projects: ProjectsSection,
  education: EducationSection,
  certifications: CertificationsSection,
  languages: LanguagesSection,
  settings: SettingsSection,
};

/** Drops blank bullet lines left while typing in the "one per line" boxes. */
function normalize(content: PortfolioContent): PortfolioContent {
  const clean = (lines: string[]) => lines.map((l) => l.trim()).filter(Boolean);
  return {
    ...content,
    experiences: content.experiences.map((e) => ({
      ...e,
      cvBullets: { pt: clean(e.cvBullets.pt), en: clean(e.cvBullets.en) },
    })),
    projects: content.projects.map((p) => ({
      ...p,
      cvBullets: { pt: clean(p.cvBullets.pt), en: clean(p.cvBullets.en) },
    })),
  };
}

/** `experiences.0.role.pt` → `Experiências › item 1 › role.pt` */
function readablePath(path: (string | number)[]) {
  const [section, index, ...rest] = path;
  const label = sectionLabels[section as PortfolioSection] ?? String(section);
  if (typeof index !== 'number')
    return [label, index, ...rest].filter((p) => p !== undefined).join(' › ');
  return [label, `item ${index + 1}`, rest.join('.')]
    .filter(Boolean)
    .join(' › ');
}

type Status =
  | { kind: 'idle' }
  | { kind: 'saved' }
  | { kind: 'conflict' }
  | { kind: 'invalid'; issues: string[] }
  | { kind: 'error'; message: string };

export function ContentEditor() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get('section') as PortfolioSection | null;
  const section: PortfolioSection =
    requested && portfolioSections.includes(requested) ? requested : 'profile';

  const [draft, setDraft] = useState<PortfolioContent | null>(null);
  const [saved, setSaved] = useState<string>('');
  const [version, setVersion] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminFetch('/content', adminContentSchema);
      setDraft(data.content);
      setSaved(JSON.stringify(normalize(data.content)));
      setVersion(data.version);
      setStatus({ kind: 'idle' });
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(
    () => draft !== null && JSON.stringify(normalize(draft)) !== saved,
    [draft, saved],
  );

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update: Update = useCallback((recipe) => {
    setDraft((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      recipe(next);
      return next;
    });
    setStatus((s) => (s.kind === 'saved' ? { kind: 'idle' } : s));
  }, []);

  const save = async () => {
    if (!draft) return;
    const content = normalize(draft);
    const check = portfolioSchema.safeParse(content);
    if (!check.success) {
      setStatus({
        kind: 'invalid',
        issues: check.error.issues.map(
          (i) => `${readablePath(i.path as (string | number)[])}: ${i.message}`,
        ),
      });
      return;
    }
    setSaving(true);
    try {
      const result = await adminFetch('/content', savedContentSchema, {
        method: 'PUT',
        body: { content: check.data, version },
      });
      setVersion(result.version);
      setSaved(JSON.stringify(content));
      setDraft(check.data);
      setStatus({ kind: 'saved' });
    } catch (err) {
      if (err instanceof AdminApiError && err.code === 'VERSION_CONFLICT') {
        setStatus({ kind: 'conflict' });
      } else if (err instanceof AdminApiError && err.details.length) {
        setStatus({
          kind: 'invalid',
          issues: err.details.map((d) => `${d.path}: ${d.message}`),
        });
      } else {
        setStatus({ kind: 'error', message: (err as Error).message });
      }
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (window.confirm('Descartar as alterações não salvas?')) void load();
  };

  const go = (next: PortfolioSection) =>
    router.replace(`/admin/content?section=${next}`, { scroll: false });

  if (loadError) return <Notice tone="error">{loadError}</Notice>;
  if (!draft)
    return <p className="font-mono text-sm text-soft">Carregando conteúdo…</p>;

  const View = sectionViews[section];

  return (
    <>
      <PageHeader
        title="Conteúdo"
        method="PUT"
        endpoint="/api/admin/content"
        description="Edite em português e inglês. Ao salvar, o site é atualizado na hora e a versão anterior fica no histórico."
        actions={
          <a
            href="/"
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 px-2 text-sm text-muted hover:text-fg"
          >
            <ExternalLink className="size-4" aria-hidden /> Ver site
          </a>
        }
      />

      <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-wrap items-center gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <span className={cn('text-sm', dirty ? 'text-post' : 'text-soft')}>
          {dirty ? '● Alterações não salvas' : 'Tudo salvo'}
        </span>
        <span className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={discard} disabled={!dirty || saving}>
            <RotateCcw className="size-4" aria-hidden /> Descartar
          </Button>
          <Button variant="primary" onClick={save} disabled={!dirty || saving}>
            <Save className="size-4" aria-hidden />{' '}
            {saving ? 'Salvando…' : 'Salvar e publicar'}
          </Button>
        </span>
      </div>

      <div className="mb-5 space-y-2">
        {status.kind === 'saved' && (
          <Notice tone="success">Salvo. O site já mostra a nova versão.</Notice>
        )}
        {status.kind === 'error' && (
          <Notice tone="error">{status.message}</Notice>
        )}
        {status.kind === 'conflict' && (
          <Notice tone="error">
            O conteúdo foi alterado em outra aba ou sessão depois que você abriu
            o editor.{' '}
            <button
              type="button"
              className="underline"
              onClick={() => void load()}
            >
              Recarregar a versão atual
            </button>{' '}
            (suas alterações daqui serão perdidas).
          </Notice>
        )}
        {status.kind === 'invalid' && (
          <Notice tone="error">
            <p className="mb-1 font-medium">Corrija antes de salvar:</p>
            <ul className="list-disc space-y-0.5 pl-5">
              {status.issues.slice(0, 12).map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </Notice>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8">
        <nav
          aria-label="Seções do conteúdo"
          className="mb-5 flex gap-1 overflow-x-auto lg:sticky lg:top-20 lg:mb-0 lg:block lg:self-start"
        >
          {portfolioSections.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => go(option)}
              aria-current={option === section ? 'page' : undefined}
              className={cn(
                'block shrink-0 rounded-md px-3 py-1.5 text-left text-sm transition lg:w-full',
                option === section
                  ? 'bg-panel-2 text-fg'
                  : 'text-muted hover:text-fg',
              )}
            >
              {sectionLabels[option]}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          <View content={draft} update={update} />
        </div>
      </div>
    </>
  );
}
