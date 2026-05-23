'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Bucket = { tier: string; count: number; cost: number };

const COLORS = ['#94a3b8', '#64748b', '#334155'];

export function TierBreakdownDonut({ data }: { data: Bucket[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="tier" innerRadius={45} outerRadius={75}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name, ctx) => {
              const cost = (ctx?.payload as Bucket | undefined)?.cost ?? 0;
              return [`${Number(v)} msgs · $${cost.toFixed(4)}`, String(name)];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
