import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadRegistry } from '@/lib/registry-server';
import { fetchGroups, fetchGroupThread } from '@/lib/stats-service';

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

function clock(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default async function GruposMonitorados({
  params,
  searchParams,
}: {
  params: Promise<{ agent: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const { agent } = await params;
  const { g } = await searchParams;
  const registry = loadRegistry();
  const found = registry.agents.find((a) => a.name === agent && a.enabled);
  if (!found) notFound();

  const groups = await fetchGroups(agent);
  const selected = g ? decodeURIComponent(g) : null;
  const thread = selected ? await fetchGroupThread(agent, selected) : null;

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/agentes/${agent}`} className="text-[11px] text-muted-fg hover:text-fg">
          ← {agent}
        </Link>
        <h1 className="font-display text-3xl font-medium tracking-tight text-fg mt-1">
          Grupos monitorados
        </h1>
        <p className="text-xs text-muted-fg mt-1">{groups.length} grupo(s) no catálogo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-5">
        {/* Lista de grupos */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-[0.12em] text-muted-fg">
            grupos
          </div>
          {groups.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-fg">Nenhum grupo no catálogo ainda.</p>
          ) : (
            <ul className="divide-y divide-border max-h-[70vh] overflow-y-auto">
              {groups.map((grp) => {
                const active = grp.jid === selected;
                return (
                  <li key={grp.jid}>
                    <Link
                      href={`/agentes/${agent}/grupos?g=${encodeURIComponent(grp.jid)}`}
                      className={`block px-4 py-3 transition ${active ? 'bg-muted' : 'hover:bg-muted'}`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-fg truncate">
                          {grp.subject ?? grp.jid}
                        </span>
                        <span className="text-[10px] text-muted-fg tabular-nums shrink-0">
                          {timeAgo(grp.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5 text-[11px] text-muted-fg tabular-nums">
                        <span>{grp.msgCount} msgs</span>
                        {grp.project ? (
                          <span className="px-1.5 py-0.5 rounded bg-honey/15 text-honey-deep">{grp.project}</span>
                        ) : (
                          <span className="text-muted-fg/60">sem projeto</span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Thread do grupo selecionado */}
        <div className="rounded-lg border border-border overflow-hidden flex flex-col">
          {!thread ? (
            <div className="flex-1 grid place-items-center p-10 text-sm text-muted-fg">
              Selecione um grupo para ver as mensagens.
            </div>
          ) : (
            <>
              <div className="px-4 py-2.5 border-b border-border flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-fg truncate">{thread.subject ?? thread.jid}</span>
                <span className="text-[11px] text-muted-fg">{thread.messages.length} msgs</span>
              </div>
              {thread.messages.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-fg">Sem mensagens ingeridas ainda para este grupo.</p>
              ) : (
                <ul className="divide-y divide-border max-h-[70vh] overflow-y-auto">
                  {thread.messages.map((m) => (
                    <li key={m.id} className="px-4 py-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-honey-deep truncate">
                          {m.pushName ?? m.author ?? 'desconhecido'}
                        </span>
                        <span className="text-[10px] text-muted-fg tabular-nums shrink-0">{clock(m.createdAt)}</span>
                      </div>
                      <p className="text-sm text-fg mt-0.5 whitespace-pre-wrap break-words">{m.text || '—'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
