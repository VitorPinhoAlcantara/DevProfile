'use client';

import {
  ExternalLink,
  FileText,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  Sun,
  UserCog,
} from 'lucide-react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { type AdminMe, adminMeSchema } from '@devprofile/shared';
import { type Method, MethodPill } from '@/components/ui/method-pill';
import { AdminApiError, adminFetch } from '@/lib/admin-api';
import { cn } from '@/lib/cn';

const nav: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  method: Method;
  endpoint: string;
}[] = [
  {
    href: '/admin',
    label: 'Painel',
    icon: LayoutDashboard,
    method: 'GET',
    endpoint: '/dashboard',
  },
  {
    href: '/admin/content',
    label: 'Conteúdo',
    icon: FileText,
    method: 'PUT',
    endpoint: '/content',
  },
  {
    href: '/admin/media',
    label: 'Imagens',
    icon: ImageIcon,
    method: 'POST',
    endpoint: '/media',
  },
  {
    href: '/admin/messages',
    label: 'Mensagens',
    icon: Mail,
    method: 'GET',
    endpoint: '/messages',
  },
  {
    href: '/admin/history',
    label: 'Histórico',
    icon: History,
    method: 'GET',
    endpoint: '/history',
  },
  {
    href: '/admin/account',
    label: 'Conta',
    icon: UserCog,
    method: 'POST',
    endpoint: '/auth',
  },
];

type AdminSession = { me: AdminMe; refresh: () => Promise<void> };
const AdminContext = createContext<AdminSession | null>(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin needs <AdminShell>');
  return context;
}

/** Checks the session (redirecting to login) and draws the admin chrome. */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<AdminMe | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMe(await adminFetch('/auth/me', adminMeSchema));
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      } else {
        throw error;
      }
    }
  }, [router, pathname]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = async () => {
    await adminFetch('/auth/logout', undefined, { method: 'POST' }).catch(
      () => undefined,
    );
    router.replace('/admin/login');
  };

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-sm text-soft">
        Verificando sessão…
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ me, refresh }}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-line bg-panel lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="font-semibold tracking-tight">
              Admin{' '}
              <span className="font-mono text-xs font-normal text-soft">
                /api/admin
              </span>
            </span>
            <ThemeToggle />
          </div>
          <nav
            aria-label="Admin"
            className="flex gap-1 overflow-x-auto px-2 pb-2 lg:block lg:space-y-0.5 lg:overflow-visible"
          >
            {nav.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 rounded-md px-2.5 py-2 transition lg:block',
                    active
                      ? 'bg-panel-2 text-fg'
                      : 'text-muted hover:bg-panel-2/60 hover:text-fg',
                  )}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Icon className="size-4" aria-hidden />
                    {item.label}
                  </span>
                  <span className="mt-0.5 hidden items-center gap-1.5 pl-6 text-soft lg:flex">
                    <MethodPill
                      method={item.method}
                      className="text-[0.5625rem]"
                    />
                    <code className="font-mono text-[0.6875rem]">
                      {item.endpoint}
                    </code>
                  </span>
                </NextLink>
              );
            })}
          </nav>
          <div className="hidden border-t border-line p-3 text-xs text-soft lg:absolute lg:bottom-0 lg:block lg:w-60">
            <p className="truncate" title={me.email}>
              {me.email}
            </p>
            <div className="mt-2 flex gap-3">
              <a
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1 hover:text-fg"
              >
                <ExternalLink className="size-3.5" aria-hidden /> Ver site
              </a>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1 hover:text-fg"
              >
                <LogOut className="size-3.5" aria-hidden /> Sair
              </button>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
          <div className="mt-10 flex gap-4 border-t border-line pt-4 text-xs text-soft lg:hidden">
            <span className="truncate">{me.email}</span>
            <a href="/" target="_blank" className="hover:text-fg">
              Ver site
            </a>
            <button type="button" onClick={logout} className="hover:text-fg">
              Sair
            </button>
          </div>
        </main>
      </div>
    </AdminContext.Provider>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = !mounted || resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label="Alternar tema claro/escuro"
      className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-panel-2"
    >
      {dark ? (
        <Moon className="size-4" aria-hidden />
      ) : (
        <Sun className="size-4" aria-hidden />
      )}
    </button>
  );
}
