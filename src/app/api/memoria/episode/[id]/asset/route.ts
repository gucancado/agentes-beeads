import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { resolveAssetRedirect } from '@/lib/memory-asset';

// GET /api/memoria/episode/[id]/asset?kind=raw|audio
// Autentica o usuário, delega ao worker (owner-token) e propaga o 302 presigned.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kind = new URL(req.url).searchParams.get('kind');
  const user = await getAuthUser();
  const r = await resolveAssetRedirect({ user, episodeId: id, kind });
  if (r.status === 302 && r.location) return NextResponse.redirect(r.location, 302);
  return NextResponse.json({ error: r.error }, { status: r.status });
}
