import type {
  AgentHomeStats,
  AgentDetailStats,
  ProjectStats,
  CostPoint,
  TierBucket,
  RecentMessage,
} from './queries';

export function mockAgentHomeStats(agents: string[]): AgentHomeStats[] {
  return agents.map((agent) => ({
    agent,
    msgsIn24h: 12,
    msgsOut24h: 11,
    cost24h: 0.085,
    errorRate: 0,
  }));
}

export function mockAgentDetailStats(_agent: string): AgentDetailStats {
  return {
    totals: { msgsIn7d: 50, msgsOut7d: 48, cost7d: 0.42 },
    projects: [
      {
        project: 'metido-a-gente',
        msgsIn24h: 12,
        msgsOut24h: 11,
        cost24h: 0.085,
        lastMessageAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      },
    ],
  };
}

export function mockProjectStats(): ProjectStats {
  return {
    msgsIn24h: 12,
    msgsOut24h: 11,
    msgsIn7d: 50,
    msgsOut7d: 48,
    cost24h: 0.085,
    cost7d: 0.42,
    avgLatencyMs: 1380,
    lastMessageAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  };
}

export function mockCostTimeseries(days: number): CostPoint[] {
  const today = new Date();
  const out: CostPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push({
      day: d.toISOString().slice(0, 10),
      cost: Number((0.04 + Math.random() * 0.08).toFixed(4)),
    });
  }
  return out;
}

export function mockTierBreakdown(): TierBucket[] {
  return [
    { tier: 'low', count: 30, cost: 0.05 },
    { tier: 'medium', count: 12, cost: 0.20 },
    { tier: 'high', count: 3, cost: 0.17 },
  ];
}

export function mockRecentMessages(limit: number): RecentMessage[] {
  const now = Date.now();
  const samples: Array<{ direction: 'inbound' | 'outbound'; text: string }> = [
    { direction: 'inbound', text: 'Oi! Vocês trabalham com investimento mensal de quanto?' },
    { direction: 'outbound', text: 'Oi, Gustavo! Sou a Mel, agente automatizada da BeeAds. Posso te ajudar?' },
    { direction: 'inbound', text: 'Quero saber mais sobre tráfego pago.' },
    { direction: 'outbound', text: 'Claro! Em qual segmento sua empresa atua?' },
  ];
  return Array.from({ length: Math.min(limit, samples.length) }, (_, i) => ({
    id: 100 - i,
    direction: samples[i].direction,
    identifier: '+5531972541177',
    text: samples[i].text,
    createdAt: new Date(now - i * 30_000).toISOString(),
  }));
}
