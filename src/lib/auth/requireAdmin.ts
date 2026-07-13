import { getUserRole, type AppRole } from "@/lib/auth/getUserRole";

export async function requireAdmin() {
  const { role, error } = await getUserRole();
  if (error) return { ok: false, role: null as AppRole | null, error };

  if (role !== "admin") {
    return { ok: false, role, error: null };
  }

  return { ok: true, role: "admin" as const, error: null };
}
