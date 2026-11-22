import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@devprofile/shared';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Vitor Pinho Alcantara';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const [name, headline] = t('title').split(' — ');

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: '#090d15',
        color: '#e4ebf5',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            background: 'rgba(74, 222, 128, 0.14)',
            color: '#4ade80',
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          GET
        </span>
        <span style={{ fontSize: 30, color: '#9aabc0' }}>/api/v1/profile</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>
          {name}
        </span>
        <span style={{ fontSize: 44, color: '#9aabc0' }}>{headline}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 30,
          color: '#5ea7ff',
        }}
      >
        <span>alcantara.dev.br</span>
        <span style={{ color: '#9aabc0' }}>Node.js · NestJS · PostgreSQL</span>
      </div>
    </div>,
    size,
  );
}
