import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") return null;

  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return null;
    }

    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    try {
      const projectRef = new URL(url).hostname.split('.')[0];
      const cookieName = `sb-${projectRef}-auth-token`;
      browserClient.auth.onAuthStateChange((_event, session) => {
        if (typeof document === 'undefined') return;
        if (session) {
          document.cookie = `${cookieName}=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
        } else {
          document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
        }
      });
    } catch {
      // ignore URL parsing error
    }
  }

  return browserClient;
}

// Export a typed supabase client for direct use
export const supabase = getSupabaseBrowserClient();