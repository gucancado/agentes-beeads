import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWorkspaceFactRows, getEpisodeTurnRows, getMemoryIndexRows, type Queryable } from '../src/lib/memory-queries';

function fakeDb(rows: any[]): Queryable & { last: { text: string; params: any[] } } {
  const state: any = { last: { text: '', params: [] } };
  state.query = async (text: string, params: any[]) => { state.last = { text, params }; return { rows }; };
  return state;
}

test('getWorkspaceFactRows passa workspace_id e devolve rows', async () => {
  const db = fakeDb([{ id: 1, fact_type: 'decisao' }]);
  const out = await getWorkspaceFactRows(db, 'wks-1');
  assert.equal(out.length, 1);
  assert.deepEqual(db.last.params, ['wks-1']);
  assert.match(db.last.text, /FROM facts/i);
});

test('getEpisodeTurnRows ordena por turn_index', async () => {
  const db = fakeDb([{ turn_index: 0 }]);
  await getEpisodeTurnRows(db, 42);
  assert.deepEqual(db.last.params, [42]);
  assert.match(db.last.text, /ORDER BY turn_index/i);
});

test('getMemoryIndexRows coage campos bigint de string para number', async () => {
  // Simula o que o driver pg retorna: counts como strings
  const db = fakeDb([{
    workspace_id: 'w',
    eps_done: '3',
    eps_total: '5',
    facts_total: '10',
    vigentes: '7',
    supersedidos: '3',
    needs_review: '2',
    ultimo_episodio: '2026-01-01T00:00:00Z',
  }]);
  const out = await getMemoryIndexRows(db);
  assert.strictEqual(out[0].eps_done, 3);
  assert.strictEqual(out[0].needs_review, 2);
  assert.strictEqual(typeof out[0].facts_total, 'number');
});
