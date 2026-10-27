/** Soft skills as a quiet labeled line, so they don't compete with the tech chips. */
export function SoftSkills({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <p className="text-sm text-soft">
      <span className="text-muted">{label}:</span> {items.join(' · ')}
    </p>
  );
}
