'use client';

import { DIBI_TOTAL } from '@/data/dibiStats';

const CARDS = [
  {
    label: 'Total Kejadian',
    sublabel: 'Data DIBI 2011–2026',
    value: DIBI_TOTAL.kejadian.toLocaleString('id'),
    unit: 'kejadian',
    icon: '📋',
    accent: '#35a7ff',
    trend: '50.000 record bencana',
    trendUp: true,
  },
  {
    label: 'Meninggal & Hilang',
    sublabel: 'Korban Jiwa',
    value: (DIBI_TOTAL.meninggal + DIBI_TOTAL.hilang).toLocaleString('id'),
    unit: 'jiwa',
    icon: '👤',
    accent: '#ff7f11',
    trend: `${DIBI_TOTAL.luka.toLocaleString('id')} luka/sakit`,
    trendUp: false,
  },
  {
    label: 'Menderita & Mengungsi',
    sublabel: 'Total Pengungsi',
    value: (DIBI_TOTAL.pengungsi / 1_000_000).toFixed(1) + ' Jt',
    unit: 'jiwa',
    icon: '🏕',
    accent: '#ff7f11',
    trend: `82,7 juta total pengungsi`,
    trendUp: false,
  },
  {
    label: 'Rumah Terdampak',
    sublabel: 'Rusak + Terendam',
    value: (DIBI_TOTAL.rumah_terdampak / 1_000_000).toFixed(2) + ' Jt',
    unit: 'unit',
    icon: '🏠',
    accent: '#35a7ff',
    trend: `11,8 juta unit rumah`,
    trendUp: true,
  },
];

export default function StatCards() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        padding: '8px 16px',
      }}
    >
      {CARDS.map((c) => (
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
              fontSize: 18,
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
  );
}
