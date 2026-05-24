'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Point = { day: string; cost: number };

export function CostTimeseriesChart({ data }: { data: Point[] }) {
  return (
    <div className="h-56 w-full px-4 pt-3">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 6, right: 16, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="honeyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFAE00" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFAE00" stopOpacity="0" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#8f8f8f' }}
            tickFormatter={(d: string) => d.slice(5)}
            axisLine={{ stroke: '#e2e2e2' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#8f8f8f' }}
            tickFormatter={(v: number) => `$${v.toFixed(2)}`}
            axisLine={{ stroke: '#e2e2e2' }}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: '#FFAE00', strokeWidth: 1 }}
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e2e2',
              borderRadius: 3,
              fontSize: 11,
              padding: '6px 10px',
            }}
            formatter={(v) => [`$${Number(v).toFixed(4)}`, 'custo']}
            labelStyle={{ color: '#545048', fontWeight: 500 }}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#0a0a0a"
            strokeWidth={1.8}
            fill="url(#honeyFill)"
            activeDot={{ r: 4, fill: '#FFAE00', stroke: '#0a0a0a', strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
