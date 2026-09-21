'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import AlertTicker from '@/components/dashboard/AlertTicker';
import StatCards from '@/components/dashboard/StatCards';
import DashboardMapK5 from '@/components/dashboard/DashboardMapK5';
import FilterPanel, { JENIS_CONFIG, JENIS_LIST } from '@/components/dashboard/FilterPanel';
import ChartSection from '@/components/dashboard/ChartSection';
import AnalysisModelsSection from '@/components/dashboard/AnalysisModelsSection';
import LogisticAnalysisSection from '@/components/dashboard/LogisticAnalysisSection';
import bencanaData from '@/data/bencana.json';
import WilayahDropdown, { FilterWilayah } from '@/components/dashboard/WilayahDropdown';
import {
  MapPin,
  BarChart3,
  ShieldAlert,
  Layers,
  PackageCheck,
  HeartPulse,
  School,
  Sprout,
  Zap,
  Truck,
  Database,
  Sun,
  Moon,
  Filter,
  LayoutDashboard,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  LogOut,
  Activity,
  Users,
  KeyRound,
  Home,
  BookOpen,
  RefreshCw,
  Handshake,
} from 'lucide-react';

type Kejadian = {
  id: number;
  nama: string;
  provinsi: string;
  kabupaten: string;
  lat: number;
  lng: number;
  jenis: string;
  tanggal: string;
  korban_jiwa: number;
  pengungsi: number;
  rumah_terdampak?: number;
  status: string;
  level: string;
};

const allData = bencanaData.kejadian as Kejadian[];

import MedicalEmergencySection from '@/components/dashboard/MedicalEmergencySection';
import InfrastructureEducationSection from '@/components/dashboard/InfrastructureEducationSection';
import EconomicAgricultureLossSection from '@/components/dashboard/EconomicAgricultureLossSection';
import UtilitiesEnergySection from '@/components/dashboard/UtilitiesEnergySection';
import AccessibilityRouteSection from '@/components/dashboard/AccessibilityRouteSection';
import AiGenerateSection from '@/components/dashboard/AiGenerateSection';
import GempaNttSection from '@/components/dashboard/GempaNttSection';

import { EstimationData } from '@/components/dashboard/LogisticAnalysisSection';

