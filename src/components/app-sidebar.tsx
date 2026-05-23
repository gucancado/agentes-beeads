import Link from 'next/link';
import { loadRegistry } from '@/lib/registry-server';
import { getEnabledAgents } from '@/lib/registry';

export function AppSidebar() {
  const registry = loadRegistry();
  const agents = getEnabledAgents(registry);

  return (
    <aside className="w-56 border-r bg-white p-4">
      <h1 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Agentes
      </h1>
      <nav className="flex flex-col gap-1">
        {agents.map((agent) => (
          <Link
            key={agent.name}
            href={`/agentes/${agent.name}`}
            className="rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            {agent.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
