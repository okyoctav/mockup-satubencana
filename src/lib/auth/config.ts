export type AuthMode = 'local' | 'supabase';

/** local = Postgres native (dev laptop). supabase = Vercel / cloud. */
export function getAuthMode(): AuthMode {
  const raw = (
    process.env.AUTH_MODE ||
    process.env.NEXT_PUBLIC_AUTH_MODE ||
    ''
  )
    .toLowerCase()
    .trim();
  if (raw === 'local' || raw === 'supabase') return raw;
  // Fallback: kalau ada DATABASE_URL tanpa Supabase → local
  if (process.env.DATABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) return 'local';
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return 'supabase';
  }
  return 'local';
}

export const SESSION_COOKIE = 'mdb_session';

export function getAuthSecret(): string {
  return process.env.AUTH_SECRET || 'mdb-dev-secret-change-me';
}
