import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type FactType =
  | 'decisao' | 'compromisso' | 'contexto' | 'objetivo' | 'papel'
  | 'marco' | 'restricao' | 'oportunidade' | 'ameaca' | 'preferencia';

export interface FactRow {
  id: number; fact_type: FactType; statement: string;
  attributes: Record<string, unknown> | null; confidence: number;
  valid_at: string; invalid_at: string | null; invalidation_reason: string | null;
  superseded_by_fact_id: number | null; needs_review: boolean; review_note: string | null;
  episode_id: number; episode_revision: number; turn_start: number | null; turn_end: number | null;
  episode_title: string; episode_at: string;
}
export interface MemoryIndexRow {
  workspace_id: string; eps_done: number; eps_total: number; facts_total: number;
  vigentes: number; supersedidos: number; needs_review: number; ultimo_episodio: string | null;
}
export interface EpisodeSummaryRow {
  id: number; title: string; occurred_at: string; duration_seconds: number | null;
  turn_count: number; participants: Array<{ name?: string; email?: string }> | null;
  fonte: string; attribution_method: string; tem_raw: boolean; tem_audio: boolean;
  processing_status: string | null; facts_extraidos: number;
}
export interface TurnRow {
  turn_index: number; speaker_name: string | null; speaker_label: string | null;
  text: string; started_at_ms: number | null; ended_at_ms: number | null;
}

export const FACT_TYPE_ORDER: FactType[] = [
  'decisao', 'compromisso', 'contexto', 'objetivo', 'papel',
  'marco', 'restricao', 'oportunidade', 'ameaca', 'preferencia',
];
// tone = chave semântica de cor; mapeada pra classe Tailwind/token no componente.
export const FACT_TYPE_META: Record<FactType, { label: string; tone: string }> = {
  decisao: { label: 'Decisão', tone: 'honey' },
  compromisso: { label: 'Compromisso', tone: 'sky' },
  contexto: { label: 'Contexto', tone: 'slate' },
  objetivo: { label: 'Objetivo', tone: 'violet' },
  papel: { label: 'Papel', tone: 'teal' },
  marco: { label: 'Marco', tone: 'amber' },
  restricao: { label: 'Restrição', tone: 'rose' },
  oportunidade: { label: 'Oportunidade', tone: 'green' },
  ameaca: { label: 'Ameaça', tone: 'red' },
  preferencia: { label: 'Preferência', tone: 'indigo' },
};

export function groupFactsByType(facts: FactRow[]) {
  return FACT_TYPE_ORDER
    .map((type) => ({
      type, label: FACT_TYPE_META[type].label, tone: FACT_TYPE_META[type].tone,
      facts: facts.filter((f) => f.fact_type === type),
    }))
    .filter((g) => g.facts.length > 0);
}

export function buildSupersedeRefs(facts: FactRow[]) {
  const byId = new Map(facts.map((f) => [f.id, f]));
  const refs = new Map<number, { supersededBy: FactRow | null; supersedes: FactRow[] }>();
  for (const f of facts) refs.set(f.id, { supersededBy: null, supersedes: [] });
  for (const f of facts) {
    if (f.superseded_by_fact_id != null) {
      const succ = byId.get(f.superseded_by_fact_id) ?? null;
      refs.get(f.id)!.supersededBy = succ;
      if (succ) refs.get(succ.id)!.supersedes.push(f);
    }
  }
  return refs;
}

export function confidenceLevel(c: number): 'baixa' | 'media' | 'alta' {
  if (c < 0.6) return 'baixa';
  if (c < 0.8) return 'media';
  return 'alta';
}

export function filterFacts(
  facts: FactRow[],
  f: { types: FactType[] | null; vigencia: 'vigentes' | 'supersedidos' | 'todos'; onlyNeedsReview: boolean },
): FactRow[] {
  return facts.filter((x) => {
    if (f.types && f.types.length > 0 && !f.types.includes(x.fact_type)) return false;
    if (f.vigencia === 'vigentes' && x.invalid_at != null) return false;
    if (f.vigencia === 'supersedidos' && x.invalid_at == null) return false;
    if (f.onlyNeedsReview && !x.needs_review) return false;
    return true;
  });
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return format(new Date(iso), 'dd/MM/yyyy', { locale: ptBR });
}
