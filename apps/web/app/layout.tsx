import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Vitor Pinho Alcantara — Desenvolvedor Back-end',
  description:
    'Portfólio de Vitor Pinho Alcantara, desenvolvedor back-end e full stack.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
