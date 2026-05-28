'use server';

import { revalidatePath } from 'next/cache';
import { getAuthUser } from '@/lib/auth';
import {
  createProject,
  upsertGoal,
  disableGoal,
  createAgenda,
  updateAgenda,
  deactivateAgenda,
  WorkerAdminError,
  WorkerTimeoutError,
  WorkerUnreachableError,
  StaleWriteError,
} from '@/lib/worker-admin-client';
import { parseAgendaForm } from '@/lib/parse-agenda-form';

export type ActionResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: string; issues?: unknown; current?: unknown };

function revalidate(agent: string, slug: string) {
  revalidatePath(`/agentes/${agent}/projetos/${slug}`);
}

function safeJsonParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

function handleError(e: unknown): ActionResult {
  if (e instanceof StaleWriteError) {
    return { ok: false, error: 'stale_write', current: e.current };
  }
  if (e instanceof WorkerTimeoutError) {
    return { ok: false, error: 'worker_timeout' };
  }
  if (e instanceof WorkerUnreachableError) {
    return { ok: false, error: 'worker_unreachable' };
  }
  if (e instanceof WorkerAdminError) {
    if (e.status === 400) {
      const parsed = safeJsonParse(e.bodyMessage) as { issues?: unknown } | null;
      return { ok: false, error: 'validation_failed', issues: parsed?.issues };
    }
    return { ok: false, error: `worker_error_${e.status}` };
  }
  console.error('[scheduling-actions] unexpected error', e);
  return { ok: false, error: 'unexpected' };
}

async function actingUserEmail(): Promise<string | null> {
  const u = await getAuthUser();
  return u?.email ?? null;
}

// ── Ensure project exists (lazy upsert) ──────────────────────────────────

export async function ensureProjectAction(
  agent: string,
  slug: string,
  displayName: string
): Promise<ActionResult> {
  const user = await actingUserEmail();
  if (!user) return { ok: false, error: 'unauthorized' };
  try {
    await createProject({ agent, slug, display_name: displayName }, { actingUser: user });
    return { ok: true };
  } catch (e) {
    if (e instanceof WorkerAdminError && e.status === 409) {
      return { ok: true };
    }
    return handleError(e);
  }
}

// ── Goal scheduling ──────────────────────────────────────────────────────

export async function enableSchedulingAction(
  agent: string,
  slug: string
): Promise<ActionResult> {
  const user = await actingUserEmail();
  if (!user) return { ok: false, error: 'unauthorized' };
  try {
    await upsertGoal(
      agent,
      slug,
      { goal_type: 'scheduling', enabled: true, config: { selection_strategy: 'single' } },
      { actingUser: user }
    );
    revalidate(agent, slug);
    return { ok: true };
  } catch (e) {
    return handleError(e);
  }
}

export async function disableSchedulingAction(
  agent: string,
  slug: string,
  if_match_updated_at?: string
): Promise<ActionResult> {
  const user = await actingUserEmail();
  if (!user) return { ok: false, error: 'unauthorized' };
  try {
    await disableGoal(agent, slug, 'scheduling', if_match_updated_at, { actingUser: user });
    revalidate(agent, slug);
    return { ok: true };
  } catch (e) {
    return handleError(e);
  }
}

// ── Agendas ──────────────────────────────────────────────────────────────

export async function saveAgendaAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await actingUserEmail();
  if (!user) return { ok: false, error: 'unauthorized' };
  const agent = String(formData.get('agent'));
  const slug = String(formData.get('slug'));
  if (!agent || !slug) return { ok: false, error: 'invalid_form' };

  let parsed: ReturnType<typeof parseAgendaForm>;
  try {
    parsed = parseAgendaForm(formData);
  } catch (e) {
    return { ok: false, error: 'invalid_form' };
  }

  try {
    if (parsed.mode === 'create') {
      await createAgenda(agent, slug, parsed.body, { actingUser: user });
    } else {
      await updateAgenda(agent, slug, parsed.agendaId, parsed.body, { actingUser: user });
    }
    revalidate(agent, slug);
    return { ok: true };
  } catch (e) {
    return handleError(e);
  }
}

export async function deactivateAgendaAction(
  agent: string,
  slug: string,
  agendaId: number,
  if_match_updated_at?: string
): Promise<ActionResult> {
  const user = await actingUserEmail();
  if (!user) return { ok: false, error: 'unauthorized' };
  try {
    await deactivateAgenda(agent, slug, agendaId, if_match_updated_at, { actingUser: user });
    revalidate(agent, slug);
    return { ok: true };
  } catch (e) {
    return handleError(e);
  }
}
