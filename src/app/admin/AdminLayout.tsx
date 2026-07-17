'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getUserRole } from '@/lib/auth/getUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminAppSidebar } from '@/components/admin/AdminAppSidebar';

type AdminLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
};

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      const client = getSupabaseBrowserClient();
      const hasEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      if (!client || !hasEnv) {
        router.replace('/login');
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const { role, error } = await getUserRole(client);
      if (!active) return;

      if (error || role !== 'admin') {
        router.replace('/login');
        return;
      }

      const {
        data: { user },
      } = await client.auth.getUser();

      if (active) {
        setUserEmail(user?.email ?? 'admin@satubencana.id');
        setReady(true);
      }
    };

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = async () => {
    const client = getSupabaseBrowserClient();
    if (client) {
      await client.auth.signOut();
    }
    router.push('/login');
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          <p className="mt-2 text-sm text-slate-500">Memverifikasi akses admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AdminAppSidebar />

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              <div className="rounded-lg border border-slate-200 p-2 text-slate-600 bg-slate-100">
                <span className="text-sm">☰</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
              {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <Input placeholder="Cari data / menu" className="h-10 w-56 rounded-xl border-slate-200 bg-slate-50" />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              <span className="text-base">🔔</span>
              <span className="font-semibold">3</span>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm">
              {userEmail ?? 'Admin'}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Keluar
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
