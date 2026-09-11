'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import {
  ChevronDown,
  Home,
  Map,
  BarChart3,
  Info,
  Lock,
  Database,
  LayoutDashboard,
  Globe,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark/light mode"
      title={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
      className="flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm"
      style={{
        width: '40px',
        height: '40px',
        background: 'var(--toggle-bg)',
        border: '1.5px solid var(--toggle-border)',
        fontSize: '18px',
        flexShrink: 0,
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

interface NavbarProps {
  activePath?: string;
}

export default function Navbar({ activePath }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<'portal' | 'operasional' | null>(null);
  const pathname = usePathname();
  const currentPath = activePath || pathname || '/';

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleMouseEnter = (menu: 'portal' | 'operasional') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMegaMenu(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 150);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'var(--bg-navbar)' : 'var(--bg-navbar-solid)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-faint)',
      }}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 text-left shrink-0">
          <img
            src="/logo/logo_mdb.png"
            alt="Logo MDB SatuBencana"
            style={{ height: 36, width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        {/* Desktop Top-Level Navigation with Hover Triggered Mega Menus */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/40 dark:bg-slate-900/60 bg-white/40 p-1.5 rounded-full border border-white/20 dark:border-slate-700/50 backdrop-blur-md shadow-lg">
          {/* Direct Quick Link: Beranda */}
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
              currentPath === '/'
                ? 'bg-[#0EA5E9] text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>

          {/* Mega Menu Trigger 1: Portal Publik & Spasial */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('portal')}
          >
            <button
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeMegaMenu === 'portal' || ['/sejarah-kebencanaan', '/analisis-data', '/informasi-mitra'].includes(currentPath)
                  ? 'bg-[#0EA5E9] text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal Publik & Spasial</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMegaMenu === 'portal' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Mega Menu Trigger 2: Aplikasi & Operasional Data */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('operasional')}
          >
            <button
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeMegaMenu === 'operasional' || ['/login', '/management', '/dashboard_k5'].includes(currentPath)
                  ? 'bg-[#0EA5E9] text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aplikasi & Operasional Data</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMegaMenu === 'operasional' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </nav>

        {/* CTA Buttons + Theme Toggle (Right side) */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 flex items-center gap-1.5 shadow-sm"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-faint)'
              }}
            >
              <Lock className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span>Login Petugas</span>
            </Link>

            <Link
              href="/dashboard_k5"
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 text-white flex items-center gap-1.5 shadow-md"
              style={{
                background: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
              }}
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>Dashboard K5</span>
            </Link>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 rounded-xl bg-slate-800/20 border border-slate-700/40 text-slate-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-0.5 mb-1 transition-all bg-current" />
            <div className="w-5 h-0.5 mb-1 transition-all bg-current" />
            <div className="w-5 h-0.5 transition-all bg-current" />
          </button>
        </div>
      </div>

      {/* FULL-WIDTH MEGA MENU DROPDOWN 1: PORTAL PUBLIK & SPASIAL */}
      {activeMegaMenu === 'portal' && (
        <div
          className="absolute top-full left-0 right-0 w-full bg-slate-900/95 dark:bg-slate-900/95 bg-white/95 backdrop-blur-2xl border-b border-white/10 dark:border-slate-800/80 shadow-2xl transition-all duration-300 z-50 overflow-hidden"
          onMouseEnter={() => handleMouseEnter('portal')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Peta & Spasial */}
            <div>
              <h4 className="text-[11px] font-extrabold text-[#0EA5E9] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Map className="w-4 h-4" />
                <span>Peta & Visualisasi Spasial</span>
              </h4>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="group flex items-start gap-3.5 p-3 rounded-2xl transition-all hover:bg-white/10 dark:hover:bg-slate-800/60 border border-transparent hover:border-white/10"
                  onClick={() => setActiveMegaMenu(null)}
                >
                  <div className="p-2.5 rounded-xl bg-[#0EA5E9]/15 text-[#0EA5E9] group-hover:bg-[#0EA5E9] group-hover:text-white transition-colors">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0EA5E9] transition-colors flex items-center gap-2">
                      <span>Beranda Utama</span>
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      Landing page resmi portal geospasial SatuBencana dengan peta interaktif nasional.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/sejarah-kebencanaan"
                  className="group flex items-start gap-3.5 p-3 rounded-2xl transition-all hover:bg-white/10 dark:hover:bg-slate-800/60 border border-transparent hover:border-white/10"
                  onClick={() => setActiveMegaMenu(null)}
                >
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Map className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                      <span>Sejarah Kebencanaan</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-400 uppercase">Live Map</span>
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      Peta spasial interaktif fullpage & tur linimasa peristiwa historis bencana di Indonesia.
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Column 2: Analisis & Informasi Kemitraan */}
            <div>
              <h4 className="text-[11px] font-extrabold text-[#0EA5E9] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                <span>Analisis & Informasi Publik</span>
              </h4>
              <div className="space-y-3">
                <Link
                  href="/analisis-data"
                  className="group flex items-start gap-3.5 p-3 rounded-2xl transition-all hover:bg-white/10 dark:hover:bg-slate-800/60 border border-transparent hover:border-white/10"
                  onClick={() => setActiveMegaMenu(null)}
                >
                  <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                      <span>Analisis Data & Tren</span>
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      Grafik statistik, agregasi korban, statistik kerusakan, dan analisis tren bencana.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/informasi-mitra"
                  className="group flex items-start gap-3.5 p-3 rounded-2xl transition-all hover:bg-white/10 dark:hover:bg-slate-800/60 border border-transparent hover:border-white/10"
                  onClick={() => setActiveMegaMenu(null)}
                >
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      <span>Informasi & Kemitraan</span>
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      Dokumen publikasi, jejaring instansi mitra (BNPB, BMKG, PVMBG), dan panduan mitigasi.
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Column 3: Visual Featured Highlight Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-6 rounded-3xl border border-sky-500/20 text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#0EA5E9]/20 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#0EA5E9]/30 border border-[#0EA5E9]/50 text-[#0EA5E9] uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-3 h-3" />
                  <span>Geospasial Nasional</span>
                </span>
                <h4 className="text-lg font-bold text-white mb-2">
                  Eksplorasi Peta Kebencanaan Interaktif
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nikmati integrasi peta spasial fullpage dengan filter jenis bencana multiselect, linimasa animasi, dan arsip artikel berita terkait.
                </p>
              </div>

              <Link
                href="/sejarah-kebencanaan"
                className="mt-6 inline-flex items-center justify-between px-5 py-2.5 rounded-2xl bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold text-xs transition-all shadow-lg hover:translate-x-0.5 group"
                onClick={() => setActiveMegaMenu(null)}
              >
                <span>Buka Peta Fullscreen</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FULL-WIDTH MEGA MENU DROPDOWN 2: APLIKASI & OPERASIONAL DATA */}
      {activeMegaMenu === 'operasional' && (
        <div
          className="absolute top-full left-0 right-0 w-full bg-slate-900/95 dark:bg-slate-900/95 bg-white/95 backdrop-blur-2xl border-b border-white/10 dark:border-slate-800/80 shadow-2xl transition-all duration-300 z-50 overflow-hidden"
          onMouseEnter={() => handleMouseEnter('operasional')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Monitoring & Analytics */}
            <div>
              <h4 className="text-[11px] font-extrabold text-[#0EA5E9] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Monitoring & Analytics</span>
              </h4>
              <div className="space-y-3">
                <Link
                  href="/dashboard_k5"
                  className="group flex items-start gap-3.5 p-3 rounded-2xl transition-all hover:bg-white/10 dark:hover:bg-slate-800/60 border border-transparent hover:border-white/10"
                  onClick={() => setActiveMegaMenu(null)}
                >
                  <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-sky-400 transition-colors flex items-center gap-2">
                      <span>Dashboard K5</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-sky-500/20 text-sky-400 uppercase">Utama</span>
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      Analytics dashboard real-time untuk pemantauan indikator K5 dan statistik terintegrasi.
                    </p>
                  </div>
                </Link>

                <a
                  href="https://inarisk.bnpb.go.id/databencana/webgis/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3.5 p-3 rounded-2xl transition-all hover:bg-white/10 dark:hover:bg-slate-800/60 border border-transparent hover:border-white/10"
                  onClick={() => setActiveMegaMenu(null)}
                >
                  <div className="p-2.5 rounded-xl bg-orange-500/15 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-orange-400 transition-colors flex items-center gap-2">
                      <span>WebGIS Inarisk BNPB</span>
                      <ExternalLink className="w-3 h-3 text-orange-400 opacity-80" />
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      Peta spasial resmi kerentanan & indeks risiko bencana Indonesia milik BNPB.
                    </p>
                  </div>
                </a>
              </div>
            </div>

            {/* Column 2: Management & Auth */}
            <div>
              <h4 className="text-[11px] font-extrabold text-[#0EA5E9] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                <span>Otentikasi & Manajemen Data</span>
              </h4>
              <div className="space-y-3">
                <Link
                  href="/management"
                  className="group flex items-start gap-3.5 p-3 rounded-2xl transition-all hover:bg-white/10 dark:hover:bg-slate-800/60 border border-transparent hover:border-white/10"
                  onClick={() => setActiveMegaMenu(null)}
                >
                  <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                      <span>Manajemen Data</span>
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      Panel inventarisasi, entry data spasial, dan validasi data kejadian bencana.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/login"
                  className="group flex items-start gap-3.5 p-3 rounded-2xl transition-all hover:bg-white/10 dark:hover:bg-slate-800/60 border border-transparent hover:border-white/10"
                  onClick={() => setActiveMegaMenu(null)}
                >
                  <div className="p-2.5 rounded-xl bg-[#0EA5E9]/15 text-[#0EA5E9] group-hover:bg-[#0EA5E9] group-hover:text-white transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0EA5E9] transition-colors flex items-center gap-2">
                      <span>Login Portal Admin</span>
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      Portal login otentikasi hak akses bagi tim pengelola & administrator sistem.
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Column 3: Visual Operational Featured Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl border border-indigo-500/20 text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Sistem Realtime Active</span>
                </span>
                <h4 className="text-lg font-bold text-white mb-2">
                  Pusat Kendali & Analytics Kebencanaan
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Akses langsung ke Dashboard K5 dan Layanan WebGIS resmi BNPB untuk mendukung pengambilan keputusan berbasis data spasial presisi.
                </p>
              </div>

              <a
                href="https://inarisk.bnpb.go.id/databencana/webgis/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-between px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs transition-all shadow-lg hover:translate-x-0.5 group"
                onClick={() => setActiveMegaMenu(null)}
              >
                <span>Akses WebGIS Inarisk ↗</span>
                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MENU ACCORDION */}
      {menuOpen && (
        <div
          className="lg:hidden px-6 pb-6 pt-2 max-h-[85vh] overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg-navbar-solid)',
            borderBottom: '1px solid var(--border-faint)',
          }}
        >
          <div className="space-y-4">
            {/* Group 1: Portal Publik */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4">
              <h5 className="text-[11px] font-extrabold text-[#0EA5E9] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Portal Publik & Spasial</span>
              </h5>
              <div className="space-y-2">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold ${
                    currentPath === '/' ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4 text-[#0EA5E9]" />
                  <span>Beranda Utama</span>
                </Link>
                <Link
                  href="/sejarah-kebencanaan"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold ${
                    currentPath === '/sejarah-kebencanaan' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Map className="w-4 h-4 text-amber-400" />
                  <span>Sejarah Kebencanaan</span>
                </Link>
                <Link
                  href="/analisis-data"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold ${
                    currentPath === '/analisis-data' ? 'text-purple-400 bg-purple-500/10' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Analisis Data & Tren</span>
                </Link>
                <Link
                  href="/informasi-mitra"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold ${
                    currentPath === '/informasi-mitra' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Info className="w-4 h-4 text-emerald-400" />
                  <span>Informasi & Kemitraan</span>
                </Link>
              </div>
            </div>

            {/* Group 2: Aplikasi & Operasional */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4">
              <h5 className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Aplikasi & Operasional Data</span>
              </h5>
              <div className="space-y-2">
                <Link
                  href="/dashboard_k5"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold ${
                    currentPath === '/dashboard_k5' ? 'text-sky-400 bg-sky-500/10' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-sky-400" />
                  <span>Dashboard K5</span>
                </Link>
                <Link
                  href="/management"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold ${
                    currentPath === '/management' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Manajemen Data</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold ${
                    currentPath === '/login' ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Lock className="w-4 h-4 text-[#0EA5E9]" />
                  <span>Login Petugas</span>
                </Link>
                <a
                  href="https://inarisk.bnpb.go.id/databencana/webgis/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-orange-400 hover:text-orange-300"
                >
                  <Globe className="w-4 h-4 text-orange-400" />
                  <span>WebGIS Inarisk ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
