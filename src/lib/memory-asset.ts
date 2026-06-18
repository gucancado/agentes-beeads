// Lógica pura de resolução de asset (presign proxy GUI → worker).
// Separada do route handler para ser testável sem contexto Next.js.

export async function resolveAssetRedirect(args: {
  user: { userId: string } | null;
  episodeId: string;
  kind: string | null;
  fetchImpl?: typeof fetch;
}): Promise<{ status: number; location?: string; error?: string }> {
  // Autenticação: user ausente → 401
  if (!args.user) return { status: 401, error: 'não autenticado' };

  // Validação: episodeId deve ser numérico
  if (!/^\d+$/.test(args.episodeId)) return { status: 400, error: 'id inválido' };

  // Validação: kind deve ser raw ou audio
  if (args.kind !== 'raw' && args.kind !== 'audio')
    return { status: 400, error: 'kind deve ser raw|audio' };

  // Configuração de ambiente
  const base = process.env.WORKER_URL;
  const token = process.env.WORKER_OWNER_ADMIN_TOKEN;
  if (!base || !token) return { status: 500, error: 'worker não configurado' };

  const f = args.fetchImpl ?? fetch;

  // Chama o worker com redirect manual para capturar o 302
  const res = await f(
    `${base}/episodes/${args.episodeId}/asset?kind=${args.kind}`,
    {
      method: 'GET',
      redirect: 'manual',
      headers: { 'X-Owner-Token': token },
    }
  );

  // Propaga 302 com Location header
  if (res.status === 302) {
    const loc = res.headers.get('location');
    if (loc) return { status: 302, location: loc };
  }

  // Arquivo não encontrado no worker
  if (res.status === 404) return { status: 404, error: 'arquivo não encontrado' };

  // Qualquer outro status → gateway error
  return { status: 502, error: 'falha ao obter arquivo' };
}
