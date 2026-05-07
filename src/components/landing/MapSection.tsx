'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import bencanaData from '@/data/bencana.json';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94A3B8',
        fontSize: '14px',
      }}
    >
      Memuat peta...
    </div>
  ),
});

const JENIS_COLOR: Record<string, string> = {
  banjir: '#0EA5E9',
  longsor: '#F97316',
  gempa: '#EF4444',
  kebakaran: '#EAB308',
};

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
  status: string;
  level: string;
};

export default function MapSection() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const kejadian: Kejadian[] = bencanaData.kejadian as Kejadian[];

  const filteredData = activeFilter
    ? kejadian.filter((k) => k.jenis === activeFilter)
    : kejadian;

  const totalKorban = filteredData.reduce((sum, k) => sum + k.korban_jiwa, 0);
  const totalPengungsi = filteredData.reduce((sum, k) => sum + k.pengungsi, 0);
  const kejadianAktif = filteredData.filter((k) => k.status === 'saat').length;

  return (
    <section id="peta" className="relative py-20 px-6" style={{ background: 'var(--bg-section)' }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: '#0EA5E9' }}>
          SECTION 02 · PETA INTERAKTIF
        </p>
        <h2 className="text-3xl md:text-5xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Peta{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #0EA5E9, #22C55E)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Bencana Indonesia
          </span>
        </h2>
        <p className="text-sm md:text-base max-w-2xl mx-auto mb-6" style={{ color: 'var(--text-secondary)' }}>
          Sebaran lokasi kejadian bencana di Sumatera — klik marker untuk detail
        </p>

        {/* Filter buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { key: null, label: 'Semua', color: '#94A3B8' },
            { key: 'banjir', label: 'Banjir', color: '#0EA5E9' },
            { key: 'longsor', label: 'Longsor', color: '#F97316' },
            { key: 'gempa', label: 'Gempa', color: '#EF4444' },
            { key: 'kebakaran', label: 'Kebakaran', color: '#EAB308' },
          ].map((f) => (
            <button
              key={String(f.key)}
              onClick={() => setActiveFilter(f.key)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                backgroundColor:
                  activeFilter === f.key ? f.color : 'rgba(255,255,255,0.06)',
                color: activeFilter === f.key ? '#fff' : f.color,
                border: `1px solid ${f.color}55`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--card-border-red)',
          }}
        >
          <div className="text-4xl font-bold mb-2" style={{ color: '#EF4444' }}>
            {totalKorban}
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Total Korban Jiwa
          </div>
        </div>
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(14,165,233,0.2)',
          }}
        >
          <div className="text-4xl font-bold mb-2" style={{ color: '#0EA5E9' }}>
            {totalPengungsi.toLocaleString('id')}
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Total Pengungsi
          </div>
        </div>
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(249,115,22,0.2)',
          }}
        >
          <div className="text-4xl font-bold mb-2" style={{ color: '#F97316' }}>
            {kejadianAktif}/{filteredData.length}
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Kejadian Aktif / Total
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="max-w-7xl mx-auto mb-12">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: '1px solid var(--card-border-blue)',
            height: '500px',
          }}
        >
          <LeafletMap data={filteredData} />
        </div>

        {/* Map Legend */}
        <div className="flex flex-wrap gap-6 mt-4 justify-center">
          {Object.entries(JENIS_COLOR).map(([jenis, color]) => (
            <div key={jenis} className="flex items-center gap-2">
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: color,
                }}
              />
              <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                {jenis}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span
              style={{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'rgba(148,163,184,0.4)',
                border: '2px solid #94A3B8',
              }}
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Ukuran = level bahaya
            </span>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="max-w-7xl mx-auto">
        <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Daftar Kejadian
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredData.slice(0, 6).map((k) => (
            <div
              key={k.id}
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${JENIS_COLOR[k.jenis]}20`,
                    color: JENIS_COLOR[k.jenis],
                  }}
                >
                  {k.jenis.toUpperCase()}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    k.status === 'saat'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {k.status === 'saat' ? 'AKTIF' : 'SELESAI'}
                </span>
              </div>
              <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                {k.nama}
              </h4>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                {k.kabupaten}, {k.provinsi}
              </p>
              <div className="flex gap-4 text-xs">
                <div>
                  <span style={{ color: '#EF4444' }}>💀 {k.korban_jiwa}</span> korban
                </div>
                <div>
                  <span style={{ color: '#0EA5E9' }}>👥 {k.pengungsi.toLocaleString('id')}</span>{' '}
                  pengungsi
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
