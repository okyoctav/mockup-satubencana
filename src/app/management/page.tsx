'use client';

import { useState, useMemo } from 'react';
import { AdminLayout } from '@/app/admin/AdminLayout';

const INARISK_BASE = 'https://gis.bnpb.go.id/server/rest/services/inarisk';

const SERVICES = [
  { name: 'Arah_jalur_evakuasi', type: 'MapServer', kategori: 'Evakuasi', deskripsi: 'Arah dan jalur evakuasi bencana' },
  { name: 'batas_administrasi', type: 'MapServer', kategori: 'Administrasi', deskripsi: 'Batas administrasi wilayah' },
  { name: 'Batas_Desa', type: 'ImageServer', kategori: 'Administrasi', deskripsi: 'Batas desa seluruh Indonesia' },
  { name: 'batas_provinsi', type: 'MapServer', kategori: 'Administrasi', deskripsi: 'Batas provinsi Indonesia' },
  { name: 'DIBI_Hidromet_2015_2024', type: 'MapServer', kategori: 'DIBI', deskripsi: 'Data bencana hidromet 2015–2024' },
  { name: 'DIBI_Kabupaten_2015_2024_Hidromet', type: 'MapServer', kategori: 'DIBI', deskripsi: 'Data DIBI per kabupaten hidromet' },
  { name: 'DIBI_Provinsi_2015_2024_Hidromet', type: 'MapServer', kategori: 'DIBI', deskripsi: 'Data DIBI per provinsi hidromet' },
  { name: 'Faults_new', type: 'MapServer', kategori: 'Geologi', deskripsi: 'Sesar/fault terbaru Indonesia' },
  { name: 'Faults', type: 'MapServer', kategori: 'Geologi', deskripsi: 'Sesar/fault Indonesia' },
  { name: 'global_tsunami_modelling', type: 'MapServer', kategori: 'Tsunami', deskripsi: 'Pemodelan tsunami global' },
  { name: 'IDX_H_EQ_GLOBAL', type: 'ImageServer', kategori: 'Indeks', deskripsi: 'Indeks bahaya gempa bumi global' },
  { name: 'INARISKPOP_2020', type: 'ImageServer', kategori: 'Populasi', deskripsi: 'Populasi terpapar risiko 2020' },
  { name: 'INDEKS_BAHAYA_BANJIR', type: 'MapServer', kategori: 'Banjir', deskripsi: 'Indeks bahaya banjir nasional' },
  { name: 'INDEKS_BAHAYA_LONGSOR', type: 'MapServer', kategori: 'Longsor', deskripsi: 'Indeks bahaya tanah longsor' },
  { name: 'INDEKS_BAHAYA_GEMPA', type: 'MapServer', kategori: 'Gempa', deskripsi: 'Indeks bahaya gempa bumi' },
  { name: 'INDEKS_BAHAYA_TSUNAMI', type: 'MapServer', kategori: 'Tsunami', deskripsi: 'Indeks bahaya tsunami nasional' },
  { name: 'INDEKS_BAHAYA_ERUPSI', type: 'MapServer', kategori: 'Erupsi', deskripsi: 'Indeks bahaya erupsi gunung api' },
  { name: 'INDEKS_BAHAYA_KEKERINGAN', type: 'MapServer', kategori: 'Kekeringan', deskripsi: 'Indeks bahaya kekeringan' },
  { name: 'INDEKS_BAHAYA_KEBAKARAN', type: 'MapServer', kategori: 'Kebakaran', deskripsi: 'Indeks bahaya kebakaran hutan/lahan' },
  { name: 'INDEKS_RESIKO_BENCANA', type: 'MapServer', kategori: 'Indeks', deskripsi: 'Indeks risiko bencana multi-ancaman' },
  { name: 'INDEKS_KERENTANAN', type: 'MapServer', kategori: 'Indeks', deskripsi: 'Indeks kerentanan wilayah' },
  { name: 'INDEKS_KAPASITAS', type: 'MapServer', kategori: 'Indeks', deskripsi: 'Indeks kapasitas daerah' },
  { name: 'KRB_BANJIR', type: 'MapServer', kategori: 'Banjir', deskripsi: 'Kawasan rawan bencana banjir' },
  { name: 'KRB_LONGSOR', type: 'MapServer', kategori: 'Longsor', deskripsi: 'Kawasan rawan bencana longsor' },
  { name: 'KRB_GEMPA', type: 'MapServer', kategori: 'Gempa', deskripsi: 'Kawasan rawan bencana gempa' },
  { name: 'KRB_TSUNAMI', type: 'MapServer', kategori: 'Tsunami', deskripsi: 'Kawasan rawan bencana tsunami' },
  { name: 'KRB_ERUPSI', type: 'MapServer', kategori: 'Erupsi', deskripsi: 'Kawasan rawan bencana erupsi' },
  { name: 'Tsunami_Modelling_Sumatra', type: 'MapServer', kategori: 'Tsunami', deskripsi: 'Pemodelan tsunami Sumatera' },
  { name: 'volcano', type: 'MapServer', kategori: 'Erupsi', deskripsi: 'Sebaran gunung api aktif' },
];

