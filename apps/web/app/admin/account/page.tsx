'use client';

import { ShieldCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import {
  MIN_PASSWORD_LENGTH,
  type TotpSetup,
  totpSetupSchema,
} from '@devprofile/shared';
import { AdminShell, useAdmin } from '@/components/admin/admin-shell';
import {
  Button,
  Card,
  Field,
  Notice,
  PageHeader,
  TextInput,
} from '@/components/admin/ui';
import { AdminApiError, adminFetch } from '@/lib/admin-api';

export default function AccountPage() {
  return (
    <AdminShell>
      <PageHeader
        title="Conta"
        method="POST"
        endpoint="/api/admin/auth"
        description="Senha e verificação em duas etapas (2FA)."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <PasswordCard />
        <TwoFactorCard />
      </div>
    </AdminShell>
  );
}

type Feedback = { tone: 'success' | 'error'; text: string } | null;
const messageOf = (err: unknown) =>
  err instanceof AdminApiError ? err.message : 'Algo deu errado.';

function PasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (next !== confirm)
      return setFeedback({ tone: 'error', text: 'A confirmação não confere.' });
    try {
      await adminFetch('/auth/password', undefined, {
        method: 'POST',
        body: { currentPassword: current, newPassword: next },
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      setFeedback({
        tone: 'success',
        text: 'Senha trocada. As outras sessões foram encerradas.',
      });
    } catch (err) {
      setFeedback({ tone: 'error', text: messageOf(err) });
    }
  };

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="font-medium text-fg">Trocar senha</h2>
        {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
        <Field label="Senha atual">
          {(id) => (
            <TextInput
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          )}
        </Field>
        <Field
          label="Nova senha"
          hint={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres. Uma frase longa é mais fácil de lembrar.`}
        >
          {(id) => (
            <TextInput
              id={id}
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          )}
        </Field>
        <Field label="Confirmar nova senha">
          {(id) => (
            <TextInput
              id={id}
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" variant="primary">
          Trocar senha
        </Button>
      </form>
    </Card>
  );
}

function TwoFactorCard() {
  const { me, refresh } = useAdmin();
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);

  const start = async () => {
    try {
      setSetup(
        await adminFetch('/auth/totp/setup', totpSetupSchema, {
          method: 'POST',
        }),
      );
      setFeedback(null);
    } catch (err) {
      setFeedback({ tone: 'error', text: messageOf(err) });
    }
  };

  const enable = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await adminFetch('/auth/totp/enable', undefined, {
        method: 'POST',
        body: { code },
      });
      setSetup(null);
      setCode('');
      await refresh();
      setFeedback({
        tone: 'success',
        text: '2FA ativado. O próximo login vai pedir o código.',
      });
    } catch (err) {
      setFeedback({ tone: 'error', text: messageOf(err) });
    }
  };

  const disable = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await adminFetch('/auth/totp/disable', undefined, {
        method: 'POST',
        body: { code, password },
      });
      setCode('');
      setPassword('');
      await refresh();
      setFeedback({ tone: 'success', text: '2FA desativado.' });
    } catch (err) {
      setFeedback({ tone: 'error', text: messageOf(err) });
    }
  };

  const codeInput = (id: string) => (
    <TextInput
      id={id}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      required
      value={code}
      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
      className="max-w-40 font-mono tracking-[0.3em]"
    />
  );

  return (
    <Card className="space-y-4">
      <h2 className="flex items-center gap-2 font-medium text-fg">
        <ShieldCheck className="size-4 text-get" aria-hidden /> Verificação em
        duas etapas
      </h2>
      {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}

      {me.totpEnabled ? (
        <form onSubmit={disable} className="space-y-4">
          <p className="text-sm text-get">
            Ativa. O login pede a senha e o código do app autenticador.
          </p>
          <Field label="Senha">
            {(id) => (
              <TextInput
                id={id}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
          <Field label="Código atual">{codeInput}</Field>
          <Button type="submit" variant="danger">
            Desativar 2FA
          </Button>
        </form>
      ) : setup ? (
        <form onSubmit={enable} className="space-y-4">
          <p className="text-sm text-muted">
            Escaneie o QR code com um app autenticador (Google Authenticator,
            1Password, Aegis…) e digite o código gerado.
          </p>
          {/* SVG generated by the API from our own otpauth URL. */}
          <div
            className="w-44 rounded-md bg-white p-2"
            dangerouslySetInnerHTML={{ __html: setup.qrSvg }}
          />
          <p className="text-xs text-soft">
            Sem câmera? Digite esta chave no app:{' '}
            <code className="break-all font-mono text-muted">
              {setup.secret}
            </code>
          </p>
          <Field label="Código do app">{codeInput}</Field>
          <Button type="submit" variant="primary">
            Ativar 2FA
          </Button>
        </form>
      ) : (
        <>
          <p className="text-sm text-muted">
            Desativada. Com o 2FA, além da senha o login pede um código de 6
            dígitos que muda a cada 30 segundos no seu celular.
          </p>
          <Button variant="primary" onClick={() => void start()}>
            Configurar 2FA
          </Button>
        </>
      )}
    </Card>
  );
}
