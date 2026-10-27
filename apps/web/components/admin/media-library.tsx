'use client';

import { ImagePlus, Upload, X } from 'lucide-react';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type MediaItem, mediaItemSchema } from '@devprofile/shared';
import { Button, Notice } from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin-api';
import { cn } from '@/lib/cn';

export async function uploadImage(file: File): Promise<MediaItem> {
  const form = new FormData();
  form.append('file', file);
  return adminFetch('/media', mediaItemSchema, { method: 'POST', body: form });
}

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setItems(await adminFetch('/media', mediaItemSchema.array()));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, error, reload, setError };
}

/** "Send image" button that uploads and reports the stored item. */
export function UploadButton({
  onUploaded,
  label = 'Enviar imagem',
}: {
  onUploaded: (item: MediaItem) => void;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onUploaded(await uploadImage(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFile}
      />
      <Button onClick={() => input.current?.click()} disabled={busy}>
        <Upload className="size-4" aria-hidden />
        {busy ? 'Enviando…' : label}
      </Button>
      {error && <span className="text-xs text-del">{error}</span>}
    </span>
  );
}

/** Grid of uploaded images; clicking one picks it. */
export function MediaGrid({
  items,
  selectedRef,
  onPick,
}: {
  items: MediaItem[];
  selectedRef?: string | null;
  onPick: (item: MediaItem) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onPick(item)}
            className={cn(
              'block w-full overflow-hidden rounded-md border text-left transition',
              selectedRef === item.ref
                ? 'border-accent ring-2 ring-accent/40'
                : 'border-line hover:border-line-strong',
            )}
          >
            <img
              src={item.url}
              alt=""
              loading="lazy"
              className="aspect-video w-full bg-panel-2 object-cover object-top"
            />
            <span className="block truncate px-2 py-1 text-xs text-soft">
              {item.originalName}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Modal to choose an image from the library, or upload a new one. */
export function MediaPickerDialog({
  open,
  onClose,
  onPick,
  selectedRef,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (item: MediaItem) => void;
  selectedRef?: string | null;
}) {
  const library = useMediaLibrary();
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Escolher imagem"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-line-strong bg-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-medium text-fg">Escolher imagem</h2>
          <div className="flex items-center gap-2">
            <UploadButton
              onUploaded={(item) => {
                void library.reload();
                onPick(item);
              }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex size-8 items-center justify-center rounded-md text-soft hover:bg-panel-2"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        {library.error && <Notice tone="error">{library.error}</Notice>}
        {!library.items ? (
          <p className="font-mono text-sm text-soft">Carregando…</p>
        ) : library.items.length === 0 ? (
          <p className="text-sm text-soft">
            Nenhuma imagem ainda. Envie a primeira.
          </p>
        ) : (
          <MediaGrid
            items={library.items}
            selectedRef={selectedRef}
            onPick={onPick}
          />
        )}
      </div>
    </div>
  );
}

/** A single image slot (cover, profile photo) holding a `media:<key>` reference. */
export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const url = value ? `/api/media/${value.replace(/^media:/, '')}` : null;

  return (
    <div>
      <p className="mb-1.5 text-sm text-muted">{label}</p>
      <div className="flex flex-wrap items-start gap-3">
        {url ? (
          <img
            src={url}
            alt=""
            className="h-28 w-48 rounded-md border border-line object-cover object-top"
          />
        ) : (
          <div className="flex h-28 w-48 items-center justify-center rounded-md border border-dashed border-line text-soft">
            <ImagePlus className="size-6" aria-hidden />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button onClick={() => setOpen(true)}>
            {url ? 'Trocar imagem' : 'Escolher imagem'}
          </Button>
          {url && (
            <Button variant="ghost" onClick={() => onChange(null)}>
              Remover
            </Button>
          )}
        </div>
      </div>
      {hint && <p className="mt-1 text-xs text-soft">{hint}</p>}
      <MediaPickerDialog
        open={open}
        selectedRef={value}
        onClose={() => setOpen(false)}
        onPick={(item) => {
          onChange(item.ref);
          setOpen(false);
        }}
      />
    </div>
  );
}
