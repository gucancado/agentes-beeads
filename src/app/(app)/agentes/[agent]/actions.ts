'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { loadRegistry, invalidateRegistry } from '@/lib/registry-server';
import { updateAgentModelsInYaml } from '@/lib/agents-yml-writer';
import { findModel } from '@/lib/models-catalog';
import { triggerSelfRedeploy } from '@/lib/coolify-deploy';

const modelsInput = z.object({
  agent: z.string().min(1),
  classifier: z.string().min(1),
  responder_baixo: z.string().min(1),
  responder_medio: z.string().min(1),
  responder_alto: z.string().min(1),
});

export async function updateAgentModelsAction(
  _prev: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = modelsInput.safeParse({
    agent: formData.get('agent'),
    classifier: formData.get('classifier'),
    responder_baixo: formData.get('responder_baixo'),
    responder_medio: formData.get('responder_medio'),
    responder_alto: formData.get('responder_alto'),
  });
  if (!parsed.success) return { ok: false, error: 'parâmetros inválidos' };
  const { agent, ...models } = parsed.data;

  for (const m of Object.values(models)) {
    if (!findModel(m)) return { ok: false, error: `modelo desconhecido: ${m}` };
  }

  const registry = loadRegistry();
  const found = registry.agents.find((a) => a.name === agent && a.enabled);
  if (!found) return { ok: false, error: 'agente não encontrado' };

  try {
    await updateAgentModelsInYaml({ agentName: agent, models });
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  // Dispara redeploy via Coolify API — não dependemos do webhook do GitHub
  // (que às vezes não fired pra commits 'chore:' dependendo da config).
  const redeploy = await triggerSelfRedeploy();

  invalidateRegistry();
  revalidatePath(`/agentes/${agent}`);
  revalidatePath(`/agentes/${agent}/projetos/[slug]`, 'page');
  return {
    ok: true,
    error: redeploy.ok ? undefined : `commit ok, mas redeploy falhou: ${redeploy.error}`,
  };
}
