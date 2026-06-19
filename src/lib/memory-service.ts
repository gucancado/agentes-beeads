import type { Queryable } from './memory-queries';
import {
  getMemoryIndexRows, getWorkspaceFactRows, getWorkspaceEpisodeRows, getEpisodeMeta, getEpisodeTurnRows,
} from './memory-queries';
import { accessibleWorkspaces, type AccessDeps } from './memory-access';

/**
 * Retorna o índice de memória filtrado pelos workspaces acessíveis ao usuário,
 * com o nome de cada workspace injetado. Mantém a ordem facts_total DESC da query.
 */
export async function assembleMemoryIndex(db: Queryable, cookie: string, deps?: AccessDeps) {
  const [rows, access] = await Promise.all([getMemoryIndexRows(db), accessibleWorkspaces(cookie, deps)]);
  return rows
    .filter((r) => access.has(r.workspace_id))
    .map((r) => ({ workspace_id: r.workspace_id, name: access.get(r.workspace_id)!, row: r }));
}

/**
 * Retorna fatos e episódios de um workspace, com o nome resolvido.
 * Retorna null se o usuário não tiver acesso ao workspace.
 */
export async function assembleWorkspaceMemory(db: Queryable, cookie: string, workspaceId: string, deps?: AccessDeps) {
  const access = await accessibleWorkspaces(cookie, deps);
  if (!access.has(workspaceId)) return null;
  const [facts, episodes] = await Promise.all([
    getWorkspaceFactRows(db, workspaceId), getWorkspaceEpisodeRows(db, workspaceId),
  ]);
  return { name: access.get(workspaceId)!, facts, episodes };
}

/**
 * Acesso a UM episódio sem buscar turnos (gate leve p/ download de asset).
 * Retorna true se o episódio existe e o usuário pertence ao workspace dele.
 */
export async function canAccessEpisode(
  db: Queryable, cookie: string, episodeId: number, deps?: AccessDeps,
): Promise<boolean> {
  const meta = await getEpisodeMeta(db, episodeId);
  if (!meta) return false;
  const access = await accessibleWorkspaces(cookie, deps);
  return access.has(meta.workspace_id);
}

/**
 * Retorna metadados, turnos e nome do workspace de um episódio específico.
 * Retorna null se o episódio não existir ou o usuário não tiver acesso ao workspace.
 */
export async function assembleEpisode(db: Queryable, cookie: string, episodeId: number, deps?: AccessDeps) {
  const meta = await getEpisodeMeta(db, episodeId);
  if (!meta) return null;
  const access = await accessibleWorkspaces(cookie, deps);
  if (!access.has(meta.workspace_id)) return null;
  const turns = await getEpisodeTurnRows(db, episodeId);
  return { workspaceId: meta.workspace_id, name: access.get(meta.workspace_id)!, meta, turns };
}
