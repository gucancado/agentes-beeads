'use server';

import { revalidatePath } from 'next/cache';
import { loadRegistry, invalidateRegistry } from '@/lib/registry-server';
import { saveProjectMd } from '@/lib/project-md';
import { saveAgentProjectConfig } from '@/lib/agent-project-config';
import { setProjectDisabledInAgentRepo } from '@/lib/disabled-projects';
import { patchProjectOverrideInYaml } from '@/lib/agents-yml-writer';
import { triggerSelfRedeploy } from '@/lib/coolify-deploy';
import {
  connectInstance,
  fetchInstanceInfo,
  getConnectionState,
  logoutInstance,
} from '@/lib/evolution-client';

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

export async function saveQuietHoursAction(
  _prev: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const agent = String(formData.get('agent') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const enabled = formData.get('enabled') === 'on';
  const startRaw = String(formData.get('start') ?? '').trim();
  const endRaw = String(formData.get('end') ?? '').trim();

  if (!agent || !slug) return { ok: false, error: 'parâmetros inválidos' };

  const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!timePattern.test(startRaw) || !timePattern.test(endRaw)) {
    return { ok: false, error: 'horários devem ser HH:MM' };
  }
  const start = startRaw.length === 5 ? `${startRaw}:00` : startRaw;
  const end = endRaw.length === 5 ? `${endRaw}:00` : endRaw;

  try {
    await saveAgentProjectConfig({
      agent,
      project: slug,
      quiet_hours_enabled: enabled,
      quiet_start: start,
      quiet_end: end,
    });
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  revalidatePath(`/agentes/${agent}/projetos/${slug}`);
  return { ok: true };
}

// ── Evolution / QR ──────────────────────────────────────────────────────

export async function instanceStatusAction(_prev: unknown, formData: FormData) {
  const instance = String(formData.get('instance') ?? '');
  if (!instance) return { ok: false as const, error: 'instance ausente' };
  try {
    const info = await fetchInstanceInfo(instance);
    return { ok: true as const, info };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

export async function requestQrAction(_prev: unknown, formData: FormData) {
  const instance = String(formData.get('instance') ?? '');
  if (!instance) return { ok: false as const, error: 'instance ausente' };
  try {
    const r = await connectInstance(instance);
    return { ok: true as const, qrBase64: r.qrBase64, pairingCode: r.pairingCode, state: r.state };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

export async function logoutInstanceAction(_prev: unknown, formData: FormData) {
  const instance = String(formData.get('instance') ?? '');
  if (!instance) return { ok: false as const, error: 'instance ausente' };
  try {
    await logoutInstance(instance);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

/**
 * Confirma número conectado, persiste em agents.yml (project_overrides.whatsapp_number)
 * e dispara redeploy. Use após reconectar com sucesso pra registrar o número novo.
 */
export async function persistConnectedNumberAction(
  _prev: { ok: boolean; error?: string; number?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; number?: string }> {
  const agent = String(formData.get('agent') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const instance = String(formData.get('instance') ?? '');
  if (!agent || !slug || !instance) return { ok: false, error: 'parâmetros inválidos' };

  try {
    const state = await getConnectionState(instance);
    if (state !== 'open') return { ok: false, error: `instância ainda não conectada (state=${state})` };
    const info = await fetchInstanceInfo(instance);
    if (!info?.ownerNumber) return { ok: false, error: 'não foi possível ler o número conectado' };
    await patchProjectOverrideInYaml({
      agentName: agent,
      slug,
      patch: { whatsapp_number: info.ownerNumber },
      commitMessage: `chore(agents.yml): update whatsapp_number=${info.ownerNumber} for ${agent}/${slug} via console`,
    });
    await triggerSelfRedeploy();
    invalidateRegistry();
    revalidatePath(`/agentes/${agent}/projetos/${slug}`);
    return { ok: true, number: info.ownerNumber };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function toggleProjectEnabledAction(
  _prev: { ok: boolean; error?: string; enabled?: boolean } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; enabled?: boolean }> {
  const agent = String(formData.get('agent') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const targetEnabled = formData.get('enabled') === 'true';

  if (!agent || !slug) return { ok: false, error: 'parâmetros inválidos' };

  const registry = loadRegistry();
  const found = registry.agents.find((a) => a.name === agent && a.enabled);
  if (!found) return { ok: false, error: 'agente não encontrado no registry' };

  try {
    await setProjectDisabledInAgentRepo({
      agent,
      githubRepo: found.repo,
      slug,
      enabled: targetEnabled,
    });
    await patchProjectOverrideInYaml({
      agentName: agent,
      slug,
      patch: { enabled: targetEnabled },
      commitMessage: `chore(agents.yml): ${targetEnabled ? 'enable' : 'disable'} ${agent}/${slug} via console`,
    });
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  await triggerSelfRedeploy();
  invalidateRegistry();
  revalidatePath(`/agentes/${agent}/projetos/${slug}`);
  return { ok: true, enabled: targetEnabled };
}
