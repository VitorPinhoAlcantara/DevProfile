'use client';

import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/components/workspace-provider';
import { MethodPill } from '@/components/ui/method-pill';
import { cn } from '@/lib/cn';
import { sections, shortPath } from '@/lib/sections';

/** Desktop sidebar: human label first, endpoint underneath. */
export function SectionNav() {
  const t = useTranslations('nav');
  const { activeSection } = useWorkspace();

  return (
    <nav aria-label={t('label')} className="sticky top-20">
      <p className="mb-2 px-2 font-mono text-[0.6875rem] text-soft">
        portfolio / v1
      </p>
      <ul className="space-y-0.5">
        {sections.map((section) => {
          const active = section.id === activeSection;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  'block rounded-md px-2 py-1.5 transition',
                  active
                    ? 'bg-panel-2 text-fg'
                    : 'text-muted hover:bg-panel hover:text-fg',
                )}
              >
                <span className="block text-sm">{t(section.id)}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-soft">
                  <MethodPill
                    method={section.method}
                    className="text-[0.5625rem]"
                  />
                  <code className="font-mono text-[0.6875rem]">
                    {shortPath(section.endpoint)}
                  </code>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile/tablet: horizontal strip of sections under the header. */
export function SectionTabs() {
  const t = useTranslations('nav');
  const { activeSection } = useWorkspace();

  return (
    <nav
      aria-label={t('label')}
      className="sticky top-14 z-20 -mx-4 border-b border-line bg-bg/90 backdrop-blur sm:-mx-6 lg:hidden"
    >
      <ul className="flex gap-1 overflow-x-auto px-4 sm:px-6 [scrollbar-width:none]">
        {sections.map((section) => {
          const active = section.id === activeSection;
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  'block border-b-2 px-2.5 py-2.5 text-sm transition',
                  active
                    ? 'border-accent text-fg'
                    : 'border-transparent text-muted',
                )}
              >
                {t(section.id)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
