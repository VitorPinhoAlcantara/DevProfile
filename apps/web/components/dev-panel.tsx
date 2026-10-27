'use client';

import { Braces, Check, Copy, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { JsonView } from '@/components/json-view';
import { MethodPill } from '@/components/ui/method-pill';
import { useWorkspace } from '@/components/workspace-provider';
import { cn } from '@/lib/cn';
import { type Section, sections } from '@/lib/sections';

type CallResult =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'done'; status: number; ms: number; bytes: number; body: unknown };

const contactExample = {
  name: 'Maria Silva',
  email: 'maria@empresa.com.br',
  message: 'Olá, Vitor! Gostaria de conversar sobre uma vaga.',
};

// Responses are cached per URL for the visit, so scrolling back and forth stays instant.
const cache = new Map<string, Extract<CallResult, { state: 'done' }>>();

function useApiCall(section: Section, locale: string) {
  const url = `${section.endpoint}?lang=${locale}`;
  const [result, setResult] = useState<CallResult>({ state: 'loading' });

  useEffect(() => {
    if (section.method !== 'GET') return;
    const cached = cache.get(url);
    if (cached) {
      setResult(cached);
      return;
    }
    const controller = new AbortController();
    setResult({ state: 'loading' });
    const started = performance.now();
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const text = await res.text();
        const done = {
          state: 'done' as const,
          status: res.status,
          ms: Math.round(performance.now() - started),
          bytes: new TextEncoder().encode(text).length,
          body: JSON.parse(text) as unknown,
        };
        cache.set(url, done);
        setResult(done);
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== 'AbortError')
          setResult({ state: 'error' });
      });
    return () => controller.abort();
  }, [url, section.method]);

  return { url, result };
}

function curlFor(section: Section, url: string) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  if (section.method === 'GET') return `curl -s "${origin}${url}"`;
  return [
    `curl -s -X POST "${origin}${section.endpoint}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${JSON.stringify(contactExample)}'`,
  ].join('\n');
}

const formatBytes = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

/** The request/response viewer, shared by the desktop sidebar and the mobile drawer. */
function DevPanelBody({ onClose }: { onClose?: () => void }) {
  const t = useTranslations('dev');
  const locale = useLocale();
  const { activeSection } = useWorkspace();
  const section = sections.find((s) => s.id === activeSection) ?? sections[0];
  const { url, result } = useApiCall(section, locale);
  const [tab, setTab] = useState<'json' | 'curl'>('json');
  const [copied, setCopied] = useState(false);

  const curl = curlFor(section, url);
  const copyText =
    tab === 'curl'
      ? curl
      : section.method === 'GET' && result.state === 'done'
        ? JSON.stringify(result.body, null, 2)
        : JSON.stringify(contactExample, null, 2);

  const copy = async () => {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <MethodPill method={section.method} />
        <code className="min-w-0 truncate font-mono text-xs text-fg">
          {section.method === 'GET' ? url : section.endpoint}
        </code>
        {result.state === 'done' && section.method === 'GET' && (
          <span className="ml-auto shrink-0 font-mono text-[0.6875rem] text-get">
            {result.status} OK
          </span>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded text-soft hover:bg-panel-2',
              (result.state !== 'done' || section.method !== 'GET') &&
                'ml-auto',
            )}
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-line px-2">
        {(['json', 'curl'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTab(option)}
            aria-pressed={tab === option}
            className={cn(
              'border-b-2 px-2 py-1.5 font-mono text-xs transition',
              tab === option
                ? 'border-accent text-fg'
                : 'border-transparent text-soft hover:text-muted',
            )}
          >
            {option === 'json' ? 'JSON' : 'cURL'}
          </button>
        ))}
        {result.state === 'done' && section.method === 'GET' && (
          <span className="ml-auto font-mono text-[0.6875rem] text-soft">
            {result.ms} ms · {formatBytes(result.bytes)}
          </span>
        )}
        <button
          type="button"
          onClick={copy}
          className={cn(
            'flex items-center gap-1 rounded px-1.5 py-1 text-[0.6875rem] text-soft hover:text-fg',
            !(result.state === 'done' && section.method === 'GET') && 'ml-auto',
          )}
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? t('copied') : t('copy')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {tab === 'curl' ? (
          <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-all text-muted">
            {curl}
          </pre>
        ) : section.method !== 'GET' ? (
          <div className="space-y-3">
            <p className="text-xs text-soft">{t('requestBody')}</p>
            <JsonView value={contactExample} />
            <p className="text-xs text-soft">{t('notExecuted')}</p>
          </div>
        ) : result.state === 'loading' ? (
          <p className="font-mono text-xs text-soft">{t('loading')}</p>
        ) : result.state === 'error' ? (
          <p className="font-mono text-xs text-post">{t('failed')}</p>
        ) : (
          <JsonView value={result.body} />
        )}
      </div>

      <div className="border-t border-line px-3 py-2 text-[0.6875rem] text-soft">
        {t('hint')}{' '}
        <a href="/api/docs" className="text-accent hover:underline">
          {t('docs')}
        </a>
      </div>
    </div>
  );
}

/** Right-hand column on wide screens, toggled by "Modo dev" in the header. */
export function DevSidebar() {
  const { devOpen } = useWorkspace();
  if (!devOpen) return null;
  return (
    <aside
      aria-label="API"
      className="sticky top-20 hidden h-[calc(100vh-6.5rem)] overflow-hidden rounded-lg border border-line bg-panel xl:block"
    >
      <DevPanelBody />
    </aside>
  );
}

/** Floating "JSON" button and bottom sheet for screens without the sidebar. */
export function DevDrawer() {
  const t = useTranslations('dev');
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="fixed right-4 bottom-4 z-30 flex items-center gap-1.5 rounded-full border border-line-strong bg-panel px-3.5 py-2 font-mono text-xs text-fg shadow-lg xl:hidden">
        <Braces className="size-3.5" aria-hidden />
        {t('open')}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex h-[70vh] flex-col rounded-t-xl border-t border-line-strong bg-panel outline-none">
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong" />
          <Drawer.Title className="sr-only">{t('title')}</Drawer.Title>
          <Drawer.Description className="sr-only">
            {t('hint')}
          </Drawer.Description>
          <div className="min-h-0 flex-1">
            <DevPanelBody onClose={() => setOpen(false)} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
