'use client';

import { Code2, Moon, Search, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import type { Locale } from '@devprofile/shared';
import { useWorkspace } from '@/components/workspace-provider';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/cn';

const localeLabels: Record<Locale, string> = { 'pt-BR': 'PT', en: 'EN' };

export function SiteHeader({
  name,
  version,
}: {
  name: string;
  version: string;
}) {
  const t = useTranslations('header');
  const { devOpen, toggleDev, setPaletteOpen } = useWorkspace();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[110rem] items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-semibold tracking-tight"
          aria-label={t('home')}
        >
          <span className="truncate">{name}</span>
          <span className="hidden rounded border border-line px-1.5 py-px font-mono text-[0.6875rem] font-normal text-soft sm:inline">
            {version}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="ml-auto hidden h-8 w-64 items-center gap-2 rounded-md border border-line px-2.5 text-sm text-soft transition hover:border-line-strong md:flex"
        >
          <Search className="size-3.5" aria-hidden />
          {t('search')}
          <kbd className="ml-auto font-mono text-[0.6875rem]">Ctrl K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-panel-2 md:hidden"
            aria-label={t('search')}
          >
            <Search className="size-4" aria-hidden />
          </button>
          <LocaleSwitch label={t('language')} />
          <ThemeToggle label={t('toggleTheme')} />
          <button
            type="button"
            onClick={toggleDev}
            aria-pressed={devOpen}
            title={t('devModeHint')}
            className={cn(
              'ml-1 hidden h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm transition xl:flex',
              devOpen
                ? 'border-accent/40 bg-accent-soft text-accent'
                : 'border-line text-muted hover:border-line-strong',
            )}
          >
            <Code2 className="size-4" aria-hidden />
            {t('devMode')}
          </button>
        </div>
      </div>
    </header>
  );
}

function LocaleSwitch({ label }: { label: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={label}
      className="flex h-8 items-center rounded-md border border-line p-0.5"
    >
      {routing.locales.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === locale}
          onClick={() => router.replace(pathname, { locale: option })}
          className={cn(
            'h-full rounded px-2 font-mono text-xs transition',
            option === locale
              ? 'bg-panel-2 text-fg'
              : 'text-soft hover:text-muted',
          )}
        >
          {localeLabels[option]}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-panel-2"
    >
      {isDark ? (
        <Moon className="size-4" aria-hidden />
      ) : (
        <Sun className="size-4" aria-hidden />
      )}
    </button>
  );
}
