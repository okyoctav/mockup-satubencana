import { Pool, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getLocalPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL belum di-set (mode auth lokal).');
  }
  if (!pool) {
    pool = new Pool({ connectionString: url, max: 5 });
  }
  return pool;
}

export async function localQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getLocalPool().query<T>(text, params);
}
