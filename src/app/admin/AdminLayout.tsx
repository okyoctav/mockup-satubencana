'use client';

import { useEffect, useState } from 'react';
// Link removed — sidebar rendered by AdminSidebar
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getUserRole } from '@/lib/auth/getUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MenuIcon from 'nexticons/outline/MenuIcon';
import ChevronLeftIcon from 'nexticons/outline/ChevronLeftIcon';
import ChevronRightIcon from 'nexticons/outline/ChevronRightIcon';
import HomeIcon from 'nexticons/outline/HomeIcon';
import MapIcon from 'nexticons/outline/MapIcon';
import ClipboardListIcon from 'nexticons/outline/ClipboardListIcon';
import SearchUsersIcon from 'nexticons/outline/SearchUsersIcon';
import AdminSidebar from '@/components/admin/AdminSidebar';

type AdminLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
};

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      const client = getSupabaseBrowserClient();
      const hasEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      if (!client || !hasEnv) {
        if (active) {
          setMockMode(true);
          setUserEmail('demo@admin.local');
          setReady(true);
        }
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        if (active) {
          setMockMode(true);
          setUserEmail('demo@admin.local');
          setReady(true);
        }
        return;
      }

      const { role, error } = await getUserRole(client);
      if (!active) return;

      const {
        data: { user },
      } = await client.auth.getUser();

      if (error || role !== 'admin') {
        if (active) {
          setUserEmail(user?.email ?? 'demo@admin.local');
          setReady(true);
          setMockMode(true);
        }
        return;
      }

      if (active) {
        setUserEmail(user?.email ?? 'demo@admin.local');
        setReady(true);
        setMockMode(false);
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

  const menuItems = [
    { key: '/admin', label: 'Dashboard', href: '/admin', icon: <HomeIcon width={18} height={18} /> },
    { key: '/admin/simulasi-k3', label: 'Simulasi K3', href: '/admin/simulasi-k3', icon: <MapIcon width={18} height={18} /> },
    { key: '/management', label: 'Management Data', href: '/management', icon: <ClipboardListIcon width={18} height={18} /> },
    { key: '/admin/roles', label: 'Users & Roles', href: '/admin/roles', icon: <SearchUsersIcon width={18} height={18} /> },
  ];

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
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      ) : null}

      {/* Admin sidebar replaced with AdminSidebar component */}
      <AdminSidebar
        menuItems={menuItems}
        pathname={pathname}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mockMode={mockMode}
        handleLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Buka sidebar"
            >
              <MenuIcon width={18} height={18} />
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="hidden rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:inline-flex"
              aria-label={sidebarCollapsed ? 'Perluas sidebar' : 'Sembunyikan sidebar'}
            >
              {sidebarCollapsed ? <ChevronRightIcon width={18} height={18} /> : <ChevronLeftIcon width={18} height={18} />}
            </button>
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
