'use client';

import type { ReactNode } from 'react';
import { DevSidebar } from '@/components/dev-panel';
import { SectionNav, SectionTabs } from '@/components/section-nav';
import { useWorkspace } from '@/components/workspace-provider';
import { cn } from '@/lib/cn';

/** Three columns on wide screens while dev mode is on, two otherwise. */
export function WorkspaceGrid({ children }: { children: ReactNode }) {
  const { devOpen } = useWorkspace();

  return (
    <div
      className={cn(
        'lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-8 2xl:grid-cols-[14rem_minmax(0,1fr)] 2xl:gap-12',
        devOpen &&
          'xl:grid-cols-[12.5rem_minmax(0,1fr)_24rem] 2xl:grid-cols-[14rem_minmax(0,1fr)_30rem]',
      )}
    >
      <div className="hidden py-8 lg:block">
        <SectionNav />
      </div>
      <SectionTabs />
      <main className="min-w-0 space-y-10 py-8">{children}</main>
      {devOpen && (
        <div className="hidden py-8 xl:block">
          <DevSidebar />
        </div>
      )}
    </div>
  );
}
