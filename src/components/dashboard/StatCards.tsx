'use client';

import { useState } from 'react';
import { ClipboardList, Users, Tent, Home, Building2, MapPin } from 'lucide-react';
import { DIBI_TOTAL } from '@/data/dibiStats';

type CardIcon = React.ReactNode;

type Kejadian = {
  korban_jiwa: number;
  pengungsi: number;
  rumah_terdampak?: number;
};

const NATIONAL_CARDS = [
  {
    label: 'Total Kejadian',
    sublabel: 'Data DIBI 2011–2026',
    getValue: () => DIBI_TOTAL.kejadian.toLocaleString('id'),
    unit: 'kejadian',
    icon: <ClipboardList size={20} /> as CardIcon,
    accent: '#35a7ff',
    getTrend: () => '50.000 record bencana',
    trendUp: true,
  },
  {
    label: 'Meninggal & Hilang',
    sublabel: 'Korban Jiwa',
    getValue: () => (DIBI_TOTAL.meninggal + DIBI_TOTAL.hilang).toLocaleString('id'),
    unit: 'jiwa',
    icon: <Users size={20} /> as CardIcon,
    accent: '#ff7f11',
    getTrend: () => `${DIBI_TOTAL.luka.toLocaleString('id')} luka/sakit`,
    trendUp: false,
  },
  {
    label: 'Menderita & Mengungsi',
    sublabel: 'Total Pengungsi',
    getValue: () => (DIBI_TOTAL.pengungsi / 1_000_000).toFixed(1) + ' Jt',
    unit: 'jiwa',
    icon: <Tent size={20} /> as CardIcon,
    accent: '#ff7f11',
    getTrend: () => '82,7 juta total pengungsi',
    trendUp: false,
  },
  {
    label: 'Rumah Terdampak',
    sublabel: 'Rusak + Terendam',
    getValue: () => (DIBI_TOTAL.rumah_terdampak / 1_000_000).toFixed(2) + ' Jt',
    unit: 'unit',
    icon: <Home size={20} /> as CardIcon,
    accent: '#35a7ff',
    getTrend: () => '11,8 juta unit rumah',
    trendUp: true,
  },
];

interface Props {
  status?: string;
  regionData?: Kejadian[];
  regionLabel?: string;
  onClearRegion?: () => void;
}

