import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadRegistry } from '@/lib/registry-server';
import {
  fetchAgentDetailStats,
  fetchCostTimeseries,
  fetchTierBreakdown,
} from '@/lib/stats-service';
import { StatCard } from '@/components/stat-card';
import { CostTimeseriesChart } from '@/components/cost-timeseries-chart';
import { TierBreakdownDonut } from '@/components/tier-breakdown-donut';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h atrás`;
  return `${Math.floor(hours / 24)} d atrás`;
}

export default async function AgentDetail({
  params,
}: {
  params: Promise<{ agent: string }>;
}) {
  const { agent } = await params;
  const registry = loadRegistry();
  const found = registry.agents.find((a) => a.name === agent && a.enabled);
  if (!found) notFound();

  const [detail, timeseries, tiers] = await Promise.all([
    fetchAgentDetailStats(agent),
    fetchCostTimeseries(agent, 7),
    fetchTierBreakdown(agent, 7),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/agentes" className="text-xs text-slate-400 hover:text-slate-600">
          ← agentes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-800 capitalize">{agent}</h1>
        <p className="text-xs text-slate-500">repo: {found.repo}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="msgs in (7d)" value={detail.totals.msgsIn7d} />
        <StatCard label="msgs out (7d)" value={detail.totals.msgsOut7d} />
        <StatCard label="$ últimos 7d" value={`$${detail.totals.cost7d.toFixed(4)}`} />
        <StatCard label="projetos ativos" value={detail.projects.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Custo diário (7d)</CardTitle></CardHeader>
          <CardContent>
            <CostTimeseriesChart data={timeseries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Mensagens por tier (7d)</CardTitle></CardHeader>
          <CardContent>
            <TierBreakdownDonut data={tiers} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Projetos
        </h2>
        {detail.projects.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum projeto com mensagens nos últimos 7d.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {detail.projects.map((p) => (
              <Link key={p.project} href={`/agentes/${agent}/projetos/${p.project}`}>
                <Card className="transition hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">{p.project}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-y-1 text-sm">
                      <dt className="text-slate-400">in / out 24h</dt>
                      <dd className="text-right text-slate-700">{p.msgsIn24h} / {p.msgsOut24h}</dd>
                      <dt className="text-slate-400">$ 24h</dt>
                      <dd className="text-right text-slate-700">${p.cost24h.toFixed(4)}</dd>
                      <dt className="text-slate-400">última msg</dt>
                      <dd className="text-right text-slate-700">{timeAgo(p.lastMessageAt)}</dd>
                    </dl>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
