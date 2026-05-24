import yaml from 'js-yaml';
import { z } from 'zod';

const ModelsSchema = z.object({
  classifier: z.string().min(1),
  responder_baixo: z.string().min(1),
  responder_medio: z.string().min(1),
  responder_alto: z.string().min(1),
});

const ProjectOverrideSchema = z.object({
  persona_name: z.string().optional(),
  whatsapp_number: z.string().optional(),
  evolution_instance: z.string().optional(),
  enabled: z.boolean().default(true),
});

const AgentSchema = z.object({
  name: z.string().min(1),
  repo: z.string().min(1),
  enabled: z.boolean().default(true),
  models: ModelsSchema.optional(),
  project_overrides: z.record(z.string(), ProjectOverrideSchema).optional(),
});

const RegistrySchema = z.object({
  agents: z.array(AgentSchema).min(1),
});

export type AgentModels = z.infer<typeof ModelsSchema>;
export type ProjectOverride = z.infer<typeof ProjectOverrideSchema>;
export type Agent = z.infer<typeof AgentSchema>;
export type Registry = z.infer<typeof RegistrySchema>;

export function parseAgentsYaml(source: string): Registry {
  const raw = yaml.load(source);
  return RegistrySchema.parse(raw);
}

export function getEnabledAgents(registry: Registry): Agent[] {
  return registry.agents.filter((a) => a.enabled);
}

/**
 * Mescla dados do workspace-map (vindos do repo do agente) com overrides
 * em agents.yml. Override prevalece quando presente.
 */
export function resolveProjectIdentity(
  agent: Agent,
  slug: string,
  baseline: { persona_name: string; whatsapp_number: string; evolution_instance: string } | null,
): { persona_name: string | null; whatsapp_number: string | null; evolution_instance: string | null } {
  const override = agent.project_overrides?.[slug];
  return {
    persona_name: override?.persona_name ?? baseline?.persona_name ?? null,
    whatsapp_number: override?.whatsapp_number ?? baseline?.whatsapp_number ?? null,
    evolution_instance: override?.evolution_instance ?? baseline?.evolution_instance ?? null,
  };
}

export function isProjectEnabled(agent: Agent, slug: string): boolean {
  return agent.project_overrides?.[slug]?.enabled ?? true;
}
