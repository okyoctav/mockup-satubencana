'use client';

import { useState, useMemo } from 'react';
import bencanaData from '@/data/bencana.json';

type KejadianBase = {
  provinsi: string;
  kabupaten: string;
  lat: number;
  lng: number;
};

// Build lookup dari bencana.json langsung
const allKejadian = bencanaData.kejadian as KejadianBase[];

// Unique provinsi sorted A-Z
const PROVINSI_LIST = Array.from(new Set(allKejadian.map((k) => k.provinsi))).sort();

// Kabupaten per provinsi
const KAB_BY_PROV: Record<string, { nama: string; lat: number; lng: number }[]> = {};
for (const k of allKejadian) {
  if (!KAB_BY_PROV[k.provinsi]) KAB_BY_PROV[k.provinsi] = [];
  if (!KAB_BY_PROV[k.provinsi].find((x) => x.nama === k.kabupaten)) {
    KAB_BY_PROV[k.provinsi].push({ nama: k.kabupaten, lat: k.lat, lng: k.lng });
  }
}
for (const arr of Object.values(KAB_BY_PROV)) {
  arr.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
}

// Center of provinsi = average lat/lng of its records
const PROV_CENTER: Record<string, { lat: number; lng: number }> = {};
for (const prov of PROVINSI_LIST) {
  const recs = allKejadian.filter((k) => k.provinsi === prov);
  const lat = recs.reduce((s, r) => s + r.lat, 0) / recs.length;
  const lng = recs.reduce((s, r) => s + r.lng, 0) / recs.length;
  PROV_CENTER[prov] = { lat, lng };
}

export type FilterWilayah =
  | { tipe: 'provinsi'; nama: string; lat: number; lng: number }
  | { tipe: 'kabupaten'; nama: string; provinsi: string; lat: number; lng: number };

interface Props {
  onSelect: (w: FilterWilayah | null) => void;
  theme: string;
}

export default function WilayahDropdown({ onSelect, theme }: Props) {
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedKab, setSelectedKab] = useState('');

  const kabList = useMemo(
    () => (selectedProv ? KAB_BY_PROV[selectedProv] ?? [] : []),
    [selectedProv]
  );

  const isDark = theme === 'dark';
  const selectStyle: React.CSSProperties = {
    background: isDark ? 'rgba(10,22,40,0.9)' : 'rgba(240,247,255,0.95)',
    border: `1.5px solid ${isDark ? '#1e3a5f' : '#c3d7ef'}`,
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 12,
    padding: '5px 10px',
    outline: 'none',
    cursor: 'pointer',
    minWidth: 160,
    height: 34,
  };

  const handleProvChange = (prov: string) => {
    setSelectedProv(prov);
    setSelectedKab('');
    if (!prov) {
      onSelect(null);
      return;
    }
    const c = PROV_CENTER[prov];
    onSelect({ tipe: 'provinsi', nama: prov, lat: c.lat, lng: c.lng });
  };

  const handleKabChange = (kab: string) => {
    setSelectedKab(kab);
    if (!kab) {
      // fall back to province
      const c = PROV_CENTER[selectedProv];
      onSelect({ tipe: 'provinsi', nama: selectedProv, lat: c.lat, lng: c.lng });
      return;
    }
    const found = kabList.find((k) => k.nama === kab);
    if (!found) return;
    onSelect({ tipe: 'kabupaten', nama: kab, provinsi: selectedProv, lat: found.lat, lng: found.lng });
  };

  const handleClear = () => {
    setSelectedProv('');
    setSelectedKab('');
    onSelect(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          whiteSpace: 'nowrap',
        }}
      >
        Filter:
      </span>

      {/* Provinsi */}
      <select
        value={selectedProv}
        onChange={(e) => handleProvChange(e.target.value)}
        style={selectStyle}
      >
        <option value="">— Semua Provinsi —</option>
        {PROVINSI_LIST.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* Kabupaten/Kota */}
      <select
        value={selectedKab}
        onChange={(e) => handleKabChange(e.target.value)}
        disabled={!selectedProv}
        style={{
          ...selectStyle,
          opacity: selectedProv ? 1 : 0.45,
          cursor: selectedProv ? 'pointer' : 'not-allowed',
        }}
      >
        <option value="">— Semua Kab/Kota —</option>
        {kabList.map((k) => (
          <option key={k.nama} value={k.nama}>
            {k.nama}
          </option>
        ))}
      </select>

      {/* Clear button */}
      {(selectedProv || selectedKab) && (
        <button
          onClick={handleClear}
          title="Reset filter"
          style={{
            background: 'none',
            border: `1px solid ${isDark ? '#1e3a5f' : '#c3d7ef'}`,
            borderRadius: 8,
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1,
            height: 34,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
