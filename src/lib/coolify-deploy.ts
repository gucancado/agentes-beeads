import 'server-only';

/**
 * Dispara redeploy desta aplicação via Coolify API. Idempotente — se a
 * config estiver ausente (env vars não setadas), apenas no-op.
 */
export async function triggerSelfRedeploy(): Promise<{ ok: boolean; deploymentUuid?: string; error?: string }> {
  const url = process.env.COOLIFY_API_URL;
  const token = process.env.COOLIFY_API_TOKEN;
  const appUuid = process.env.COOLIFY_APP_UUID;
  if (!url || !token || !appUuid) {
    return { ok: false, error: 'coolify-redeploy: env vars não configuradas (COOLIFY_API_URL, COOLIFY_API_TOKEN, COOLIFY_APP_UUID)' };
  }
  try {
    const resp = await fetch(`${url.replace(/\/$/, '')}/deploy?uuid=${encodeURIComponent(appUuid)}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!resp.ok) {
      const body = await resp.text();
      return { ok: false, error: `coolify HTTP ${resp.status}: ${body.slice(0, 160)}` };
    }
    const json = await resp.json() as { deployments?: Array<{ deployment_uuid: string }> };
    return { ok: true, deploymentUuid: json.deployments?.[0]?.deployment_uuid };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
