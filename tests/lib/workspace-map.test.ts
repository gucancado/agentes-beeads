import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkspaceMap, findProject } from '../../src/lib/workspace-map';

const sample = JSON.stringify({
  version: 1,
  comment: 'qualquer coisa',
  workspaces: [
    {
      id: null,
      name: 'metido-a-gente',
      slug: 'metido-a-gente',
      evolution_instance: 'mercurio-metido-a-gente',
      whatsapp_number: '+5531977786735',
      persona_name: 'Mel',
    },
  ],
});

test('parseWorkspaceMap lê estrutura válida', () => {
  const map = parseWorkspaceMap(sample);
  assert.equal(map.version, 1);
  assert.equal(map.workspaces.length, 1);
  assert.equal(map.workspaces[0].persona_name, 'Mel');
});

test('parseWorkspaceMap rejeita JSON sem workspaces', () => {
  assert.throws(() => parseWorkspaceMap('{"version":1}'));
});

test('findProject acha por slug', () => {
  const map = parseWorkspaceMap(sample);
  const proj = findProject(map, 'metido-a-gente');
  assert.ok(proj);
  assert.equal(proj!.whatsapp_number, '+5531977786735');
});

test('findProject devolve null quando não acha', () => {
  const map = parseWorkspaceMap(sample);
  assert.equal(findProject(map, 'inexistente'), null);
});
