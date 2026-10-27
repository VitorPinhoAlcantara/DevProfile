'use client';

import { ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';
import type { LocalizedText } from '@devprofile/shared';
import { MediaPickerDialog } from '@/components/admin/media-library';
import { Button, TextArea } from '@/components/admin/ui';
import { Markdown } from '@/components/markdown';
import { cn } from '@/lib/cn';

type Lang = 'pt' | 'en';

/**
 * README-style page editor: Markdown per language, live preview, and an
 * "insert image" button that drops `![alt](url)` at the cursor.
 */
export function MarkdownEditor({
  value,
  onChange,
}: {
  value: LocalizedText | null;
  onChange: (value: LocalizedText | null) => void;
}) {
  const [lang, setLang] = useState<Lang>('pt');
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [picking, setPicking] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const current = value ?? { pt: '', en: '' };

  const set = (text: string) => {
    const next = { ...current, [lang]: text };
    // Both empty means "no page": the site falls back to the short summary.
    onChange(next.pt.trim() === '' && next.en.trim() === '' ? null : next);
  };

  const insertAtCursor = (snippet: string) => {
    const el = textarea.current;
    const text = current[lang];
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    set(`${text.slice(0, start)}${snippet}${text.slice(end)}`);
  };

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Página do projeto (Markdown)</p>
        <div className="flex flex-wrap items-center gap-1">
          {(['pt', 'en'] as const).map((option) => (
            <Tab
              key={option}
              active={lang === option}
              onClick={() => setLang(option)}
            >
              {option.toUpperCase()}
            </Tab>
          ))}
          <span className="mx-1 h-4 w-px bg-line" />
          <Tab active={mode === 'write'} onClick={() => setMode('write')}>
            Escrever
          </Tab>
          <Tab active={mode === 'preview'} onClick={() => setMode('preview')}>
            Pré-visualizar
          </Tab>
        </div>
      </div>

      {mode === 'write' ? (
        <>
          <TextArea
            ref={textarea}
            aria-label={`Página do projeto em ${lang.toUpperCase()}`}
            rows={18}
            value={current[lang]}
            onChange={(e) => set(e.target.value)}
            className="font-mono text-[0.8125rem]"
            placeholder={
              '## Sobre o projeto\n\nO que ele resolve, como funciona, qual foi a sua parte…'
            }
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <Button onClick={() => setPicking(true)}>
              <ImagePlus className="size-4" aria-hidden />
              Inserir imagem
            </Button>
            <p className="text-xs text-soft">
              Títulos com <code>##</code>, listas com <code>-</code>, tabelas e{' '}
              <code>&gt; citações</code>. A legenda da imagem vem do texto entre
              colchetes.
            </p>
          </div>
        </>
      ) : (
        <div className="min-h-40 rounded-md border border-line bg-bg p-5">
          {current[lang].trim() ? (
            <Markdown>{current[lang]}</Markdown>
          ) : (
            <p className="text-sm text-soft">Nada para mostrar ainda.</p>
          )}
        </div>
      )}

      <MediaPickerDialog
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(item) => {
          setPicking(false);
          insertAtCursor(`\n![Descreva a imagem](${item.url})\n`);
        }}
      />
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded px-2 py-1 text-xs transition',
        active ? 'bg-panel-2 text-fg' : 'text-soft hover:text-muted',
      )}
    >
      {children}
    </button>
  );
}
