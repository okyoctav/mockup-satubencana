'use client';

import bencanaData from '@/data/bencana.json';

const stats = bencanaData.statistik as {
  total_kejadian_2024: number;
  total_korban: number;
  total_pengungsi: number;
  provinsi_terdampak: number;
  estimasi_kerugian_miliar?: number;
  rumah_terdampak?: number;
};

const CARDS = [
  {
    label: 'Total Kejadian',
    sublabel: 'Tahun Ini',
    value: stats.total_kejadian_2024?.toLocaleString('id') ?? '342',
    unit: '',
    icon: '📋',
    accent: '#35a7ff',
    trend: '+12% vs tahun lalu',
    trendUp: true,
  },
  {
    label: 'Estimasi Kerugian',
    sublabel: 'Nasional',
    value: stats.estimasi_kerugian_miliar ? `${stats.estimasi_kerugian_miliar} M` : '250 M',
    unit: 'IDR',
    icon: '💰',
    accent: '#ff7f11',
    trend: '-5% vs tahun lalu',
    trendUp: false,
  },
  {
    label: 'Jumlah Korban',
    sublabel: 'Jiwa',
    value: stats.total_korban ? `${(stats.total_korban / 1000).toFixed(1)}K` : '1,5K',
    unit: '',
    icon: '👤',
    accent: '#ff7f11',
    trend: '+3% vs tahun lalu',
    trendUp: true,
  },
  {
    label: 'Rumah Terdampak',
    sublabel: 'Unit',
    value: stats.rumah_terdampak ? `${(stats.rumah_terdampak / 1000).toFixed(0)}K` : '35K',
    unit: '',
    icon: '🏠',
    accent: '#35a7ff',
    trend: '-8% vs tahun lalu',
    trendUp: false,
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
