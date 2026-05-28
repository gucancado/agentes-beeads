export type AgentHomeStats = {
  agent: string;
  msgsIn24h: number;
  msgsOut24h: number;
  cost24h: number;
  errorRate: number;
};

export type ProjectSummary = {
  project: string;
  msgsIn24h: number;
  msgsOut24h: number;
  cost24h: number;
  lastMessageAt: string | null;
};

export type AgentDetailStats = {
  totals: { msgsIn7d: number; msgsOut7d: number; cost7d: number };
  projects: ProjectSummary[];
};

export type ProjectStats = {
  msgsIn24h: number;
  msgsOut24h: number;
  msgsIn7d: number;
  msgsOut7d: number;
  cost24h: number;
  cost7d: number;
  avgLatencyMs: number | null;
  lastMessageAt: string | null;
};

export type CostPoint = { day: string; cost: number };
export type TierBucket = { tier: string; count: number; cost: number };
export type RecentMessage = {
  id: number;
  direction: 'inbound' | 'outbound';
  identifier: string;
  text: string;
  createdAt: string;
};

export type Conversation = {
  identifier: string;
  pushName: string | null;
  msgCount: number;
  lastMessageAt: string;
};

export type ConversationMessage = {
  id: number;
  direction: 'inbound' | 'outbound';
  text: string;
  createdAt: string;
  tier: string | null;
  model: string | null;
  classifierIntent: string | null;
  latencyMs: number | null;
  respondCost: number;
  classifyCost: number;
  turnCost: number;
};

export type ConversationThread = {
  identifier: string;
  pushName: string | null;
  messages: ConversationMessage[];
  totalCost: number;
};

type Querier = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function strOrNull(v: unknown): string | null {
  return v === null || v === undefined ? null : String(v);
}

export async function getAgentHomeStats(pool: Querier, agents: string[]): Promise<AgentHomeStats[]> {
  if (agents.length === 0) return [];
  const { rows } = await pool.query(
    `
    WITH msg AS (
      SELECT agent,
             COUNT(*) FILTER (WHERE direction='inbound')  AS msgs_in_24h,
             COUNT(*) FILTER (WHERE direction='outbound') AS msgs_out_24h,
             COALESCE(SUM(cost_usd), 0) AS cost_24h
      FROM messages
      WHERE agent = ANY($1::text[])
        AND created_at > NOW() - INTERVAL '1 day'
      GROUP BY agent
    ),
    err AS (
      SELECT agent,
             COUNT(*) FILTER (WHERE error IS NOT NULL)::float
               / NULLIF(COUNT(*),0)::float AS error_rate
      FROM llm_metrics
      WHERE agent = ANY($1::text[])
        AND created_at > NOW() - INTERVAL '1 day'
      GROUP BY agent
    )
    SELECT a.agent,
           COALESCE(m.msgs_in_24h, 0)  AS msgs_in_24h,
           COALESCE(m.msgs_out_24h, 0) AS msgs_out_24h,
           COALESCE(m.cost_24h, 0)     AS cost_24h,
           COALESCE(e.error_rate, 0)   AS error_rate
    FROM unnest($1::text[]) AS a(agent)
    LEFT JOIN msg m USING (agent)
    LEFT JOIN err e USING (agent)
    `,
    [agents]
  );
  return (rows as Record<string, unknown>[]).map((r) => ({
    agent: String(r.agent),
    msgsIn24h: num(r.msgs_in_24h),
    msgsOut24h: num(r.msgs_out_24h),
    cost24h: num(r.cost_24h),
    errorRate: num(r.error_rate),
  }));
}

