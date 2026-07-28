'use client';

import { useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AlertTicker from '@/components/dashboard/AlertTicker';
import StatCards from '@/components/dashboard/StatCards';
import DashboardMapK4 from '@/components/dashboard/DashboardMapK4';
import FilterPanel from '@/components/dashboard/FilterPanel';
import ChartSection from '@/components/dashboard/ChartSection';
import AnalysisModelsSection from '@/components/dashboard/AnalysisModelsSection';
import bencanaData from '@/data/bencana.json';
import WilayahDropdown, { FilterWilayah } from '@/components/dashboard/WilayahDropdown';
import { Sparkles, MapPin, BarChart3, ShieldAlert, Layers } from 'lucide-react';

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
  const { theme } = useTheme();
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [filters, setFilters] = useState({ jenis: 'Semua', status: 'Semua', level: 'Semua' });
  const [activeFilter, setActiveFilter] = useState<FilterWilayah | null>(null);

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-sky-500 selection:text-white font-sans">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <DashboardHeader onSearch={handleSearch} />
        <AlertTicker onAlertClick={handleAlertClick} />
      </div>

      {/* Sub-Header Concept Switcher Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
            <span>KONSEP 5 — Dukcapil Feature Service Estimator</span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline-block">
            Estimasi Kependudukan Real-time Terbencana
          </span>
        </div>

        {/* Navigation Concepts */}
        <nav className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60">
          <a
            href="/dashboard"
            className="px-2.5 py-1 rounded-md transition-all hover:text-sky-600 hover:bg-white"
          >
            K1 (Leaflet)
          </a>
          <span className="text-slate-300">|</span>
          <a
            href="/dashboard_k2"
            className="px-2.5 py-1 rounded-md transition-all hover:text-sky-600 hover:bg-white"
          >
            K2 (ArcGIS)
          </a>
          <span className="text-slate-300">|</span>
          <a
            href="/dashboard_k3"
            className="px-2.5 py-1 rounded-md transition-all hover:text-sky-600 hover:bg-white"
          >
            K3
          </a>
          <span className="text-slate-300">|</span>
          <a
            href="/dashboard_k4"
            className="px-2.5 py-1 rounded-md transition-all hover:text-sky-600 hover:bg-white"
          >
            K4
          </a>
          <span className="text-slate-300">|</span>
          <a
            href="/dashboard_k5"
            className="px-2.5 py-1 rounded-md font-semibold text-sky-600 bg-white shadow-2xs"
          >
            K5 (Clean)
          </a>
        </nav>
      </div>

      {/* Wilayah Filter Toolbar */}
      <div className="bg-slate-100/60 border-b border-slate-200/80 px-4 py-2 sm:px-6 flex items-center gap-3 flex-wrap">
        <WilayahDropdown onSelect={handleDropdownFilter} theme={theme} />
        {activeFilter && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-100/80 border border-sky-200 text-xs text-sky-800 font-medium">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>{activeFilter.tipe === 'provinsi' ? 'Provinsi' : 'Kab/Kota'}:</span>
            <strong className="font-semibold">{activeFilter.nama}</strong>
            <span className="text-sky-600/80 font-normal">— {regionFilteredData.length} kejadian</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 py-4 space-y-5 max-w-[1600px] w-full mx-auto">
        {/* Key Stats Cards */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <StatCards
            status={filters.status}
            regionData={activeFilter ? regionFilteredData : undefined}
            regionLabel={activeFilter?.nama}
            onClearRegion={activeFilter ? handleClearSearch : undefined}
          />
        </section>

        {/* Interactive Map & Side Filter Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-[540px]">
          {/* Map Container */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden relative group">
            <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-700 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Peta Tematik GIS & Dukcapil GeoJSON</span>
            </div>
            <div className="w-full h-full">
              <DashboardMapK4 data={filteredData} flyTo={flyTo} theme={theme} />
            </div>
          </div>

          {/* Side Filter Panel */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <FilterPanel
              data={regionFilteredData}
              filters={filters}
              onFilter={setFilters}
              onEventClick={handleEventClick}
            />
          </div>
        </section>

        {/* Section Divider: Chart */}
        <div className="pt-4 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analisis Statistik — Sumber: DIBI BNPB</span>
          </div>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Charts Container */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <ChartSection
            theme={theme}
            filteredData={activeFilter ? filteredData : undefined}
            regionLabel={activeFilter?.nama}
          />
        </section>

        {/* Section Divider: Analysis */}
        <div className="pt-4 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Model Kerentanan, Fase Bencana & Respon</span>
          </div>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Analysis Models Section */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <AnalysisModelsSection />
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="mt-8 bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Satu Bencana — Platform Sistem Informasi & Estimasi Resiko Bencana Nasional</p>
      </footer>
    </div>
  );
}

