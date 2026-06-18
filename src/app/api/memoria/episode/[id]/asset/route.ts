import { NextResponse } from 'next/server';
import { getAuthUser, getRawCookieHeader } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { canAccessEpisode } from '@/lib/memory-service';
import { resolveAssetRedirect } from '@/lib/memory-asset';

// GET /api/memoria/episode/[id]/asset?kind=raw|audio
// Autentica o usuário, verifica membership no workspace do episódio,
// delega ao worker (owner-token) e propaga o 302 presigned.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kind = new URL(req.url).searchParams.get('kind');
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'não autenticado' }, { status: 401 });
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  const cookie = await getRawCookieHeader();
  if (!(await canAccessEpisode(getPool(), cookie, Number(id)))) {
    return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  }
  const r = await resolveAssetRedirect({ user, episodeId: id, kind });
  if (r.status === 302 && r.location) return NextResponse.redirect(r.location, 302);
  return NextResponse.json({ error: r.error }, { status: r.status });
}
