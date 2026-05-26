import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAgentsYaml, type Registry, type Agent } from './registry';
import { meAgents, type MeAgent } from './bloquim-client';

let cached: Registry | null = null;

export function loadRegistry(): Registry {
  if (cached) return cached;
  const path = join(process.cwd(), 'agents.yml');
  const source = readFileSync(path, 'utf8');
  cached = parseAgentsYaml(source);
  return cached;
}

/**
 * Zera o cache em memória do registry. Use após editar agents.yml
 * (o arquivo em disco pode estar stale até o próximo deploy do Coolify,
 * mas pelo menos não devolveremos o valor antigo cacheado).
 *
 * Nota: a edição via `agents-yml-writer` commita no repo e dispara
 * auto-deploy do Coolify (~90s); até lá, o arquivo em disco do container
 * atual continua o antigo. Pra ler a versão recém-salva sem esperar,
 * vamos retornar o estado em-memória explicitamente do server action.
 */
export function invalidateRegistry(): void {
  cached = null;
}

export interface AccessibleAgent extends Agent {
  workspaceId: string;
  workspaceName: string;
  project: string;
}

/**
 * Loads agents accessible to the authenticated user by calling
 * Bloquim's /api/auth/me/agents, then merges in static YAML metadata
 * (models, repo, project_overrides) from the local agents.yml registry.
 */
export async function loadAccessibleAgents(cookie: string): Promise<AccessibleAgent[]> {
  let agentsFromBloquim: MeAgent[];
  try {
    agentsFromBloquim = await meAgents(cookie);
  } catch (err) {
    // If unauthenticated or network error, return empty — layout will redirect.
    if (err instanceof Error && err.message === 'UNAUTHENTICATED') return [];
    throw err;
  }

  const registry = loadRegistry();
  const registryByName = new Map(registry.agents.map((a) => [a.name, a]));

  return agentsFromBloquim.map((a) => {
    const yml = registryByName.get(a.agentName);
    return {
      // Defaults for Agent fields not present in Bloquim response
      name: a.agentName,
      repo: yml?.repo ?? a.agentName,
      enabled: yml?.enabled ?? true,
      models: yml?.models,
      project_overrides: yml?.project_overrides,
      // Bloquim membership info
      workspaceId: a.workspaceId,
      workspaceName: a.workspaceName,
      project: a.projectSlug,
    };
  });
}
