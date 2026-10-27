'use client';

import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LocalizedList, LocalizedText } from '@devprofile/shared';
import {
  Button,
  Checkbox,
  Field,
  IconButton,
  TextArea,
  TextInput,
} from '@/components/admin/ui';
import { cn } from '@/lib/cn';

const LANGS = [
  { key: 'pt', label: 'PT' },
  { key: 'en', label: 'EN' },
] as const;

function LangTag({ label }: { label: string }) {
  return (
    <span className="rounded bg-panel-2 px-1.5 py-px font-mono text-[0.625rem] text-soft">
      {label}
    </span>
  );
}

/** Portuguese and English side by side, so both versions are edited together. */
export function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  rows,
  hint,
}: {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm text-muted">{label}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {LANGS.map(({ key, label: lang }) => (
          <div key={key} className="relative">
            <span className="absolute top-2 right-2 z-10">
              <LangTag label={lang} />
            </span>
            {multiline ? (
              <TextArea
                aria-label={`${label} (${lang})`}
                rows={rows ?? 4}
                value={value[key]}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                className="pr-12"
              />
            ) : (
              <TextInput
                aria-label={`${label} (${lang})`}
                value={value[key]}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                className="pr-12"
              />
            )}
          </div>
        ))}
      </div>
      {hint && <p className="mt-1 text-xs text-soft">{hint}</p>}
    </fieldset>
  );
}

/** One bullet per line, in both languages. */
export function LocalizedLines({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: LocalizedList;
  onChange: (value: LocalizedList) => void;
  hint?: string;
}) {
  const toText = (lines: string[]) => lines.join('\n');
  // Empty lines are dropped only when saving, so typing a new line still works.
  const toLines = (text: string) => text.split('\n');
  return (
    <LocalizedField
      label={label}
      multiline
      rows={4}
      hint={hint ?? 'Um item por linha.'}
      value={{ pt: toText(value.pt), en: toText(value.en) }}
      onChange={(text) =>
        onChange({ pt: toLines(text.pt), en: toLines(text.en) })
      }
    />
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: 'text' | 'url' | 'month' | 'email';
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <TextInput
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

/** Optional text: an empty box means `null`. */
export function OptionalTextField({
  value,
  onChange,
  ...props
}: Omit<Parameters<typeof TextField>[0], 'value' | 'onChange'> & {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <TextField
      {...props}
      value={value ?? ''}
      onChange={(next) => onChange(next.trim() === '' ? null : next)}
    />
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      {(id) => (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-9 w-full rounded-md border border-line bg-bg px-3 text-sm text-fg outline-none focus:border-accent"
        >
          {(Object.keys(options) as T[]).map((option) => (
            <option key={option} value={option}>
              {options[option]}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

/** Where an item shows up. */
export function VisibilityFields({
  value,
  onChange,
}: {
  value: { showOnSite: boolean; showOnCv: boolean };
  onChange: (value: { showOnSite: boolean; showOnCv: boolean }) => void;
}) {
  return (
    <div className="flex flex-wrap gap-5">
      <Checkbox
        label="Mostrar no site"
        checked={value.showOnSite}
        onChange={(showOnSite) => onChange({ ...value, showOnSite })}
      />
      <Checkbox
        label="Incluir no currículo"
        checked={value.showOnCv}
        onChange={(showOnCv) => onChange({ ...value, showOnCv })}
      />
    </div>
  );
}

/** Toggle chips to pick skills from the catalog. */
export function SkillPicker({
  catalog,
  value,
  onChange,
}: {
  catalog: { category: string; skills: string[] }[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const selected = new Set(value);
  const toggle = (skill: string) =>
    onChange(
      selected.has(skill)
        ? value.filter((s) => s !== skill)
        : [...value, skill],
    );

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm text-muted">
        Tecnologias e habilidades{' '}
        <span className="text-soft">({value.length} selecionadas)</span>
      </legend>
      <div className="space-y-2 rounded-md border border-line p-3">
        {catalog.map((group) => (
          <div
            key={group.category}
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className="mr-1 w-full text-xs text-soft sm:w-40">
              {group.category}
            </span>
            {group.skills.map((skill) => (
              <button
                key={skill}
                type="button"
                aria-pressed={selected.has(skill)}
                onClick={() => toggle(skill)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs transition',
                  selected.has(skill)
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-muted hover:border-line-strong',
                )}
              >
                {skill}
              </button>
            ))}
          </div>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * A reorderable list of collapsible items (experiences, projects…). Order here is
 * the order on the site and on the CV.
 */
export function ListEditor<T>({
  items,
  itemTitle,
  itemSubtitle,
  renderItem,
  onChange,
  createItem,
  addLabel,
  emptyLabel,
}: {
  items: T[];
  itemTitle: (item: T) => string;
  itemSubtitle?: (item: T) => string | null;
  renderItem: (item: T, update: (next: T) => void, index: number) => ReactNode;
  onChange: (items: T[]) => void;
  createItem: () => T;
  addLabel: string;
  emptyLabel: string;
}) {
  const move = (index: number, delta: -1 | 1) => {
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved!);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-soft">
          {emptyLabel}
        </p>
      )}
      {items.map((item, index) => (
        <details
          key={index}
          className="group rounded-lg border border-line bg-panel open:border-line-strong"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
            <ChevronRight
              className="size-4 shrink-0 text-soft transition group-open:rotate-90"
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg">
                {itemTitle(item) || 'Sem título'}
              </span>
              {itemSubtitle?.(item) && (
                <span className="block truncate text-xs text-soft">
                  {itemSubtitle(item)}
                </span>
              )}
            </span>
            <span className="flex shrink-0" onClick={(e) => e.preventDefault()}>
              <IconButton
                label="Subir"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="size-4" aria-hidden />
              </IconButton>
              <IconButton
                label="Descer"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="size-4" aria-hidden />
              </IconButton>
              <IconButton
                label="Remover"
                className="hover:text-del"
                onClick={() => {
                  if (
                    window.confirm(`Remover "${itemTitle(item) || 'item'}"?`)
                  ) {
                    onChange(items.filter((_, i) => i !== index));
                  }
                }}
              >
                <Trash2 className="size-4" aria-hidden />
              </IconButton>
            </span>
          </summary>
          <div className="space-y-4 border-t border-line p-4">
            {renderItem(
              item,
              (next) =>
                onChange(
                  items.map((current, i) => (i === index ? next : current)),
                ),
              index,
            )}
          </div>
        </details>
      ))}
      <Button onClick={() => onChange([...items, createItem()])}>
        <Plus className="size-4" aria-hidden />
        {addLabel}
      </Button>
    </div>
  );
}

export const emptyText = () => ({ pt: '', en: '' });
export const emptyList = () => ({ pt: [] as string[], en: [] as string[] });
