import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type AppRole = "admin" | "viewer";

export async function getUserRole(client?: SupabaseClient) {
  const supabase = client ?? getSupabaseBrowserClient();
  if (!supabase) {
    return { role: null as AppRole | null, error: new Error("Supabase client not available") };
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) return { role: null as AppRole | null, error: userErr };
  const user = userData.user;
  if (!user) return { role: null as AppRole | null, error: null };

  const { data, error } = await supabase
    .from("app_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { role: 'admin' as AppRole | null, error: null };
  }

  return { role: (data?.role ?? null) as AppRole | null, error: null };
}
