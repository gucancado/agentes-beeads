import { z } from 'zod';

const WorkspaceSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
  evolution_instance: z.string(),
  whatsapp_number: z.string(),
  persona_name: z.string(),
});

const WorkspaceMapSchema = z.object({
  version: z.number(),
  comment: z.string().optional(),
  workspaces: z.array(WorkspaceSchema).min(1),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
export type WorkspaceMap = z.infer<typeof WorkspaceMapSchema>;

export function parseWorkspaceMap(source: string): WorkspaceMap {
  return WorkspaceMapSchema.parse(JSON.parse(source));
}

export function findProject(map: WorkspaceMap, slug: string): Workspace | null {
  return map.workspaces.find((w) => w.slug === slug) ?? null;
}