export default function StatCards({ status, regionData, regionLabel, onClearRegion }: Props) {
  const [showRehabModal, setShowRehabModal] = useState(false);
  const showRehab = status === 'pasca';

  // Compute dynamic stats from region-filtered data
  const regionStats = regionData
    ? {
        kejadian: regionData.length,
        korban_jiwa: regionData.reduce((s, k) => s + k.korban_jiwa, 0),
        pengungsi: regionData.reduce((s, k) => s + k.pengungsi, 0),
        rumah_terdampak: regionData.reduce((s, k) => s + (k.rumah_terdampak ?? 0), 0),
      }
    : null;

  // Build display cards
  const cards = regionStats
    ? [
        {
          label: 'Total Kejadian',
          sublabel: regionLabel ?? 'Wilayah Terpilih',
          value: regionStats.kejadian.toLocaleString('id'),
          unit: 'kejadian',
          icon: <ClipboardList size={20} /> as CardIcon,
          accent: '#35a7ff',
          trend: `dari ${DIBI_TOTAL.kejadian.toLocaleString('id')} nasional`,
          trendUp: true,
        },
        {
          label: 'Meninggal & Hilang',
          sublabel: 'Korban Jiwa',
          value: regionStats.korban_jiwa.toLocaleString('id'),
          unit: 'jiwa',
          icon: <Users size={20} /> as CardIcon,
          accent: '#ff7f11',
          trend: 'berdasarkan data lokal',
          trendUp: false,
        },
        {
          label: 'Menderita & Mengungsi',
          sublabel: 'Total Pengungsi',
          value: regionStats.pengungsi >= 1_000_000
            ? (regionStats.pengungsi / 1_000_000).toFixed(1) + ' Jt'
            : regionStats.pengungsi.toLocaleString('id'),
          unit: 'jiwa',
          icon: <Tent size={20} /> as CardIcon,
          accent: '#ff7f11',
          trend: 'berdasarkan data lokal',
          trendUp: false,
        },
        {
          label: 'Rumah Terdampak',
          sublabel: 'Rusak + Terendam',
          value: regionStats.rumah_terdampak > 0
            ? regionStats.rumah_terdampak.toLocaleString('id')
            : '—',
          unit: regionStats.rumah_terdampak > 0 ? 'unit' : '',
          icon: <Home size={20} /> as CardIcon,
          accent: '#35a7ff',
          trend: regionStats.rumah_terdampak > 0 ? 'berdasarkan data lokal' : 'data tidak tersedia per wilayah',
          trendUp: true,
        },
      ]
    : NATIONAL_CARDS.map((c) => ({
        label: c.label,
        sublabel: c.sublabel,
        value: c.getValue(),
        unit: c.unit,
        icon: c.icon,
        accent: c.accent,
        trend: c.getTrend(),
        trendUp: c.trendUp,
      }));

  const REHAB_ROWS = [
    { provinsi: 'Aceh', program: 5240, a2026: 'Rp 24.413.584.187.060', a2027: 'Rp 18.700.109.534.662', a2028: 'Rp 15.884.670.865.237', total: 'Rp 58.998.364.586.959' },
    { provinsi: 'Sumatera Utara', program: 1971, a2026: 'Rp 8.968.931.090.944', a2027: 'Rp 7.996.217.522.392', a2028: 'Rp 6.450.248.696.599', total: 'Rp 23.415.397.309.935' },
    { provinsi: 'Sumatera Barat', program: 4791, a2026: 'Rp 7.856.905.150.891', a2027: 'Rp 5.816.725.182.105', a2028: 'Rp 8.650.463.097.458', total: 'Rp 22.324.093.430.454' },
  ];

  return (
    <>
      {/* Region filter badge */}
      {regionLabel && (
        <div style={{ padding: '4px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 12px', borderRadius: 20,
            background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)',
            fontSize: 11, color: '#0EA5E9', fontWeight: 600,
          }}>
            <MapPin size={13} /> Filter Wilayah: {regionLabel}
            <button
              onClick={onClearRegion}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0EA5E9', fontSize: 13, padding: 0, lineHeight: 1, opacity: 0.7 }}
              title="Hapus filter wilayah"
            >✕</button>
          </div>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showRehab ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)',
          gap: 10,
          padding: '8px 16px',
        }}
      >
        {/* Rehab-Rekon card — only when pasca is selected */}
        {showRehab && (
          <div
            key="rehab-rekon"
            onClick={() => setShowRehabModal(true)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-faint)',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              borderLeft: '3px solid #10b981',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(16,185,129,0.18)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#10b98118',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0,
              }}
            >
              <Building2 size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                Rehab-Rekon <span style={{ opacity: 0.7 }}>· Total Anggaran</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                Rp 104,7 T
              </div>
              <div style={{ fontSize: 10, color: '#10b981', marginTop: 3 }}>
                ▲ Akumulasi 2026–2028
              </div>
            </div>
          </div>
        )}

        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-faint)',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              borderLeft: `3px solid ${c.accent}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px rgba(0,0,0,0.12)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${c.accent}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: c.accent,
                flexShrink: 0,
              }}
            >
              {c.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                {c.label}
                {c.sublabel && <span style={{ opacity: 0.7 }}> · {c.sublabel}</span>}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {c.value}
                {c.unit && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>{c.unit}</span>}
              </div>
              <div style={{ fontSize: 10, color: c.trendUp ? '#35a7ff' : 'var(--text-muted)', marginTop: 3 }}>
                {c.trendUp ? '▲' : '▼'} {c.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rehab-Rekon Modal */}
      {showRehabModal && (
        <div
          onClick={() => setShowRehabModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 18,
              padding: '28px 32px',
              maxWidth: 820,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  🏗 Rehabilitasi & Rekonstruksi
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  Rp 104.737.855.327.349
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Total Anggaran · Akumulasi 2026–2028
                </div>
              </div>
              <button
                onClick={() => setShowRehabModal(false)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-faint)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>

            {/* Summary stat pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { value: '12.002', label: 'Program Terdaftar', sub: 'Total Kegiatan/Program', color: '#35a7ff' },
                { value: '3 Provinsi', label: 'Cakupan Wilayah', sub: 'Sebaran Lokasi', color: '#10b981' },
                { value: '54 K/L', label: 'Instansi Terlibat', sub: 'Kementerian / Lembaga', color: '#f59e0b' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: `${s.color}10`,
                    border: `1px solid ${s.color}30`,
                    borderRadius: 12,
                    padding: '14px 16px',
                    borderLeft: `3px solid ${s.color}`,
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Rincian Per Provinsi
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border-faint)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-page)' }}>
                    {['PROVINSI', 'PROGRAM UNIT', 'ANGGARAN 2026', 'ANGGARAN 2027', 'ANGGARAN 2028', 'TOTAL'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 14px',
                          textAlign: h === 'PROVINSI' || h === 'PROGRAM UNIT' ? 'left' : 'right',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          fontSize: 10,
                          letterSpacing: 0.6,
                          borderBottom: '1px solid var(--border-faint)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REHAB_ROWS.map((row, i) => (
                    <tr
                      key={row.provinsi}
                      style={{ background: i % 2 === 0 ? 'transparent' : 'var(--glass-bg)' }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{row.provinsi}</td>
                      <td style={{ padding: '10px 14px', color: '#35a7ff', fontWeight: 700 }}>{row.program.toLocaleString('id')}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{row.a2026}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{row.a2027}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{row.a2028}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
