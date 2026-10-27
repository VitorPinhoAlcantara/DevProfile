import type { ReactNode } from 'react';

// Small JSON highlighter: enough for API responses, no syntax-highlighting library needed.
const TOKEN =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

export function highlightJson(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(TOKEN)) {
    const index = match.index;
    if (index > last) nodes.push(text.slice(last, index));
    const [token, str, colon, literal] = match;

    if (str !== undefined) {
      nodes.push(
        <span
          key={index}
          className={
            colon ? 'text-[var(--json-key)]' : 'text-[var(--json-string)]'
          }
        >
          {str}
        </span>,
      );
      if (colon) nodes.push(colon);
    } else {
      nodes.push(
        <span
          key={index}
          className={
            literal ? 'text-[var(--json-literal)]' : 'text-[var(--json-number)]'
          }
        >
          {token}
        </span>,
      );
    }
    last = index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function JsonView({ value }: { value: unknown }) {
  const text =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return (
    <pre className="font-mono whitespace-pre-wrap break-words text-xs leading-relaxed text-muted">
      <code>{highlightJson(text)}</code>
    </pre>
  );
}
