'use client';

import { Command } from 'cmdk';
import {
  BookOpen,
  Code2,
  FolderGit2,
  Hash,
  Languages,
  SunMoon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { type ReactNode, useEffect } from 'react';
import type { Locale } from '@devprofile/shared';
import { useWorkspace } from '@/components/workspace-provider';
import { usePathname, useRouter } from '@/i18n/navigation';
import { sections } from '@/lib/sections';

/** Ctrl/Cmd + K: jump to a section or project, or run a quick action. */
export function CommandPalette({
  projects,
}: {
  projects: { slug: string; name: string }[];
}) {
  const t = useTranslations('palette');
  const tNav = useTranslations('nav');
  const { paletteOpen, setPaletteOpen, toggleDev } = useWorkspace();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, setPaletteOpen]);

  const run = (action: () => void) => () => {
    setPaletteOpen(false);
    action();
  };

  const goToSection = (id: string) => {
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', `#${id}`);
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <Command.Dialog
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      label={t('placeholder')}
      overlayClassName="fixed inset-0 z-40 bg-black/50"
      contentClassName="fixed top-[12vh] left-1/2 z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-line-strong bg-panel shadow-2xl"
    >
      <Command.Input
        placeholder={t('placeholder')}
        className="w-full border-b border-line bg-transparent px-4 py-3 text-sm text-fg outline-none placeholder:text-soft focus-visible:outline-none"
      />
      <Command.List className="max-h-[50vh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-center text-sm text-soft">
          {t('empty')}
        </Command.Empty>

        <Group heading={t('sections')}>
          {sections.map((section) => (
            <Item
              key={section.id}
              icon={<Hash className="size-4" />}
              onSelect={run(() => goToSection(section.id))}
            >
              {tNav(section.id)}
            </Item>
          ))}
        </Group>

        <Group heading={t('projects')}>
          {projects.map((project) => (
            <Item
              key={project.slug}
              icon={<FolderGit2 className="size-4" />}
              onSelect={run(() => router.push(`/projects/${project.slug}`))}
            >
              {project.name}
            </Item>
          ))}
        </Group>

        <Group heading={t('actions')}>
          <Item
            icon={<SunMoon className="size-4" />}
            onSelect={run(() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
            )}
          >
            {t('toggleTheme')}
          </Item>
          <Item
            icon={<Languages className="size-4" />}
            onSelect={run(() =>
              router.replace(pathname, {
                locale: locale === 'en' ? 'pt-BR' : 'en',
              }),
            )}
          >
            {t('switchLanguage')}
          </Item>
          <Item icon={<Code2 className="size-4" />} onSelect={run(toggleDev)}>
            {t('toggleDev')}
          </Item>
          <Item
            icon={<BookOpen className="size-4" />}
            onSelect={run(() => window.open('/api/docs', '_blank'))}
          >
            {t('apiDocs')}
          </Item>
        </Group>
      </Command.List>
    </Command.Dialog>
  );
}

function Group({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <Command.Group
      heading={heading}
      className="mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:text-soft"
    >
      {children}
    </Command.Group>
  );
}

function Item({
  icon,
  children,
  onSelect,
}: {
  icon: ReactNode;
  children: ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-muted data-[selected=true]:bg-panel-2 data-[selected=true]:text-fg"
    >
      <span className="text-soft" aria-hidden>
        {icon}
      </span>
      {children}
    </Command.Item>
  );
}
