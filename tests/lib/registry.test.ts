import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAgentsYaml, getEnabledAgents } from '../../src/lib/registry';

test('parseAgentsYaml lê 1 agente enabled', () => {
  const yaml = `
agents:
  - name: mercurio
    repo: gucancado/agente-mercurio
    enabled: true
`;
  const registry = parseAgentsYaml(yaml);
  assert.equal(registry.agents.length, 1);
  assert.equal(registry.agents[0].name, 'mercurio');
  assert.equal(registry.agents[0].repo, 'gucancado/agente-mercurio');
  assert.equal(registry.agents[0].enabled, true);
});

test('parseAgentsYaml filtra desabilitados via getEnabledAgents', () => {
  const yaml = `
agents:
  - name: mercurio
    repo: gucancado/agente-mercurio
    enabled: true
  - name: legado
    repo: gucancado/agente-legado
    enabled: false
`;
  const registry = parseAgentsYaml(yaml);
  const enabled = getEnabledAgents(registry);
  assert.equal(enabled.length, 1);
  assert.equal(enabled[0].name, 'mercurio');
});

test('parseAgentsYaml rejeita YAML malformado (sem agents:)', () => {
  assert.throws(() => parseAgentsYaml('foo: bar'), /agents/);
});

test('parseAgentsYaml rejeita agente sem name', () => {
  const yaml = `
agents:
  - repo: gucancado/foo
    enabled: true
`;
  assert.throws(() => parseAgentsYaml(yaml));
});
