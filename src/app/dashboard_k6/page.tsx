'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import AlertTicker from '@/components/dashboard/AlertTicker';
import StatCards from '@/components/dashboard/StatCards';
import DashboardMapK5 from '@/components/dashboard/DashboardMapK5';
import FilterPanel from '@/components/dashboard/FilterPanel';
import ChartSection from '@/components/dashboard/ChartSection';
import AnalysisModelsSection from '@/components/dashboard/AnalysisModelsSection';
import LogisticAnalysisSection, { EstimationData } from '@/components/dashboard/LogisticAnalysisSection';
import MedicalEmergencySection from '@/components/dashboard/MedicalEmergencySection';
import InfrastructureEducationSection from '@/components/dashboard/InfrastructureEducationSection';
import EconomicAgricultureLossSection from '@/components/dashboard/EconomicAgricultureLossSection';
import UtilitiesEnergySection from '@/components/dashboard/UtilitiesEnergySection';
import AccessibilityRouteSection from '@/components/dashboard/AccessibilityRouteSection';
import AiGenerateSection from '@/components/dashboard/AiGenerateSection';
import GempaNttSection from '@/components/dashboard/GempaNttSection';
import WilayahDropdown, { FilterWilayah } from '@/components/dashboard/WilayahDropdown';
import bencanaData from '@/data/bencana.json';
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
  Lock,
  ArrowLeft,
  Map as MapIcon,
  Sun,
  Moon,
  Filter,
  Maximize2,
  Minimize2,
  Radio,
  LayoutDashboard,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  LogOut,
  X,
  Compass,
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

