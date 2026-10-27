import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm text-post">404 · NOT_FOUND</p>
      <h1 className="mt-3 text-2xl font-semibold text-fg">{t('title')}</h1>
      <p className="mt-2 text-muted">{t('description')}</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-on-accent"
      >
        {t('back')}
      </Link>
    </main>
  );
}
