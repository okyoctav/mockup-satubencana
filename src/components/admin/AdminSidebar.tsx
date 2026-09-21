'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import MapIcon from 'nexticons/outline/MapIcon';
import SpeedometerIcon from 'nexticons/outline/SpeedometerIcon';
import CircleGraphIcon from 'nexticons/outline/CircleGraphIcon';
import ServerIcon from 'nexticons/outline/ServerIcon';
import SearchUsersIcon from 'nexticons/outline/SearchUsersIcon';
import LockIcon from 'nexticons/outline/LockIcon';
import HomeIcon from 'nexticons/outline/HomeIcon';
import OpenBookIcon from 'nexticons/outline/OpenBookIcon';
import RepeatIcon from 'nexticons/outline/RepeatIcon';
import GroupIcon from 'nexticons/outline/GroupIcon';
import SignOutIcon from 'nexticons/outline/SignOutIcon';
import MoonIcon from 'nexticons/outline/MoonIcon';
import UpdatesIcon from 'nexticons/outline/UpdatesIcon';

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  onToggleSidebar?: () => void;
  activePathOverride?: string;
}

export default function AdminSidebar({
  isSidebarOpen,
  activePathOverride,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const currentPath = activePathOverride || pathname;
  const { theme, toggle } = useTheme();

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

  const isRouteActive = (path: string) => {
    if (path === '/dashboard_k5' && currentPath === '/dashboard_k5') return true;
    if (path === '/simulasi-modeling' && currentPath === '/simulasi-modeling') return true;
    if (path === '/manajemen-data-bencana' && (currentPath === '/manajemen-data-bencana' || currentPath === '/management')) return true;
    if (path === '/admin/roles' && currentPath === '/admin/roles') return true;
    if (path === '/api-testing' && currentPath === '/api-testing') return true;
    if (path === '/' && currentPath === '/') return true;
    if (path === '/sejarah-kebencanaan' && currentPath === '/sejarah-kebencanaan') return true;
    if (path === '/analisis-data' && currentPath === '/analisis-data') return true;
    if (path === '/informasi-mitra' && currentPath === '/informasi-mitra') return true;
    return false;
  };

  return (
    <aside
      className={`${
        isSidebarOpen ? 'w-64' : 'w-20'
      } bg-[#0a1e36] text-white flex flex-col shrink-0 border-r border-[#152e4d] shadow-md z-30 sticky top-0 h-screen transition-all duration-300 ease-in-out select-none`}
    >
      {/* Brand Header - Solid Material Surface */}
      <div
        className={`p-4 border-b border-[#152e4d] flex items-center ${
          isSidebarOpen ? 'justify-between' : 'justify-center'
        } bg-[#08182b]`}
      >
        {isSidebarOpen ? (
          <Link href="/dashboard_k5">
            <img
              src="/logo/logo_mdb.png"
              alt="Logo MDB"
              className="h-10 w-auto object-contain brightness-0 invert transition-transform hover:scale-105 duration-200 cursor-pointer"
            />
          </Link>
        ) : (
          <Link
            href="/dashboard_k5"
            className="w-10 h-10 rounded-xl bg-[#132c4d] border border-[#1e4273] flex items-center justify-center font-bold text-white tracking-widest hover:bg-[#1a3b66] transition-all cursor-pointer shadow-xs"
          >
            MDB
          </Link>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="px-3 py-4 flex-1 space-y-5 overflow-y-auto overflow-x-hidden">
        {/* 1. MENU UTAMA */}
        <div>
          {isSidebarOpen && (
            <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Menu Utama
            </div>
          )}
          <nav className="space-y-1">
            <Link
              href="/dashboard_k5"
              className={`w-full flex items-center ${
                isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isRouteActive('/dashboard_k5')
                  ? 'bg-[#1f8080] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#132c4d] hover:text-white'
              }`}
              title={!isSidebarOpen ? 'Dashboard' : undefined}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5 text-slate-200">
                <MapIcon width={18} height={18} />
              </span>
              {isSidebarOpen && <span>Dashboard</span>}
            </Link>

            <Link
              href="/simulasi-modeling"
              className={`w-full flex items-center ${
                isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isRouteActive('/simulasi-modeling')
                  ? 'bg-[#1f8080] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#132c4d] hover:text-white'
              }`}
              title={!isSidebarOpen ? 'Simulasi Modeling (FastFlood)' : undefined}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5 text-emerald-300">
                <SpeedometerIcon width={18} height={18} />
              </span>
              {isSidebarOpen && (
                <span className="flex items-center justify-between flex-1">
                  <span>Simulasi Modeling</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#132c4d] text-emerald-300 border border-emerald-500 font-mono font-bold">
                    2D
                  </span>
                </span>
              )}
            </Link>

            <Link
              href="/dashboard_k5?tab=ai"
              className={`w-full flex items-center ${
                isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:bg-[#132c4d] hover:text-white`}
              title={!isSidebarOpen ? 'CAKNA AI' : undefined}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5 text-purple-300">
                <CircleGraphIcon width={18} height={18} />
              </span>
              {isSidebarOpen && <span>CAKNA AI</span>}
            </Link>
          </nav>
        </div>

        {/* 2. AKSES SISTEM */}
        <div>
          {isSidebarOpen && (
            <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Akses Sistem
            </div>
          )}
          <div className="space-y-1 text-xs">
            <Link
              href="/manajemen-data-bencana"
              className={`flex items-center ${
                isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                isRouteActive('/manajemen-data-bencana')
                  ? 'bg-[#1f8080] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#132c4d] hover:text-white'
              }`}
              title={!isSidebarOpen ? 'Manajemen Data Bencana' : undefined}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5 text-teal-400">
                <ServerIcon width={18} height={18} />
              </span>
              {isSidebarOpen && <span>Manajemen Data Bencana</span>}
            </Link>

            <Link
              href="/admin/roles"
              className={`flex items-center ${
                isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                isRouteActive('/admin/roles')
                  ? 'bg-[#1f8080] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#132c4d] hover:text-white'
              }`}
              title={!isSidebarOpen ? 'Manajemen Users' : undefined}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5 text-teal-400">
                <SearchUsersIcon width={18} height={18} />
              </span>
              {isSidebarOpen && <span>Manajemen Users</span>}
            </Link>

            <Link
              href="/api-testing"
              className={`flex items-center ${
                isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                isRouteActive('/api-testing')
                  ? 'bg-[#1f8080] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#132c4d] hover:text-white'
              }`}
              title={!isSidebarOpen ? 'API Token' : undefined}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5 text-teal-400">
                <LockIcon width={18} height={18} />
              </span>
              {isSidebarOpen && <span>API Token</span>}
            </Link>
          </div>
        </div>

        {/* 3. KONTEN */}
        <div>
          {isSidebarOpen && (
            <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Konten
            </div>
          )}
          <div className="space-y-1 text-xs">
            <Link
              href="/"
              className={`flex items-center ${
                isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2 rounded-xl text-slate-300 hover:bg-[#132c4d] hover:text-white transition-colors font-medium cursor-pointer`}
              title={!isSidebarOpen ? 'Landing Page' : undefined}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5 text-sky-400">
                <HomeIcon width={18} height={18} />
              </span>
              {isSidebarOpen && <span>Landing Page</span>}
            </Link>

            <Link
              href="/sejarah-kebencanaan"
              className={`flex items-center ${
                isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2 rounded-xl text-slate-300 hover:bg-[#132c4d] hover:text-white transition-colors font-medium cursor-pointer`}
              title={!isSidebarOpen ? 'Arsip & Artikel' : undefined}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5 text-sky-400">
                <OpenBookIcon width={18} height={18} />
              </span>
              {isSidebarOpen && <span>Arsip & Artikel</span>}
            </Link>

            <Link
              href="/analisis-data"
              className={`flex items-center ${
                isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2 rounded-xl text-slate-300 hover:bg-[#132c4d] hover:text-white transition-colors font-medium cursor-pointer`}
              title={!isSidebarOpen ? 'DIBI Update' : undefined}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5 text-sky-400">
                <RepeatIcon width={18} height={18} />
              </span>
              {isSidebarOpen && <span>DIBI Update</span>}
            </Link>

            <Link
              href="/informasi-mitra"
              className={`flex items-center ${
                isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2 rounded-xl text-slate-300 hover:bg-[#132c4d] hover:text-white transition-colors font-medium cursor-pointer`}
              title={!isSidebarOpen ? 'Informasi & Mitra' : undefined}
            >
              <span className="shrink-0 flex items-center justify-center w-5 h-5 text-sky-400">
                <GroupIcon width={18} height={18} />
              </span>
              {isSidebarOpen && <span>Informasi & Mitra</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Sidebar Footer - Solid Surface */}
      <div
        className={`p-3 border-t border-[#152e4d] bg-[#08182b] flex items-center ${
          isSidebarOpen ? 'justify-between' : 'justify-center flex-col gap-2'
        } text-xs`}
      >
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-[#132c4d] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          title={!isSidebarOpen ? 'Logout / Keluar' : undefined}
        >
          <span className="shrink-0 text-slate-400">
            <SignOutIcon width={16} height={16} />
          </span>
          {isSidebarOpen && <span className="font-semibold text-[11px]">Logout</span>}
        </button>

        <button
          onClick={toggle}
          className="p-2 rounded-lg bg-[#132c4d] border border-[#1e4273] text-white hover:bg-[#1a3b66] transition-colors cursor-pointer shadow-xs"
          title="Ganti Tema"
        >
          {theme === 'dark' ? (
            <span className="text-amber-300 flex items-center justify-center">
              <UpdatesIcon width={16} height={16} />
            </span>
          ) : (
            <span className="text-slate-200 flex items-center justify-center">
              <MoonIcon width={16} height={16} />
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
