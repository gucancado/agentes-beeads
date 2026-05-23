'use server';

import { revalidatePath } from 'next/cache';
import { loadRegistry } from '@/lib/registry-server';
import { saveProjectMd } from '@/lib/project-md';

export async function saveBriefingAction(
  _prev: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const agent = String(formData.get('agent') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const content = String(formData.get('content') ?? '');

  if (!agent || !slug) return { ok: false, error: 'parâmetros inválidos' };

  const registry = loadRegistry();
  const found = registry.agents.find((a) => a.name === agent && a.enabled);
  if (!found) return { ok: false, error: 'agente não encontrado no registry' };

  try {
    await saveProjectMd({
      agent,
      githubRepo: found.repo,
      slug,
      content,
    });
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  revalidatePath(`/agentes/${agent}/projetos/${slug}`);
  return { ok: true };
}
