'use client';

import type {
  ButtonHTMLAttributes,
  ComponentProps,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import { useId } from 'react';
import { type Method, MethodPill } from '@/components/ui/method-pill';
import { cn } from '@/lib/cn';

// Small building blocks for the admin forms, styled with the site's tokens.

const controlClass =
  'w-full rounded-md border border-line bg-bg px-3 py-2 text-sm text-fg outline-none transition placeholder:text-soft focus:border-accent disabled:opacity-60';

export function Button({
  variant = 'secondary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-on-accent hover:opacity-90',
        variant === 'secondary' &&
          'border border-line-strong text-fg hover:bg-panel-2',
        variant === 'ghost' && 'text-muted hover:bg-panel-2 hover:text-fg',
        variant === 'danger' &&
          'border border-del/40 text-del hover:bg-del-soft',
        className,
      )}
    />
  );
}

export function IconButton({
  label,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cn(
        'flex size-8 items-center justify-center rounded-md text-soft transition hover:bg-panel-2 hover:text-fg disabled:opacity-30',
        className,
      )}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm text-muted">
        {label}
      </label>
      {children(id)}
      {hint && !error && <p className="mt-1 text-xs text-soft">{hint}</p>}
      {error && <p className="mt-1 text-xs text-del">{error}</p>}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input {...props} className={cn(controlClass, className)} />;
}

export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      {...props}
      className={cn(
        controlClass,
        'min-h-24 resize-y leading-relaxed',
        className,
      )}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(controlClass, 'h-9 py-0', className)} />
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('rounded-lg border border-line bg-panel p-5', className)}
    >
      {children}
    </div>
  );
}

/** Page title with the endpoint it talks to, in the same spirit as the site. */
export function PageHeader({
  title,
  method,
  endpoint,
  description,
  actions,
}: {
  title: string;
  method: Method;
  endpoint: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-soft">
          <MethodPill method={method} />
          <code className="font-mono text-xs">{endpoint}</code>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: 'success' | 'error' | 'info';
  children: ReactNode;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md border px-3.5 py-2.5 text-sm',
        tone === 'success' && 'border-get/30 bg-get-soft text-get',
        tone === 'error' && 'border-del/30 bg-del-soft text-del',
        tone === 'info' && 'border-line bg-panel-2 text-muted',
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-soft">
      {children}
    </p>
  );
}

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