export default function DashboardK5Page() {
  const [, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const client = getSupabaseBrowserClient();
        if (!client) {
          // If Supabase not configured, allow access or check localStorage
          const localAuth = localStorage.getItem('is_logged_in') === 'true';
          if (!localAuth && process.env.NEXT_PUBLIC_SUPABASE_URL) {
            window.location.href = '/login?next=/dashboard_k5';
            return;
          }
          setIsAuthenticated(true);
          setAuthLoading(false);
          return;
        }

        const { data: { session } } = await client.auth.getSession();
        if (!session) {
          const localAuth = localStorage.getItem('is_logged_in') === 'true';
          if (!localAuth) {
            window.location.href = '/login?next=/dashboard_k5';
            return;
          }
        }
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(true);
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

  const { theme, toggle } = useTheme();
  const [showBumper, setShowBumper] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [filters, setFilters] = useState({ jenis: 'Semua', status: 'Semua', level: 'Semua' });
  const [activeFilter, setActiveFilter] = useState<FilterWilayah | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'models' | 'logistics' | 'medical' | 'infrastructure' | 'economic' | 'utilities' | 'routes' | 'ai' | 'gempa_ntt'>('map');
  const [drawEstimation, setDrawEstimation] = useState<EstimationData | null>(null);
  const [activeOverlays, setActiveOverlays] = useState<string[]>([]);
  const isFotoGeotagNttActive = activeOverlays.includes('foto_geotag_ntt') || activeOverlays.includes('gempa_ntt_2026_v2');

  useEffect(() => {
    if (!isFotoGeotagNttActive && activeTab === 'gempa_ntt') {
      setActiveTab('map');
    }
  }, [isFotoGeotagNttActive, activeTab]);

  // First-time visit Bumper Video check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasPlayedBumper = sessionStorage.getItem('mdb_bumper_played');
      if (!hasPlayedBumper) {
        setShowBumper(true);
      }
    }
  }, []);

  const handleFinishBumper = () => {
    setShowBumper(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mdb_bumper_played', 'true');
    }
  };

  const handleClearSearch = () => {
    setActiveFilter(null);
  };

  const handleDropdownFilter = (f: FilterWilayah | null) => {
    setActiveFilter(f);
    if (f) {
      setFlyTo({ lat: f.lat, lng: f.lng, zoom: f.tipe === 'provinsi' ? 8 : 11 });
    }
  };

  const handleAlertClick = (lat: number, lng: number) => {
    setFlyTo({ lat, lng, zoom: 12 });
  };

  const handleEventClick = (lat: number, lng: number) => {
    setFlyTo({ lat, lng, zoom: 13 });
  };

  const regionFilteredData = useMemo<Kejadian[]>(() => {
    if (!activeFilter) return allData;
    if (activeFilter.tipe === 'provinsi') {
      const q = activeFilter.nama.toLowerCase();
      return allData.filter((k) => k.provinsi.toLowerCase() === q || k.provinsi.toLowerCase().includes(q));
    }
    const q = activeFilter.nama.toLowerCase();
    return allData.filter((k) => k.kabupaten.toLowerCase() === q || k.kabupaten.toLowerCase().includes(q));
  }, [activeFilter]);

  const filteredData = useMemo<Kejadian[]>(() => {
    return regionFilteredData.filter((k) => {
      if (filters.jenis !== 'Semua' && k.jenis !== filters.jenis) return false;
      if (filters.status !== 'Semua' && k.status !== filters.status) return false;
      if (filters.level !== 'Semua' && k.level !== filters.level) return false;
      return true;
    });
  }, [regionFilteredData, filters]);

    if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wider text-slate-300">Memeriksa Sesi Autentikasi Pengguna...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white text-slate-800 font-sans selection:bg-[#1f8080] selection:text-white antialiased relative dashboard-k5-container">
      {/* FULLSCREEN BUMPER LOGO VIDEO (Played 1x on first-time visit) */}
      {showBumper && (
        <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-500">
          <video
            autoPlay
            muted
            playsInline
            onEnded={handleFinishBumper}
            onError={handleFinishBumper}
            className="w-full h-full object-cover sm:object-contain"
          >
            <source src="/logo/bumperlogo.mp4" type="video/mp4" />
            Browser Anda tidak mendukung tag video.
          </video>

          {/* SKIP BUTTON */}
          <button
            onClick={handleFinishBumper}
            className="absolute bottom-6 right-6 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer z-[100000]"
          >
            <span>Lewati Intro</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* 1. LEFT SIDEBAR NAVIGATION WITH TOGGLE */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-[#0a1e36] text-white flex flex-col shrink-0 border-r border-[#0a1e36]/20 shadow-lg z-30 sticky top-0 h-screen transition-all duration-300 ease-in-out`}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b border-white/10 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
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
              <button
                onClick={() => setActiveTab('map')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-[#1f8080] text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title={!isSidebarOpen ? 'Dashboard' : undefined}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {isSidebarOpen && <span>Dashboard</span>}
              </button>

              <Link
                href="/simulasi-modeling"
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-300 hover:bg-white/10 hover:text-white`}
                title={!isSidebarOpen ? 'Simulasi Modeling (FastFlood)' : undefined}
              >
                <Activity className="w-4 h-4 shrink-0 text-emerald-400" />
                {isSidebarOpen && (
                  <span className="flex items-center justify-between flex-1">
                    <span>Simulasi Modeling</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">2D</span>
                  </span>
                )}
              </Link>

              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ai'
                    ? 'bg-[#1f8080] text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title={!isSidebarOpen ? 'CAKNA AI' : undefined}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-purple-300" />
                {isSidebarOpen && <span>CAKNA AI</span>}
              </button>
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
                className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'Manajemen Data Bencana' : undefined}
              >
                <Database className="w-4 h-4 text-teal-400 shrink-0" />
                {isSidebarOpen && <span>Manajemen Data Bencana</span>}
              </Link>

              <a
                href="/admin/roles"
                className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'Manajemen Users' : undefined}
              >
                <Users className="w-4 h-4 text-teal-400 shrink-0" />
                {isSidebarOpen && <span>Manajemen Users</span>}
              </a>

              <a
                href="/api-testing"
                className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
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
                className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'Landing Page' : undefined}
              >
                <Home className="w-4 h-4 text-sky-400 shrink-0" />
                {isSidebarOpen && <span>Landing Page</span>}
              </a>

              <a
                href="/sejarah-kebencanaan"
                className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'Arsip & Artikel' : undefined}
              >
                <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                {isSidebarOpen && <span>Arsip & Artikel</span>}
              </a>

              <a
                href="/analisis-data"
                className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'DIBI Update' : undefined}
              >
                <RefreshCw className="w-4 h-4 text-sky-400 shrink-0" />
                {isSidebarOpen && <span>DIBI Update</span>}
              </a>

              <a
                href="/informasi-mitra"
                className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium`}
                title={!isSidebarOpen ? 'Informasi & Mitra' : undefined}
              >
                <Handshake className="w-4 h-4 text-sky-400 shrink-0" />
                {isSidebarOpen && <span>Informasi & Mitra</span>}
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t border-white/10 bg-[#0a1e36]/90 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center flex-col gap-2'} text-xs`}>
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
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
          </button>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Header Wrapper with Integrated Early Warning Ticker */}
        <header className="sticky top-0 z-[700] bg-white border-b border-slate-200 shadow-2xs">
          {/* Integrated Early Warning Alert Ticker */}
          <div className="border-b border-[#1f8080]/30 text-white">
            <AlertTicker onAlertClick={handleAlertClick} />
          </div>

          {/* Header Controls Bar */}
          <div className="px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Header Burger Trigger Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#0a1e36] transition-all shadow-2xs group"
                title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4 text-slate-600 group-hover:text-[#0a1e36] transition-colors" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4 text-[#1f8080] group-hover:text-[#0a1e36] transition-colors" />
                )}
              </button>

              <WilayahDropdown onSelect={handleDropdownFilter} theme={theme} />
              {activeFilter && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1f8080]/10 border border-[#1f8080]/30 text-xs text-[#0a1e36] font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-[#1f8080]" />
                  <span>{activeFilter.tipe === 'provinsi' ? 'Provinsi' : 'Kab/Kota'}:</span>
                  <strong className="text-[#0a1e36]">{activeFilter.nama}</strong>
                  <span className="text-slate-500 font-normal">— {regionFilteredData.length} kejadian</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
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

        {/* Scrollable Content Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* 1. HERO SIMULATION STEP 1: PILIH JENIS BENCANA (HIGH-PRIORITY CALLOUT) */}
          <section
            className={`bg-white rounded-2xl p-4 sm:p-5 transition-all duration-300 ${
              filters.jenis === 'Semua'
                ? 'border-2 border-[#1f8080] shadow-lg ring-4 ring-[#1f8080]/15'
                : 'border border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0a1e36] text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-[#0a1e36]">
                      Mulai Simulasi: Pilih Jenis Bencana
                    </h2>
                    {filters.jenis === 'Semua' ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Langkah Utama · Klik Jenis Bencana
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Simulasi Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tentukan kategori bencana utama sebagai basis pemodelan spasial, analisis logistik, fasilitas, dan respon darurat.
                  </p>
                </div>
              </div>

              {/* Status Indicator & Reset */}
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                {filters.jenis !== 'Semua' ? (
                  <>
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5"
                      style={{ backgroundColor: JENIS_CONFIG[filters.jenis]?.color || '#0a1e36' }}
                    >
                      <span className="text-sm">{JENIS_CONFIG[filters.jenis]?.icon}</span>
                      <span>Skenario: {JENIS_CONFIG[filters.jenis]?.label}</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono font-normal">
                        {filteredData.length} Titik
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilters({ ...filters, jenis: 'Semua' })}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    >
                      Reset Pilihan
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl animate-pulse">
                    <span>👆</span>
                    <span>Klik salah satu bencana di bawah ini untuk memulai</span>
                  </div>
                )}
              </div>
            </div>

            {/* Grid of Disaster Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 pt-3">
              {JENIS_LIST.map((j) => {
                const isSelected = filters.jenis === j;
                const cfg = JENIS_CONFIG[j];
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setFilters({ ...filters, jenis: j })}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative ${
                      isSelected
                        ? 'text-white shadow-md scale-105 ring-2 ring-offset-1 ring-[#0a1e36]/30'
                        : filters.jenis === 'Semua'
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 hover:border-[#1f8080] hover:scale-102 hover:shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                    }`}
                    style={{
                      backgroundColor: isSelected ? cfg.color : undefined,
                      boxShadow: isSelected ? `0 4px 14px ${cfg.color}55` : undefined,
                    }}
                    title={`Pilih skenario simulasi: ${cfg.label}`}
                  >
                    <span className="text-xl sm:text-lg">{cfg.icon}</span>
                    <span className="text-center font-bold tracking-tight">{cfg.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-white animate-ping absolute top-1.5 right-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Key Stat Cards */}
          <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <StatCards
              status={filters.status}
              selectedJenis={filters.jenis}
              regionData={activeFilter || filters.jenis !== 'Semua' ? filteredData : undefined}
              regionLabel={
                activeFilter
                  ? (filters.jenis !== 'Semua' ? `${activeFilter.nama} (${JENIS_CONFIG[filters.jenis]?.label})` : activeFilter.nama)
                  : (filters.jenis !== 'Semua' ? `Bencana ${JENIS_CONFIG[filters.jenis]?.label}` : undefined)
              }
              onClearRegion={
                activeFilter || filters.jenis !== 'Semua'
                  ? () => {
                      if (activeFilter) handleClearSearch();
                      if (filters.jenis !== 'Semua') setFilters({ ...filters, jenis: 'Semua' });
                    }
                  : undefined
              }
            />
          </section>

          {/* 2. TAB NAVIGATION BAR LOCATED DIRECTLY BELOW CARDS (USER-FRIENDLY REDESIGN) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#1f8080]/10 text-[#1f8080]">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0a1e36] tracking-tight block">Modul Analisis & Visualisasi Spasial K5</span>
                  <span className="text-[10px] text-slate-400">Pilih modul analisis bencana di bawah ini</span>
                </div>
              </div>

              {/* Quick Select Dropdown for Mobile / Compact Navigation */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
                  className="w-full sm:w-64 appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-[#0a1e36] outline-none cursor-pointer focus:border-[#1f8080]"
                >
                  <option value="map">🗺️ Peta Utama K5</option>
                  {isFotoGeotagNttActive && (
                    <option value="gempa_ntt">🌋 Analisis Dampak Gempa NTT 2026</option>
                  )}
                  {/* Analisis Statistik Kebencanaan sementara di-hide */}
                  <option value="models">🛡️ Model Kerentanan & Respon</option>
                  <option value="logistics">📦 Analisis Kebutuhan Logistik</option>
                  <option value="medical">🩺 Analisis Medis & Faskes Darurat</option>
                  <option value="infrastructure">🏫 Analisis Fasum & Infrastruktur Kritis</option>
                  <option value="economic">🌾 Analisis Kerugian Ekonomi & Lahan</option>
                  <option value="utilities">⚡ Analisis Energi & Utilitas Kritis</option>
                  <option value="routes">🚚 Analisis Rute & Aksesibilitas</option>
                  <option value="ai">✨ Generate AI (9Router)</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Responsive Grid Tab Buttons (No Side Scrolling Needed) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'map'
                    ? 'bg-[#0a1e36] text-white shadow-md ring-2 ring-[#0a1e36]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0 text-[#1f8080]" />
                <span className="truncate">Peta Utama</span>
              </button>

              {isFotoGeotagNttActive && (
                <button
                  onClick={() => setActiveTab('gempa_ntt')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'gempa_ntt'
                      ? 'bg-[#0a1e36] text-white shadow-md ring-2 ring-[#0a1e36]/30 scale-[1.02]'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 animate-pulse" />
                  <span className="truncate">Gempa NTT 2026</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('models')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'models'
                    ? 'bg-[#0a1e36] text-white shadow-md ring-2 ring-[#0a1e36]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 text-purple-500" />
                <span className="truncate">Model Kerentanan</span>
              </button>


              <button
                onClick={() => setActiveTab('logistics')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'logistics'
                    ? 'bg-[#0a1e36] text-white shadow-md ring-2 ring-[#0a1e36]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <PackageCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="truncate">Analisis Logistik</span>
              </button>

              <button
                onClick={() => setActiveTab('medical')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'medical'
                    ? 'bg-[#0a1e36] text-white shadow-md ring-2 ring-[#0a1e36]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <HeartPulse className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="truncate">Medis & Faskes</span>
              </button>

              <button
                onClick={() => setActiveTab('infrastructure')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'infrastructure'
                    ? 'bg-[#0a1e36] text-white shadow-md ring-2 ring-[#0a1e36]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <School className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="truncate">Fasum & Pendidikan</span>
              </button>

              <button
                onClick={() => setActiveTab('economic')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'economic'
                    ? 'bg-[#0a1e36] text-white shadow-md ring-2 ring-[#0a1e36]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <Sprout className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="truncate">Kerugian Ekonomi</span>
              </button>

              <button
                onClick={() => setActiveTab('utilities')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'utilities'
                    ? 'bg-[#0a1e36] text-white shadow-md ring-2 ring-[#0a1e36]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <Zap className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="truncate">Energi & Utilitas</span>
              </button>

              <button
                onClick={() => setActiveTab('routes')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'routes'
                    ? 'bg-[#0a1e36] text-white shadow-md ring-2 ring-[#0a1e36]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <Truck className="w-4 h-4 shrink-0 text-sky-500" />
                <span className="truncate">Rute & Aksesibilitas</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'ai'
                    ? 'bg-[#0a1e36] text-white shadow-md ring-2 ring-[#0a1e36]/30 scale-[1.02]'
                    : 'bg-gradient-to-r from-purple-50 to-emerald-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-purple-600 animate-pulse" />
                <span className="truncate">Generate AI</span>
              </button>
            </div>
          </div>

          {/* 3. TAB CONTENT SECTION */}
          <div className={activeTab === 'map' ? 'block' : 'hidden'}>
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 transition-all duration-300">
              {/* GIS Map Canvas */}
              <div className="lg:col-span-3 min-h-[560px] bg-white rounded-2xl border-2 border-[#0a1e36]/20 shadow-md overflow-hidden relative group transition-all duration-300">
                <div className="w-full h-full">
                  <DashboardMapK5
                    data={filteredData}
                    flyTo={flyTo}
                    theme={theme}
                    kodeKemendagri={activeFilter?.kodeKemendagri}
                    selectedJenis={filters.jenis}
                    onDrawEstimation={(stats) => setDrawEstimation(stats)}
                    onActiveOverlaysChange={(overlays) => setActiveOverlays(overlays)}
                  />
                </div>
              </div>

              {/* Side Filter Control Panel */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[580px]">
                <div className="bg-[#0a1e36] text-white px-4 py-3 font-semibold text-xs flex items-center gap-2 shrink-0">
                  <Filter className="w-4 h-4 text-[#1f8080]" />
                  <span>Filter & Daftar Kejadian</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <FilterPanel
                    data={regionFilteredData}
                    filters={filters}
                    onFilter={setFilters}
                    onEventClick={handleEventClick}
                  />
                </div>
              </div>
            </section>
          </div>

          {activeTab === 'gempa_ntt' && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <GempaNttSection />
            </section>
          )}

          {activeTab === 'analytics' && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#1f8080]/10 text-[#1f8080]">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0a1e36]">Analisis Statistik Kebencanaan</h2>
                  <p className="text-xs text-slate-500">Visualisasi tren kejadian, dampak korban, dan kerusakan infrastruktur</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <ChartSection
                  theme={theme}
                  filteredData={activeFilter ? filteredData : undefined}
                  regionLabel={activeFilter?.nama}
                />
              </div>
            </section>
          )}

          {activeTab === 'models' && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#1f8080]/10 text-[#1f8080]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0a1e36]">Model Kerentanan & Respon Bencana</h2>
                  <p className="text-xs text-slate-500">Simulasi risiko kerentanan wilayah dan matriks kalkulator respon bencana</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <AnalysisModelsSection />
              </div>
            </section>
          )}


          {activeTab === 'logistics' && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <LogisticAnalysisSection estimationData={drawEstimation} />
            </section>
          )}

          {activeTab === 'medical' && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <MedicalEmergencySection estimationData={drawEstimation} />
            </section>
          )}

          {activeTab === 'infrastructure' && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <InfrastructureEducationSection estimationData={drawEstimation} />
            </section>
          )}

          {activeTab === 'economic' && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <EconomicAgricultureLossSection estimationData={drawEstimation} />
            </section>
          )}

          {activeTab === 'utilities' && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <UtilitiesEnergySection estimationData={drawEstimation} />
            </section>
          )}

          {activeTab === 'routes' && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <AccessibilityRouteSection estimationData={drawEstimation} />
            </section>
          )}

          {activeTab === 'ai' && (
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <AiGenerateSection estimationData={drawEstimation} />
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500 flex items-center justify-between">
          <p>© 2026 Manajemen Data Bencana — Kedeputian Bidang Pengembangan Kewilayahan</p>
          <div className="flex items-center gap-2 text-[#0a1e36] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#1f8080]" />
            {/* <span>Theme Tone: Clean White & #1f8080 / #0a1e36</span> */}
            <span>BY TRPPPB</span>
          </div>
        </footer>
      </div>
    </div>
  );
}


