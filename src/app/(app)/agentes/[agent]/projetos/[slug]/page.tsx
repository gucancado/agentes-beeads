import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadRegistry } from '@/lib/registry-server';
import { fetchProjectStats, fetchRecentMessages } from '@/lib/stats-service';
import { loadProjectFromAgentRepo } from '@/lib/project-md';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BriefingForm } from './briefing-form';

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

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ agent: string; slug: string }>;
}) {
  const { agent, slug } = await params;
  const registry = loadRegistry();
  const found = registry.agents.find((a) => a.name === agent && a.enabled);
  if (!found) notFound();

  const [stats, recent, { workspace, projectMd }] = await Promise.all([
    fetchProjectStats(agent, slug),
    fetchRecentMessages(agent, slug, 20),
    loadProjectFromAgentRepo({ agent, githubRepo: found.repo, slug }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/agentes/${agent}`} className="text-xs text-slate-400 hover:text-slate-600">
          ← {agent}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-800">{slug}</h1>
        {workspace ? (
          <dl className="mt-2 grid grid-cols-1 gap-y-0.5 text-xs text-slate-500 md:grid-cols-3">
            <div><span className="text-slate-400">persona:</span> {workspace.persona_name}</div>
            <div><span className="text-slate-400">whatsapp:</span> {workspace.whatsapp_number}</div>
            <div><span className="text-slate-400">instância:</span> {workspace.evolution_instance}</div>
          </dl>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            Projeto não encontrado em <code>_platform/workspace-map.json</code> do repo.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="msgs in (24h)" value={stats.msgsIn24h} />
        <StatCard label="msgs out (24h)" value={stats.msgsOut24h} />
        <StatCard label="$ 24h" value={`$${stats.cost24h.toFixed(4)}`} />
        <StatCard
          label="latência média"
          value={stats.avgLatencyMs == null ? '—' : `${Math.round(stats.avgLatencyMs)} ms`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="msgs in (7d)" value={stats.msgsIn7d} />
        <StatCard label="msgs out (7d)" value={stats.msgsOut7d} />
        <StatCard label="$ 7d" value={`$${stats.cost7d.toFixed(4)}`} />
        <StatCard label="última msg" value={timeAgo(stats.lastMessageAt)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Briefing (PROJECT.md)</CardTitle>
        </CardHeader>
        <CardContent>
          {projectMd === null ? (
            <p className="text-sm text-rose-600">
              <code>projetos/{slug}/PROJECT.md</code> não encontrado no repo.
            </p>
          ) : (
            <BriefingForm agent={agent} slug={slug} initialContent={projectMd} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mensagens recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma mensagem ainda.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((m) => (
                <li key={m.id} className="py-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="capitalize">{m.direction}</span>
                    <span>{timeAgo(m.createdAt)} · {m.identifier}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{m.text}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
