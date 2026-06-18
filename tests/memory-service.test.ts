import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleMemoryIndex, assembleWorkspaceMemory, canAccessEpisode } from '../src/lib/memory-service';

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

test('canAccessEpisode → true quando user é membro do workspace do episódio', async () => {
  const db = { query: async () => ({ rows: [{ workspace_id: 'a', id: 1 }] }) };
  const deps = { meWorkspaces: async () => [{ id: 'a', name: 'Alfa' }], meAgents: async () => [] };
  const out = await canAccessEpisode(db, 'cookie', 1, deps);
  assert.equal(out, true);
});

test('canAccessEpisode → false quando episódio pertence a workspace sem acesso', async () => {
  const db = { query: async () => ({ rows: [{ workspace_id: 'z', id: 2 }] }) };
  const deps = { meWorkspaces: async () => [{ id: 'a', name: 'Alfa' }], meAgents: async () => [] };
  const out = await canAccessEpisode(db, 'cookie', 2, deps);
  assert.equal(out, false);
});

test('canAccessEpisode → false quando episódio não existe', async () => {
  const db = { query: async () => ({ rows: [] }) };
  const deps = { meWorkspaces: async () => [{ id: 'a', name: 'Alfa' }], meAgents: async () => [] };
  const out = await canAccessEpisode(db, 'cookie', 999, deps);
  assert.equal(out, false);
});
