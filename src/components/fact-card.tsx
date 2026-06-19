import Link from 'next/link';
import { Badge } from '@beeads/ui';
import { confidenceLevel, fmtDate, FACT_TYPE_META, type FactRow } from '@/lib/memory-shape';

export function FactCard({
  fact,
  workspaceId,
  supersededBy,
  supersedes,
}: {
  fact: FactRow;
  workspaceId: string;
  supersededBy: FactRow | null;
  supersedes: FactRow[];
}) {
  const conf = confidenceLevel(fact.confidence);
  const turnQ =
    fact.turn_start != null
      ? `?turn=${fact.turn_start}-${fact.turn_end ?? fact.turn_start}`
      : '';
  return (
    <div
      className={`rounded-md border px-3 py-2.5 space-y-1.5 ${
        fact.needs_review ? 'border-rose-400 bg-rose-50/40' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm">{fact.statement}</p>
        <Badge variant="secondary" className="shrink-0">
          {FACT_TYPE_META[fact.fact_type].label}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-fg">
        <span>desde {fmtDate(fact.valid_at)}</span>
        {fact.invalid_at && <span>· valeu até {fmtDate(fact.invalid_at)}</span>}
        <span className={conf === 'baixa' ? 'text-rose-600 font-medium' : ''}>
          · confiança {conf}
        </span>
        {fact.needs_review && (
          <span className="text-rose-600 font-medium">· a revisar</span>
        )}
      </div>
      {fact.needs_review && fact.review_note && (
        <p className="text-xs text-rose-700">⚠ {fact.review_note}</p>
      )}
      {fact.attributes && Object.keys(fact.attributes).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(fact.attributes).map(([k, v]) => (
            <span
              key={k}
              className="text-[11px] rounded bg-muted px-1.5 py-0.5 text-muted-fg"
            >
              {k}: {String(v)}
            </span>
          ))}
        </div>
      )}
      {supersededBy && (
        <p className="text-xs text-muted-fg">→ sucedido pelo fato #{supersededBy.id}</p>
      )}
      {supersedes.length > 0 && (
        <p className="text-xs text-muted-fg">
          sucede {supersedes.map((s) => `#${s.id}`).join(', ')}
        </p>
      )}
      <Link
        href={`/memoria/${workspaceId}/episodio/${fact.episode_id}${turnQ}`}
        className="text-xs text-honey-deep hover:underline"
      >
        ver na reunião: {fact.episode_title} ({fmtDate(fact.episode_at)})
      </Link>
    </div>
  );
}
