'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Point = { day: string; cost: number };

export function CostTimeseriesChart({ data }: { data: Point[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11 }}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
          <Tooltip
            formatter={(v) => [`$${Number(v).toFixed(4)}`, 'custo']}
            labelClassName="text-xs"
          />
          <Line type="monotone" dataKey="cost" stroke="#0f172a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
