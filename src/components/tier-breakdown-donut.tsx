type Bucket = { tier: string; count: number; cost: number };

const TIER_COLORS: Record<string, string> = {
  baixo: '#FFE7A8',
  medio: '#FFAE00',
  alto: '#0a0a0a',
  unknown: '#c0c0c0',
};

export function TierBreakdownDonut({ data }: { data: Bucket[] }) {
  const total = data.reduce((acc, b) => acc + b.count, 0);
  return (
    <div className="px-5 py-4 space-y-2.5">
      {data.map((b) => {
        const pct = total === 0 ? 0 : Math.round((b.count / total) * 100);
        const color = TIER_COLORS[b.tier] ?? TIER_COLORS.unknown;
        return (
          <div key={b.tier} className="grid grid-cols-[60px_1fr_60px] gap-3 items-center text-xs">
            <span className="text-muted-fg capitalize">{b.tier}</span>
            <span className="relative h-1.5 rounded-sm border border-border bg-muted overflow-hidden">
              <span
                className="absolute inset-y-[-1px] left-[-1px] rounded-sm"
                style={{ width: `${pct}%`, background: color }}
              />
            </span>
            <span className="text-right font-medium text-ink tabular-nums">
              {b.count}
              <span className="text-muted-fg"> ·{' '}</span>
              <span className="text-muted-fg">${b.cost.toFixed(3)}</span>
            </span>
          </div>
        );
      })}
      {data.length === 0 && (
        <p className="text-xs text-muted-fg">Sem dados de tier ainda.</p>
      )}
    </div>
  );
}
