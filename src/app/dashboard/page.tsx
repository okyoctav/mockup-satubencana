'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AlertTicker from '@/components/dashboard/AlertTicker';
import StatCards from '@/components/dashboard/StatCards';
import DashboardMap from '@/components/dashboard/DashboardMap';
import FilterPanel from '@/components/dashboard/FilterPanel';
import ChartSection from '@/components/dashboard/ChartSection';
import AnalysisModelsSection from '@/components/dashboard/AnalysisModelsSection';
import bencanaData from '@/data/bencana.json';
import { Wilayah } from '@/data/wilayah';

const allData = bencanaData.kejadian as {
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
  status: string;
  level: string;
}[];

export default function DashboardPage() {
  const { theme } = useTheme();
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [filters, setFilters] = useState({ jenis: 'Semua', status: 'Semua', level: 'Semua' });

  const handleSearch = (w: Wilayah) => {
    setFlyTo({ lat: w.lat, lng: w.lng, zoom: w.zoom });
  };

  const handleAlertClick = (lat: number, lng: number) => {
    setFlyTo({ lat, lng, zoom: 12 });
  };

  const handleEventClick = (lat: number, lng: number) => {
    setFlyTo({ lat, lng, zoom: 13 });
  };

  const filteredData = allData.filter((k) => {
    if (filters.jenis !== 'Semua' && k.jenis !== filters.jenis) return false;
    if (filters.status !== 'Semua' && k.status !== filters.status) return false;
    if (filters.level !== 'Semua' && k.level !== filters.level) return false;
    return true;
  });

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
      {/* Header — sticky */}
      <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
        <DashboardHeader onSearch={handleSearch} />
        <AlertTicker onAlertClick={handleAlertClick} />
      </div>

      {/* Stat Cards */}
      <StatCards status={filters.status} />

      {/* Map + Filter Panel — fixed height section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 10,
          padding: '10px 16px 0',
          height: 480,
        }}
      >
        {/* Map */}
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
            🗺 Model 2 — Peta Sebaran Bencana Nasional
          </div>
          <DashboardMap data={filteredData} flyTo={flyTo} theme={theme} />
        </div>

        {/* Filter Panel */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-faint)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <FilterPanel
            data={allData}
            filters={filters}
            onFilter={setFilters}
            onEventClick={handleEventClick}
          />
        </div>
      </div>

      {/* Divider label */}
      <div style={{ padding: '24px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-faint)' }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.2, whiteSpace: 'nowrap' }}>
          📊 Analisis Statistik — Sumber: DIBI BNPB 2011–2026
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--border-faint)' }} />
      </div>

      {/* Chart section — scrollable */}
      <ChartSection theme={theme} />

      {/* Divider label 2 */}
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-faint)' }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.2, whiteSpace: 'nowrap' }}>
          🛡 Model Kerentanan, Fase Bencana & Respon
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--border-faint)' }} />
      </div>

      {/* Analysis Models 4, 6, 7 */}
      <AnalysisModelsSection />
    </div>
  );
}
