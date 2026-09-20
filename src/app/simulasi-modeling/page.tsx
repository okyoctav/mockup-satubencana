'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import AlertTicker from '@/components/dashboard/AlertTicker';
import SimulasiModelingView from '@/components/simulasi/SimulasiModelingView';
import {
  LayoutDashboard,
  Activity,
  Sparkles,
  Database,
  Users,
  KeyRound,
  Home,
  BookOpen,
  RefreshCw,
  Handshake,
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Waves,
} from 'lucide-react';

export default function SimulasiModelingPage() {
  const { theme, toggle } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // Authentication check matching dashboard_k5
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const client = getSupabaseBrowserClient();
        if (!client) {
          setAuthLoading(false);
          return;
        }

        const {
          data: { session },
        } = await client.auth.getSession();
        if (!session) {
          const localAuth = localStorage.getItem('is_logged_in') === 'true';
          if (!localAuth) {
            window.location.href = '/login?next=/simulasi-modeling';
            return;
          }
        }
      } catch {
        // continue
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wider text-slate-300">
          Memeriksa Sesi Autentikasi Pengguna...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white text-slate-800 font-sans selection:bg-[#1f8080] selection:text-white antialiased relative">
      {/* 1. LEFT SIDEBAR NAVIGATION (Identik dengan Dashboard K5) */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-[#0a1e36] text-white flex flex-col shrink-0 border-r border-[#0a1e36]/20 shadow-lg z-30 sticky top-0 h-screen transition-all duration-300 ease-in-out`}
      >
        {/* Brand Header */}
        <div
          className={`p-4 border-b border-white/10 flex items-center ${
            isSidebarOpen ? 'justify-between' : 'justify-center'
          }`}
        >
          {isSidebarOpen ? (
            <img
              src="/logo/logo_mdb.png"
              alt="Logo MDB"
              className="h-10 w-auto object-contain brightness-0 invert transition-transform hover:scale-105 duration-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white tracking-widest">
              MDB
            </div>
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
                } py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:bg-white/10 hover:text-white`}
                title={!isSidebarOpen ? 'Dashboard' : undefined}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {isSidebarOpen && <span>Dashboard</span>}
              </Link>

              {/* ACTIVE ITEM: Simulasi Modeling */}
              <div
                className={`w-full flex items-center ${
                  isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } py-2.5 rounded-xl text-xs font-bold transition-all bg-[#1f8080] text-white shadow-md`}
                title={!isSidebarOpen ? 'Simulasi Modeling (FastFlood)' : undefined}
              >
                <Activity className="w-4 h-4 shrink-0 text-emerald-300" />
                {isSidebarOpen && (
                  <span className="flex items-center justify-between flex-1">
                    <span>Simulasi Modeling</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono font-bold">
                      2D
                    </span>
                  </span>
                )}
              </div>

              <Link
                href="/dashboard_k5?tab=ai"
                className={`w-full flex items-center ${
                  isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:bg-white/10 hover:text-white`}
                title={!isSidebarOpen ? 'CAKNA AI' : undefined}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-purple-300" />
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
              <a
                href="/management"
                className={`flex items-center ${
                  isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'Manajemen Data' : undefined}
              >
                <Database className="w-4 h-4 text-teal-400 shrink-0" />
                {isSidebarOpen && <span>Manajemen Data</span>}
              </a>

              <a
                href="/admin/roles"
                className={`flex items-center ${
                  isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'Manajemen Users' : undefined}
              >
                <Users className="w-4 h-4 text-teal-400 shrink-0" />
                {isSidebarOpen && <span>Manajemen Users</span>}
              </a>

              <a
                href="/api-testing"
                className={`flex items-center ${
                  isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'API Token' : undefined}
              >
                <KeyRound className="w-4 h-4 text-teal-400 shrink-0" />
                {isSidebarOpen && <span>API Token</span>}
              </a>
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
              <a
                href="/"
                className={`flex items-center ${
                  isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'Landing Page' : undefined}
              >
                <Home className="w-4 h-4 text-sky-400 shrink-0" />
                {isSidebarOpen && <span>Landing Page</span>}
              </a>

              <a
                href="/sejarah-kebencanaan"
                className={`flex items-center ${
                  isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'Arsip & Artikel' : undefined}
              >
                <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                {isSidebarOpen && <span>Arsip & Artikel</span>}
              </a>

              <a
                href="/analisis-data"
                className={`flex items-center ${
                  isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'DIBI Update' : undefined}
              >
                <RefreshCw className="w-4 h-4 text-sky-400 shrink-0" />
                {isSidebarOpen && <span>DIBI Update</span>}
              </a>

              <a
                href="/informasi-mitra"
                className={`flex items-center ${
                  isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'Informasi & Mitra' : undefined}
              >
                <Handshake className="w-4 h-4 text-sky-400 shrink-0" />
                {isSidebarOpen && <span>Informasi & Mitra</span>}
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div
          className={`p-3 border-t border-white/10 bg-[#0a1e36]/90 flex items-center ${
            isSidebarOpen ? 'justify-between' : 'justify-center flex-col gap-2'
          } text-xs`}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title={!isSidebarOpen ? 'Logout / Keluar' : undefined}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            {isSidebarOpen && <span className="font-semibold text-[11px]">Logout</span>}
          </button>

          <button
            onClick={toggle}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-200" />
            )}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA: HEADER DENGAN ALERT TICKER + FULL HEIGHT SIMULASI MODELING BANJIR 2D SAJA */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 h-screen overflow-hidden">
        {/* Top Header Wrapper with Integrated Early Warning Ticker (Identik dengan Dashboard K5) */}
        <header className="sticky top-0 z-[700] bg-white border-b border-slate-200 shadow-2xs shrink-0">
          {/* Integrated Early Warning Alert Ticker */}
          <div className="border-b border-[#1f8080]/30 text-white">
            <AlertTicker onAlertClick={() => {}} />
          </div>

          {/* Header Controls Bar */}
          <div className="px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap bg-white">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Header Burger Trigger Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#0a1e36] transition-all shadow-2xs group cursor-pointer"
                title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4 text-slate-600 group-hover:text-[#0a1e36] transition-colors" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4 text-[#1f8080] group-hover:text-[#0a1e36] transition-colors" />
                )}
              </button>

              {/* Title & Badge */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-[#1f8080]">
                  <Waves className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0a1e36]">
                    Simulasi Modeling Banjir 2D
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-[#1f8080] border border-teal-200 font-bold">
                    FastFlood Engine SFFS
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard_k5"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#0a1e36] transition-all text-xs font-semibold cursor-pointer shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                <span>Dashboard Utama</span>
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0a1e36] transition-all text-xs font-semibold cursor-pointer shadow-xs"
                title="Keluar dari akun"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* 3. DEDICATED WORKSPACE: FULL HEIGHT SIMULASI MODELING BANJIR 2D SAJA */}
        <main className="flex-1 w-full h-[calc(100vh-85px)] relative overflow-hidden">
          <SimulasiModelingView embedded />
        </main>
      </div>
    </div>
  );
}
