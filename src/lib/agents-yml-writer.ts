import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { ensureRepo, commitAndPush } from './git';
import type { AgentModels, ProjectOverride } from './registry';

const CONSOLE_REPO = 'gucancado/agentes-beeads';
const CONSOLE_BRANCH = 'main';
const CONSOLE_AGENT_KEY = '_console';

type RawAgents = {
  agents: Array<{
    name: string;
    repo: string;
    enabled?: boolean;
    models?: AgentModels;
    project_overrides?: Record<string, Partial<ProjectOverride>>;
  }>;
};

async function loadAgentsYaml(): Promise<{ root: string; parsed: RawAgents }> {
  const root = await ensureRepo({
    agent: CONSOLE_AGENT_KEY,
    githubRepo: CONSOLE_REPO,
    branch: CONSOLE_BRANCH,
  });
  const source = await readFile(join(root, 'agents.yml'), 'utf8');
  const parsed = yaml.load(source) as RawAgents;
  return { root, parsed };
}

function dumpAndCommit(parsed: RawAgents, message: string) {
  const newSource = yaml.dump(parsed, {
    indent: 2,
    lineWidth: 100,
    noRefs: true,
    quotingType: '"',
  });
  return commitAndPush({
    agent: CONSOLE_AGENT_KEY,
    githubRepo: CONSOLE_REPO,
    branch: CONSOLE_BRANCH,
    filePath: 'agents.yml',
    content: newSource,
    commitMessage: message,
  });
}

export async function updateAgentModelsInYaml(args: {
  agentName: string;
  models: AgentModels;
}): Promise<{ sha: string }> {
  const { parsed } = await loadAgentsYaml();
  const agent = parsed.agents.find((a) => a.name === args.agentName);
  if (!agent) throw new Error(`agente '${args.agentName}' não encontrado em agents.yml`);
  agent.models = args.models;
  return dumpAndCommit(parsed, `chore(agents.yml): update models for ${args.agentName} via console`);
}

/**
 * Faz merge de um project_override (apenas campos passados) e commita.
 */
export async function patchProjectOverrideInYaml(args: {
  agentName: string;
  slug: string;
  patch: Partial<ProjectOverride>;
  commitMessage: string;
}): Promise<{ sha: string }> {
  const { parsed } = await loadAgentsYaml();
  const agent = parsed.agents.find((a) => a.name === args.agentName);
  if (!agent) throw new Error(`agente '${args.agentName}' não encontrado em agents.yml`);
  agent.project_overrides = agent.project_overrides ?? {};
  agent.project_overrides[args.slug] = { ...(agent.project_overrides[args.slug] ?? {}), ...args.patch };
  return dumpAndCommit(parsed, args.commitMessage);
}
