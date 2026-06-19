import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  groupFactsByType, buildSupersedeRefs, confidenceLevel, filterFacts, FACT_TYPE_META, type FactRow,
} from '../src/lib/memory-shape';

function f(over: Partial<FactRow> = {}): FactRow {
  return {
    id: 1, fact_type: 'decisao', statement: 's', attributes: null, confidence: 0.9,
    valid_at: '2026-01-01T00:00:00Z', invalid_at: null, invalidation_reason: null,
    superseded_by_fact_id: null, needs_review: false, review_note: null,
    episode_id: 10, episode_revision: 1, turn_start: 0, turn_end: 2,
    episode_title: 'Ep', episode_at: '2026-01-01T00:00:00Z', ...over,
  };
}

test('groupFactsByType agrupa e ordena por ordem canônica', () => {
  const g = groupFactsByType([f({ id: 1, fact_type: 'papel' }), f({ id: 2, fact_type: 'decisao' })]);
  assert.equal(g[0].type, 'decisao'); // decisao vem antes de papel
  assert.equal(g[0].label, FACT_TYPE_META.decisao.label);
  assert.equal(g.find((x) => x.type === 'papel')!.facts.length, 1);
});

test('buildSupersedeRefs liga vigente↔supersedido', () => {
  const antigo = f({ id: 1, invalid_at: '2026-02-01T00:00:00Z', superseded_by_fact_id: 2 });
  const novo = f({ id: 2 });
  const refs = buildSupersedeRefs([antigo, novo]);
  assert.equal(refs.get(1)!.supersededBy!.id, 2);
  assert.equal(refs.get(2)!.supersedes[0].id, 1);
});

test('confidenceLevel: <0.6 baixa', () => {
  assert.equal(confidenceLevel(0.5), 'baixa');
  assert.equal(confidenceLevel(0.7), 'media');
  assert.equal(confidenceLevel(0.85), 'alta');
});

test('filterFacts respeita vigencia e needs_review', () => {
  const vig = f({ id: 1 });
  const sup = f({ id: 2, invalid_at: '2026-02-01T00:00:00Z' });
  const nr = f({ id: 3, needs_review: true });
  const all = [vig, sup, nr];
  assert.deepEqual(filterFacts(all, { types: null, vigencia: 'vigentes', onlyNeedsReview: false }).map((x) => x.id), [1, 3]);
  assert.deepEqual(filterFacts(all, { types: null, vigencia: 'supersedidos', onlyNeedsReview: false }).map((x) => x.id), [2]);
  assert.deepEqual(filterFacts(all, { types: null, vigencia: 'todos', onlyNeedsReview: true }).map((x) => x.id), [3]);
});
