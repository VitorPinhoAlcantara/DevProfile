import { defineRouting } from 'next-intl/routing';
import { locales } from '@devprofile/shared';

// Portuguese lives at `/`, English at `/en`. Locale codes match the API's `?lang=`.
export const routing = defineRouting({
  locales,
  defaultLocale: 'pt-BR',
  localePrefix: 'as-needed',
});
