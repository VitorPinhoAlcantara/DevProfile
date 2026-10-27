'use client';

import { LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { adminMeSchema } from '@devprofile/shared';
import { Button, Field, Notice, TextInput } from '@/components/admin/ui';
import { AdminApiError, adminFetch } from '@/lib/admin-api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminFetch('/auth/login', adminMeSchema, {
        method: 'POST',
        body: { email, password, ...(needsTotp ? { totp } : {}) },
      });
      // Only same-site admin paths are honored, so `next` can't redirect elsewhere.
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(next?.startsWith('/admin') ? next : '/admin');
    } catch (err) {
      if (err instanceof AdminApiError && err.code === 'TOTP_REQUIRED') {
        setNeedsTotp(true);
      } else if (err instanceof AdminApiError && err.status === 429) {
        setError('Muitas tentativas. Espere alguns minutos e tente de novo.');
      } else {
        setError(
          err instanceof AdminApiError
            ? err.message
            : 'Não foi possível entrar.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-line bg-panel p-6"
      >
        <div className="flex items-center gap-2">
          <LockKeyhole className="size-5 text-accent" aria-hidden />
          <h1 className="text-lg font-semibold text-fg">Entrar no painel</h1>
        </div>
        <p className="font-mono text-xs text-soft">
          POST /api/admin/auth/login
        </p>

        {error && <Notice tone="error">{error}</Notice>}

        {!needsTotp ? (
          <>
            <Field label="E-mail">
              {(id) => (
                <TextInput
                  id={id}
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>
            <Field label="Senha">
              {(id) => (
                <TextInput
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>
          </>
        ) : (
          <Field
            label="Código do app autenticador"
            hint="Os 6 dígitos que aparecem no app."
          >
            {(id) => (
              <TextInput
                id={id}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                autoFocus
                required
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                className="font-mono tracking-[0.3em]"
              />
            )}
          </Field>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={busy}
          className="w-full"
        >
          {busy ? 'Entrando…' : needsTotp ? 'Confirmar código' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
