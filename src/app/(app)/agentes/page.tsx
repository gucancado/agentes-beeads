import Link from 'next/link';
import { loadAccessibleAgents } from '@/lib/registry-server';
import { getRawCookieHeader } from '@/lib/auth';
import { fetchAgentHomeStats } from '@/lib/stats-service';

export default async function AgentesHome() {
  const cookie = await getRawCookieHeader();
  const agents = await loadAccessibleAgents(cookie);
  const stats = await fetchAgentHomeStats(agents.map((a) => a.name));
  const byAgent = new Map(stats.map((s) => [s.agent, s]));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-fg">Agentes registrados</p>
        <h1 className="font-display text-4xl font-medium tracking-tight text-fg mt-1">
          Visão <em className="italic text-honey-deep">geral</em>
        </h1>
        <p className="mt-2 text-sm text-muted-fg max-w-xl">
          Stats das últimas 24 h por agente. Clique pra abrir detalhe, projetos e editar briefing.
        </p>
      </div>

      {agents.length === 0 ? (
        <p className="text-sm text-muted-fg">
          Nenhum agente habilitado em <code>agents.yml</code>.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const s = byAgent.get(agent.name);
            const errPct = s ? (s.errorRate * 100) : 0;
            const errOk = errPct < 1;
            return (
              <Link
                key={agent.name}
                href={`/agentes/${agent.name}`}
                className="group block rounded-md border border-border bg-card overflow-hidden shadow-[0_1px_0_rgba(10,10,10,0.04),0_4px_14px_rgba(10,10,10,0.04)] transition hover:-translate-y-px hover:border-honey hover:border-l-[3px]"
              >
                <header className="flex items-baseline justify-between px-5 pt-4 pb-2 border-b border-border">
                  <div>
                    <h3 className="font-display text-xl font-medium tracking-tight text-fg capitalize">
                      {agent.name}
                    </h3>
                    <p className="text-[10px] text-muted-fg mt-0.5">{agent.repo}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-ok">
                    <span className="size-1.5 rounded-full bg-ok" />
                    healthy
                  </span>
                </header>
                {s ? (
                  <dl className="grid grid-cols-3 divide-x divide-border">
                    <div className="px-4 py-3">
                      <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-fg">$ hoje</dt>
                      <dd className="font-display text-xl font-medium text-honey-deep mt-1 leading-none">
                        ${s.cost24h.toFixed(4)}
                      </dd>
                    </div>
                    <div className="px-4 py-3">
                      <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-fg">in / out</dt>
                      <dd className="font-display text-xl font-medium text-fg mt-1 leading-none">
                        {s.msgsIn24h} / {s.msgsOut24h}
                      </dd>
                    </div>
                    <div className="px-4 py-3">
                      <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-fg">erros</dt>
                      <dd className={`font-display text-xl font-medium mt-1 leading-none ${errOk ? 'text-fg' : 'text-err'}`}>
                        {errPct.toFixed(1)}%
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="px-5 py-4 text-sm text-muted-fg">sem dados ainda</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
