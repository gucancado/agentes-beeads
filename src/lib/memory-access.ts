// Camada de acesso por membership do Bloquim.
// Determina quais workspaces o usuário autenticado pode visualizar na Memória da Lua.
// Dependências injetáveis (AccessDeps) permitem testes unitários offline sem rede.

export type AccessDeps = {
  meWorkspaces(cookie: string): Promise<{ id: string; name: string }[]>;
  meAgents(cookie: string): Promise<{ workspaceId: string; workspaceName: string }[]>;
};

// resolveDefaultDeps: dynamic import lazy para evitar que 'server-only' (em bloquim-client.ts)
// quebre testes unitários que passam suas próprias fakes via parâmetro deps.
// Usa await import() (ESM idiom) em vez de require(), compatível com Turbopack/ESM.
async function resolveDefaultDeps(): Promise<AccessDeps> {
  const { meWorkspaces, meAgents } = await import('./bloquim-client');
  return { meWorkspaces, meAgents };
}

/**
 * Retorna um Map de workspace_id → nome com todos os workspaces que o usuário
 * pode acessar: união dos workspaces diretos (meWorkspaces) + workspaces de
 * agentes (meAgents). Em caso de colisão de id, o nome do workspace prevalece.
 */
export async function accessibleWorkspaces(
  cookie: string,
  deps?: AccessDeps,
): Promise<Map<string, string>> {
  const d = deps ?? (await resolveDefaultDeps());
  const [wss, agents] = await Promise.all([
    d.meWorkspaces(cookie),
    d.meAgents(cookie),
  ]);
  const m = new Map<string, string>();
  // Workspaces diretos têm precedência de nome
  for (const w of wss) m.set(w.id, w.name);
  // Agentes adicionam workspaces não cobertos acima
  for (const a of agents) if (!m.has(a.workspaceId)) m.set(a.workspaceId, a.workspaceName);
  return m;
}

/**
 * Retorna true se o usuário é membro (por qualquer papel) do workspace indicado.
 */
export async function canAccessWorkspace(
  cookie: string,
  workspaceId: string,
  deps?: AccessDeps,
): Promise<boolean> {
  return (await accessibleWorkspaces(cookie, deps)).has(workspaceId);
}
