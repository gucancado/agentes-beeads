import 'server-only';
import { getPool } from './db';

export type AgentProjectConfig = {
  agent: string;
  project: string;
  quiet_hours_enabled: boolean;
  quiet_start: string; // HH:MM:SS
  quiet_end: string; // HH:MM:SS
  quiet_tz: string;
};

const DEFAULT_CONFIG: Omit<AgentProjectConfig, 'agent' | 'project'> = {
  quiet_hours_enabled: false,
  quiet_start: '23:00:00',
  quiet_end: '07:00:00',
  quiet_tz: 'America/Sao_Paulo',
};

/**
 * Lê config de (agent, project). Se não existe row, devolve defaults SEM
 * persistir. A persistência acontece no primeiro PATCH/upsert vindo da GUI.
 */
export async function loadAgentProjectConfig(
  agent: string,
  project: string,
): Promise<AgentProjectConfig> {
  const pool = getPool();
  const { rows } = await pool.query<AgentProjectConfig>(
    `SELECT agent, project, quiet_hours_enabled,
            quiet_start::text AS quiet_start,
            quiet_end::text AS quiet_end,
            quiet_tz
       FROM agent_project_config
      WHERE agent = $1 AND project = $2`,
    [agent, project],
  );
  if (rows[0]) return rows[0];
  return { agent, project, ...DEFAULT_CONFIG };
}

/**
 * Upsert. Mesma semântica do endpoint REST do worker — campos undefined
 * preservam valor existente.
 */
export async function saveAgentProjectConfig(args: {
  agent: string;
  project: string;
  quiet_hours_enabled?: boolean;
  quiet_start?: string;
  quiet_end?: string;
  quiet_tz?: string;
}): Promise<AgentProjectConfig> {
  const pool = getPool();
  const { rows } = await pool.query<AgentProjectConfig>(
    `INSERT INTO agent_project_config
       (agent, project, quiet_hours_enabled, quiet_start, quiet_end, quiet_tz)
     VALUES (
       $1, $2,
       COALESCE($3, false),
       COALESCE($4::time, '23:00'::time),
       COALESCE($5::time, '07:00'::time),
       COALESCE($6, 'America/Sao_Paulo')
     )
     ON CONFLICT (agent, project) DO UPDATE SET
       quiet_hours_enabled = COALESCE($3, agent_project_config.quiet_hours_enabled),
       quiet_start = COALESCE($4::time, agent_project_config.quiet_start),
       quiet_end = COALESCE($5::time, agent_project_config.quiet_end),
       quiet_tz = COALESCE($6, agent_project_config.quiet_tz),
       updated_at = NOW()
     RETURNING agent, project, quiet_hours_enabled,
               quiet_start::text AS quiet_start,
               quiet_end::text AS quiet_end,
               quiet_tz`,
    [
      args.agent,
      args.project,
      args.quiet_hours_enabled ?? null,
      args.quiet_start ?? null,
      args.quiet_end ?? null,
      args.quiet_tz ?? null,
    ],
  );
  return rows[0]!;
}
