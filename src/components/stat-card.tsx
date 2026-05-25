type StatVariant = 'default' | 'honey' | 'accent';

export function StatCard({
  label,
  value,
  hint,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  variant?: StatVariant;
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 border-r border-border last:border-r-0">
      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-fg">{label}</span>
      <span
        className={[
          'font-display text-3xl font-medium leading-none tracking-tight text-card-fg',
          variant === 'honey' && 'text-honey-deep',
          variant === 'accent' && 'italic',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
        {variant === 'accent' && (
          <span className="inline-block align-middle ml-1.5 w-6 h-[3px] bg-honey" />
        )}
      </span>
      {hint && <span className="text-[10px] text-muted-fg">{hint}</span>}
    </div>
  );
}
