import 'server-only';
import { cache } from 'react';

const BLOQUIM_BASE =
  process.env.BLOQUIM_API_URL ?? 'https://bloquim.beeads.com.br/api';

const BLOQUIM_ORIGIN = BLOQUIM_BASE.replace(/\/api\/?$/, '');

export interface MeWorkspace {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  hidden: boolean;
}

export interface MeAgent {
  agentName: string;
  projectSlug: string;
  workspaceId: string;
  workspaceName: string;
}

export interface PublicWorkspace {
  id: string;
  name: string;
  hidden: boolean;
}

async function bloquimGet<T>(path: string, cookie: string): Promise<T> {
  const url = `${BLOQUIM_BASE}${path}`;
  const r = await fetch(url, {
    headers: { Cookie: cookie, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (r.status === 401) throw new Error('UNAUTHENTICATED');
  if (!r.ok) throw new Error(`Bloquim API ${path} returned ${r.status}`);
  return r.json() as Promise<T>;
}

export async function meWorkspaces(cookie: string): Promise<MeWorkspace[]> {
  return bloquimGet<MeWorkspace[]>('/auth/me/workspaces', cookie);
}

export async function meAgents(cookie: string): Promise<MeAgent[]> {
  return bloquimGet<MeAgent[]>('/auth/me/agents', cookie);
}

export async function publicWorkspaces(
  ids: string[],
  cookie: string,
): Promise<PublicWorkspace[]> {
  if (ids.length === 0) return [];
  const idsParam = ids.join(',');
  return bloquimGet<PublicWorkspace[]>(`/public/workspaces?ids=${idsParam}`, cookie);
}

export interface BloquimProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export const meProfile = cache(
  async (cookie: string): Promise<BloquimProfile | null> => {
    try {
      const profile = await bloquimGet<BloquimProfile>('/auth/me', cookie);
      if (profile.avatarUrl && profile.avatarUrl.startsWith('/')) {
        profile.avatarUrl = `${BLOQUIM_ORIGIN}${profile.avatarUrl}`;
      }
      return profile;
    } catch {
      return null;
    }
  },
);
