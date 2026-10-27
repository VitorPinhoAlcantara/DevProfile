'use client';

import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { type Dashboard, dashboardSchema } from '@devprofile/shared';
import { AdminShell } from '@/components/admin/admin-shell';
import { sectionLabels } from '@/components/admin/content/labels';
import {
  Card,
  Notice,
  PageHeader,
  formatDateTime,
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin-api';

export default function DashboardPage() {
  return (
    <AdminShell>
      <DashboardView />
    </AdminShell>
  );
}

function DashboardView() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch('/dashboard', dashboardSchema)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <p className="font-mono text-sm text-soft">Carregando…</p>;

  const stats = [
    {
      label: 'Mensagens não lidas',
      value: data.unreadMessages,
      href: '/admin/messages',
    },
    {
      label: 'Experiências',
      value: data.counts.experiences,
      href: '/admin/content?section=experiences',
    },
    {
      label: 'Projetos',
      value: data.counts.projects,
      href: '/admin/content?section=projects',
    },
    {
      label: 'Skills',
      value: data.counts.skills,
      href: '/admin/content?section=skillCategories',
    },
    {
      label: 'Certificações',
      value: data.counts.certifications,
      href: '/admin/content?section=certifications',
    },
    { label: 'Imagens', value: data.counts.media, href: '/admin/media' },
  ];

  return (
    <>
      <PageHeader
        title="Painel"
        method="GET"
        endpoint="/api/admin/dashboard"
        description={`Versão publicada ${data.version}, atualizada em ${formatDateTime(data.updatedAt)}.`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <NextLink
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-line bg-panel px-4 py-3 transition hover:border-line-strong"
          >
            <p className="text-2xl font-semibold text-fg">{stat.value}</p>
            <p className="text-xs text-soft">{stat.label}</p>
          </NextLink>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 font-medium text-fg">Últimas alterações</h2>
        {data.recentChanges.length === 0 ? (
          <p className="text-sm text-soft">
            Nenhuma alteração feita pelo painel ainda.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {data.recentChanges.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap justify-between gap-2 py-2 text-sm"
              >
                <span className="text-muted">
                  {entry.action === 'RESTORE' ? 'Desfeito: ' : ''}
                  {entry.changed.length
                    ? entry.changed.map((s) => sectionLabels[s]).join(', ')
                    : 'sem mudanças'}
                </span>
                <span className="font-mono text-xs text-soft">
                  {formatDateTime(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <NextLink
          href="/admin/history"
          className="mt-3 inline-block text-sm text-accent hover:underline"
        >
          Ver histórico completo
        </NextLink>
      </Card>
    </>
  );
}
