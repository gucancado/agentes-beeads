import 'server-only';
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL não definida (e USE_MOCK_STATS=false). Configure no .env.local.');
  }
  pool = new Pool({ connectionString: url, max: 5 });
  return pool;
}
