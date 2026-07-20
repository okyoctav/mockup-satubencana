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

export default function DashboardK4Page() {
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
        <DashboardHeader onSearch={handleSearch} />
        <AlertTicker onAlertClick={handleAlertClick} />
      </div>

      <div
        style={{
          padding: '6px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: theme === 'dark'
            ? 'linear-gradient(90deg, rgba(14,165,233,0.18), rgba(53,167,255,0.08))'
            : 'linear-gradient(90deg, rgba(14,165,233,0.10), rgba(53,167,255,0.04))',
          borderBottom: '1px solid rgba(14,165,233,0.2)',
        }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
          color: '#fff', borderRadius: 20,
          padding: '3px 12px', fontSize: 10, fontWeight: 800,
          letterSpacing: 0.6,
        }}>
          ⚡ KONSEP 4 — Dukcapil Feature Service Estimator
        </div>
        <span style={{ fontSize: 10, color: theme === 'dark' ? '#94A3B8' : '#64748B' }}>
          Estimasi Kependudukan Real-time Terbencana
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
            href="/dashboard_k2"
            style={{
              fontSize: 10, color: '#0EA5E9',
              textDecoration: 'none', fontWeight: 600,
            }}
          >
            Konsep 2 (ArcGIS Native)
          </a>
        </div>
      </div>

      <div
        style={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: theme === 'dark' ? 'rgba(5,14,31,0.8)' : 'rgba(236,245,255,0.9)',
          borderBottom: '1px solid var(--border-faint)',
          flexWrap: 'wrap',
        }}
      >
        <WilayahDropdown onSelect={handleDropdownFilter} theme={theme} />
        {activeFilter && (
          <span style={{ fontSize: 11, color: '#35a7ff', fontWeight: 600 }}>
            🔍 {activeFilter.tipe === 'provinsi' ? 'Provinsi' : 'Kab/Kota'}: <strong>{activeFilter.nama}</strong>
            {' '}— {regionFilteredData.length} kejadian
          </span>
        )}
      </div>

      <StatCards
        status={filters.status}
        regionData={activeFilter ? regionFilteredData : undefined}
        regionLabel={activeFilter?.nama}
        onClearRegion={activeFilter ? handleClearSearch : undefined}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 10,
          padding: '10px 16px 0',
          height: 480,
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-faint)',
            borderRadius: 14,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 999,
              background: theme === 'dark' ? 'rgba(10,22,40,0.85)' : 'rgba(255,255,255,0.9)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-primary)',
              backdropFilter: 'blur(8px)',
              letterSpacing: 0.5,
            }}
          >
            🗺 Model 4 — Peta KJS GeoJSON Lokal
          </div>
          <DashboardMapK4 flyTo={flyTo} theme={theme} />
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-faint)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <FilterPanel
            data={regionFilteredData}
            filters={filters}
            onFilter={setFilters}
            onEventClick={handleEventClick}
          />
        </div>
      </div>

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
