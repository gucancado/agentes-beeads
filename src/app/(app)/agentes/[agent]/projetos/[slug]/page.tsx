import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@beeads/ui';
import { loadRegistry } from '@/lib/registry-server';
import { resolveProjectIdentity, isProjectEnabled } from '@/lib/registry';
import { fetchProjectStats, fetchRecentMessages } from '@/lib/stats-service';
import { loadProjectFromAgentRepo } from '@/lib/project-md';
import { loadAgentProjectConfig } from '@/lib/agent-project-config';
import { StatCard } from '@/components/stat-card';
import { SectionCard } from '@/components/section-card';
import { ModelsCard } from '@/components/models-card';
import { BriefingForm } from './briefing-form';
import { QuietHoursForm } from './quiet-hours-form';
import { ProjectToggle } from './project-toggle';
import { InstanceQrPanel } from './instance-qr-panel';

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

function splitSlug(slug: string): { prefix: string; mid: string; suffix: string } {
  if (slug.length < 3) return { prefix: slug, mid: '', suffix: '' };
  const mid = Math.floor(slug.length / 2);
  return { prefix: slug.slice(0, mid - 1), mid: slug[mid - 1], suffix: slug.slice(mid) };
}

/**
 * TODO(data): substituir por série temporal real (ex: queries.ts → diário 7d
 * para in/out/cost). Hoje gera uma curva derivada do total apenas pra dar
 * shape visual ao sparkline.
 */
function fakeSeriesFromTotal(total: number, points = 7): number[] {
  if (total <= 0) return Array.from({ length: points }, () => 0);
  const avg = total / points;
  // Distribuição determinística pra manter consistência entre renders (sem
  // Math.random — evita hydration mismatch e ruído visual entre reloads).
  const weights = [0.6, 0.8, 1.1, 1.0, 1.3, 0.9, 1.3];
  return weights.slice(0, points).map((w) => Math.max(0, Math.round(avg * w)));
}

