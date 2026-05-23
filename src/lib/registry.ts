import yaml from 'js-yaml';
import { z } from 'zod';

const AgentSchema = z.object({
  name: z.string().min(1),
  repo: z.string().min(1),
  enabled: z.boolean().default(true),
});

const RegistrySchema = z.object({
  agents: z.array(AgentSchema).min(1),
});

export type Agent = z.infer<typeof AgentSchema>;
export type Registry = z.infer<typeof RegistrySchema>;

export function parseAgentsYaml(source: string): Registry {
  const raw = yaml.load(source);
  return RegistrySchema.parse(raw);
}

export function getEnabledAgents(registry: Registry): Agent[] {
  return registry.agents.filter((a) => a.enabled);
}
