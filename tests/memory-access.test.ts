import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessibleWorkspaces, canAccessWorkspace } from '../src/lib/memory-access';

const deps = {
  meWorkspaces: async () => [{ id: 'a', name: 'Alfa' }],
  meAgents: async () => [{ workspaceId: 'b', workspaceName: 'Beta' }],
};

test('accessibleWorkspaces une workspaces e agents (id→nome)', async () => {
  const m = await accessibleWorkspaces('cookie', deps);
  assert.equal(m.get('a'), 'Alfa');
  assert.equal(m.get('b'), 'Beta');
  assert.equal(m.size, 2);
});

test('canAccessWorkspace true/false', async () => {
  assert.equal(await canAccessWorkspace('c', 'a', deps), true);
  assert.equal(await canAccessWorkspace('c', 'z', deps), false);
});

test('workspaces ganham na colisão de nome (workspace name wins)', async () => {
  const collisionDeps = {
    meWorkspaces: async () => [{ id: 'a', name: 'Alfa' }],
    meAgents: async () => [{ workspaceId: 'a', workspaceName: 'Alfa-agent' }],
  };
  const m = await accessibleWorkspaces('cookie', collisionDeps);
  assert.equal(m.get('a'), 'Alfa');
  assert.equal(m.size, 1);
});
