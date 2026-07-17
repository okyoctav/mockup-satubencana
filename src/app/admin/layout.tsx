'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AdminAppSidebar } from '@/components/admin/AdminAppSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

// Routes where the main content should be edge-to-edge (no padding)
const FULLSIZE_ROUTES = ['/admin/simulasi-k3']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('demo@admin.local');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const isFullsize = FULLSIZE_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const supabase = getSupabaseBrowserClient();

      // No supabase configured → demo mode, allow access
      if (!supabase) {
        if (mounted) {
          setIsDemoMode(true);
          setReady(true);
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // No session → redirect to login
        router.replace('/login');
        return;
      }

      if (mounted) {
        setUserEmail(session.user.email ?? 'admin@satubencana.id');
        setIsDemoMode(false);
        setReady(true);
      }
    };

    void check();
    return () => { mounted = false; };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Memverifikasi sesi admin...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminAppSidebar />
      <SidebarInset>
        <AdminHeader userEmail={userEmail} isDemoMode={isDemoMode} />
        <main className={isFullsize ? 'flex flex-1 flex-col overflow-hidden' : 'flex flex-1 flex-col gap-4 p-4 md:p-6'}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
