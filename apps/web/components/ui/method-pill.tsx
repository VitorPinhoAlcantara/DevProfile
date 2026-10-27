import { cn } from '@/lib/cn';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const styles: Record<Method, string> = {
  GET: 'bg-get-soft text-get',
  POST: 'bg-post-soft text-post',
  PUT: 'bg-patch-soft text-patch',
  PATCH: 'bg-patch-soft text-patch',
  DELETE: 'bg-del-soft text-del',
};

export function MethodPill({
  method,
  className,
}: {
  method: Method;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded px-1.5 py-px font-mono text-[0.625rem] font-semibold tracking-wide',
        styles[method],
        className,
      )}
    >
      {method}
    </span>
  );
}
