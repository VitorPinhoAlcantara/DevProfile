import type { ReactNode } from 'react';
import { MethodPill } from '@/components/ui/method-pill';
import { type Section as SectionDef, shortPath } from '@/lib/sections';

/** A page section; `data-section` is what the scroll spy watches. */
export function Section({
  section,
  title,
  hideTitle = false,
  children,
}: {
  section: SectionDef;
  title: string;
  /** Keep the heading for screen readers only, showing just the endpoint. */
  hideTitle?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={section.id}
      data-section={section.id}
      aria-labelledby={`${section.id}-title`}
      className="border-t border-line pt-10 pb-4 first:border-t-0 first:pt-0"
    >
      <header className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2
          id={`${section.id}-title`}
          className={
            hideTitle
              ? 'sr-only'
              : 'text-xl font-semibold tracking-tight text-fg'
          }
        >
          {title}
        </h2>
        <span className="flex items-center gap-1.5 text-soft" aria-hidden>
          <MethodPill method={section.method} />
          <code className="font-mono text-xs">
            {shortPath(section.endpoint)}
          </code>
        </span>
      </header>
      {children}
    </section>
  );
}
