import type { MetadataRoute } from 'next';
import { getPortfolio } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data, meta } = await getPortfolio('pt-BR');
  const lastModified = new Date(meta.updatedAt);
  const entry = (path: string) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    alternates: {
      languages: {
        'pt-BR': `${SITE_URL}${path}`,
        en: `${SITE_URL}/en${path === '/' ? '' : path}`,
      },
    },
  });

  return [
    entry('/'),
    ...data.projects.map((project) => entry(`/projects/${project.slug}`)),
  ];
}
