import Link from 'next/link';
import { notFound } from 'next/navigation';
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

  return (
    <div className="space-y-6 3xl:grid 3xl:grid-cols-[1fr_400px] 3xl:gap-6 3xl:space-y-0 3xl:items-start">
      {/* Coluna principal */}
      <div className="space-y-6 min-w-0">
        <div>
          <div className="text-[11px] text-muted-fg tracking-wide">
            <Link href="/agentes" className="text-muted-fg hover:text-ink">agentes</Link>
            {' / '}
            <Link href={`/agentes/${agent}`} className="text-muted-fg hover:text-ink">{agent}</Link>
            {' / projetos /'}
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink mt-1 leading-none">
            {titleParts.prefix}
            <em className="italic text-honey-deep">{titleParts.mid}</em>
            {titleParts.suffix}
          </h1>
          <div className="mt-3 flex items-center flex-wrap gap-x-6 gap-y-2 border-t border-b border-border py-3">
            {identity.persona_name || identity.whatsapp_number || identity.evolution_instance ? (
              <>
                {identity.persona_name && <Chip k="atende como" v={identity.persona_name} emphasis />}
                {identity.whatsapp_number && <Chip k="whatsapp" v={identity.whatsapp_number} />}
                {identity.evolution_instance && <Chip k="instância" v={identity.evolution_instance} />}
              </>
            ) : (
              <span className="text-[11px] text-muted-fg">
                Sem identidade do projeto. Adicione <code>project_overrides</code> em <code>agents.yml</code> ou crie <code>_platform/workspace-map.json</code> no repo do agente.
              </span>
            )}
            <span className="ml-auto" />
            <ProjectToggle agent={agent} slug={slug} initialEnabled={enabled} />
          </div>
        </div>

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
            <StatCard label="msgs in (7d)" value={stats.msgsIn7d} />
            <StatCard label="msgs out (7d)" value={stats.msgsOut7d} />
            <StatCard label="$ 7d" value={`$${stats.cost7d.toFixed(4)}`} />
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

        <SectionCard
          title="Briefing ·"
          titleAccent="PROJECT.md"
          action={
            <a
              href={`https://github.com/${found.repo}/commits/master/projetos/${slug}/PROJECT.md`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-ink underline-honey"
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

function Chip({ k, v, emphasis = false }: { k: string; v: string; emphasis?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 text-xs">
      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-fg">{k}</span>
      <span className="text-ink">
        {emphasis ? <em className="font-display italic">{v}</em> : v}
      </span>
    </span>
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
        <ul className={`divide-y divide-line ${sticky ? 'max-h-[calc(100vh-120px)] overflow-y-auto' : ''}`}>
          {recent.map((m) => (
            <li key={m.id} className="grid grid-cols-[18px_70px_1fr_60px] gap-3 px-5 py-3 items-baseline text-[13px]">
              <span className={`font-display italic text-lg leading-none ${m.direction === 'inbound' ? 'text-ink' : 'text-honey-deep'}`}>
                {m.direction === 'inbound' ? '←' : '→'}
              </span>
              <span className="text-[11px] text-muted-fg tracking-wide">
                {m.direction === 'inbound' ? 'in' : 'out'} · {shortTime(m.createdAt)}
              </span>
              <span className="text-ink leading-snug">{m.text}</span>
              <span className="font-display italic text-muted-fg text-[12px] text-right tabular-nums">
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
