'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/contexts/ThemeContext';
import AlertTicker from '@/components/dashboard/AlertTicker';
import StatCards from '@/components/dashboard/StatCards';
import DashboardMapK4 from '@/components/dashboard/DashboardMapK4';
import FilterPanel from '@/components/dashboard/FilterPanel';
import ChartSection from '@/components/dashboard/ChartSection';
import AnalysisModelsSection from '@/components/dashboard/AnalysisModelsSection';
import bencanaData from '@/data/bencana.json';
import WilayahDropdown, { FilterWilayah } from '@/components/dashboard/WilayahDropdown';
import {
  MapPin,
  BarChart3,
  ShieldAlert,
  Layers,
  Database,
  Lock,
  ArrowLeft,
  Map as MapIcon,
  Sun,
  Moon,
  ChevronRight,
  Filter,
  Sparkles,
  Maximize2,
  Minimize2,
  Radio
} from 'lucide-react';

const SearchDaerah = dynamic(() => import('@/components/dashboard/SearchDaerah'), { ssr: false });

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

export default function DashboardK5Page() {
  const { theme, toggle } = useTheme();
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [filters, setFilters] = useState({ jenis: 'Semua', status: 'Semua', level: 'Semua' });
  const [activeFilter, setActiveFilter] = useState<FilterWilayah | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'models'>('map');
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const handleSearch = (w: { tipe: string; nama: string; provinsi: string; lat: number; lng: number; zoom: number }) => {
    setFlyTo({ lat: w.lat, lng: w.lng, zoom: w.zoom });
    setActiveFilter(
      w.tipe === 'provinsi'
        ? { tipe: 'provinsi', nama: w.nama, lat: w.lat, lng: w.lng }
        : { tipe: 'kabupaten', nama: w.nama, provinsi: w.provinsi, lat: w.lat, lng: w.lng }
    );
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

  return (
    <div className="min-h-screen flex bg-white text-slate-800 font-sans selection:bg-[#1f8080] selection:text-white antialiased">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#19506e] text-white flex flex-col shrink-0 border-r border-[#19506e]/20 shadow-lg z-30 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-xl shadow-md flex items-center justify-center">
            <img src="/logo/logo_mdb.png" alt="Logo MDB" className="h-7 w-auto object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-tight leading-none">SATU BENCANA</h1>
            <span className="text-[10px] text-[#1f8080] bg-white/90 font-bold px-1.5 py-0.5 rounded-full inline-block mt-1">
              K5 • Dukcapil GIS
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-4 flex-1 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Menu Utama
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('map')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'map'
                    ? 'bg-[#1f8080] text-white shadow-md'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4" />
                  <span>Peta & Sebaran</span>
                </div>
                {activeTab === 'map' && <ChevronRight className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-[#1f8080] text-white shadow-md'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analisis Statistik</span>
                </div>
                {activeTab === 'analytics' && <ChevronRight className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setActiveTab('models')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'models'
                    ? 'bg-[#1f8080] text-white shadow-md'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Model Kerentanan</span>
                </div>
                {activeTab === 'models' && <ChevronRight className="w-4 h-4" />}
              </button>
            </nav>
          </div>

          {/* Konsep Switcher Nav */}
          <div>
            <div className="px-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Konsep Tampilan
            </div>
            <div className="space-y-1 text-xs">
              <a
                href="/dashboard"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
              >
                <span>Konsep 1 (Leaflet)</span>
              </a>
              <a
                href="/dashboard_k2"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
              >
                <span>Konsep 2 (ArcGIS)</span>
              </a>
              <a
                href="/dashboard_k3"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
              >
                <span>Konsep 3</span>
              </a>
              <a
                href="/dashboard_k4"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
              >
                <span>Konsep 4</span>
              </a>
              <a
                href="/dashboard_k5"
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/15 text-white font-semibold border-l-4 border-[#1f8080]"
              >
                <span>Konsep 5 (Sidebar)</span>
                <span className="w-2 h-2 rounded-full bg-[#1f8080]" />
              </a>
            </div>
          </div>

          {/* Action Navigation */}
          <div>
            <div className="px-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Akses Sistem
            </div>
            <div className="space-y-1.5 text-xs">
              <a
                href="/management"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 transition-colors"
              >
                <Database className="w-4 h-4 text-[#1f8080]" />
                <span>Management Data</span>
              </a>
              <a
                href="/login"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 transition-colors"
              >
                <Lock className="w-4 h-4 text-[#1f8080]" />
                <span>Login Submisi</span>
              </a>
              <a
                href="https://inarisk.bnpb.go.id/databencana/webgis/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white bg-[#1f8080] hover:bg-[#1f8080]/90 transition-colors font-medium shadow-sm"
              >
                <MapIcon className="w-4 h-4" />
                <span>WebGIS BNPB</span>
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 bg-[#19506e]/80 flex items-center justify-between text-xs">
          <a href="/" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </a>
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
          </button>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-xs px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="flex-1">
              <SearchDaerah onSelect={handleSearch} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
              <span>LIVE SYSTEM</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-[#19506e]">
              <Sparkles className="w-3.5 h-3.5 text-[#1f8080]" />
              <span>Estimator Dukcapil</span>
            </div>
          </div>
        </header>

        {/* Ticker Notification */}
        <div className="bg-slate-50 border-b border-slate-200">
          <AlertTicker onAlertClick={handleAlertClick} />
        </div>

        {/* Region Filter Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <WilayahDropdown onSelect={handleDropdownFilter} theme={theme} />
            {activeFilter && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1f8080]/10 border border-[#1f8080]/30 text-xs text-[#19506e] font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#1f8080]" />
                <span>{activeFilter.tipe === 'provinsi' ? 'Provinsi' : 'Kab/Kota'}:</span>
                <strong className="text-[#19506e]">{activeFilter.nama}</strong>
                <span className="text-slate-500 font-normal">— {regionFilteredData.length} kejadian</span>
              </div>
            )}
          </div>

          {/* Map Size Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#1f8080]/30 text-[#1f8080] hover:bg-[#1f8080] hover:text-white transition-all text-xs font-semibold"
            >
              {isMapExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Kecilkan Peta</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Perluas Peta</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Key Stat Cards */}
          <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <StatCards
              status={filters.status}
              regionData={activeFilter ? regionFilteredData : undefined}
              regionLabel={activeFilter?.nama}
              onClearRegion={activeFilter ? handleClearSearch : undefined}
            />
          </section>

          {/* MAIN GIS MAP SECTION (ENLARGED & HIGH IMPACT) */}
          {activeTab === 'map' && (
            <section className={`grid grid-cols-1 ${isMapExpanded ? 'lg:grid-cols-1' : 'lg:grid-cols-4'} gap-6 transition-all duration-300`}>
              {/* GIS Map Canvas */}
              <div
                className={`${
                  isMapExpanded ? 'lg:col-span-1 h-[720px]' : 'lg:col-span-3 h-[580px]'
                } bg-white rounded-2xl border-2 border-[#19506e]/20 shadow-md overflow-hidden relative group transition-all duration-300`}
              >
                {/* Header overlay badge */}
                <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-[#19506e]/20 rounded-xl px-3.5 py-2 shadow-md flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1f8080] animate-pulse" />
                  <Layers className="w-4 h-4 text-[#19506e]" />
                  <span className="text-xs font-bold text-[#19506e] tracking-tight">Peta Kebencanaan & Feature Service Dukcapil</span>
                </div>

                <div className="w-full h-full">
                  <DashboardMapK4 data={filteredData} flyTo={flyTo} theme={theme} />
                </div>
              </div>

              {/* Side Filter Control Panel */}
              {!isMapExpanded && (
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[580px]">
                  <div className="bg-[#19506e] text-white px-4 py-3 font-semibold text-xs flex items-center gap-2 shrink-0">
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
              )}
            </section>
          )}

          {/* STATISTICAL CHARTS SECTION */}
          {(activeTab === 'analytics' || activeTab === 'map') && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#1f8080]/10 text-[#1f8080]">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#19506e]">Analisis Statistik Kebencanaan</h2>
                  <p className="text-xs text-slate-500">Visualisasi tren kejadian, dampak korban, dan kerusakan infrastruktur</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <ChartSection
                  theme={theme}
                  filteredData={activeFilter ? filteredData : undefined}
                  regionLabel={activeFilter?.nama}
                />
              </div>
            </section>
          )}

          {/* RISK & VULNERABILITY MODELS SECTION */}
          {(activeTab === 'models' || activeTab === 'map') && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#19506e]/10 text-[#19506e]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#19506e]">Model Kerentanan & Respon Bencana</h2>
                  <p className="text-xs text-slate-500">Estimasi demografi Dukcapil, kesiapsiagaan, serta alokasi bantuan</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <AnalysisModelsSection />
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500 flex items-center justify-between">
          <p>© 2026 Satu Bencana — Platform Estimasi & Data Bencana Indonesia</p>
          <div className="flex items-center gap-2 text-[#19506e] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#1f8080]" />
            <span>Theme Tone: Clean White & #1f8080 / #19506e</span>
          </div>
        </footer>
      </div>
    </div>
  );
}


