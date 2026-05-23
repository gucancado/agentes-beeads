import { Card, CardContent } from '@/components/ui/card';

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-800">{value}</div>
        {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
      </CardContent>
    </Card>
  );
}
