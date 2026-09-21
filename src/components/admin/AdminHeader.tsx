'use client';

import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen, LayoutDashboard, LogOut } from 'lucide-react';
import AlertTicker from '@/components/dashboard/AlertTicker';

interface AdminHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  title: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  rightActions?: React.ReactNode;
}

export default function AdminHeader({
  isSidebarOpen,
  onToggleSidebar,
  title,
  badge,
  badgeColor = 'bg-teal-50 text-[#1f8080] border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
  icon,
  rightActions,
}: AdminHeaderProps) {
  const handleLogout = async () => {
    localStorage.removeItem('is_logged_in');
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const client = getSupabaseBrowserClient();
      if (client) {
        await client.auth.signOut();
      }
    } catch {
      // ignore
    }
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-[700] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs shrink-0 select-none">
      {/* Integrated Early Warning Alert Ticker */}
      <div className="border-b border-[#1f8080]/30 text-white">
        <AlertTicker onAlertClick={() => {}} />
      </div>

      {/* Header Controls Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Header Burger Trigger Button */}
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-2xs group cursor-pointer"
            title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-[#0a1e36] dark:group-hover:text-white transition-colors" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-[#1f8080] group-hover:text-[#0a1e36] dark:group-hover:text-white transition-colors" />
            )}
          </button>

          {/* Title & Badge */}
          <div className="flex items-center gap-2">
            {icon && (
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-[#1f8080] dark:text-teal-400">
                {icon}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-[#0a1e36] dark:text-white">
                {title}
              </span>
              {badge && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${badgeColor}`}
                >
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {rightActions}

          <Link
            href="/dashboard_k5"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all text-xs font-semibold cursor-pointer shadow-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Dashboard Utama</span>
          </Link>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all text-xs font-semibold cursor-pointer shadow-xs"
            title="Keluar dari akun"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
