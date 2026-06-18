import Link from 'next/link';
import { Badge } from '@beeads/ui';
import { fmtDate, type MemoryIndexRow } from '@/lib/memory-shape';

export function MemoryIndexList({ items }: { items: { workspace_id: string; name: string; row: MemoryIndexRow }[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-fg px-4 py-8">Nenhum workspace com memória ainda.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {items.map(({ workspace_id, name, row }) => (
        <li key={workspace_id}>
          <Link href={`/memoria/${workspace_id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-honey/5">
            <div className="min-w-0">
              <div className="font-medium truncate">{name}</div>
              <div className="text-xs text-muted-fg">
                {row.eps_done}/{row.eps_total} reuniões · último em {fmtDate(row.ultimo_episodio)}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm shrink-0">
              <span title="fatos vigentes">{row.vigentes} vigentes</span>
              <span className="text-muted-fg" title="fatos supersedidos">{row.supersedidos} hist.</span>
              {Number(row.needs_review) > 0 && <Badge variant="destructive">{row.needs_review} a revisar</Badge>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
