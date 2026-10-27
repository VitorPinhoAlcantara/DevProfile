'use client';

import { Undo2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  type HistoryEntry,
  historyEntrySchema,
  savedContentSchema,
} from '@devprofile/shared';
import { AdminShell } from '@/components/admin/admin-shell';
import { sectionLabels } from '@/components/admin/content/labels';
import {
  Button,
  EmptyState,
  Notice,
  PageHeader,
  formatDateTime,
} from '@/components/admin/ui';
import { AdminApiError, adminFetch } from '@/lib/admin-api';

export default function HistoryPage() {
  return (
    <AdminShell>
      <HistoryView />
    </AdminShell>
  );
}

function HistoryView() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await adminFetch('/history', historyEntrySchema.array()));
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const undo = async (entry: HistoryEntry) => {
    const what =
      entry.changed.map((s) => sectionLabels[s]).join(', ') || 'esta alteração';
    if (
      !window.confirm(
        `Desfazer ${what}? O conteúdo volta a ser como era antes de ${formatDateTime(entry.createdAt)}.`,
      )
    )
      return;
    setBusy(entry.id);
    try {
      await adminFetch(`/history/${entry.id}/restore`, savedContentSchema, {
        method: 'POST',
      });
      setNotice({
        tone: 'success',
        text: 'Alteração desfeita. O site já foi atualizado.',
      });
      await load();
    } catch (err) {
      setNotice({
        tone: 'error',
        text:
          err instanceof AdminApiError
            ? err.message
            : 'Não foi possível desfazer.',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Histórico"
        method="GET"
        endpoint="/api/admin/history"
        description="Cada salvamento guarda como o conteúdo era antes. Desfazer restaura aquele estado e também fica registrado aqui."
      />
      {notice && (
        <div className="mb-4">
          <Notice tone={notice.tone}>{notice.text}</Notice>
        </div>
      )}
      {!entries ? (
        <p className="font-mono text-sm text-soft">Carregando…</p>
      ) : entries.length === 0 ? (
        <EmptyState>Nenhuma alteração feita pelo painel ainda.</EmptyState>
      ) : (
        <ol className="divide-y divide-line rounded-lg border border-line bg-panel">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <span className="font-mono text-xs text-soft">
                {formatDateTime(entry.createdAt)}
              </span>
              <span className="min-w-0 flex-1 text-sm text-fg">
                {entry.action === 'RESTORE' && (
                  <span className="mr-1.5 rounded bg-patch-soft px-1.5 py-px text-xs text-patch">
                    desfazer
                  </span>
                )}
                {entry.changed.length
                  ? entry.changed.map((s) => sectionLabels[s]).join(', ')
                  : 'Salvo sem mudanças'}
                {entry.actor && (
                  <span className="ml-2 text-xs text-soft">
                    por {entry.actor}
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                disabled={busy !== null || entry.changed.length === 0}
                onClick={() => void undo(entry)}
              >
                <Undo2 className="size-4" aria-hidden />{' '}
                {busy === entry.id ? 'Desfazendo…' : 'Desfazer'}
              </Button>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
