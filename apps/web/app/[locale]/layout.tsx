import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/site';
import '../globals.css';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: `%s · Vitor Pinho Alcantara` },
    description: t('description'),
    alternates: {
      canonical: locale === routing.defaultLocale ? '/' : `/${locale}`,
      languages: { 'pt-BR': '/', en: '/en' },
    },
    openGraph: {
      type: 'profile',
      title: t('title'),
      description: t('description'),
      locale: locale === 'en' ? 'en_US' : 'pt_BR',
      images: ['/profile-photo.jpeg'],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#090d15' },
    { media: '(prefers-color-scheme: light)', color: '#f6f8fb' },
  ],
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
