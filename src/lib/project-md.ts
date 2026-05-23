import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ensureRepo, commitAndPush } from './git';
import { parseWorkspaceMap, findProject, type Workspace } from './workspace-map';

const DEFAULT_BRANCH = 'master';

function projectMdPath(slug: string): string {
  return `projetos/${slug}/PROJECT.md`;
}

function workspaceMapPath(): string {
  return `_platform/workspace-map.json`;
}

export async function loadProjectFromAgentRepo(args: {
  agent: string;
  githubRepo: string;
  slug: string;
}): Promise<{ workspace: Workspace | null; projectMd: string | null }> {
  const { agent, githubRepo, slug } = args;
  const repoRoot = await ensureRepo({ agent, githubRepo, branch: DEFAULT_BRANCH });

  let workspace: Workspace | null = null;
  try {
    const raw = await readFile(join(repoRoot, workspaceMapPath()), 'utf8');
    const map = parseWorkspaceMap(raw);
    workspace = findProject(map, slug);
  } catch {
    workspace = null;
  }

  let projectMd: string | null = null;
  try {
    projectMd = await readFile(join(repoRoot, projectMdPath(slug)), 'utf8');
  } catch {
    projectMd = null;
  }

  return { workspace, projectMd };
}

export async function saveProjectMd(args: {
  agent: string;
  githubRepo: string;
  slug: string;
  content: string;
}): Promise<{ sha: string }> {
  if (!args.content.trim()) throw new Error('PROJECT.md vazio não é permitido');
  if (args.content.length > 100_000) throw new Error('PROJECT.md acima de 100 KB não é permitido');

  return commitAndPush({
    agent: args.agent,
    githubRepo: args.githubRepo,
    branch: DEFAULT_BRANCH,
    filePath: projectMdPath(args.slug),
    content: args.content,
    commitMessage: `docs(projetos/${args.slug}/PROJECT.md): edit via agentes-beeads console`,
  });
}
