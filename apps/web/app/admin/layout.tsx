import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import '../globals.css';

// The admin has its own root layout: Portuguese only, no translations, never indexed.
export const metadata: Metadata = {
  title: 'Admin · Portfólio',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
