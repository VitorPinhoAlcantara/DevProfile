import { defineRouting } from 'next-intl/routing';
import { locales } from '@devprofile/shared';

export const routing = defineRouting({
  locales,
  defaultLocale: 'pt-BR',
  localePrefix: 'as-needed',
  // Behind the tunnel this header would say http://; the page metadata lists these links.
  alternateLinks: false,
});
