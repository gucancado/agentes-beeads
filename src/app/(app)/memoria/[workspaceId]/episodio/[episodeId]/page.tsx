import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPool } from '@/lib/db';
import { getAuthUser, getRawCookieHeader } from '@/lib/auth';
import { assembleEpisode } from '@/lib/memory-service';
import { fmtDate } from '@/lib/memory-shape';
import { SectionCard } from '@/components/section-card';
import { TranscriptView } from './transcript-view';

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ workspaceId: string; episodeId: string }>;
}) {
  const { workspaceId, episodeId } = await params;
  if (!/^\d+$/.test(episodeId)) notFound();
  const user = await getAuthUser();
  if (!user) return null; // layout já protege; guarda defensiva
  const cookie = await getRawCookieHeader();
  const data = await assembleEpisode(getPool(), cookie, Number(episodeId));
  if (!data || data.workspaceId !== workspaceId) notFound();
  const m = data.meta;

  return (
    <div className="space-y-4 p-4">
      <header className="space-y-1">
        <Link
          href={`/memoria/${workspaceId}`}
          className="text-xs text-honey-deep hover:underline"
        >
          ← {data.name}
        </Link>
        <h1 className="text-lg font-semibold">{m.title}</h1>
        <p className="text-sm text-muted-fg">
          {fmtDate(m.occurred_at)} · {m.turn_count} turnos · {Number(m.facts_extraidos)} fatos
        </p>
        <div className="flex gap-3 text-xs">
          {m.tem_raw && (
            <a
              className="text-honey-deep hover:underline"
              href={`/api/memoria/episode/${m.id}/asset?kind=raw`}
            >
              baixar transcrição (.json)
            </a>
          )}
          {m.tem_audio && (
            <a
              className="text-honey-deep hover:underline"
              href={`/api/memoria/episode/${m.id}/asset?kind=audio`}
            >
              baixar áudio
            </a>
          )}
        </div>
      </header>
      <SectionCard title="Transcrição">
        <TranscriptView turns={data.turns} />
      </SectionCard>
    </div>
  );
}
