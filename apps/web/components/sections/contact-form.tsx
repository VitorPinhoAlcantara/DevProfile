'use client';

import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { apiErrorSchema, contactMessageInputSchema } from '@devprofile/shared';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';

type Field = 'name' | 'email' | 'message';
type Status = 'idle' | 'sending' | 'sent' | 'error' | 'rateLimited';

/** Validates with the same schema as the API, then posts to /api/v1/contact. */
export function ContactForm() {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  // Messages come from the translations, so the English page doesn't show Portuguese errors.
  const fieldErrors = (paths: string[]) =>
    Object.fromEntries(
      paths
        .filter((path): path is Field =>
          ['name', 'email', 'message'].includes(path),
        )
        .map((field) => [field, t(`errors.${field}`)]),
    );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    const parsed = contactMessageInputSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues.map((i) => String(i.path[0]))));
      return;
    }

    setErrors({});
    setStatus('sending');
    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (res.status === 429) return setStatus('rateLimited');
      if (res.status === 400) {
        const body = apiErrorSchema.safeParse(await res.json());
        setErrors(
          fieldErrors((body.data?.error.details ?? []).map((d) => d.path)),
        );
        return setStatus('idle');
      }
      if (!res.ok) return setStatus('error');
      form.reset();
      setStatus('sent');
      track('contact-form-sent');
    } catch {
      setStatus('error');
    }
  };

  const fieldClass = (field: Field) =>
    cn(
      'w-full rounded-md border bg-bg px-3 py-2 text-sm text-fg outline-none transition placeholder:text-soft focus:border-accent',
      errors[field] ? 'border-post' : 'border-line',
    );

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4 rounded-lg border border-line bg-panel p-5"
    >
      <h3 className="font-medium text-fg">{t('formTitle')}</h3>

      {(['name', 'email'] as const).map((field) => (
        <div key={field}>
          <label
            htmlFor={`contact-${field}`}
            className="mb-1.5 block text-sm text-muted"
          >
            {t(field)}
          </label>
          <input
            id={`contact-${field}`}
            name={field}
            type={field === 'email' ? 'email' : 'text'}
            autoComplete={field}
            placeholder={t(`${field}Placeholder`)}
            aria-invalid={!!errors[field]}
            aria-describedby={
              errors[field] ? `contact-${field}-error` : undefined
            }
            className={fieldClass(field)}
          />
          {errors[field] && (
            <p id={`contact-${field}-error`} className="mt-1 text-xs text-post">
              {errors[field]}
            </p>
          )}
        </div>
      ))}

      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-sm text-muted"
        >
          {t('message')}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder={t('messagePlaceholder')}
          aria-invalid={!!errors.message}
          aria-describedby={
            errors.message ? 'contact-message-error' : undefined
          }
          className={cn(fieldClass('message'), 'resize-y')}
        />
        {errors.message && (
          <p id="contact-message-error" className="mt-1 text-xs text-post">
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-on-accent transition hover:opacity-90 disabled:opacity-60"
        >
          <Send className="size-4" aria-hidden />
          {status === 'sending' ? t('sending') : t('send')}
        </button>
        <p role="status" className="text-sm">
          {status === 'sent' && (
            <span className="text-get">{t('success')}</span>
          )}
          {status === 'error' && (
            <span className="text-post">{t('error')}</span>
          )}
          {status === 'rateLimited' && (
            <span className="text-post">{t('rateLimited')}</span>
          )}
        </p>
      </div>
    </form>
  );
}
