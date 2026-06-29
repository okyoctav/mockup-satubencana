'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AlertTicker from '@/components/dashboard/AlertTicker';
import StatCards from '@/components/dashboard/StatCards';
import ArcGISLayerPanel from '@/components/dashboard/ArcGISLayerPanel';
import ChartSection from '@/components/dashboard/ChartSection';
import AnalysisModelsSection from '@/components/dashboard/AnalysisModelsSection';
import bencanaData from '@/data/bencana.json';
import wabConfig from '@/data/wab_layers.json';
import WilayahDropdown, { FilterWilayah } from '@/components/dashboard/WilayahDropdown';
import { Wilayah } from '@/data/wilayah';

const ArcGISMapView = dynamic(
  () => import('@/components/dashboard/ArcGISMapView'),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#64748B' }}>
        Memuat ArcGIS Map…
      </div>
    ),
  }
);

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

export default function DashboardK2Page() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState<FilterWilayah | null>(null);
  const [activeLayers, setActiveLayers] = useState<string[]>(
    wabConfig.layers.filter((l) => l.visible).map((l) => l.id)
  );
  const [filters] = useState({ jenis: 'Semua', status: 'Semua', level: 'Semua' });

  const handleSearch = (w: Wilayah) => {
    setActiveFilter(
      w.tipe === 'provinsi'
        ? { tipe: 'provinsi', nama: w.nama, lat: w.lat, lng: w.lng }
        : { tipe: 'kabupaten', nama: w.nama, provinsi: w.provinsi ?? '', lat: w.lat, lng: w.lng }
    );
  };

  const handleDropdownFilter = (f: FilterWilayah | null) => {
    setActiveFilter(f);
  };

  const handleAlertClick = (_lat: number, _lng: number) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // ArcGIS map manages its own navigation
  };

  const handleLayerToggle = useCallback((id: string, visible: boolean) => {
    setActiveLayers((prev) =>
      visible ? [...prev.filter((x) => x !== id), id] : prev.filter((x) => x !== id)
    );
  }, []);

  const regionFilteredData = useMemo<Kejadian[]>(() => {
    if (!activeFilter) return allData;
    if (activeFilter.tipe === 'provinsi') {
      const q = activeFilter.nama.toLowerCase();
      return allData.filter((k) => k.provinsi.toLowerCase().includes(q));
    }
    const q = activeFilter.nama.toLowerCase();
    return allData.filter((k) => k.kabupaten.toLowerCase().includes(q));
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
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-page)',
      color: 'var(--text-primary)',
    }}>
      {/* Header — sticky */}
      <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
        <DashboardHeader onSearch={handleSearch} />
        <AlertTicker onAlertClick={handleAlertClick} />
      </div>

      {/* K2 badge bar */}
      <div style={{
        padding: '6px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: isDark
          ? 'linear-gradient(90deg, rgba(0,121,193,0.18), rgba(0,169,206,0.08))'
          : 'linear-gradient(90deg, rgba(0,121,193,0.10), rgba(0,169,206,0.04))',
        borderBottom: '1px solid rgba(0,121,193,0.2)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg, #0079C1, #00A9CE)',
          color: '#fff', borderRadius: 20,
          padding: '3px 12px', fontSize: 10, fontWeight: 800,
          letterSpacing: 0.6,
        }}>
          ⚡ KONSEP 2 — ArcGIS Maps SDK (Native)
        </div>
        <span style={{ fontSize: 10, color: isDark ? '#94A3B8' : '#64748B' }}>
          {wabConfig.appTitle} · {wabConfig.layers.length} layer tersedia
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <a
            href="/dashboard"
            style={{
              fontSize: 10, color: '#0EA5E9',
              textDecoration: 'none', fontWeight: 600,
            }}
          >
            Konsep 1 (Leaflet)
          </a>
          <span style={{ color: 'var(--border-subtle)', fontSize: 10 }}>|</span>
          <a
            href="/dashboard_k3"
            style={{
              fontSize: 10, color: '#0EA5E9',
              textDecoration: 'none', fontWeight: 600,
            }}
          >
            Konsep 3 (Dukcapil Service)
          </a>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        background: isDark ? 'rgba(5,14,31,0.8)' : 'rgba(236,245,255,0.9)',
        borderBottom: '1px solid var(--border-faint)',
        flexWrap: 'wrap',
      }}>
        <WilayahDropdown onSelect={handleDropdownFilter} theme={theme} />
        {activeFilter && (
          <span style={{ fontSize: 11, color: '#35a7ff', fontWeight: 600 }}>
            🔍 {activeFilter.tipe === 'provinsi' ? 'Provinsi' : 'Kab/Kota'}:{' '}
            <strong>{activeFilter.nama}</strong>{' '}— {regionFilteredData.length} kejadian
          </span>
        )}
        {activeFilter && (
          <button
            onClick={() => setActiveFilter(null)}
            style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            ✕ Reset
          </button>
        )}
        <div style={{
          marginLeft: 'auto', fontSize: 9, color: isDark ? '#475569' : '#94A3B8',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 6, height: 6, background: '#22C55E', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Filter wilayah berlaku pada grafik statistik di bawah
        </div>
      </div>

      {/* Stat Cards */}
      <StatCards
        status={filters.status}
        regionData={activeFilter ? regionFilteredData : undefined}
        regionLabel={activeFilter?.nama}
        onClearRegion={activeFilter ? () => setActiveFilter(null) : undefined}
      />

      {/* Map section: WAB iframe + Layer Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: 10,
        padding: '10px 16px 0',
        height: 540,
      }}>
        {/* WAB Map area */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-faint)',
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Map label */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            background: isDark ? 'rgba(0,14,31,0.85)' : 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(0,121,193,0.3)',
            borderRadius: 8, padding: '5px 12px',
            fontSize: 11, fontWeight: 700, color: 'var(--text-primary)',
            backdropFilter: 'blur(8px)', letterSpacing: 0.5,
            display: 'flex', alignItems: 'center', gap: 6,
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 8, background: 'linear-gradient(135deg,#0079C1,#00A9CE)', color: '#fff', borderRadius: 4, padding: '1px 5px', fontWeight: 800 }}>ArcGIS</span>
            Konsep 2 — ArcGIS Maps SDK
          </div>
          <ArcGISMapView theme={theme} activeLayers={activeLayers} />
        </div>

        {/* ArcGIS Layer Panel */}
        <ArcGISLayerPanel theme={theme} activeLayers={activeLayers} onToggle={handleLayerToggle} />
      </div>

      {/* Divider — Charts */}
      <div style={{ padding: '24px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-faint)' }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.2, whiteSpace: 'nowrap' }}>
          📊 Analisis Statistik — Sumber: DIBI BNPB 2011–2026
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--border-faint)' }} />
      </div>

      <ChartSection
        theme={theme}
        filteredData={activeFilter ? filteredData : undefined}
        regionLabel={activeFilter?.nama}
      />

      {/* Divider — Analysis */}
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-faint)' }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.2, whiteSpace: 'nowrap' }}>
          🛡 Model Kerentanan, Fase Bencana & Respon
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--border-faint)' }} />
      </div>

      <AnalysisModelsSection />
    </div>
  );
}
