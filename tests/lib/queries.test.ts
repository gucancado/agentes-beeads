import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAgentHomeStats,
  getAgentDetailStats,
  getProjectStats,
  getCostTimeseries,
  getTierBreakdown,
  getRecentMessages,
} from '../../src/lib/queries';

function makeMockPool(responses: Array<{ rows: unknown[] }>): {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
} {
  let i = 0;
  return {
    async query() {
      const r = responses[i++];
      if (!r) throw new Error('mock pool sem mais respostas');
      return r;
    },
  };
}

test('getAgentHomeStats agrega por agent', async () => {
  const pool = makeMockPool([{
    rows: [
      { agent: 'mercurio', msgs_in_24h: '12', msgs_out_24h: '11', cost_24h: '0.085', error_rate: '0' },
    ],
  }]);
  const stats = await getAgentHomeStats(pool, ['mercurio']);
  assert.equal(stats.length, 1);
  assert.equal(stats[0].agent, 'mercurio');
  assert.equal(stats[0].msgsIn24h, 12);
  assert.equal(stats[0].msgsOut24h, 11);
  assert.equal(stats[0].cost24h, 0.085);
  assert.equal(stats[0].errorRate, 0);
});

test('getAgentDetailStats devolve cost/messages totais + projetos', async () => {
  const pool = makeMockPool([
    { rows: [{ msgs_in_7d: '50', msgs_out_7d: '48', cost_7d: '0.42' }] },
    { rows: [
      { project: 'metido-a-gente', msgs_in_24h: '12', msgs_out_24h: '11', cost_24h: '0.085', last_message_at: '2026-05-23T10:00:00Z' },
    ] },
  ]);
  const stats = await getAgentDetailStats(pool, 'mercurio');
  assert.equal(stats.totals.msgsIn7d, 50);
  assert.equal(stats.totals.cost7d, 0.42);
  assert.equal(stats.projects.length, 1);
  assert.equal(stats.projects[0].project, 'metido-a-gente');
});

test('getProjectStats inclui in/out + custo + latência', async () => {
  const pool = makeMockPool([{
    rows: [{
      msgs_in_24h: '5', msgs_out_24h: '4', msgs_in_7d: '30', msgs_out_7d: '28',
      cost_24h: '0.04', cost_7d: '0.30',
      avg_latency_ms: '1250.5',
      last_message_at: '2026-05-23T10:00:00Z',
    }],
  }]);
  const stats = await getProjectStats(pool, 'mercurio', 'metido-a-gente');
  assert.equal(stats.msgsIn24h, 5);
  assert.equal(stats.cost7d, 0.30);
  assert.equal(stats.avgLatencyMs, 1250.5);
});

test('getCostTimeseries devolve 1 ponto por dia', async () => {
  const pool = makeMockPool([{
    rows: [
      { day: '2026-05-20', cost: '0.10' },
      { day: '2026-05-21', cost: '0.15' },
      { day: '2026-05-22', cost: '0.20' },
    ],
  }]);
  const points = await getCostTimeseries(pool, 'mercurio', 7);
  assert.equal(points.length, 3);
  assert.equal(points[0].day, '2026-05-20');
  assert.equal(points[0].cost, 0.10);
});

test('getTierBreakdown agrupa por tier', async () => {
  const pool = makeMockPool([{
    rows: [
      { tier: 'low', count: '10', cost: '0.02' },
      { tier: 'medium', count: '5', cost: '0.08' },
      { tier: 'high', count: '1', cost: '0.05' },
    ],
  }]);
  const breakdown = await getTierBreakdown(pool, 'mercurio', 7);
  assert.equal(breakdown.length, 3);
  assert.equal(breakdown[0].tier, 'low');
  assert.equal(breakdown[0].count, 10);
});

test('getRecentMessages mostra últimas N por projeto', async () => {
  const pool = makeMockPool([{
    rows: [
      { id: 26, direction: 'inbound', identifier: '+5531999998888', text: 'oi', created_at: '2026-05-23T10:00:00Z' },
      { id: 27, direction: 'outbound', identifier: '+5531999998888', text: 'olá', created_at: '2026-05-23T10:00:30Z' },
    ],
  }]);
  const msgs = await getRecentMessages(pool, 'mercurio', 'metido-a-gente', 20);
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0].direction, 'inbound');
});
