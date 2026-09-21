'use client';

import Link from 'next/link';
import MenuIcon from 'nexticons/outline/MenuIcon';
import ChevronLeftIcon from 'nexticons/outline/ChevronLeftIcon';
import MapIcon from 'nexticons/outline/MapIcon';
import SignOutIcon from 'nexticons/outline/SignOutIcon';
import AlertTicker from '@/components/dashboard/AlertTicker';

interface AdminHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  title: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  rightActions?: React.ReactNode;
  showDashboardLink?: boolean;
}

export default function AdminHeader({
  isSidebarOpen,
  onToggleSidebar,
  title,
  badge,
  badgeColor = 'bg-teal-50 text-[#1f8080] border-teal-200',
  icon,
  rightActions,
  showDashboardLink = true,
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
    <header className="sticky top-0 z-[700] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs shrink-0 select-none">
      {/* Integrated Early Warning Alert Ticker */}
      <div className="border-b border-[#1f8080]/30 text-white bg-[#0a1e36]">
        <AlertTicker onAlertClick={() => {}} />
      </div>

      {/* Header Controls Bar - Solid Materialized Elevation */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Header Burger Trigger Button */}
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-xs cursor-pointer"
            title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
          >
            {isSidebarOpen ? (
              <ChevronLeftIcon width={18} height={18} />
            ) : (
              <MenuIcon width={18} height={18} />
            )}
          </button>

          {/* Title & Badge */}
          <div className="flex items-center gap-2">
            {icon && (
              <div className="p-1.5 rounded-xl bg-teal-50 border border-teal-200 text-[#1f8080] flex items-center justify-center shadow-2xs">
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

          {showDashboardLink && (
            <Link
              href="/dashboard_k5"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all text-xs font-semibold cursor-pointer shadow-xs"
            >
              <span className="text-slate-500 dark:text-slate-400 flex items-center justify-center">
                <MapIcon width={15} height={15} />
              </span>
              <span className="hidden sm:inline">Dashboard Utama</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all text-xs font-semibold cursor-pointer shadow-xs"
            title="Keluar dari akun"
          >
            <span className="text-slate-500 dark:text-slate-400 flex items-center justify-center">
              <SignOutIcon width={15} height={15} />
            </span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
