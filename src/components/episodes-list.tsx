import Link from 'next/link';
import { Badge } from '@beeads/ui';
import { fmtDate, type EpisodeSummaryRow } from '@/lib/memory-shape';

export function EpisodesList({
  workspaceId,
  episodes,
}: {
  workspaceId: string;
  episodes: EpisodeSummaryRow[];
}) {
  if (episodes.length === 0)
    return <p className="text-sm text-muted-fg">Nenhuma reunião.</p>;
  return (
    <ul className="divide-y divide-border">
      {episodes.map((e) => (
        <li key={e.id}>
          <Link
            href={`/memoria/${workspaceId}/episodio/${e.id}`}
            className="flex items-center justify-between gap-4 px-1 py-2.5 hover:bg-honey/5"
          >
            <div className="min-w-0">
              <div className="text-sm truncate">{e.title}</div>
              <div className="text-xs text-muted-fg">
                {fmtDate(e.occurred_at)} · {e.turn_count} turnos
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span>{Number(e.facts_extraidos)} fatos</span>
              {e.processing_status && e.processing_status !== 'done' && (
                <Badge variant="secondary">{e.processing_status}</Badge>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