const KATEGORI_COLOR: Record<string, string> = {
  Evakuasi: '#35a7ff',
  Administrasi: '#38618c',
  DIBI: '#ff7f11',
  Geologi: '#8b5cf6',
  Tsunami: '#06b6d4',
  Indeks: '#ccdbdc',
  Populasi: '#22c55e',
  Banjir: '#0ea5e9',
  Longsor: '#f97316',
  Gempa: '#ef4444',
  Erupsi: '#f59e0b',
  Kekeringan: '#78716c',
  Kebakaran: '#dc2626',
};

export default function ManagementPage() {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [typeFilter, setTypeFilter] = useState('Semua');

  const kategoriList = ['Semua', ...Array.from(new Set(SERVICES.map(s => s.kategori))).sort()];
  const typeList = ['Semua', 'MapServer', 'ImageServer'];

  const filtered = useMemo(() => {
    return SERVICES.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.deskripsi.toLowerCase().includes(q) || s.kategori.toLowerCase().includes(q);
      const matchKategori = kategoriFilter === 'Semua' || s.kategori === kategoriFilter;
      const matchType = typeFilter === 'Semua' || s.type === typeFilter;
      return matchSearch && matchKategori && matchType;
    });
  }, [search, kategoriFilter, typeFilter]);

  return (
    <AdminLayout title="Management Data" subtitle="Layanan Geospasial Inarisk — BNPB">
      <div style={{ padding: '8px 0' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Layanan', value: SERVICES.length, icon: '🗂', accent: '#35a7ff' },
            { label: 'MapServer', value: SERVICES.filter(s => s.type === 'MapServer').length, icon: '🗺', accent: '#38618c' },
            { label: 'ImageServer', value: SERVICES.filter(s => s.type === 'ImageServer').length, icon: '🖼', accent: '#ff7f11' },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)', borderRadius: 14, padding: '16px 20px', borderLeft: `3px solid ${c.accent}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{c.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)', borderRadius: 14, padding: '16px 20px', marginBottom: 18, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Cari nama layer, kategori, deskripsi..."
            style={{ flex: 1, minWidth: 220, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
          />
          <select
            value={kategoriFilter}
            onChange={e => setKategoriFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12 }}
          >
            {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12 }}
          >
            {typeList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {filtered.length} dari {SERVICES.length} layanan
          </span>
        </div>

        {/* DataTable */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-faint)', background: 'var(--bg-primary)' }}>
                {['#', 'Nama Layer', 'Kategori', 'Tipe', 'Deskripsi', 'Endpoint', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.name} style={{ borderBottom: '1px solid var(--border-faint)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(53,167,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)', maxWidth: 200 }}>
                    {s.name.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      background: `${KATEGORI_COLOR[s.kategori] ?? '#38618c'}20`,
                      color: KATEGORI_COLOR[s.kategori] ?? '#38618c',
                      border: `1px solid ${KATEGORI_COLOR[s.kategori] ?? '#38618c'}40`,
                    }}>
                      {s.kategori}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 600,
                      background: s.type === 'MapServer' ? 'rgba(53,167,255,0.12)' : 'rgba(255,127,17,0.12)',
                      color: s.type === 'MapServer' ? '#35a7ff' : '#ff7f11',
                    }}>
                      {s.type}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', maxWidth: 240 }}>{s.deskripsi}</td>
                  <td style={{ padding: '10px 14px', maxWidth: 260 }}>
                    <code style={{ fontSize: 10, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                      /inarisk/{s.name}
                    </code>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a
                        href={`${INARISK_BASE}/${s.name}/${s.type === 'ImageServer' ? '' : '0'}/query?where=1%3D1&outFields=*&f=geojson`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(53,167,255,0.12)', color: '#35a7ff', fontSize: 10, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(53,167,255,0.25)', whiteSpace: 'nowrap' }}
                      >
                        GeoJSON
                      </a>
                      <a
                        href={`${INARISK_BASE}/${s.name}?f=json`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(204,219,220,0.12)', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border-faint)', whiteSpace: 'nowrap' }}
                      >
                        Detail
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Tidak ada layanan yang sesuai filter.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
