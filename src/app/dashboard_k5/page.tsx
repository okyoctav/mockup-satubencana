'use client';

import { useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import AlertTicker from '@/components/dashboard/AlertTicker';
import StatCards from '@/components/dashboard/StatCards';
import DashboardMapK5 from '@/components/dashboard/DashboardMapK5';
import FilterPanel from '@/components/dashboard/FilterPanel';
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

export default function DashboardK5Page() {
  const { theme, toggle } = useTheme();
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [filters, setFilters] = useState({ jenis: 'Semua', status: 'Semua', level: 'Semua' });
  const [activeFilter, setActiveFilter] = useState<FilterWilayah | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'models' | 'logistics' | 'medical' | 'infrastructure' | 'economic' | 'utilities' | 'routes'>('map');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [drawEstimation, setDrawEstimation] = useState<{
    totalPopulasi: number;
    totalLakiLaki: number;
    totalPerempuan: number;
    totalLansia: number;
    totalBalita: number;
    totalPd1: number;
    totalPd2: number;
    totalKeluarga: number;
  } | null>(null);

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
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#19506e] text-white flex flex-col shrink-0 border-r border-[#19506e]/20 shadow-lg z-30 sticky top-0 h-screen">
        {/* Brand Header (Full Logo Only without box background, filter brightness-0 invert) */}
        <div className="p-5 border-b border-white/10 flex items-center justify-center">
          <img
            src="/logo/logo_mdb.png"
            alt="Logo MDB"
            className="h-12 w-auto object-contain brightness-0 invert transition-transform hover:scale-105 duration-200"
          />
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-4 flex-1 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Menu Utama
            </div>
            <nav className="space-y-1">
              <a
                href="/dashboard_k5"
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold bg-[#1f8080] text-white shadow-md transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-white" />
                <span>Dashboard K5</span>
              </a>
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
                <span>Konsep 5 (Clean Sidebar)</span>
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
        {/* Top Header Wrapper with Integrated Early Warning Ticker */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-2xs">
          {/* Integrated Early Warning Alert Ticker */}
          <div className="border-b border-[#1f8080]/30 text-white">
            <AlertTicker onAlertClick={handleAlertClick} />
          </div>

          {/* Header Controls Bar */}
          <div className="px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
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

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                <span>LIVE SYSTEM</span>
              </div>
              {activeTab === 'map' && (
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
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* 1. Key Stat Cards */}
          <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <StatCards
              status={filters.status}
              regionData={activeFilter ? regionFilteredData : undefined}
              regionLabel={activeFilter?.nama}
              onClearRegion={activeFilter ? handleClearSearch : undefined}
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
                  <span className="text-xs font-bold text-[#19506e] tracking-tight block">Modul Analisis & Visualisasi Spasial K5</span>
                  <span className="text-[10px] text-slate-400">Pilih modul analisis bencana di bawah ini</span>
                </div>
              </div>

              {/* Quick Select Dropdown for Mobile / Compact Navigation */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
                  className="w-full sm:w-64 appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-[#19506e] outline-none cursor-pointer focus:border-[#1f8080]"
                >
                  <option value="map">🗺️ Peta Utama K5</option>
                  <option value="analytics">📊 Analisis Statistik Kebencanaan</option>
                  <option value="models">🛡️ Model Kerentanan & Respon</option>
                  <option value="logistics">📦 Analisis Kebutuhan Logistik</option>
                  <option value="medical">🩺 Analisis Medis & Faskes Darurat</option>
                  <option value="infrastructure">🏫 Analisis Fasum & Infrastruktur Kritis</option>
                  <option value="economic">🌾 Analisis Kerugian Ekonomi & Lahan</option>
                  <option value="utilities">⚡ Analisis Energi & Utilitas Kritis</option>
                  <option value="routes">🚚 Analisis Rute & Aksesibilitas</option>
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
                    ? 'bg-[#19506e] text-white shadow-md ring-2 ring-[#19506e]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0 text-[#1f8080]" />
                <span className="truncate">Peta Utama</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'analytics'
                    ? 'bg-[#19506e] text-white shadow-md ring-2 ring-[#19506e]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0 text-sky-500" />
                <span className="truncate">Analisis Statistik</span>
              </button>

              <button
                onClick={() => setActiveTab('models')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'models'
                    ? 'bg-[#19506e] text-white shadow-md ring-2 ring-[#19506e]/30 scale-[1.02]'
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
                    ? 'bg-[#19506e] text-white shadow-md ring-2 ring-[#19506e]/30 scale-[1.02]'
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
                    ? 'bg-[#19506e] text-white shadow-md ring-2 ring-[#19506e]/30 scale-[1.02]'
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
                    ? 'bg-[#19506e] text-white shadow-md ring-2 ring-[#19506e]/30 scale-[1.02]'
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
                    ? 'bg-[#19506e] text-white shadow-md ring-2 ring-[#19506e]/30 scale-[1.02]'
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
                    ? 'bg-[#19506e] text-white shadow-md ring-2 ring-[#19506e]/30 scale-[1.02]'
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
                    ? 'bg-[#19506e] text-white shadow-md ring-2 ring-[#19506e]/30 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-[#1f8080]'
                }`}
              >
                <Truck className="w-4 h-4 shrink-0 text-sky-500" />
                <span className="truncate">Rute & Aksesibilitas</span>
              </button>
            </div>
          </div>

          {/* 3. TAB CONTENT SECTION */}
          <div className={activeTab === 'map' ? 'block' : 'hidden'}>
            <section className={`grid grid-cols-1 ${isMapExpanded ? 'lg:grid-cols-1' : 'lg:grid-cols-4'} gap-6 transition-all duration-300`}>
              {/* GIS Map Canvas */}
              <div
                className={`${
                  isMapExpanded ? 'lg:col-span-1 min-h-[700px]' : 'lg:col-span-3 min-h-[560px]'
                } bg-white rounded-2xl border-2 border-[#19506e]/20 shadow-md overflow-hidden relative group transition-all duration-300`}
              >
                {/* Header overlay badge */}
                <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-[#19506e]/20 rounded-xl px-3.5 py-2 shadow-md flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1f8080] animate-pulse" />
                  <Layers className="w-4 h-4 text-[#19506e]" />
                  <span className="text-xs font-bold text-[#19506e] tracking-tight">Peta Kebencanaan & Feature Service Dukcapil</span>
                </div>

                <div className="w-full h-full">
                  <DashboardMapK5
                    data={filteredData}
                    flyTo={flyTo}
                    theme={theme}
                    kodeKemendagri={activeFilter?.kodeKemendagri}
                    onDrawEstimation={(stats) => setDrawEstimation(stats)}
                  />
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
          </div>

          {activeTab === 'analytics' && (
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
                  <h2 className="text-base font-bold text-[#19506e]">Model Kerentanan & Respon Bencana</h2>
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


