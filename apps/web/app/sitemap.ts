import type { MetadataRoute } from 'next';
import { getPortfolio } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data, meta } = await getPortfolio('pt-BR');
  const lastModified = new Date(meta.updatedAt);
  const english = (path: string) => `/en${path === '/' ? '' : path}`;
  const alternates = (path: string) => ({
    languages: {
      'pt-BR': `${SITE_URL}${path}`,
      en: `${SITE_URL}${english(path)}`,
    },
  });
  const entries = (path: string) => [
    { url: `${SITE_URL}${path}`, lastModified, alternates: alternates(path) },
    {
      url: `${SITE_URL}${english(path)}`,
      lastModified,
      alternates: alternates(path),
    },
  ];

  return [
    ...entries('/'),
    ...data.projects.flatMap((project) => entries(`/projects/${project.slug}`)),
  ];
}
