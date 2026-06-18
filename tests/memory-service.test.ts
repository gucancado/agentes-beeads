import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleMemoryIndex, assembleWorkspaceMemory } from '../src/lib/memory-service';

const access = {
  meWorkspaces: async () => [{ id: 'a', name: 'Alfa' }],
  meAgents: async () => [],
};

test('assembleMemoryIndex filtra para workspaces acessíveis e injeta nome', async () => {
  const db = { query: async () => ({ rows: [
    { workspace_id: 'a', facts_total: 5 }, { workspace_id: 'z', facts_total: 9 },
  ] }) };
  const out = await assembleMemoryIndex(db, 'cookie', access);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, 'Alfa');
});

test('assembleWorkspaceMemory sem acesso → null', async () => {
  const db = { query: async () => ({ rows: [] }) };
  const out = await assembleWorkspaceMemory(db, 'cookie', 'z', access);
  assert.equal(out, null);
});
