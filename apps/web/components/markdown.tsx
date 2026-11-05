import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { responsiveImage } from '@/lib/media';

// Raw HTML in the Markdown is not rendered (react-markdown's default), so content
// edited in the admin can't inject markup into the page.

/** README-style project page: headings, lists, tables, quotes and screenshots. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-portfolio max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: label }) => {
            const external = href ? /^https?:\/\//.test(href) : false;
            return (
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {label}
              </a>
            );
          },
          // Markdown puts images inside <p>, where <figure> isn't valid HTML,
          // so the figure is built from spans.
          img: ({ src, alt }) => (
            <span className="md-figure">
              {/* shortcut: `sizes` sets the width here, so an image narrower than the column stretches to fit; store real dimensions if small images are ever needed. */}
              <img
                alt={alt ?? ''}
                loading="lazy"
                {...responsiveImage(
                  typeof src === 'string' ? src : undefined,
                  '(min-width: 1024px) 53rem, 100vw',
                )}
              />
              {alt && <span className="md-caption">{alt}</span>}
            </span>
          ),
          // Wide tables scroll inside the column instead of the whole page.
          table: ({ children: rows }) => (
            <div className="overflow-x-auto">
              <table>{rows}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
