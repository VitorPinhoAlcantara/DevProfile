'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { sections, type SectionId } from '@/lib/sections';

type Workspace = {
  activeSection: SectionId;
  devOpen: boolean;
  toggleDev: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
};

const WorkspaceContext = createContext<Workspace | null>(null);
const DEV_KEY = 'devprofile:dev-open';

function readStoredDev(): boolean | null {
  try {
    const value = localStorage.getItem(DEV_KEY);
    return value === null ? null : value === '1';
  } catch {
    return null;
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<SectionId>('about');
  const [devOpen, setDevOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const stored = readStoredDev();
    if (stored !== null) setDevOpen(stored);
  }, []);

  const toggleDev = useCallback(() => {
    setDevOpen((open) => {
      try {
        localStorage.setItem(DEV_KEY, open ? '0' : '1');
      } catch {
        // Private mode or blocked storage: the toggle still works for this visit.
      }
      return !open;
    });
  }, []);

  // Scroll spy: the active section is the last one whose top passed the upper third,
  // or the last section once the page can't scroll further (short final sections).
  useEffect(() => {
    const elements = sections
      .map((s) =>
        document.querySelector<HTMLElement>(`[data-section="${s.id}"]`),
      )
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      const line = window.innerHeight / 3;
      const current = atBottom
        ? elements.at(-1)
        : elements.findLast((el) => el.getBoundingClientRect().top <= line);
      setActiveSection(
        (current?.dataset.section as SectionId | undefined) ?? 'about',
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const value = useMemo(
    () => ({ activeSection, devOpen, toggleDev, paletteOpen, setPaletteOpen }),
    [activeSection, devOpen, toggleDev, paletteOpen],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace needs a <WorkspaceProvider>');
  return context;
}
