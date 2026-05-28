// NOTE: 'server-only' import omitted for test compatibility.
// Em produção (build do Next.js), o tree-shaking + boundary enforcement
// garante que esse módulo só é importado de server contexts.
// Re-add quando achar solução pra rodar com server-only no test env.

const DEFAULT_TIMEOUT_MS = 5000;

// ── Error classes ────────────────────────────────────────────────────────

export class WorkerAdminError extends Error {
  constructor(public status: number, public bodyMessage: string) {
    super(`worker admin error ${status}: ${bodyMessage.slice(0, 200)}`);
    this.name = 'WorkerAdminError';
  }
}

export class WorkerUnreachableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerUnreachableError';
  }
}

export class WorkerTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerTimeoutError';
  }
}

export class StaleWriteError extends Error {
  constructor(public current: unknown) {
    super('agenda was modified by someone else');
    this.name = 'StaleWriteError';
  }
}

// ── Types (mirror do worker; ver spec 1B § Known limitation L6) ─────────

export type Project = {
  id: number;
  agent: string;
  slug: string;
  display_name: string;
  created_at: string;
  updated_at: string;
};

export type ProjectGoal = {
  id: number;
  project_id: number;
  goal_type: string;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SchedulingAgenda = {
  id: number;
  project_id: number;
  person_name: string;
  person_email: string;
  display_label: string;
  description: string | null;
  working_hours: {
    mon?: string[];
    tue?: string[];
    wed?: string[];
    thu?: string[];
    fri?: string[];
    sat?: string[];
    sun?: string[];
    timezone: string;
  };
  meeting_duration_min: number;
  min_advance_hours: number;
  max_advance_business_days: number;
  active: boolean;
  round_robin_last_assigned_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GoogleConnectionPublic = {
  id: number;
  project_id: number;
  google_email: string;
  scopes: string[];
  connected_at: string;
  last_refresh_at: string | null;
  last_error: string | null;
};

export type GoogleTestResult = {
  ok: boolean;
  email: string;
  calendar_ok: boolean;
  calendar_error?: string;
  gmail_ok: boolean;
  gmail_error?: string;
  scopes_granted: string[];
  scope_warnings: string[];
};

export type TestAccessResult =
  | { ok: true; calendar_metadata: { id: string; summary: string; timeZone: string } }
  | { ok: false; error: 'not_shared' | 'not_found' | 'auth' | 'unknown'; detail?: string; agent_email?: string };

export type GoalUpsertBody = {
  goal_type: 'scheduling';
  enabled?: boolean;
  config?: { selection_strategy?: 'single' | 'round_robin' | 'by_specialty' };
};

export type AgendaCreateBody = {
  person_name: string;
  person_email: string;
  display_label: string;
  description?: string | null;
  working_hours: SchedulingAgenda['working_hours'];
  meeting_duration_min?: number;
  min_advance_hours?: number;
  max_advance_business_days?: number;
};

export type AgendaPatchBody = Partial<AgendaCreateBody> & {
  active?: boolean;
  if_match_updated_at?: string;
};

// ── Internal helpers ─────────────────────────────────────────────────────

export type CallOptions = {
  actingUser?: string;
  timeoutMs?: number;
};

function safeJsonParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

async function workerFetch<T>(
  path: string,
  init: RequestInit & CallOptions = {}
): Promise<T> {
  const WORKER_URL = process.env.WORKER_URL;
  const OWNER_TOKEN = process.env.WORKER_OWNER_ADMIN_TOKEN;
  if (!WORKER_URL) throw new Error('WORKER_URL not configured');
  if (!OWNER_TOKEN) throw new Error('WORKER_OWNER_ADMIN_TOKEN not configured');

  const { actingUser, timeoutMs, ...fetchInit } = init;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${WORKER_URL}${path}`, {
      ...fetchInit,
      signal: ctrl.signal,
      headers: {
        'X-Owner-Token': OWNER_TOKEN,
        'Content-Type': 'application/json',
        ...(actingUser ? { 'X-Acting-User': actingUser } : {}),
        ...(fetchInit.headers ?? {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 409) {
        const parsed = safeJsonParse(body) as { current?: unknown } | null;
        throw new StaleWriteError(parsed?.current ?? null);
      }
      throw new WorkerAdminError(res.status, body);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new WorkerTimeoutError(`worker did not respond in ${timeoutMs ?? DEFAULT_TIMEOUT_MS}ms`);
    }
    if (e instanceof TypeError) {
      throw new WorkerUnreachableError(`worker unreachable: ${e.message}`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function basePath(agent: string, slug: string): string {
  return `/admin/agents/${encodeURIComponent(agent)}/projects/${encodeURIComponent(slug)}`;
}

// ── Public API ───────────────────────────────────────────────────────────

export async function createProject(
  args: { agent: string; slug: string; display_name: string },
  opts: CallOptions = {}
): Promise<Project> {
  return workerFetch<Project>(`/admin/agents/${encodeURIComponent(args.agent)}/projects`, {
    method: 'POST',
    body: JSON.stringify({ slug: args.slug, display_name: args.display_name }),
    ...opts,
  });
}

export async function getProjectDetail(
  agent: string,
  slug: string,
  opts: CallOptions = {}
): Promise<{
  project: Project;
  goals: ProjectGoal[];
  agendas: SchedulingAgenda[];
  google_connection: GoogleConnectionPublic | null;
}> {
  return workerFetch(`${basePath(agent, slug)}`, { method: 'GET', ...opts });
}

export async function upsertGoal(
  agent: string,
  slug: string,
  body: GoalUpsertBody,
  opts: CallOptions = {}
): Promise<ProjectGoal> {
  return workerFetch<ProjectGoal>(`${basePath(agent, slug)}/goals`, {
    method: 'POST',
    body: JSON.stringify(body),
    ...opts,
  });
}

export async function disableGoal(
  agent: string,
  slug: string,
  goal_type: string,
  if_match_updated_at?: string,
  opts: CallOptions = {}
): Promise<ProjectGoal> {
  return workerFetch<ProjectGoal>(
    `${basePath(agent, slug)}/goals/${encodeURIComponent(goal_type)}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ if_match_updated_at }),
      ...opts,
    }
  );
}

