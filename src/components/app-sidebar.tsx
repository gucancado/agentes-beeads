"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarNavItem,
  SidebarSectionLabel,
} from "@beeads/ui";
import { HexLogo } from "./hex-logo";

export interface AgentItem {
  name: string;
  workspaceName?: string;
}

export interface SidebarUser {
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export function AppSidebar({
  agents,
  user,
}: {
  agents: AgentItem[];
  user: SidebarUser | null;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider persist="localStorage" storageKey="agentes_sidebar_collapsed">
      <Sidebar>
        <SidebarHeader
          logo={<HexLogo />}
          title={
            <>
              agentes<span className="italic text-honey-deep">·</span>beeads
            </>
          }
        />
        <SidebarBody>
          <SidebarSectionLabel>Agentes</SidebarSectionLabel>
          {agents.length === 0 ? (
            <p className="px-3 text-[11px] text-sidebar-foreground/50">
              Nenhum agente acessível.
            </p>
          ) : (
            agents.map((agent) => (
              <SidebarNavItem
                key={agent.name}
                label={
                  <span className="flex flex-col">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 shrink-0 rounded-full bg-ok shadow-[0_0_0_3px_rgba(31,122,58,0.15)]" />
                      <span className="capitalize">{agent.name}</span>
                    </span>
                    {agent.workspaceName && (
                      <span className="text-[11px] text-sidebar-foreground/50 pl-3">
                        {agent.workspaceName}
                      </span>
                    )}
                  </span>
                }
                title={agent.name}
                active={pathname?.startsWith(`/agentes/${agent.name}`)}
                render={(props) => (
                  <Link href={`/agentes/${agent.name}`} {...props} />
                )}
              />
            ))
          )}
        </SidebarBody>
        <SidebarFooter
          user={user}
          onLogout={() => {
            window.location.assign(
              "https://bloquim.beeads.com.br/api/auth/logout?return_url=" +
                encodeURIComponent("https://bloquim.beeads.com.br/login"),
            );
          }}
        />
      </Sidebar>
    </SidebarProvider>
  );
}
