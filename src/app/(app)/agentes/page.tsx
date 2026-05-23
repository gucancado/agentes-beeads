import Link from 'next/link';
import { loadRegistry } from '@/lib/registry-server';
import { getEnabledAgents } from '@/lib/registry';
import { fetchAgentHomeStats } from '@/lib/stats-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AgentesHome() {
  const registry = loadRegistry();
  const agents = getEnabledAgents(registry);
  const stats = await fetchAgentHomeStats(agents.map((a) => a.name));
  const byAgent = new Map(stats.map((s) => [s.agent, s]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Agentes</h1>

      {agents.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhum agente habilitado em <code>agents.yml</code>.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const s = byAgent.get(agent.name);
            return (
              <Link key={agent.name} href={`/agentes/${agent.name}`}>
                <Card className="transition hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="capitalize">{agent.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {s ? (
                      <dl className="grid grid-cols-2 gap-y-1 text-sm">
                        <dt className="text-slate-400">$ hoje</dt>
                        <dd className="text-right text-slate-700">${s.cost24h.toFixed(4)}</dd>
                        <dt className="text-slate-400">in / out 24h</dt>
                        <dd className="text-right text-slate-700">{s.msgsIn24h} / {s.msgsOut24h}</dd>
                        <dt className="text-slate-400">erros 24h</dt>
                        <dd className="text-right text-slate-700">{(s.errorRate * 100).toFixed(1)}%</dd>
                      </dl>
                    ) : (
                      <p className="text-sm text-slate-400">sem dados ainda</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
