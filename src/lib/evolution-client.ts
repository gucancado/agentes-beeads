import 'server-only';

function baseUrl(): string {
  const v = process.env.EVOLUTION_API_URL;
  if (!v) throw new Error('EVOLUTION_API_URL não configurada');
  return v.replace(/\/$/, '');
}

function apiKey(): string {
  const v = process.env.EVOLUTION_API_KEY;
  if (!v) throw new Error('EVOLUTION_API_KEY não configurada');
  return v;
}

async function req(path: string, init?: RequestInit): Promise<unknown> {
  const resp = await fetch(`${baseUrl()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'apikey': apiKey(),
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await resp.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch {}
  if (!resp.ok) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body);
    throw new Error(`evolution HTTP ${resp.status}: ${detail.slice(0, 220)}`);
  }
  return body;
}

export type InstanceState =
  | 'open'           // conectado e funcionando
  | 'connecting'     // QR gerado / aguardando scan
  | 'close'          // desconectado
  | 'unknown';

type ConnectionStateResp = {
  instance?: {
    instanceName?: string;
    state?: string;
  };
};

export async function getConnectionState(instance: string): Promise<InstanceState> {
  try {
    const r = await req(`/instance/connectionState/${encodeURIComponent(instance)}`) as ConnectionStateResp;
    const s = r?.instance?.state;
    if (s === 'open' || s === 'connecting' || s === 'close') return s;
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

type FetchInstancesResp = Array<{
  instance?: {
    instanceName?: string;
    owner?: string;
    profileName?: string;
    state?: string;
  };
}> | { instances?: Array<unknown> };

export type InstanceInfo = {
  name: string | null;
  owner: string | null;          // owner jid: "5531977786735@s.whatsapp.net"
  ownerNumber: string | null;    // E.164: "+5531977786735"
  profileName: string | null;
  state: InstanceState;
};

function ownerToE164(jid: string | null): string | null {
  if (!jid) return null;
  const num = jid.split('@')[0];
  if (!num) return null;
  return `+${num}`;
}

export async function fetchInstanceInfo(instance: string): Promise<InstanceInfo | null> {
  try {
    const r = await req(`/instance/fetchInstances?instanceName=${encodeURIComponent(instance)}`) as FetchInstancesResp;
    const list = Array.isArray(r) ? r : (r.instances ?? []) as Array<{ instance?: Record<string, unknown> }>;
    const first = list[0] as { instance?: { instanceName?: string; owner?: string; profileName?: string; state?: string } } | undefined;
    if (!first?.instance) return null;
    const inst = first.instance;
    const s = inst.state;
    const state: InstanceState = s === 'open' || s === 'connecting' || s === 'close' ? s : 'unknown';
    return {
      name: inst.instanceName ?? null,
      owner: inst.owner ?? null,
      ownerNumber: ownerToE164(inst.owner ?? null),
      profileName: inst.profileName ?? null,
      state,
    };
  } catch {
    return null;
  }
}

type ConnectResp = {
  pairingCode?: string | null;
  code?: string;          // string que vira o QR
  base64?: string;        // QR base64 PNG já pronto
  count?: number;
};

/**
 * Pede QR/connect. Se já está conectado, devolve estado open sem QR.
 */
export async function connectInstance(instance: string): Promise<{ qrBase64: string | null; pairingCode: string | null; state: InstanceState }> {
  const r = await req(`/instance/connect/${encodeURIComponent(instance)}`) as ConnectResp & ConnectionStateResp;
  const state = (r?.instance?.state as InstanceState) ?? (await getConnectionState(instance));
  const qrBase64 = r.base64 ?? null;
  const pairingCode = r.pairingCode ?? null;
  return { qrBase64, pairingCode, state };
}

export async function logoutInstance(instance: string): Promise<void> {
  await req(`/instance/logout/${encodeURIComponent(instance)}`, { method: 'DELETE' });
}

export async function restartInstance(instance: string): Promise<void> {
  await req(`/instance/restart/${encodeURIComponent(instance)}`, { method: 'POST' });
}
