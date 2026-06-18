import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWorkspaceFactRows, getEpisodeTurnRows, type Queryable } from '../src/lib/memory-queries';

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
