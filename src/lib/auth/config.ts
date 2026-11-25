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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Fallback: kalau ada DATABASE_URL tanpa Supabase → local
  if (process.env.DATABASE_URL && !supabaseUrl) return 'local';
  if (supabaseUrl && supabaseAnon) {
    return 'supabase';
  }
  return 'local';
}

export const SESSION_COOKIE = 'mdb_session';

export function getAuthSecret(): string {
  return process.env.AUTH_SECRET || 'mdb-dev-secret-change-me';
}