export default function DashboardK6Page() {
  const [, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
        const client = getSupabaseBrowserClient();
        if (!client) {
          const localAuth = localStorage.getItem('is_logged_in') === 'true';
          if (!localAuth && process.env.NEXT_PUBLIC_SUPABASE_URL) {
            window.location.href = '/login?next=/dashboard_k6';
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
            window.location.href = '/login?next=/dashboard_k6';
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
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [drawEstimation, setDrawEstimation] = useState<EstimationData | null>(null);
  const [activeOverlays, setActiveOverlays] = useState<string[]>([]);
  const isFotoGeotagNttActive = activeOverlays.includes('foto_geotag_ntt') || activeOverlays.includes('gempa_ntt_2026_v2');

  useEffect(() => {
    if (!isFotoGeotagNttActive && activeTab === 'gempa_ntt') {
      setActiveTab('map');
    }
  }, [isFotoGeotagNttActive, activeTab]);

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
      <div 
        className="min-h-screen flex flex-col items-center justify-center space-y-4 font-sans"
        style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
      >
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold tracking-wider text-teal-700 animate-pulse">
          Memeriksa Sesi Autentikasi Pengguna...
        </p>
      </div>
    );
  }

  // Material Design Tab Definitions
  const tabs = [
    { id: 'map', label: 'Peta Utama', icon: <Layers className="w-4 h-4 shrink-0 text-teal-600" /> },
    ...(isFotoGeotagNttActive
      ? [{ id: 'gempa_ntt', label: 'Gempa NTT 2026', icon: <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 animate-pulse" /> }]
      : []),
    { id: 'analytics', label: 'Analisis Statistik', icon: <BarChart3 className="w-4 h-4 shrink-0 text-blue-500" /> },
    { id: 'models', label: 'Model Kerentanan', icon: <ShieldAlert className="w-4 h-4 shrink-0 text-purple-500" /> },
    { id: 'logistics', label: 'Analisis Logistik', icon: <PackageCheck className="w-4 h-4 shrink-0 text-emerald-500" /> },
    { id: 'medical', label: 'Medis & Faskes', icon: <HeartPulse className="w-4 h-4 shrink-0 text-rose-500" /> },
    { id: 'infrastructure', label: 'Fasum & Pendidikan', icon: <School className="w-4 h-4 shrink-0 text-amber-500" /> },
    { id: 'economic', label: 'Kerugian Ekonomi', icon: <Sprout className="w-4 h-4 shrink-0 text-emerald-600" /> },
    { id: 'utilities', label: 'Energi & Utilitas', icon: <Zap className="w-4 h-4 shrink-0 text-yellow-500" /> },
    { id: 'routes', label: 'Rute & Aksesibilitas', icon: <Truck className="w-4 h-4 shrink-0 text-sky-500" /> },
    { id: 'ai', label: 'Generate AI', icon: <Sparkles className="w-4 h-4 shrink-0 text-purple-600 animate-pulse" /> },
  ] as const;

  return (
    <div 
      className="min-h-screen flex font-sans antialiased relative transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
    >
      {/* FULLSCREEN BUMPER LOGO VIDEO */}
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

          <button
            onClick={handleFinishBumper}
            className="absolute bottom-6 right-6 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer z-[100000]"
          >
            <span>Lewati Intro</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* ============================================================
          1. MATERIAL DESIGN LEFT SIDEBAR DRAWER (z-depth-2)
          ============================================================ */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col shrink-0 z-30 sticky top-0 h-screen transition-all duration-300 ease-in-out text-white shadow-xl`}
        style={{
          backgroundColor: '#004d40', // Material Deep Teal 900
          borderRight: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b border-white/10 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {isSidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-sm tracking-wide text-white leading-tight">SATU BENCANA</div>
                <div className="text-[10px] font-bold text-teal-300 uppercase tracking-widest">K6 · Materialize</div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-black text-white tracking-widest shadow-sm">
              K6
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-4 flex-1 space-y-5 overflow-y-auto overflow-x-hidden">
          {/* Main Menu Section */}
          <div>
            {isSidebarOpen && (
              <div className="px-3 text-[10px] font-extrabold text-teal-200 uppercase tracking-wider mb-2">
                Menu Utama
              </div>
            )}
            <nav className="space-y-1">
              <a
                href="/dashboard_k6"
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-black bg-teal-600 text-white shadow-md transition-all`}
                title={!isSidebarOpen ? 'Dashboard K6 (Materialize)' : undefined}
              >
                <LayoutDashboard className="w-4 h-4 text-white shrink-0" />
                {isSidebarOpen && <span>Dashboard K6 (Materialize)</span>}
              </a>
              <a
                href="/analisis-data"
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-bold text-teal-100 hover:bg-white/10 hover:text-white transition-all`}
                title={!isSidebarOpen ? 'Analisis Data Nasional' : undefined}
              >
                <BarChart3 className="w-4 h-4 text-teal-300 shrink-0" />
                {isSidebarOpen && <span>Analisis Data Nasional</span>}
              </a>
              <a
                href="/sejarah-kebencanaan"
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-bold text-teal-100 hover:bg-white/10 hover:text-white transition-all`}
                title={!isSidebarOpen ? 'Sejarah Kebencanaan' : undefined}
              >
                <Compass className="w-4 h-4 text-teal-300 shrink-0" />
                {isSidebarOpen && <span>Sejarah Kebencanaan</span>}
              </a>
            </nav>
          </div>

          {/* Konsep Switcher Nav */}
          <div>
            {isSidebarOpen && (
              <div className="px-3 text-[10px] font-extrabold text-teal-200 uppercase tracking-wider mb-2">
                Pilihan Konsep Dashboard
              </div>
            )}
            <div className="space-y-1 text-xs">
              <a
                href="/dashboard_k5"
                className={`flex items-center ${isSidebarOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2 rounded-xl text-teal-100 hover:bg-white/10 hover:text-white transition-colors`}
                title={!isSidebarOpen ? 'Konsep K5 (Standard)' : undefined}
              >
                {isSidebarOpen ? (
                  <>
                    <span>Konsep K5 (Standard)</span>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-white/10 text-teal-200 font-bold">K5</span>
                  </>
                ) : (
                  <span className="text-[10px] font-bold text-teal-200">K5</span>
                )}
              </a>

              <a
                href="/dashboard_k6"
                className={`flex items-center ${isSidebarOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2 rounded-xl bg-teal-800/80 text-white font-black border border-teal-500/40 shadow-xs`}
                title={!isSidebarOpen ? 'Konsep K6 (Materialize - Aktif)' : undefined}
              >
                {isSidebarOpen ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
                      <span>Konsep K6 (Materialize)</span>
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-500 text-white font-black uppercase">
                      Aktif
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] font-black text-teal-300">K6</span>
                )}
              </a>
            </div>
          </div>

          {/* Action Navigation */}
          <div>
            {isSidebarOpen && (
              <div className="px-3 text-[10px] font-extrabold text-teal-200 uppercase tracking-wider mb-2">
                Akses & Integrasi
              </div>
            )}
            <div className="space-y-1.5 text-xs">
              <a
                href="/management"
                className={`flex items-center ${isSidebarOpen ? 'gap-2.5 px-3' : 'justify-center px-0'} py-2 rounded-xl text-teal-100 hover:bg-white/10 hover:text-white transition-colors`}
                title={!isSidebarOpen ? 'Management Data' : undefined}
              >
                <Database className="w-4 h-4 text-teal-300 shrink-0" />
                {isSidebarOpen && <span>Management Data</span>}
              </a>
              <a
                href="/login"
                className={`flex items-center ${isSidebarOpen ? 'gap-2.5 px-3' : 'justify-center px-0'} py-2 rounded-xl text-teal-100 hover:bg-white/10 hover:text-white transition-colors`}
                title={!isSidebarOpen ? 'Login Submisi' : undefined}
              >
                <Lock className="w-4 h-4 text-teal-300 shrink-0" />
                {isSidebarOpen && <span>Login Submisi</span>}
              </a>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-2.5 px-3' : 'justify-center px-0'} py-2 rounded-xl text-rose-200 hover:bg-rose-500/20 hover:text-white transition-colors cursor-pointer text-left`}
                title={!isSidebarOpen ? 'Logout / Keluar' : undefined}
              >
                <LogOut className="w-4 h-4 text-rose-300 shrink-0" />
                {isSidebarOpen && <span>Logout / Keluar</span>}
              </button>
              <a
                href="https://inarisk.bnpb.go.id/databencana/webgis/"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center ${isSidebarOpen ? 'gap-2.5 px-3' : 'justify-center px-0'} py-2 rounded-xl text-white bg-teal-600 hover:bg-teal-500 transition-colors font-bold shadow-xs`}
                title={!isSidebarOpen ? 'WebGIS BNPB' : undefined}
              >
                <MapIcon className="w-4 h-4 shrink-0" />
                {isSidebarOpen && <span>WebGIS BNPB ↗</span>}
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div 
          className={`p-3 border-t border-white/10 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center flex-col gap-2'} text-xs`}
          style={{ backgroundColor: 'rgba(0, 50, 40, 0.6)' }}
        >
          <a href="/" className="flex items-center gap-1.5 text-teal-200 hover:text-white font-bold transition-colors" title={!isSidebarOpen ? 'Kembali ke Beranda' : undefined}>
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            {isSidebarOpen && <span>Kembali</span>}
          </a>
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer shadow-2xs"
            title="Toggle Theme (Terang / Gelap)"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-100" />}
          </button>
        </div>
      </aside>

      {/* ============================================================
          2. MAIN DASHBOARD CONTENT AREA
          ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Wrapper (Material App Bar) */}
        <header 
          className="sticky top-0 z-[700] border-b shadow-xs transition-colors duration-300"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-faint)' 
          }}
        >
          {/* Integrated Early Warning Alert Ticker */}
          <div className="border-b border-teal-800/20 text-white">
            <AlertTicker onAlertClick={handleAlertClick} />
          </div>

          {/* Header Controls Bar */}
          <div className="px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Sidebar Burger Trigger */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex items-center justify-center p-2 rounded-xl border transition-all shadow-2xs cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
                title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                )}
              </button>

              <WilayahDropdown onSelect={handleDropdownFilter} theme={theme} />

              {/* Material Chip for Active Filter */}
              {activeFilter && (
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-white shadow-2xs"
                  style={{ backgroundColor: '#00695c' }}
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>{activeFilter.tipe === 'provinsi' ? 'Provinsi' : 'Kab/Kota'}:</span>
                  <strong className="text-white">{activeFilter.nama}</strong>
                  <span className="opacity-80 font-normal">— {regionFilteredData.length} kejadian</span>
                  <button 
                    onClick={handleClearSearch}
                    className="ml-1.5 p-0.5 rounded-full hover:bg-black/20 text-white cursor-pointer"
                    title="Hapus Filter Wilayah"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Material Live Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-black tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
                <span>LIVE SYSTEM</span>
              </div>

              {activeTab === 'map' && (
                <button
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {isMapExpanded ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Kecilkan Peta</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Perluas Peta</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 transition-all text-xs font-bold cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* ============================================================
              1. MATERIAL KEY STAT CARDS (z-depth-1)
              ============================================================ */}
          <section 
            className="rounded-2xl p-4 border transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-faint)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <StatCards
              status={filters.status}
              regionData={activeFilter ? regionFilteredData : undefined}
              regionLabel={activeFilter?.nama}
              onClearRegion={activeFilter ? handleClearSearch : undefined}
            />
          </section>

          {/* ============================================================
              2. MATERIAL TAB NAVIGATION BAR DIRECTLY BELOW CARDS
              ============================================================ */}
          <div 
            className="border rounded-2xl p-3.5 space-y-3 transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-faint)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 shrink-0">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                    Modul Analisis & Visualisasi Spasial K6 (Materialize)
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">Pilih modul analitik multisektoral di bawah ini</p>
                </div>
              </div>

              {/* Quick Select Dropdown for Mobile */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
                  className="w-full sm:w-64 appearance-none border rounded-xl px-3 py-1.5 pr-8 text-xs font-bold outline-none cursor-pointer shadow-2xs"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="map">🗺️ Peta Utama K6</option>
                  {isFotoGeotagNttActive && (
                    <option value="gempa_ntt">🌋 Analisis Dampak Gempa NTT 2026</option>
                  )}
                  <option value="analytics">📊 Analisis Statistik Kebencanaan</option>
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

            {/* Material Tabs Grid Buttons (Elevated Material Chips) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-faint)' }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-md scale-[1.02]'
                        : 'border hover:bg-teal-500/10'
                    }`}
                    style={{
                      backgroundColor: isActive ? '#00695c' : 'var(--bg-page)',
                      borderColor: isActive ? '#00695c' : 'var(--border-subtle)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              3. TAB CONTENT SECTION
              ============================================================ */}
          {/* TAB: Peta Utama */}
          <div className={activeTab === 'map' ? 'block' : 'hidden'}>
            <section className={`grid grid-cols-1 ${isMapExpanded ? 'lg:grid-cols-1' : 'lg:grid-cols-4'} gap-6 transition-all duration-300`}>
              {/* GIS Map Canvas */}
              <div
                className={`${
                  isMapExpanded ? 'lg:col-span-1 min-h-[720px]' : 'lg:col-span-3 min-h-[580px]'
                } rounded-2xl border overflow-hidden relative group transition-all duration-300`}
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                }}
              >
                <div className="w-full h-full">
                  <DashboardMapK5
                    data={filteredData}
                    flyTo={flyTo}
                    theme={theme}
                    kodeKemendagri={activeFilter?.kodeKemendagri}
                    onDrawEstimation={(stats) => setDrawEstimation(stats)}
                    onActiveOverlaysChange={(overlays) => setActiveOverlays(overlays)}
                  />
                </div>
              </div>

              {/* Side Filter Control Panel */}
              {!isMapExpanded && (
                <div 
                  className="lg:col-span-1 rounded-2xl border overflow-hidden flex flex-col h-[580px] shadow-xs"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-faint)' 
                  }}
                >
                  <div 
                    className="text-white px-4 py-3 font-extrabold text-xs flex items-center gap-2 shrink-0 shadow-xs"
                    style={{ backgroundColor: '#00695c' }}
                  >
                    <Filter className="w-4 h-4 text-teal-200" />
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
              )}
            </section>
          </div>

          {/* TAB: Gempa NTT */}
          {activeTab === 'gempa_ntt' && (
            <section 
              className="rounded-2xl p-6 border shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
            >
              <GempaNttSection />
            </section>
          )}

          {/* TAB: Analisis Statistik */}
          {activeTab === 'analytics' && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                    Analisis Statistik Kebencanaan
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Visualisasi tren kejadian, dampak korban, dan kerusakan infrastruktur</p>
                </div>
              </div>

              <div 
                className="rounded-2xl p-6 border shadow-xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
              >
                <ChartSection
                  theme={theme}
                  filteredData={activeFilter ? filteredData : undefined}
                  regionLabel={activeFilter?.nama}
                />
              </div>
            </section>
          )}

          {/* TAB: Model Kerentanan */}
          {activeTab === 'models' && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                    Model Kerentanan & Respon Bencana
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Simulasi risiko kerentanan wilayah dan matriks kalkulator respon bencana</p>
                </div>
              </div>

              <div 
                className="rounded-2xl p-6 border shadow-xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
              >
                <AnalysisModelsSection />
              </div>
            </section>
          )}

          {/* TAB: Logistik */}
          {activeTab === 'logistics' && (
            <section 
              className="rounded-2xl p-6 border shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
            >
              <LogisticAnalysisSection estimationData={drawEstimation} />
            </section>
          )}

          {/* TAB: Medis */}
          {activeTab === 'medical' && (
            <section 
              className="rounded-2xl p-6 border shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
            >
              <MedicalEmergencySection estimationData={drawEstimation} />
            </section>
          )}

          {/* TAB: Fasum & Pendidikan */}
          {activeTab === 'infrastructure' && (
            <section 
              className="rounded-2xl p-6 border shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
            >
              <InfrastructureEducationSection estimationData={drawEstimation} />
            </section>
          )}

          {/* TAB: Kerugian Ekonomi */}
          {activeTab === 'economic' && (
            <section 
              className="rounded-2xl p-6 border shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
            >
              <EconomicAgricultureLossSection estimationData={drawEstimation} />
            </section>
          )}

          {/* TAB: Energi & Utilitas */}
          {activeTab === 'utilities' && (
            <section 
              className="rounded-2xl p-6 border shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
            >
              <UtilitiesEnergySection estimationData={drawEstimation} />
            </section>
          )}

          {/* TAB: Rute Aksesibilitas */}
          {activeTab === 'routes' && (
            <section 
              className="rounded-2xl p-6 border shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
            >
              <AccessibilityRouteSection estimationData={drawEstimation} />
            </section>
          )}

          {/* TAB: Generate AI */}
          {activeTab === 'ai' && (
            <section 
              className="rounded-2xl p-6 border shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
            >
              <AiGenerateSection estimationData={drawEstimation} />
            </section>
          )}
        </main>

        {/* Material Footer */}
        <footer 
          className="border-t px-6 py-4 text-xs flex items-center justify-between flex-wrap gap-2"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-faint)',
            color: 'var(--text-secondary)'
          }}
        >
          <p className="font-medium">© 2026 Satu Bencana — Platform Estimasi & Data Bencana Indonesia (K6 Materialize)</p>
          <div className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-400">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
            <span>Theme Tone: Material Deep Teal (#00695c)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
