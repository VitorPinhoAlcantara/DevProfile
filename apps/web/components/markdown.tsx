import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
              <img
                src={typeof src === 'string' ? src : undefined}
                alt={alt ?? ''}
                loading="lazy"
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
