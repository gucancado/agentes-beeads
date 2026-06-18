import type { FactRow, MemoryIndexRow, EpisodeSummaryRow, TurnRow } from './memory-shape';

// Interface injetável: qualquer objeto com query(text, params) satisfaz o contrato.
// O Pool real do `pg` satisfaz; testes passam um fake offline.
export interface Queryable { query(text: string, params?: any[]): Promise<{ rows: any[] }>; }

// Retorna um resumo agregado de todos os workspaces com memória registrada.
export async function getMemoryIndexRows(db: Queryable): Promise<MemoryIndexRow[]> {
  const { rows } = await db.query(`
    SELECT e.workspace_id,
      count(DISTINCT e.id) FILTER (WHERE lp.status='done')   AS eps_done,
      count(DISTINCT e.id)                                   AS eps_total,
      count(f.id)                                            AS facts_total,
      count(f.id) FILTER (WHERE f.invalid_at IS NULL)        AS vigentes,
      count(f.id) FILTER (WHERE f.invalid_at IS NOT NULL)    AS supersedidos,
      count(f.id) FILTER (WHERE f.needs_review)              AS needs_review,
      max(e.occurred_at)                                     AS ultimo_episodio
    FROM episodes e
    LEFT JOIN lua_processing lp ON lp.episode_id = e.id
    LEFT JOIN facts f          ON f.episode_id   = e.id
    WHERE e.workspace_id IS NOT NULL
    GROUP BY e.workspace_id
    HAVING count(f.id) > 0 OR count(DISTINCT e.id) FILTER (WHERE lp.status='done') > 0
    ORDER BY facts_total DESC`);
  return rows as MemoryIndexRow[];
}

// Retorna todos os fatos de um workspace, ordenados por tipo e data.
export async function getWorkspaceFactRows(db: Queryable, workspaceId: string): Promise<FactRow[]> {
  const { rows } = await db.query(`
    SELECT f.id, f.fact_type, f.statement, f.attributes, f.confidence,
           f.valid_at, f.invalid_at, f.invalidation_reason, f.superseded_by_fact_id,
           f.needs_review, f.review_note, f.episode_id, f.episode_revision,
           f.turn_start, f.turn_end, e.title AS episode_title, e.occurred_at AS episode_at
    FROM facts f JOIN episodes e ON e.id = f.episode_id
    WHERE f.workspace_id = $1
    ORDER BY f.fact_type, f.valid_at`, [workspaceId]);
  return rows as FactRow[];
}

// Retorna os episódios de um workspace com contagem de fatos extraídos.
export async function getWorkspaceEpisodeRows(db: Queryable, workspaceId: string): Promise<EpisodeSummaryRow[]> {
  const { rows } = await db.query(`
    SELECT e.id, e.title, e.occurred_at, e.duration_seconds, e.turn_count,
           e.participants, e.fonte, e.attribution_method,
           (e.raw_r2_key IS NOT NULL) AS tem_raw, (e.audio_r2_key IS NOT NULL) AS tem_audio,
           lp.status AS processing_status,
           count(f.id) FILTER (WHERE f.id IS NOT NULL) AS facts_extraidos
    FROM episodes e
    LEFT JOIN lua_processing lp ON lp.episode_id = e.id
    LEFT JOIN facts f          ON f.episode_id   = e.id
    WHERE e.workspace_id = $1
    GROUP BY e.id, lp.status
    ORDER BY e.occurred_at DESC`, [workspaceId]);
  return rows as EpisodeSummaryRow[];
}

// Retorna metadados de um episódio específico (inclui workspace_id), ou null se não encontrado.
export async function getEpisodeMeta(db: Queryable, episodeId: number) {
  const { rows } = await db.query(`
    SELECT e.id, e.title, e.occurred_at, e.duration_seconds, e.turn_count, e.participants,
           e.fonte, e.attribution_method, e.workspace_id,
           (e.raw_r2_key IS NOT NULL) AS tem_raw, (e.audio_r2_key IS NOT NULL) AS tem_audio,
           lp.status AS processing_status,
           count(f.id) FILTER (WHERE f.id IS NOT NULL) AS facts_extraidos
    FROM episodes e
    LEFT JOIN lua_processing lp ON lp.episode_id = e.id
    LEFT JOIN facts f          ON f.episode_id   = e.id
    WHERE e.id = $1
    GROUP BY e.id, lp.status`, [episodeId]);
  return (rows[0] as (EpisodeSummaryRow & { workspace_id: string }) | undefined) ?? null;
}

// Retorna os turnos de um episódio, ordenados por turn_index.
export async function getEpisodeTurnRows(db: Queryable, episodeId: number): Promise<TurnRow[]> {
  const { rows } = await db.query(`
    SELECT turn_index, speaker_name, speaker_label, text, started_at_ms, ended_at_ms
    FROM episode_turns WHERE episode_id = $1 ORDER BY turn_index`, [episodeId]);
  return rows as TurnRow[];
}
