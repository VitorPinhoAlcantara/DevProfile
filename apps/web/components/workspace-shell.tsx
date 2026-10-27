import type { ReactNode } from 'react';
import type { PublicPortfolio, ResponseMeta } from '@devprofile/shared';
import { CommandPalette } from '@/components/command-palette';
import { DevDrawer } from '@/components/dev-panel';
import { SiteHeader } from '@/components/site-header';
import { StatusBar } from '@/components/status-bar';
import { WorkspaceGrid } from '@/components/workspace-grid';
import { WorkspaceProvider } from '@/components/workspace-provider';

/**
 * The API-client look: section list on the left, readable content in the middle,
 * live API responses on the right (or in a bottom sheet on small screens).
 */
export function WorkspaceShell({
  portfolio,
  meta,
  withSections = true,
  children,
}: {
  portfolio: PublicPortfolio;
  meta: ResponseMeta;
  /** Project pages have no sections, so they skip the nav and the dev panel. */
  withSections?: boolean;
  children: ReactNode;
}) {
  const { profile } = portfolio;

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader name={profile.fullName} version={meta.version} />
        <div className="mx-auto w-full max-w-[110rem] flex-1 px-4 sm:px-6">
          {withSections ? (
            <WorkspaceGrid>{children}</WorkspaceGrid>
          ) : (
            <main className="mx-auto max-w-6xl py-8">{children}</main>
          )}
        </div>
        <StatusBar
          meta={meta}
          location={profile.location}
          openToWork={profile.availability.status === 'OPEN_TO_WORK'}
        />
      </div>
      {withSections && <DevDrawer />}
      <CommandPalette
        projects={portfolio.projects.map(({ slug, name }) => ({ slug, name }))}
      />
    </WorkspaceProvider>
  );
}
