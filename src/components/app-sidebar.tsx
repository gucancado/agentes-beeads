import Link from 'next/link';
import { loadAccessibleAgents } from '@/lib/registry-server';
import { getRawCookieHeader } from '@/lib/auth';
import { HexLogo } from './hex-logo';
import { ThemeToggle } from '@beeads/ui';

export async function AppSidebar() {
  const cookie = await getRawCookieHeader();
  const agents = await loadAccessibleAgents(cookie);

  return (
    <aside className="border-r border-border bg-muted px-5 py-6 flex flex-col gap-6 min-h-screen">
      <div className="flex items-center gap-2.5 border-b border-border pb-4">
        <HexLogo />
        <span className="font-display text-xl font-medium tracking-tight text-fg">
          agentes<span className="italic text-honey-deep">·</span>beeads
        </span>
      </div>

      <nav>
        <h4 className="mb-2.5 text-[10px] uppercase tracking-[0.22em] text-muted-fg font-normal">
          Agentes
        </h4>
        <ul className="space-y-2">
          {agents.map((agent) => (
            <li key={agent.name}>
              <Link
                href={`/agentes/${agent.name}`}
                className="group block rounded-sm border border-border bg-card px-3.5 py-3 shadow-[0_1px_0_rgba(10,10,10,0.04),0_4px_14px_rgba(10,10,10,0.04)] hover:-translate-y-px hover:border-border transition"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="size-1.5 rounded-full bg-ok shadow-[0_0_0_3px_rgba(31,122,58,0.15)]" />
                  <span className="font-display text-base font-medium tracking-tight text-card-fg capitalize">
                    {agent.name}
                  </span>
                </div>
                <p className="text-[11px] text-muted-fg">{agent.workspaceName}</p>
              </Link>
            </li>
          ))}
          {agents.length === 0 && (
            <li className="text-[11px] text-muted-fg px-1">
              Nenhum agente acessível.
            </li>
          )}
        </ul>
      </nav>

      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-fg font-normal">
          Tema
        </span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
