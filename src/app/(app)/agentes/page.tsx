import Link from 'next/link';
import { loadRegistry } from '@/lib/registry-server';
import { getEnabledAgents } from '@/lib/registry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AgentesHome() {
  const registry = loadRegistry();
  const agents = getEnabledAgents(registry);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Agentes</h1>

      {agents.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhum agente habilitado em <code>agents.yml</code>.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.name} href={`/agentes/${agent.name}`}>
              <Card className="transition hover:shadow-md">
                <CardHeader>
                  <CardTitle className="capitalize">{agent.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    <span className="text-slate-400">repo:</span> {agent.repo}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Stats em breve (Sub-tarefa C).
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
