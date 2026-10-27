import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Chip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-line px-2.5 py-0.5 text-xs text-muted',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Chip>{item}</Chip>
        </li>
      ))}
    </ul>
  );
}