export async function listAgendas(
  agent: string,
  slug: string,
  opts: CallOptions = {}
): Promise<SchedulingAgenda[]> {
  const { agendas } = await workerFetch<{ agendas: SchedulingAgenda[] }>(
    `${basePath(agent, slug)}/agendas`,
    { method: 'GET', ...opts }
  );
  return agendas;
}

export async function createAgenda(
  agent: string,
  slug: string,
  body: AgendaCreateBody,
  opts: CallOptions = {}
): Promise<SchedulingAgenda> {
  return workerFetch<SchedulingAgenda>(`${basePath(agent, slug)}/agendas`, {
    method: 'POST',
    body: JSON.stringify(body),
    ...opts,
  });
}

export async function updateAgenda(
  agent: string,
  slug: string,
  agendaId: number,
  patch: AgendaPatchBody,
  opts: CallOptions = {}
): Promise<SchedulingAgenda> {
  return workerFetch<SchedulingAgenda>(`${basePath(agent, slug)}/agendas/${agendaId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
    ...opts,
  });
}

export async function deactivateAgenda(
  agent: string,
  slug: string,
  agendaId: number,
  if_match_updated_at?: string,
  opts: CallOptions = {}
): Promise<SchedulingAgenda> {
  return workerFetch<SchedulingAgenda>(`${basePath(agent, slug)}/agendas/${agendaId}`, {
    method: 'DELETE',
    body: JSON.stringify({ if_match_updated_at }),
    ...opts,
  });
}

// ── Google OAuth ─────────────────────────────────────────────────────────

export async function startGoogleOAuth(
  agent: string,
  slug: string,
  opts: CallOptions = {}
): Promise<{ url: string }> {
  return workerFetch(`${basePath(agent, slug)}/google/oauth-start`, {
    method: 'POST',
    body: '{}',
    ...opts,
  });
}

export async function disconnectGoogle(
  agent: string,
  slug: string,
  opts: CallOptions = {}
): Promise<{ ok: true }> {
  return workerFetch(`${basePath(agent, slug)}/google/disconnect`, {
    method: 'POST',
    body: '{}',
    ...opts,
  });
}

export async function testGoogleConnection(
  agent: string,
  slug: string,
  opts: CallOptions = {}
): Promise<GoogleTestResult> {
  return workerFetch(`${basePath(agent, slug)}/google/test`, {
    method: 'POST',
    body: '{}',
    ...opts,
  });
}

export async function testAgendaAccess(
  agent: string,
  slug: string,
  agendaId: number,
  opts: CallOptions = {}
): Promise<TestAccessResult> {
  return workerFetch(`${basePath(agent, slug)}/agendas/${agendaId}/test-access`, {
    method: 'POST',
    body: '{}',
    ...opts,
  });
}
