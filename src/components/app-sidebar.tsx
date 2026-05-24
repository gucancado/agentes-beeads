import Link from 'next/link';
import { loadRegistry } from '@/lib/registry-server';
import { getEnabledAgents } from '@/lib/registry';
import { HexLogo } from './hex-logo';

export function AppSidebar() {
  const registry = loadRegistry();
  const enabled = getEnabledAgents(registry);
  const disabled = registry.agents.filter((a) => !a.enabled);

  return (
    <aside className="border-r border-line bg-paper-2 px-5 py-6 flex flex-col gap-6 min-h-screen">
      <div className="flex items-center gap-2.5 border-b border-line pb-4">
        <HexLogo />
        <span className="font-display text-xl font-medium tracking-tight text-ink">
          agentes<span className="italic text-honey-deep">·</span>beeads
        </span>
      </div>

      <nav>
        <h4 className="mb-2.5 text-[10px] uppercase tracking-[0.22em] text-ink-mute font-normal">
          Agentes
        </h4>
        <ul className="space-y-2">
          {enabled.map((agent) => (
            <li key={agent.name}>
              <Link
                href={`/agentes/${agent.name}`}
                className="group block rounded-sm border border-line bg-card px-3.5 py-3 shadow-[0_1px_0_rgba(10,10,10,0.04),0_4px_14px_rgba(10,10,10,0.04)] hover:-translate-y-px hover:border-line-2 transition"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="size-1.5 rounded-full bg-ok shadow-[0_0_0_3px_rgba(31,122,58,0.15)]" />
                  <span className="font-display text-base font-medium tracking-tight text-ink capitalize">
                    {agent.name}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft">repo: {agent.repo.split('/')[1] ?? agent.repo}</p>
              </Link>
            </li>
          ))}
          {disabled.map((agent) => (
            <li key={agent.name}>
              <div className="block rounded-sm border border-line bg-card px-3.5 py-3 opacity-60">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="size-1.5 rounded-full bg-ink-mute" />
                  <span className="font-display text-base font-medium tracking-tight text-ink capitalize">
                    {agent.name}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft">disabled em agents.yml</p>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
