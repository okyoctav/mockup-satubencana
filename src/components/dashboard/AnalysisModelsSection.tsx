'use client';

// Model 6: Kerentanan & Kapasitas (Inarisk layers)
// Model 7: Respon & Bantuan (timeline statistik)
// Model 4: Fase Bencana (pra/saat/pasca overview)

const INARISK_LAYERS = [
  { label: 'Indeks Risiko Multi-Ancaman', key: 'INDEKS_RESIKO_BENCANA', level: 'Nasional', color: '#EF4444' },
  { label: 'Indeks Kerentanan Wilayah',   key: 'INDEKS_KERENTANAN',     level: 'Nasional', color: '#FF7F11' },
  { label: 'Indeks Kapasitas Daerah',     key: 'INDEKS_KAPASITAS',      level: 'Nasional', color: '#22C55E' },
  { label: 'Kawasan Rawan Banjir (KRB)',  key: 'KRB_BANJIR',            level: 'Nasional', color: '#35A7FF' },
  { label: 'Kawasan Rawan Gempa (KRB)',   key: 'KRB_GEMPA',             level: 'Nasional', color: '#EF4444' },
  { label: 'Kawasan Rawan Longsor (KRB)', key: 'KRB_LONGSOR',           level: 'Nasional', color: '#F97316' },
  { label: 'Indeks Bahaya Banjir',        key: 'INDEKS_BAHAYA_BANJIR',  level: 'Nasional', color: '#0EA5E9' },
  { label: 'Indeks Bahaya Gempa',         key: 'INDEKS_BAHAYA_GEMPA',   level: 'Nasional', color: '#DC2626' },
];

const FASE_BENCANA = [
  {
    fase: 'Pra-Bencana',
    icon: '🟢',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    aktivitas: [
      'Pemetaan kawasan rawan bencana (KRB)',
      'Analisis indeks bahaya multi-ancaman',
      'Pemantauan data historis DIBI 2011–2026',
      'Identifikasi daerah dengan kerentanan tinggi',
      'Perencanaan jalur evakuasi',
    ],
    stats: 'Lebih dari 9 jenis bencana terpantau sistem Inarisk',
  },
  {
    fase: 'Saat Bencana',
    icon: '🔴',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    aktivitas: [
      'Pemantauan kejadian bencana real-time (DIBI)',
      'Distribusi bantuan darurat ke wilayah terdampak',
      'Evakuasi warga menggunakan jalur terencana',
      'Koordinasi BNPB–BPBD–relawan di lapangan',
      'Update data pengungsi & korban jiwa',
    ],
    stats: 'Rata-rata 3.100+ kejadian/bulan di periode puncak',
  },
  {
    fase: 'Pasca-Bencana',
    icon: '🔵',
    color: '#35A7FF',
    bg: 'rgba(53,167,255,0.08)',
    border: 'rgba(53,167,255,0.2)',
    aktivitas: [
      'Asesmen kerusakan rumah & infrastruktur',
      'Estimasi total kerugian ekonomi',
      'Analisis dampak: korban, pengungsi, rumah rusak',
      'Rekonstruksi & rehabilitasi wilayah terdampak',
      'Evaluasi kesiapan respons untuk mitigasi ke depan',
    ],
    stats: '11,8 juta unit rumah terdampak (2011–2026)',
  },
];

const RESPON_STATS = [
  { label: 'Bencana Terbanyak', value: '2021', sub: '6.233 kejadian', icon: '📅', color: '#ff7f11' },
  { label: 'Bulan Puncak Bencana', value: 'Januari', sub: '6.452 kejadian/tahun', icon: '🌧', color: '#35a7ff' },
  { label: 'Jenis Paling Sering', value: 'Banjir', sub: '16.524 kejadian (33%)', icon: '🌊', color: '#35a7ff' },
  { label: 'Korban Jiwa Tertinggi', value: 'Gempa', sub: '5.716 meninggal', icon: '⚠', color: '#ef4444' },
  { label: 'Provinsi Paling Rawan', value: 'Jawa Barat', sub: '9.293 kejadian', icon: '🗺', color: '#38618c' },
  { label: 'Pengungsi Terbesar', value: 'Kekeringan', sub: '23,2 juta pengungsi', icon: '🏕', color: '#78716c' },
];

export default function AnalysisModelsSection() {
  return (
    <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Model 4: Fase Bencana ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>⚡ Model 4 — Analisis Fase Bencana</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Fokus analisis per fase: pra, saat, dan pasca bencana</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {FASE_BENCANA.map(f => (
            <div key={f.fase} style={{ background: f.bg, border: `1px solid ${f.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{f.icon}</span>
                <span style={{ fontWeight: 800, fontSize: 13, color: f.color }}>{f.fase}</span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {f.aktivitas.map((a, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    <span style={{ color: f.color, fontWeight: 700, flexShrink: 0 }}>›</span>
                    {a}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${f.border}`, fontSize: 10, color: f.color, fontWeight: 600 }}>
                {f.stats}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Model 6: Kerentanan & Kapasitas (Inarisk) ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>🛡 Model 6 — Kerentanan & Kapasitas (Inarisk BNPB)</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Akses langsung ke layanan geospasial indeks risiko dari GIS Inarisk</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {INARISK_LAYERS.map(l => (
            <a
              key={l.key}
              href={`https://gis.bnpb.go.id/server/rest/services/inarisk/${l.key}/MapServer?f=json`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${l.color}30`,
                background: `${l.color}08`,
                textDecoration: 'none',
                transition: 'transform 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: l.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {l.level}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{l.label}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 6 }}>
                /inarisk/{l.key}
              </div>
              <div style={{ marginTop: 8, fontSize: 9, color: l.color, fontWeight: 600 }}>Buka GIS →</div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Model 7: Respon & Bantuan ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)', borderRadius: 14, padding: '16px 18px' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>📦 Model 7 — Ringkasan Respon & Statistik Kunci</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Indikator utama untuk analisis kecepatan dan kebutuhan respons bencana</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {RESPON_STATS.map(s => (
            <div key={s.label} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border-faint)', borderLeft: `3px solid ${s.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data source footer */}
      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(53,167,255,0.05)', border: '1px solid rgba(53,167,255,0.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14 }}>📁</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#35a7ff' }}>Sumber Data Utama</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            DIBI BNPB — Data Informasi Bencana Indonesia | File: <code style={{ color: '#35a7ff' }}>20260505_072732.json</code> | 50.000 record bencana (2011–2026) | GIS Inarisk: gis.bnpb.go.id
          </div>
        </div>
      </div>

    </div>
  );
}
