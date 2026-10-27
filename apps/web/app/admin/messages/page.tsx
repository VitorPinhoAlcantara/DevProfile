'use client';

import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { type ContactMessage, contactMessageSchema } from '@devprofile/shared';
import { AdminShell } from '@/components/admin/admin-shell';
import {
  Button,
  EmptyState,
  Notice,
  PageHeader,
  formatDateTime,
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin-api';
import { cn } from '@/lib/cn';

export default function MessagesPage() {
  return (
    <AdminShell>
      <MessagesView />
    </AdminShell>
  );
}

function MessagesView() {
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMessages(await adminFetch('/messages', contactMessageSchema.array()));
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mark = async (message: ContactMessage, read: boolean) => {
    const updated = await adminFetch(
      `/messages/${message.id}`,
      contactMessageSchema,
      {
        method: 'PATCH',
        body: { read },
      },
    );
    setMessages(
      (list) => list?.map((m) => (m.id === updated.id ? updated : m)) ?? null,
    );
  };

  const remove = async (message: ContactMessage) => {
    if (!window.confirm(`Apagar a mensagem de ${message.name}?`)) return;
    await adminFetch(`/messages/${message.id}`, undefined, {
      method: 'DELETE',
    });
    setMessages((list) => list?.filter((m) => m.id !== message.id) ?? null);
  };

  const unread = messages?.filter((m) => !m.readAt).length ?? 0;

  return (
    <>
      <PageHeader
        title="Mensagens"
        method="GET"
        endpoint="/api/admin/messages"
        description={
          messages
            ? `${unread} não lida${unread === 1 ? '' : 's'} de ${messages.length}.`
            : undefined
        }
      />
      {error && <Notice tone="error">{error}</Notice>}
      {!messages ? (
        <p className="font-mono text-sm text-soft">Carregando…</p>
      ) : messages.length === 0 ? (
        <EmptyState>
          Nenhuma mensagem pelo formulário de contato ainda.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={cn(
                'rounded-lg border bg-panel p-4',
                message.readAt ? 'border-line' : 'border-accent/40',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-fg">
                    {!message.readAt && (
                      <span
                        className="mr-2 inline-block size-2 rounded-full bg-accent"
                        aria-label="Não lida"
                      />
                    )}
                    {message.name}
                  </p>
                  <a
                    href={`mailto:${message.email}?subject=${encodeURIComponent('Re: contato pelo portfólio')}`}
                    className="text-sm text-accent hover:underline"
                  >
                    {message.email}
                  </a>
                </div>
                <span className="font-mono text-xs text-soft">
                  {formatDateTime(message.createdAt)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted">
                {message.message}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  onClick={() => void mark(message, !message.readAt)}
                >
                  {message.readAt ? (
                    <Mail className="size-4" aria-hidden />
                  ) : (
                    <MailOpen className="size-4" aria-hidden />
                  )}
                  {message.readAt ? 'Marcar como não lida' : 'Marcar como lida'}
                </Button>
                <Button
                  variant="ghost"
                  className="hover:text-del"
                  onClick={() => void remove(message)}
                >
                  <Trash2 className="size-4" aria-hidden /> Apagar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
