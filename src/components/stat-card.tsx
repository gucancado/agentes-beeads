'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';

type StatVariant = 'default' | 'honey' | 'accent';

export function StatCard({
  label,
  value,
  hint,
  variant = 'default',
  series,
}: {
  label: string;
  value: string | number;
  hint?: string;
  variant?: StatVariant;
  /**
   * Optional time-series for a minimalist sparkline.
   * Only render in cards where a series makes sense (7d cumulative metrics).
   */
  series?: number[];
}) {
  const showSparkline = series && series.length > 1;

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
      {showSparkline && (
        <div className="h-8 mt-1 -mx-1" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="var(--color-honey)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