export async function getAgentDetailStats(pool: Querier, agent: string): Promise<AgentDetailStats> {
  const totalsResp = await pool.query(
    `
    SELECT COUNT(*) FILTER (WHERE direction='inbound')  AS msgs_in_7d,
           COUNT(*) FILTER (WHERE direction='outbound') AS msgs_out_7d,
           COALESCE(SUM(cost_usd), 0)                   AS cost_7d
    FROM messages
    WHERE agent = $1 AND created_at > NOW() - INTERVAL '7 days'
    `,
    [agent]
  );
  const tRow = (totalsResp.rows[0] ?? {}) as Record<string, unknown>;

  const projResp = await pool.query(
    `
    SELECT project,
           COUNT(*) FILTER (WHERE direction='inbound' AND created_at > NOW() - INTERVAL '1 day')  AS msgs_in_24h,
           COUNT(*) FILTER (WHERE direction='outbound' AND created_at > NOW() - INTERVAL '1 day') AS msgs_out_24h,
           COALESCE(SUM(cost_usd) FILTER (WHERE created_at > NOW() - INTERVAL '1 day'), 0) AS cost_24h,
           MAX(created_at) AS last_message_at
    FROM messages
    WHERE agent = $1 AND project IS NOT NULL
    GROUP BY project
    ORDER BY last_message_at DESC NULLS LAST
    `,
    [agent]
  );

  return {
    totals: {
      msgsIn7d: num(tRow.msgs_in_7d),
      msgsOut7d: num(tRow.msgs_out_7d),
      cost7d: num(tRow.cost_7d),
    },
    projects: (projResp.rows as Record<string, unknown>[]).map((r) => ({
      project: String(r.project),
      msgsIn24h: num(r.msgs_in_24h),
      msgsOut24h: num(r.msgs_out_24h),
      cost24h: num(r.cost_24h),
      lastMessageAt: strOrNull(r.last_message_at),
    })),
  };
}

export async function getProjectStats(pool: Querier, agent: string, project: string): Promise<ProjectStats> {
  const { rows } = await pool.query(
    `
    SELECT COUNT(*) FILTER (WHERE direction='inbound'  AND created_at > NOW() - INTERVAL '1 day')  AS msgs_in_24h,
           COUNT(*) FILTER (WHERE direction='outbound' AND created_at > NOW() - INTERVAL '1 day')  AS msgs_out_24h,
           COUNT(*) FILTER (WHERE direction='inbound'  AND created_at > NOW() - INTERVAL '7 days') AS msgs_in_7d,
           COUNT(*) FILTER (WHERE direction='outbound' AND created_at > NOW() - INTERVAL '7 days') AS msgs_out_7d,
           COALESCE(SUM(cost_usd) FILTER (WHERE created_at > NOW() - INTERVAL '1 day'), 0)  AS cost_24h,
           COALESCE(SUM(cost_usd) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'), 0) AS cost_7d,
           AVG(latency_ms) FILTER (WHERE direction='outbound' AND created_at > NOW() - INTERVAL '7 days') AS avg_latency_ms,
           MAX(created_at) AS last_message_at
    FROM messages
    WHERE agent = $1 AND project = $2
    `,
    [agent, project]
  );
  const r = (rows[0] ?? {}) as Record<string, unknown>;
  return {
    msgsIn24h: num(r.msgs_in_24h),
    msgsOut24h: num(r.msgs_out_24h),
    msgsIn7d: num(r.msgs_in_7d),
    msgsOut7d: num(r.msgs_out_7d),
    cost24h: num(r.cost_24h),
    cost7d: num(r.cost_7d),
    avgLatencyMs: r.avg_latency_ms == null ? null : num(r.avg_latency_ms),
    lastMessageAt: strOrNull(r.last_message_at),
  };
}

export async function getCostTimeseries(pool: Querier, agent: string, days: number): Promise<CostPoint[]> {
  const { rows } = await pool.query(
    `
    SELECT date_trunc('day', created_at)::date::text AS day,
           COALESCE(SUM(cost_usd), 0) AS cost
    FROM messages
    WHERE agent = $1 AND created_at > NOW() - ($2 || ' days')::interval
    GROUP BY day
    ORDER BY day
    `,
    [agent, days]
  );
  return (rows as Record<string, unknown>[]).map((r) => ({
    day: String(r.day),
    cost: num(r.cost),
  }));
}

export async function getTierBreakdown(pool: Querier, agent: string, days: number): Promise<TierBucket[]> {
  const { rows } = await pool.query(
    `
    SELECT COALESCE(tier, 'unknown') AS tier,
           COUNT(*)                  AS count,
           COALESCE(SUM(cost_usd), 0) AS cost
    FROM messages
    WHERE agent = $1
      AND direction = 'outbound'
      AND created_at > NOW() - ($2 || ' days')::interval
    GROUP BY tier
    ORDER BY count DESC
    `,
    [agent, days]
  );
  return (rows as Record<string, unknown>[]).map((r) => ({
    tier: String(r.tier),
    count: num(r.count),
    cost: num(r.cost),
  }));
}

