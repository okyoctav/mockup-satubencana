import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getAuthMode } from '@/lib/auth/config';

export type AppRole = 'admin' | 'user';

/**
 * Ambil role user aktif.
 * - local: lewat /api/auth/me (cookie JWT)
 * - supabase: lewat tabel app_users (tanpa fallback admin saat error)
 */
export async function getUserRole(client?: SupabaseClient) {
  if (typeof window !== 'undefined' && getAuthMode() === 'local') {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) return { role: null as AppRole | null, error: null };
      const data = await res.json();
      const role = data?.user?.role;
      if (role === 'admin' || role === 'user') {
        return { role: role as AppRole, error: null };
      }
      return { role: null as AppRole | null, error: null };
    } catch (error) {
      return { role: null as AppRole | null, error: error as Error };
    }
  }

  const supabase = client ?? getSupabaseBrowserClient();
  if (!supabase) {
    return { role: null as AppRole | null, error: new Error('Supabase client not available') };
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) return { role: null as AppRole | null, error: userErr };
  const user = userData.user;
  if (!user) return { role: null as AppRole | null, error: null };

  const { data, error } = await supabase
    .from('app_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  // Aman: error DB → tidak pernah naik jadi admin
  if (error) {
    return { role: null as AppRole | null, error };
  }

  const role = data?.role;
  if (role === 'admin' || role === 'user' || role === 'viewer') {
    // viewer legacy di cloud lama → perlakukan sebagai user
    return { role: (role === 'viewer' ? 'user' : role) as AppRole, error: null };
  }

  return { role: null as AppRole | null, error: null };
}
