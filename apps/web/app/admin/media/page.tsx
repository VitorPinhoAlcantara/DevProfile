'use client';

import { Check, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { MediaItem } from '@devprofile/shared';
import { AdminShell } from '@/components/admin/admin-shell';
import {
  MediaGrid,
  UploadButton,
  useMediaLibrary,
} from '@/components/admin/media-library';
import {
  Button,
  Card,
  EmptyState,
  Notice,
  PageHeader,
  formatBytes,
  formatDateTime,
} from '@/components/admin/ui';
import { AdminApiError, adminFetch } from '@/lib/admin-api';

export default function MediaPage() {
  return (
    <AdminShell>
      <MediaView />
    </AdminShell>
  );
}

function MediaView() {
  const library = useMediaLibrary();
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyMarkdown = async (item: MediaItem) => {
    await navigator.clipboard.writeText(`![Descreva a imagem](${item.url})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const remove = async (item: MediaItem) => {
    if (!window.confirm(`Apagar "${item.originalName}"?`)) return;
    setError(null);
    try {
      await adminFetch(`/media/${item.key}`, undefined, { method: 'DELETE' });
      setSelected(null);
      await library.reload();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Não foi possível apagar.',
      );
    }
  };

  return (
    <>
      <PageHeader
        title="Imagens"
        method="POST"
        endpoint="/api/admin/media"
        description="Prints e fotos usados nas capas, na foto de perfil e nas páginas dos projetos."
        actions={
          <UploadButton
            onUploaded={(item) => {
              void library.reload();
              setSelected(item);
            }}
          />
        }
      />
      {(error || library.error) && (
        <div className="mb-4">
          <Notice tone="error">{error ?? library.error}</Notice>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <div>
          {!library.items ? (
            <p className="font-mono text-sm text-soft">Carregando…</p>
          ) : library.items.length === 0 ? (
            <EmptyState>Nenhuma imagem ainda. Envie a primeira.</EmptyState>
          ) : (
            <MediaGrid
              items={library.items}
              selectedRef={selected?.ref}
              onPick={setSelected}
            />
          )}
        </div>

        {selected && (
          <Card className="mt-6 space-y-3 self-start lg:sticky lg:top-6 lg:mt-0">
            <img
              src={selected.url}
              alt=""
              className="w-full rounded-md border border-line"
            />
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-soft">Arquivo</dt>
                <dd className="truncate text-fg">{selected.originalName}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-soft">Tamanho</dt>
                <dd className="text-fg">
                  {selected.width}×{selected.height} ·{' '}
                  {formatBytes(selected.sizeBytes)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-soft">Enviada</dt>
                <dd className="text-fg">
                  {formatDateTime(selected.createdAt)}
                </dd>
              </div>
            </dl>
            <code className="block break-all rounded bg-panel-2 px-2 py-1.5 font-mono text-xs text-muted">
              {selected.url}
            </code>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void copyMarkdown(selected)}>
                {copied ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copied ? 'Copiado' : 'Copiar Markdown'}
              </Button>
              <Button variant="danger" onClick={() => void remove(selected)}>
                <Trash2 className="size-4" aria-hidden /> Apagar
              </Button>
            </div>
            <p className="text-xs text-soft">
              Imagens em uso (capa, foto ou texto de projeto) não podem ser
              apagadas.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
