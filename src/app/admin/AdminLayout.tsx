'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getUserRole } from '@/lib/auth/getUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MenuIcon from 'nexticons/outline/MenuIcon';
import ChevronLeftIcon from 'nexticons/outline/ChevronLeftIcon';
import ChevronRightIcon from 'nexticons/outline/ChevronRightIcon';
import ArrowLeftIcon from 'nexticons/outline/ArrowLeftIcon';
import ArrowRightIcon from 'nexticons/outline/ArrowRightIcon';
import BellIcon from 'nexticons/outline/BellIcon';
import HomeIcon from 'nexticons/outline/HomeIcon';
import MapIcon from 'nexticons/outline/MapIcon';
import HomeSecondIcon from 'nexticons/outline/HomeSecondIcon';
import SearchUsersIcon from 'nexticons/outline/SearchUsersIcon';
import XIcon from 'nexticons/outline/XIcon';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        setUserEmail(user?.email ?? 'Admin');
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

  const menuItems = [
    { key: '/admin', label: 'Dashboard', href: '/admin', icon: <HomeIcon width={18} height={18} /> },
    { key: '/admin/simulasi-k3', label: 'Simulasi K3', href: '/admin/simulasi-k3', icon: <MapIcon width={18} height={18} /> },
    { key: '/management', label: 'Management Data', href: '/management', icon: <HomeSecondIcon width={18} height={18} /> },
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

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex-shrink-0 border-r border-slate-200 bg-white transition-all duration-200 lg:static lg:flex lg:flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'w-20' : 'w-72'
        )}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 px-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">SB</div>
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">MDB</p>
                <p className="truncate text-xs text-slate-500">Manajemen Data Bencana</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Tutup sidebar"
          >
            <XIcon width={18} height={18} />
          </button>
        </div>

        <div className="flex-1 px-3 py-6">
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            {sidebarCollapsed ? 'SB' : 'Panel admin'}
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = item.key === '/admin' ? pathname === '/admin' : pathname === item.key || pathname.startsWith(item.key);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {!sidebarCollapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4">
          <Button
            variant="outline"
            className={cn('w-full justify-start', sidebarCollapsed && 'justify-center px-2')}
            onClick={handleLogout}
          >
            {sidebarCollapsed ? <ArrowRightIcon width={18} height={18} /> : 'Keluar'}
          </Button>
        </div>
      </aside>

      <div className={cn('flex flex-1 flex-col', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72')}>
        <header
          className={cn(
            'fixed top-0 right-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6',
            sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'
          )}
        >
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
              <Input placeholder="search SDB" className="h-10 w-56 rounded-xl border-slate-200 bg-slate-50" />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              <BellIcon width={16} height={16} />
              <span className="font-semibold">3</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm transition hover:bg-slate-100">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{(userEmail ?? 'AD').slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="font-semibold text-slate-900">{userEmail?.split('@')[0] ?? 'Admin'}</span>
                    <span className="text-xs text-slate-500">{userEmail ?? 'admin'}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-default text-slate-900">{userEmail?.split('@')[0] ?? 'Admin'}</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-default text-slate-500">{userEmail ?? 'admin@example.com'}</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    router.push('/settings');
                  }}
                >
                  Setting
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    handleLogout();
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 mt-16">{children}</main>
      </div>
    </div>
  );
}
