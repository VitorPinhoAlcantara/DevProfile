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

/** Shared UI state: which section is on screen, and whether the dev panel is open. */
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

  // Scroll spy: the active section is the last one whose top crossed the upper third.
  useEffect(() => {
    const elements = sections
      .map((s) =>
        document.querySelector<HTMLElement>(`[data-section="${s.id}"]`),
      )
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.section!;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        const current = sections.findLast((s) => visible.has(s.id));
        if (current) setActiveSection(current.id);
      },
      { rootMargin: '-20% 0px -55% 0px' },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
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
