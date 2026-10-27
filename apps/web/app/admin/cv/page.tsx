'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import NextLink from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { type CvReport, cvReportSchema, type Locale } from '@devprofile/shared';
import { AdminShell } from '@/components/admin/admin-shell';
import {
  Button,
  Card,
  Notice,
  PageHeader,
  formatDateTime,
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin-api';
import { cn } from '@/lib/cn';

export default function CvPage() {
  return (
    <AdminShell>
      <CvView />
    </AdminShell>
  );
}

const statusIcon = {
  pass: <CheckCircle2 className="size-4 shrink-0 text-get" aria-label="OK" />,
  warn: (
    <AlertTriangle className="size-4 shrink-0 text-post" aria-label="Atenção" />
  ),
  fail: <XCircle className="size-4 shrink-0 text-del" aria-label="Falhou" />,
};

function CvView() {
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const [report, setReport] = useState<CvReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Changing this reloads the preview after an edit made in another tab.
  const [stamp, setStamp] = useState(() => Date.now());

  const load = useCallback(async () => {
    setReport(null);
    setError(null);
    try {
      setReport(await adminFetch(`/cv/report?lang=${locale}`, cvReportSchema));
    } catch (err) {
      setError((err as Error).message);
    }
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load, stamp]);

  const fileUrl = (format: 'pdf' | 'docx', inline = false) =>
    `/api/v1/cv?lang=${locale}&format=${format}${inline ? `&inline=true&t=${stamp}` : ''}`;

  const failures =
    report?.checks.filter((c) => c.status === 'fail').length ?? 0;
  const warnings =
    report?.checks.filter((c) => c.status === 'warn').length ?? 0;

  return (
    <>
      <PageHeader
        title="Currículo"
        method="GET"
        endpoint="/api/v1/cv"
        description="Gerado com Typst a partir do conteúdo do site, sempre na versão mais recente. O modelo (júnior ou estágio) fica em Conteúdo › Currículo."
        actions={
          <>
            <a
              href={fileUrl('pdf')}
              download
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-3.5 text-sm font-medium text-on-accent hover:opacity-90"
            >
              <Download className="size-4" aria-hidden /> PDF
            </a>
            <a
              href={fileUrl('docx')}
              download
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong px-3.5 text-sm font-medium text-fg hover:bg-panel-2"
            >
              <Download className="size-4" aria-hidden /> Word (.docx)
            </a>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['pt-BR', 'en'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={locale === option}
            onClick={() => setLocale(option)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition',
              locale === option
                ? 'bg-panel-2 text-fg'
                : 'text-muted hover:text-fg',
            )}
          >
            {option === 'pt-BR' ? 'Português' : 'English'}
          </button>
        ))}
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={() => setStamp(Date.now())}
        >
          <RefreshCw className="size-4" aria-hidden /> Atualizar
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <iframe
            key={fileUrl('pdf', true)}
            src={fileUrl('pdf', true)}
            title="Prévia do currículo"
            className="h-[80vh] w-full"
          />
        </div>

        <Card className="space-y-4 self-start xl:sticky xl:top-6">
          <div>
            <h2 className="font-medium text-fg">Checklist</h2>
            <p className="text-xs text-soft">
              O PDF é lido como um sistema de triagem (ATS) leria.
              {report && ` Gerado em ${formatDateTime(report.generatedAt)}.`}
            </p>
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          {!report && !error && (
            <p className="font-mono text-sm text-soft">Verificando…</p>
          )}
          {report && (
            <>
              <Notice tone={failures ? 'error' : warnings ? 'info' : 'success'}>
                {failures
                  ? `${failures} problema${failures > 1 ? 's' : ''} para corrigir antes de enviar.`
                  : warnings
                    ? `Pronto para enviar, com ${warnings} sugest${warnings > 1 ? 'ões' : 'ão'} de melhoria.`
                    : 'Tudo certo para enviar.'}
              </Notice>
              <ul className="space-y-3">
                {report.checks.map((check) => (
                  <li key={check.id} className="flex gap-2.5 text-sm">
                    {statusIcon[check.status]}
                    <div>
                      <p className="text-fg">{check.label}</p>
                      {check.detail && (
                        <p className="text-xs text-soft">{check.detail}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="border-t border-line pt-3 text-xs text-soft">
            Para mudar o que entra no currículo, use “Incluir no currículo” nos
            itens e os bullets em{' '}
            <NextLink
              href="/admin/content?section=experiences"
              className="text-accent hover:underline"
            >
              Conteúdo
            </NextLink>
            . Na Gupy, envie o .docx em português e confira os campos que ela
            preencher.
          </p>
        </Card>
      </div>
    </>
  );
}
