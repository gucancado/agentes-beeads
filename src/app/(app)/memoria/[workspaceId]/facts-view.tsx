'use client';
import { useMemo, useState } from 'react';
import { Badge } from '@beeads/ui';
import {
  filterFacts,
  groupFactsByType,
  buildSupersedeRefs,
  FACT_TYPE_ORDER,
  FACT_TYPE_META,
  type FactRow,
  type FactType,
} from '@/lib/memory-shape';
import { FactCard } from '@/components/fact-card';

export function FactsView({
  facts,
  workspaceId,
}: {
  facts: FactRow[];
  workspaceId: string;
}) {
  const [types, setTypes] = useState<FactType[]>([]);
  const [vigencia, setVigencia] = useState<'vigentes' | 'supersedidos' | 'todos'>('vigentes');
  const [onlyNr, setOnlyNr] = useState(false);

  const refs = useMemo(() => buildSupersedeRefs(facts), [facts]);
  const shown = useMemo(
    () =>
      filterFacts(facts, {
        types: types.length ? types : null,
        vigencia,
        onlyNeedsReview: onlyNr,
      }),
    [facts, types, vigencia, onlyNr],
  );
  const groups = groupFactsByType(shown);

  const toggle = (t: FactType) =>
    setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <div className="space-y-4">
      {/* Filtro vigência + needs_review */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {(['vigentes', 'supersedidos', 'todos'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVigencia(v)}
            className={`rounded px-2 py-1 border ${
              vigencia === v ? 'bg-honey/15 border-honey-deep' : 'border-border'
            }`}
          >
            {v}
          </button>
        ))}
        <button
          onClick={() => setOnlyNr((p) => !p)}
          className={`rounded px-2 py-1 border ${
            onlyNr
              ? 'bg-rose-100 border-rose-400 text-rose-700'
              : 'border-border'
          }`}
        >
          só a revisar
        </button>
      </div>

      {/* Filtro por tipo */}
      <div className="flex flex-wrap gap-1.5">
        {FACT_TYPE_ORDER.map((t) => (
          <button
            key={t}
            onClick={() => toggle(t)}
            className={`text-xs rounded-full px-2 py-0.5 border ${
              types.includes(t)
                ? 'bg-honey/15 border-honey-deep'
                : 'border-border text-muted-fg'
            }`}
          >
            {FACT_TYPE_META[t].label}
          </button>
        ))}
      </div>

      {/* Resultados agrupados */}
      {groups.length === 0 ? (
        <p className="text-sm text-muted-fg">Nenhum fato com esses filtros.</p>
      ) : (
        groups.map((g) => (
          <section key={g.type} className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              {g.label}{' '}
              <Badge variant="secondary">{g.facts.length}</Badge>
            </h3>
            <div className="space-y-2">
              {g.facts.map((f) => {
                const r = refs.get(f.id)!;
                return (
                  <FactCard
                    key={f.id}
                    fact={f}
                    workspaceId={workspaceId}
                    supersededBy={r.supersededBy}
                    supersedes={r.supersedes}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
