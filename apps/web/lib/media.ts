import { mediaWidths } from '@devprofile/shared';

/** Lets the browser pick a resized copy. Only uploads have them: Markdown can link anywhere. */
export function responsiveImage(src: string | undefined, sizes: string) {
  if (!src?.startsWith('/api/media/')) return { src };
  const srcSet = mediaWidths.map((w) => `${src}?w=${w} ${w}w`).join(', ');
  return { sizes, srcSet, src };
}
