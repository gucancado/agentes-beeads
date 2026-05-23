import 'server-only';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import simpleGit from 'simple-git';

const REPOS_ROOT = join(tmpdir(), 'agentes-beeads-repos');

const locks: Map<string, Promise<unknown>> = new Map();

async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => { release = r; });
  locks.set(key, prev.then(() => next));
  try {
    await prev;
    return await fn();
  } finally {
    release();
    if (locks.get(key) === next) locks.delete(key);
  }
}

function repoPath(agent: string): string {
  return join(REPOS_ROOT, agent);
}

function authedUrl(repo: string): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN não configurado');
  return `https://x-access-token:${token}@github.com/${repo}.git`;
}

async function exists(path: string): Promise<boolean> {
  try { await stat(path); return true; } catch { return false; }
}

export async function ensureRepo(args: {
  agent: string;
  githubRepo: string;
  branch: string;
}): Promise<string> {
  const { agent, githubRepo, branch } = args;
  return withLock(agent, async () => {
    await mkdir(REPOS_ROOT, { recursive: true });
    const path = repoPath(agent);
    if (!(await exists(join(path, '.git')))) {
      await simpleGit().clone(authedUrl(githubRepo), path, ['--depth', '1', '--branch', branch]);
      return path;
    }
    const git = simpleGit(path);
    await git.remote(['set-url', 'origin', authedUrl(githubRepo)]);
    await git.fetch('origin', branch, ['--depth', '1']);
    await git.reset(['--hard', `origin/${branch}`]);
    return path;
  });
}

export async function commitAndPush(args: {
  agent: string;
  githubRepo: string;
  branch: string;
  filePath: string;
  content: string;
  commitMessage?: string;
}): Promise<{ sha: string }> {
  const { agent, githubRepo, branch, filePath, content } = args;
  return withLock(agent, async () => {
    const root = repoPath(agent);
    if (!(await exists(join(root, '.git')))) {
      throw new Error(`Repo de ${agent} não está clonado; chame ensureRepo() antes.`);
    }
    const git = simpleGit(root);

    await git.remote(['set-url', 'origin', authedUrl(githubRepo)]);
    await git.fetch('origin', branch, ['--depth', '1']);
    await git.reset(['--hard', `origin/${branch}`]);

    const absPath = join(root, filePath);
    const dir = filePath.split('/').slice(0, -1).join('/');
    if (dir) await mkdir(join(root, dir), { recursive: true });
    await writeFile(absPath, content, 'utf8');

    await git.addConfig('user.email', 'console@agentes-beeads.beeads.com.br', false, 'local');
    await git.addConfig('user.name', 'agentes-beeads console', false, 'local');
    await git.add(filePath);

    const msg = args.commitMessage ?? `chore(${filePath}): edit via console`;
    const commit = await git.commit(msg, [filePath]);
    if (!commit.commit) {
      const head = await git.revparse(['HEAD']);
      return { sha: head.trim() };
    }
    await git.push('origin', branch);
    return { sha: commit.commit };
  });
}
