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
        <Link href="/agentes" className="text-[11px] text-ink-soft hover:text-ink">
          ← agentes
        </Link>
        <h1 className="font-display text-4xl font-medium tracking-tight text-ink mt-1 capitalize">
          {agent}
        </h1>
        <div className="mt-3 flex items-center justify-between flex-wrap gap-4 py-3 border-t border-b border-line">
          <span className="inline-flex items-baseline gap-1.5 text-xs">
            <span className="text-[10px] uppercase tracking-[0.12em] text-ink-mute">repo</span>
            <span className="text-ink">{found.repo}</span>
          </span>
          <span className="inline-flex items-baseline gap-1.5 text-xs">
            <span className="text-[10px] uppercase tracking-[0.12em] text-ink-mute">projetos ativos</span>
            <span className="text-ink font-medium">{detail.projects.length}</span>
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-ok/30 bg-ok/8 text-[11px] text-ok font-medium tracking-wide" style={{ background: 'rgba(31,122,58,0.08)' }}>
            <span className="size-1.5 rounded-full bg-ok" />
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

      <ModelsCard models={found.models} agentSlug={agent} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        <SectionCard title="Custo diário" titleAccent="7d" meta="cost timeseries">
          <CostTimeseriesChart data={timeseries} />
          <div className="px-5 py-3 text-[11px] text-ink-soft border-t border-line flex justify-between">
            <span>23 mai → hoje</span>
            <span>
              total <b className="text-ink font-medium">${timeseries.reduce((a, p) => a + p.cost, 0).toFixed(4)}</b>
            </span>
          </div>
        </SectionCard>
        <SectionCard title="Por" titleAccent="tier (7d)" meta="outbound">
          <TierBreakdownDonut data={tiers} />
        </SectionCard>
      </div>

      <SectionCard title="Projetos do" titleAccent="agente" meta={`${detail.projects.length} ativo(s)`}>
        {detail.projects.length === 0 ? (
          <p className="px-5 py-4 text-sm text-ink-soft">Nenhum projeto com mensagens nos últimos 7d.</p>
        ) : (
          <ul className="divide-y divide-line">
            {detail.projects.map((p) => (
              <li key={p.project}>
                <Link
                  href={`/agentes/${agent}/projetos/${p.project}`}
                  className="grid grid-cols-[1fr_auto_auto_auto_24px] gap-6 items-baseline px-5 py-3.5 hover:bg-paper-2 transition"
                >
                  <span className="font-display italic text-lg font-medium text-ink">{p.project}</span>
                  <span className="text-xs text-ink-soft tabular-nums">
                    <span className="text-ink-mute">in/out 24h</span> {p.msgsIn24h}/{p.msgsOut24h}
                  </span>
                  <span className="text-xs text-ink-soft tabular-nums">
                    <span className="text-ink-mute">$ 24h</span> ${p.cost24h.toFixed(4)}
                  </span>
                  <span className="text-xs text-ink-soft">
                    <span className="text-ink-mute">última</span> {timeAgo(p.lastMessageAt)}
                  </span>
                  <span className="text-honey-deep">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