function fakeSeriesFromCost(total: number, points = 7): number[] {
  if (total <= 0) return Array.from({ length: points }, () => 0);
  const avg = total / points;
  const weights = [0.5, 0.7, 1.2, 1.1, 1.4, 0.8, 1.3];
  return weights.slice(0, points).map((w) => Number((avg * w).toFixed(6)));
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ agent: string; slug: string }>;
}) {
  const { agent, slug } = await params;
  const registry = loadRegistry();
  const found = registry.agents.find((a) => a.name === agent && a.enabled);
  if (!found) notFound();

  const [stats, recent, { workspace, projectMd }, quietConfig] = await Promise.all([
    fetchProjectStats(agent, slug),
    fetchRecentMessages(agent, slug, 20),
    loadProjectFromAgentRepo({ agent, githubRepo: found.repo, slug }),
    loadAgentProjectConfig(agent, slug),
  ]);

  const identity = resolveProjectIdentity(found, slug, workspace);
  const enabled = isProjectEnabled(found, slug);
  const titleParts = splitSlug(slug);

  const hasIdentity = !!(
    identity.persona_name || identity.whatsapp_number || identity.evolution_instance
  );

  const operacaoContent = (
    <>
      <SectionCard title="Métricas das últimas" titleAccent="24 horas" meta="janela 24h">
        <div className="grid grid-cols-2 md:grid-cols-4">
          <StatCard label="msgs in" value={stats.msgsIn24h} />
          <StatCard label="msgs out" value={stats.msgsOut24h} />
          <StatCard label="$ 24h" value={`$${stats.cost24h.toFixed(4)}`} variant="honey" />
          <StatCard
            label="latência média"
            value={stats.avgLatencyMs == null ? '—' : `${Math.round(stats.avgLatencyMs)} ms`}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-border">
          <StatCard
            label="msgs in (7d)"
            value={stats.msgsIn7d}
            series={fakeSeriesFromTotal(stats.msgsIn7d)}
          />
          <StatCard
            label="msgs out (7d)"
            value={stats.msgsOut7d}
            series={fakeSeriesFromTotal(stats.msgsOut7d)}
          />
          <StatCard
            label="$ 7d"
            value={`$${stats.cost7d.toFixed(4)}`}
            series={fakeSeriesFromCost(stats.cost7d)}
          />
          <StatCard label="última msg" value={timeAgo(stats.lastMessageAt)} />
        </div>
      </SectionCard>

      <ModelsCard models={found.models} agentName={agent} />

      {identity.evolution_instance && (
        <SectionCard
          title="WhatsApp ·"
          titleAccent="instância Evolution"
          meta="conectar / trocar número"
        >
          <InstanceQrPanel
            agent={agent}
            slug={slug}
            instance={identity.evolution_instance}
            initialNumber={identity.whatsapp_number}
          />
        </SectionCard>
      )}
    </>
  );

  const configContent = (
    <>
      <SectionCard
        title="Briefing ·"
        titleAccent="PROJECT.md"
        action={
          <a
            href={`https://github.com/${found.repo}/commits/master/projetos/${slug}/PROJECT.md`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-fg underline-honey"
          >
            ver histórico no GitHub →
          </a>
        }
      >
        {projectMd === null ? (
          <p className="px-5 py-4 text-sm text-err">
            <code>projetos/{slug}/PROJECT.md</code> não encontrado no repo.
          </p>
        ) : (
          <BriefingForm agent={agent} slug={slug} initialContent={projectMd} />
        )}
      </SectionCard>

      <SectionCard
        title="Quiet hours ·"
        titleAccent="anti-detecção"
        meta={quietConfig.quiet_hours_enabled ? 'ativo' : 'desligado'}
      >
        <QuietHoursForm
          agent={agent}
          slug={slug}
          initialEnabled={quietConfig.quiet_hours_enabled}
          initialStart={quietConfig.quiet_start}
          initialEnd={quietConfig.quiet_end}
          initialTz={quietConfig.quiet_tz}
        />
      </SectionCard>
    </>
  );

  return (
    <div className="space-y-6 3xl:grid 3xl:grid-cols-[1fr_400px] 3xl:gap-6 3xl:space-y-0 3xl:items-start">
      {/* Coluna principal */}
      <div className="space-y-6 min-w-0">
        <div>
          {/* Breadcrumb sem barra final pendurada */}
          <nav className="flex items-center gap-2 text-[11px] text-muted-fg tracking-wide">
            <Link href="/agentes" className="hover:text-fg transition-colors">
              agentes
            </Link>
            <span aria-hidden>/</span>
            <Link href={`/agentes/${agent}`} className="hover:text-fg transition-colors">
              {agent}
            </Link>
            <span aria-hidden>/</span>
            <span>projetos</span>
          </nav>

          <h1 className="font-display text-4xl font-medium tracking-tight text-fg mt-1 leading-none">
            {titleParts.prefix}
            <em className="italic text-honey-deep">{titleParts.mid}</em>
            {titleParts.suffix}
          </h1>

          {/* Identidade do projeto: persona como display, metadados como pills sutis */}
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-t border-b border-border py-3">
            {hasIdentity ? (
              <>
                {identity.persona_name && (
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-muted-fg shrink-0">
                      atende como
                    </span>
                    <span className="font-display text-2xl italic text-fg truncate">
                      {identity.persona_name}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-6 text-[11px]">
                  {identity.whatsapp_number && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-muted-fg">
                        WhatsApp
                      </span>
                      <span className="font-mono text-fg/80">{identity.whatsapp_number}</span>
                    </div>
                  )}
                  {identity.evolution_instance && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-[0.22em] text-muted-fg">
                        Instância
                      </span>
                      <span className="font-mono text-fg/80">{identity.evolution_instance}</span>
                    </div>
                  )}
                  <ProjectToggle agent={agent} slug={slug} initialEnabled={enabled} />
                </div>
              </>
            ) : (
              <>
                <span className="text-[11px] text-muted-fg">
                  Sem identidade do projeto. Adicione <code>project_overrides</code> em{' '}
                  <code>agents.yml</code> ou crie <code>_platform/workspace-map.json</code> no repo
                  do agente.
                </span>
                <ProjectToggle agent={agent} slug={slug} initialEnabled={enabled} />
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="operacao" className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="operacao">Operação</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
          </TabsList>

          <TabsContent value="operacao" className="space-y-6 mt-4" keepMounted>
            {operacaoContent}
          </TabsContent>

          <TabsContent value="config" className="space-y-6 mt-4" keepMounted>
            {configContent}
          </TabsContent>
        </Tabs>

        {/* mensagens — só aparece aqui se NÃO for 3xl (ultra-wide); em wide, vão pra coluna direita */}
        <div className="3xl:hidden">
          <RecentMessagesCard recent={recent} />
        </div>
      </div>

      {/* Coluna lateral em ultra-wide (≥1700px) */}
      <aside className="hidden 3xl:block 3xl:sticky 3xl:top-6">
        <RecentMessagesCard recent={recent} sticky />
      </aside>
    </div>
  );
}

function RecentMessagesCard({ recent, sticky = false }: {
  recent: Array<{ id: number; direction: 'inbound' | 'outbound'; identifier: string; text: string; createdAt: string }>;
  sticky?: boolean;
}) {
  return (
    <SectionCard
      title="Mensagens"
      titleAccent="recentes"
      meta={`últimas ${recent.length}`}
    >
      {recent.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-fg">Nenhuma mensagem ainda.</p>
      ) : (
        <ul className={`divide-y divide-border ${sticky ? 'max-h-[calc(100vh-120px)] overflow-y-auto' : ''}`}>
          {recent.map((m) => (
            <li
              key={m.id}
              className="grid grid-cols-[18px_70px_1fr_60px] gap-3 px-5 py-3 items-baseline"
            >
              <span
                className={`font-display italic text-lg leading-none ${
                  m.direction === 'inbound' ? 'text-fg' : 'text-honey-deep'
                }`}
              >
                {m.direction === 'inbound' ? '←' : '→'}
              </span>
              <span className="text-[10px] text-muted-fg tracking-wide">
                {m.direction === 'inbound' ? 'in' : 'out'} · {shortTime(m.createdAt)}
              </span>
              <span className="text-xs text-fg/80 leading-snug">{m.text}</span>
              <span className="text-[10px] text-honey/80 text-right tabular-nums font-mono">
                {shortIdentifier(m.identifier)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function shortTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(0, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function shortIdentifier(id: string): string {
  // +5531977786735 → "+97778"
  if (!id.startsWith('+')) return id;
  return '+' + id.slice(-5);
}