export async function getRecentMessages(pool: Querier, agent: string, project: string, limit: number): Promise<RecentMessage[]> {
  const { rows } = await pool.query(
    `
    SELECT id, direction, identifier, text, created_at
    FROM messages
    WHERE agent = $1 AND project = $2
    ORDER BY created_at DESC
    LIMIT $3
    `,
    [agent, project, limit]
  );
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: num(r.id),
    direction: String(r.direction) as 'inbound' | 'outbound',
    identifier: String(r.identifier),
    text: String(r.text),
    createdAt: String(r.created_at),
  }));
}

export async function getConversations(
  pool: Querier,
  agent: string,
  project: string
): Promise<Conversation[]> {
  const { rows } = await pool.query(
    `
    SELECT
      m.identifier,
      (SELECT wl.push_name FROM webhook_logs wl
         WHERE wl.agent = m.agent AND wl.channel = m.channel
           AND wl.identifier = m.identifier AND wl.push_name IS NOT NULL
         ORDER BY wl.created_at DESC LIMIT 1) AS push_name,
      COUNT(*) AS msg_count,
      MAX(m.created_at) AS last_message_at
    FROM messages m
    WHERE m.agent = $1 AND m.project = $2 AND m.channel = 'whatsapp'
    GROUP BY m.agent, m.channel, m.identifier
    ORDER BY MAX(m.created_at) DESC
    `,
    [agent, project]
  );
  return (rows as Record<string, unknown>[]).map((r) => ({
    identifier: String(r.identifier),
    pushName: strOrNull(r.push_name),
    msgCount: num(r.msg_count),
    lastMessageAt: String(r.last_message_at),
  }));
}

export async function getConversationThread(
  pool: Querier,
  agent: string,
  project: string,
  identifier: string
): Promise<ConversationThread> {
  const [msgsResp, headerResp] = await Promise.all([
    pool.query(
      `
      SELECT
        m.id, m.direction, m.text, m.created_at,
        m.tier, m.model, m.classifier_intent, m.latency_ms,
        COALESCE(m.cost_usd, 0) AS respond_cost,
        COALESCE(c.cost_usd, 0) AS classify_cost
      FROM messages m
      LEFT JOIN LATERAL (
        SELECT cost_usd FROM llm_metrics lm
        WHERE lm.agent = m.agent
          AND lm.task = 'classify'
          AND lm.message_id IS NULL
          AND lm.created_at < m.created_at
          AND lm.created_at > m.created_at - INTERVAL '60 seconds'
        ORDER BY lm.created_at DESC LIMIT 1
      ) c ON m.direction = 'outbound'
      WHERE m.agent = $1 AND m.project = $2 AND m.identifier = $3
      ORDER BY m.created_at ASC
      `,
      [agent, project, identifier]
    ),
    pool.query(
      `
      SELECT push_name FROM webhook_logs
      WHERE agent = $1 AND identifier = $2 AND push_name IS NOT NULL
      ORDER BY created_at DESC LIMIT 1
      `,
      [agent, identifier]
    ),
  ]);

  const messages: ConversationMessage[] = (msgsResp.rows as Record<string, unknown>[]).map((r) => {
    const respondCost = num(r.respond_cost);
    const classifyCost = num(r.classify_cost);
    const direction = String(r.direction) as 'inbound' | 'outbound';
    return {
      id: num(r.id),
      direction,
      text: String(r.text),
      createdAt: String(r.created_at),
      tier: strOrNull(r.tier),
      model: strOrNull(r.model),
      classifierIntent: strOrNull(r.classifier_intent),
      latencyMs: r.latency_ms == null ? null : num(r.latency_ms),
      respondCost,
      classifyCost,
      turnCost: direction === 'outbound' ? respondCost + classifyCost : 0,
    };
  });

  const totalCost = messages.reduce((acc, m) => acc + m.turnCost, 0);
  const headerRow = (headerResp.rows[0] ?? {}) as Record<string, unknown>;

  return {
    identifier,
    pushName: strOrNull(headerRow.push_name),
    messages,
    totalCost,
  };
}
