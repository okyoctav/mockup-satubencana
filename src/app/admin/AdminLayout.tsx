'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getUserRole } from '@/lib/auth/getUserRole';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      const client = getSupabaseBrowserClient();
      if (!client) {
        if (active) {
          router.replace('/login');
        }
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        if (active) router.replace('/login');
        return;
      }

      const { role, error } = await getUserRole(client);
      if (!active) return;

      const {
        data: { user },
      } = await client.auth.getUser();

      if (error) {
        if (active) {
          setUserEmail(user?.email ?? null);
          setReady(true);
        }
        return;
      }

      if (role !== 'admin') {
        if (active) {
          setUserEmail(user?.email ?? null);
          setReady(true);
        }
        return;
      }

      if (active) {
        setUserEmail(user?.email ?? null);
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
    {
      key: '/admin',
      label: 'Dashboard',
      href: '/admin',
    },
    {
      key: '/management',
      label: 'Management Data',
      href: '/management',
    },
    {
      key: '/admin/roles',
      label: 'Users & Roles',
      href: '/admin/roles',
    },
  ];

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-muted"
      >
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Memverifikasi akses admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className="w-64 bg-card border-r border-border flex-shrink-0"
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center">
              SB
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">SATUBENCANA</p>
              <p className="text-xs text-muted-foreground">Admin Console</p>
            </div>
          </div>
          <Button
            asChild
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="p-1"
          >
            {/* Simple logout icon (you can replace with actual icon later) */}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </Button>
        </div>

        <nav className="mt-6 space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.key}
              asChild
              variant={pathname === item.key ? "default" : "ghost"}
              size="default"
              className={cn(
                "w-full text-left",
                pathname === item.key && "bg-primary/10"
              )}
              onClick={() => router.push(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header
          className="h-16 bg-card border-b border-border flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {userEmail ?? 'Admin'}
            </span>
            <Button
              variant="outline"
              onClick={handleLogout}
              size="sm"
            >
              Keluar
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}