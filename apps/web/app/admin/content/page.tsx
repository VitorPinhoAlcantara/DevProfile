'use client';

import { Suspense } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { ContentEditor } from '@/components/admin/content/content-editor';

export default function ContentPage() {
  return (
    <AdminShell>
      {/* The editor reads ?section= from the URL. */}
      <Suspense>
        <ContentEditor />
      </Suspense>
    </AdminShell>
  );
}
