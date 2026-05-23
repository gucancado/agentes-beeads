import 'server-only';
import { getPool } from './db';
import * as q from './queries';
import * as m from './mocks';

function useMock(): boolean {
  return process.env.USE_MOCK_STATS === 'true';
}

export async function fetchAgentHomeStats(agents: string[]) {
  if (useMock()) return m.mockAgentHomeStats(agents);
  return q.getAgentHomeStats(getPool(), agents);
}

export async function fetchAgentDetailStats(agent: string) {
  if (useMock()) return m.mockAgentDetailStats(agent);
  return q.getAgentDetailStats(getPool(), agent);
}

export async function fetchProjectStats(agent: string, project: string) {
  if (useMock()) return m.mockProjectStats();
  return q.getProjectStats(getPool(), agent, project);
}

export async function fetchCostTimeseries(agent: string, days: number) {
  if (useMock()) return m.mockCostTimeseries(days);
  return q.getCostTimeseries(getPool(), agent, days);
}

export async function fetchTierBreakdown(agent: string, days: number) {
  if (useMock()) return m.mockTierBreakdown();
  return q.getTierBreakdown(getPool(), agent, days);
}

export async function fetchRecentMessages(agent: string, project: string, limit: number) {
  if (useMock()) return m.mockRecentMessages(limit);
  return q.getRecentMessages(getPool(), agent, project, limit);
}
