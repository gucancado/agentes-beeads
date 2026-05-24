import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ensureRepo, commitAndPush } from './git';

const FILE_PATH = '_platform/disabled-projects.json';
const DEFAULT_BRANCH = 'master';

type DisabledFile = { version: number; disabled: string[] };

async function readCurrent(agent: string, githubRepo: string): Promise<{ root: string; data: DisabledFile }> {
  const root = await ensureRepo({ agent, githubRepo, branch: DEFAULT_BRANCH });
  let data: DisabledFile = { version: 1, disabled: [] };
  try {
    const raw = await readFile(join(root, FILE_PATH), 'utf8');
    const parsed = JSON.parse(raw) as Partial<DisabledFile>;
    if (Array.isArray(parsed.disabled)) {
      data = { version: parsed.version ?? 1, disabled: parsed.disabled };
    }
  } catch {
    // arquivo ausente — usa default
  }
  return { root, data };
}

/**
 * Garante que `slug` esteja na lista de desabilitados (ou removido, se enabled=true).
 * Commit + push no repo do agente. Próximo deploy/tick aplica o estado.
 */
export async function setProjectDisabledInAgentRepo(args: {
  agent: string;
  githubRepo: string;
  slug: string;
  enabled: boolean;
}): Promise<{ sha: string; changed: boolean }> {
  const { agent, githubRepo, slug, enabled } = args;
  const { data } = await readCurrent(agent, githubRepo);

  const has = data.disabled.includes(slug);
  let next: string[];
  if (enabled) {
    if (!has) return { sha: 'noop', changed: false };
    next = data.disabled.filter((s) => s !== slug);
  } else {
    if (has) return { sha: 'noop', changed: false };
    next = [...data.disabled, slug];
  }

  const payload: DisabledFile = { version: 1, disabled: next };
  const content = JSON.stringify(payload, null, 2) + '\n';

  const result = await commitAndPush({
    agent,
    githubRepo,
    branch: DEFAULT_BRANCH,
    filePath: FILE_PATH,
    content,
    commitMessage: enabled
      ? `chore(disabled-projects): re-enable ${slug} via agentes-beeads console`
      : `chore(disabled-projects): disable ${slug} via agentes-beeads console`,
  });
  return { ...result, changed: true };
}

export async function getDisabledProjects(args: {
  agent: string;
  githubRepo: string;
}): Promise<string[]> {
  const { data } = await readCurrent(args.agent, args.githubRepo);
  return data.disabled;
}
