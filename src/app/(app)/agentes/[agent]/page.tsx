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
import { SectionCard } from '@/components/section-card';
import { ModelsCard } from '@/components/models-card';

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
        <Link href="/agentes" className="text-[11px] text-muted-fg hover:text-fg">
          ← agentes
        </Link>
        <h1 className="font-display text-4xl font-medium tracking-tight text-fg mt-1 capitalize">
          {agent}
        </h1>
        <div className="mt-3 flex items-center justify-between flex-wrap gap-4 py-3 border-t border-b border-border">
          <span className="inline-flex items-baseline gap-1.5 text-xs">
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-fg">repo</span>
            <span className="text-fg">{found.repo}</span>
          </span>
          <span className="inline-flex items-baseline gap-1.5 text-xs">
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-fg">projetos ativos</span>
            <span className="text-fg font-medium">{detail.projects.length}</span>
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-ok/30 bg-ok/8 text-[11px] text-ok font-medium tracking-wide" style={{ background: 'rgba(31,122,58,0.08)' }}>
            <span className="size-1.5 rounded-full bg-ok status-pulse" />
            healthy
          </span>
        </div>
      </div>

      <SectionCard title="Métricas dos últimos" titleAccent="7 dias" meta="janela 7d">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <StatCard label="msgs in" value={detail.totals.msgsIn7d} />
          <StatCard label="msgs out" value={detail.totals.msgsOut7d} />
          <StatCard label="$ últimos 7d" value={`$${detail.totals.cost7d.toFixed(4)}`} variant="honey" />
          <StatCard label="projetos" value={detail.projects.length} />
        </div>
      </SectionCard>

      <ModelsCard models={found.models} agentName={agent} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        <SectionCard title="Custo diário" titleAccent="7d" meta="cost timeseries">
          <CostTimeseriesChart data={timeseries} />
          <div className="px-5 py-3 text-[11px] text-muted-fg border-t border-border flex justify-between">
            <span>23 mai → hoje</span>
            <span>
              total <b className="text-fg font-medium">${timeseries.reduce((a, p) => a + p.cost, 0).toFixed(4)}</b>
            </span>
          </div>
        </SectionCard>
        <SectionCard title="Por" titleAccent="tier (7d)" meta="outbound">
          <TierBreakdownDonut data={tiers} />
        </SectionCard>
      </div>

      <SectionCard title="Projetos do" titleAccent="agente" meta={`${detail.projects.length} ativo(s)`}>
        {detail.projects.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted-fg">Nenhum projeto com mensagens nos últimos 7d.</p>
        ) : (
          <ul className="divide-y divide-border">
            {detail.projects.map((p) => (
              <li key={p.project}>
                <Link
                  href={`/agentes/${agent}/projetos/${p.project}`}
                  className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 px-5 py-3.5 hover:bg-muted transition group"
                >
                  <span className="font-display italic text-lg font-medium text-fg flex-1 min-w-[180px]">
                    {p.project}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 text-xs tabular-nums">
                    <span className="text-muted-fg">
                      <span>in/out 24h </span>
                      <span className="text-fg">{p.msgsIn24h}/{p.msgsOut24h}</span>
                    </span>
                    <span className="text-muted-fg">
                      <span>$ 24h </span>
                      <span className="text-fg">${p.cost24h.toFixed(4)}</span>
                    </span>
                    <span className="text-muted-fg">
                      <span>última </span>
                      <span className="text-fg">{timeAgo(p.lastMessageAt)}</span>
                    </span>
                  </div>
                  <span className="text-honey-deep group-hover:translate-x-0.5 transition-transform" aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
