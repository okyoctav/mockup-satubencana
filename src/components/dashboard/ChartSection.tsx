'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  DIBI_PER_TAHUN,
  DIBI_PER_JENIS,
  DIBI_TOP_PROVINSI,
  DIBI_PER_BULAN,
  KORBAN_DIST,
  PENGUNGSI_DIST,
  DIBI_TOTAL,
} from '@/data/dibiStats';
import type {
  DibiPerTahun,
  DibiPerJenis,
  DibiTopProvinsi,
  DibiDist,
} from '@/lib/dibiCkan';

interface KejadianLocal {
  jenis: string;
  korban_jiwa: number;
  pengungsi: number;
  tanggal: string;
}

interface Props {
  theme: string;
  filteredData?: KejadianLocal[];
  regionLabel?: string;
}

interface TooltipProps { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string; }
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--chart-tooltip-bg)',
        border: '1px solid var(--chart-tooltip-border)',
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 12,
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color ?? '#0EA5E9' }}>
          {p.name}: <strong>{p.value?.toLocaleString('id')}</strong>
        </div>
      ))}
    </div>
  );
};

interface PieTooltipProps { active?: boolean; payload?: { name: string; value: number }[]; }
const PieTooltip = ({ active, payload }: PieTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--chart-tooltip-bg)',
        border: '1px solid var(--chart-tooltip-border)',
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 12,
        color: 'var(--text-primary)',
      }}
    >
      <strong>{payload[0].name}</strong>: {payload[0].value}%
    </div>
  );
};

type ChartBundle = {
  perTahun: DibiPerTahun[];
  perJenis: DibiPerJenis[];
  topProvinsi: DibiTopProvinsi[];
  perBulan: { bulan: string; kejadian: number }[];
  korbanDist: DibiDist[];
  pengungsiDist: DibiDist[];
  total: {
    kejadian: number;
    meninggal: number;
    hilang: number;
    luka: number;
    pengungsi: number;
    rumah_terdampak: number;
  };
  yearRange: { min: number; max: number };
};

const FALLBACK: ChartBundle = {
  perTahun: DIBI_PER_TAHUN,
  perJenis: DIBI_PER_JENIS,
  topProvinsi: DIBI_TOP_PROVINSI,
  perBulan: DIBI_PER_BULAN,
  korbanDist: KORBAN_DIST,
  pengungsiDist: PENGUNGSI_DIST,
  total: DIBI_TOTAL,
  yearRange: { min: 2011, max: 2026 },
};

export default function ChartSection({ theme, filteredData, regionLabel }: Props) {
  const gridColor = theme === 'dark' ? '#38618c' : '#ccdbdc';
  const textColor = theme === 'dark' ? '#7aaab8' : '#38618c';

  const [bundle, setBundle] = useState<ChartBundle>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/dibi-aggregates', { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        setBundle({
          perTahun: json.perTahun || FALLBACK.perTahun,
          perJenis: json.perJenis || FALLBACK.perJenis,
          topProvinsi: json.topProvinsi || FALLBACK.topProvinsi,
          perBulan: json.perBulan || FALLBACK.perBulan,
          korbanDist: json.korbanDist || FALLBACK.korbanDist,
          pengungsiDist: json.pengungsiDist || FALLBACK.pengungsiDist,
          total: json.total || FALLBACK.total,
          yearRange: json.yearRange || FALLBACK.yearRange,
        });
      } catch {
        if (!cancelled) setBundle(FALLBACK);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const topJenis = [...bundle.perJenis].sort((a, b) => b.kejadian - a.kejadian);
  const yrLabel = `${bundle.yearRange.min}–${bundle.yearRange.max}`;

  const localJenis = filteredData && filteredData.length > 0
    ? (() => {
        const map: Record<string, { jenis: string; kejadian: number; korban_jiwa: number; pengungsi: number; color: string }> = {};
        const COLOR_MAP: Record<string, string> = {
          banjir: '#35a7ff',
          longsor: '#a78bfa',
          gempa: '#ff7f11',
          kebakaran: '#ef4444',
          'angin puting beliung': '#06b6d4',
          tsunami: '#10b981',
          erupsi: '#f59e0b',
          kekeringan: '#d97706',
          lainnya: '#6b7280',
        };
        for (const k of filteredData) {
          if (!map[k.jenis]) {
            map[k.jenis] = { jenis: k.jenis, kejadian: 0, korban_jiwa: 0, pengungsi: 0, color: COLOR_MAP[k.jenis] ?? '#6b7280' };
          }
          map[k.jenis].kejadian++;
          map[k.jenis].korban_jiwa += k.korban_jiwa;
          map[k.jenis].pengungsi += k.pengungsi;
        }
        return Object.values(map).sort((a, b) => b.kejadian - a.kejadian).map(x => ({
          ...x,
          meninggal: x.korban_jiwa,
          rumah_rusak: 0,
        }));
      })()
    : null;

  const localPerTahun = filteredData && filteredData.length > 0
    ? (() => {
        const map: Record<string, number> = {};
        for (const k of filteredData) {
          const tahun = k.tanggal?.slice(0, 4) ?? '?';
          map[tahun] = (map[tahun] ?? 0) + 1;
        }
        return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([tahun, kejadian]) => ({ tahun, kejadian }));
      })()
    : null;

  const CardWrap = ({ title, sub, children, cols = 1 }: { title: string; sub: string; children: React.ReactNode; cols?: number }) => (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)', borderRadius: 14, padding: '16px 18px', gridColumn: `span ${cols}` }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
      {children}
    </div>
  );

  const trenData = localPerTahun ?? bundle.perTahun;
  const jenisData = localJenis ?? topJenis;

  return (
    <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {regionLabel && (
        <div style={{
          background: 'rgba(53,167,255,0.1)',
          border: '1px solid rgba(53,167,255,0.3)',
          borderRadius: 10,
          padding: '8px 14px',
          fontSize: 11,
          color: '#35a7ff',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>Grafik difilter: <strong>{regionLabel}</strong> — {filteredData?.length ?? 0} kejadian lokal (bukan agregat nasional)</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <CardWrap
          title="Tren Kejadian Bencana"
          sub={localPerTahun ? `Data lokal ${regionLabel} per tahun` : `Jumlah kejadian per tahun (DIBI ${yrLabel})`}
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trenData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="tahun" tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="kejadian" name="Kejadian" radius={[3, 3, 0, 0]}>
                {trenData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      localPerTahun
                        ? '#35a7ff'
                        : ((entry as { tahun: string }).tahun === '2021'
                          ? '#ff7f11'
                          : i === trenData.length - 1
                            ? '#35a7ff'
                            : 'rgba(56,97,140,0.55)')
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardWrap>
        <CardWrap title="Pola Musiman Bulanan" sub="Agregat bulanan">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bundle.perBulan} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="kejadian" name="Kejadian" stroke="#35a7ff" strokeWidth={2} dot={{ fill: '#35a7ff', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardWrap>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <CardWrap
          title="Kejadian per Jenis"
          sub={localJenis ? `Data lokal ${regionLabel}` : 'Frekuensi per jenis bencana'}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={jenisData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="jenis" tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="kejadian" name="Kejadian" radius={[0, 3, 3, 0]}>
                {jenisData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardWrap>
        <CardWrap title="Distribusi Korban Jiwa" sub="% meninggal per jenis">
          <ResponsiveContainer width="100%" height={165}>
            <PieChart>
              <Pie data={bundle.korbanDist} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2} dataKey="value">
                {bundle.korbanDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', justifyContent: 'center' }}>
            {bundle.korbanDist.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-muted)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                {d.name} {d.value}%
              </div>
            ))}
          </div>
        </CardWrap>
        <CardWrap title="Distribusi Pengungsi" sub="% pengungsi per jenis">
          <ResponsiveContainer width="100%" height={165}>
            <PieChart>
              <Pie data={bundle.pengungsiDist} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2} dataKey="value">
                {bundle.pengungsiDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', justifyContent: 'center' }}>
            {bundle.pengungsiDist.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-muted)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                {d.name} {d.value}%
              </div>
            ))}
          </div>
        </CardWrap>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <CardWrap title="Korban Meninggal per Jenis" sub={`Total meninggal DIBI ${yrLabel}`}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topJenis} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="jenis" tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="meninggal" name="Meninggal" radius={[0, 3, 3, 0]}>
                {topJenis.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardWrap>
        <CardWrap title="Rumah Rusak per Jenis" sub="Unit rumah rusak (agregat portal)">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topJenis.filter(j => j.rumah_rusak > 0)} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="jenis" tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rumah_rusak" name="Rumah Rusak" radius={[0, 3, 3, 0]}>
                {topJenis.filter(j => j.rumah_rusak > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardWrap>
      </div>

      <CardWrap title="Top 10 Provinsi" sub={`Frekuensi kejadian tertinggi (DIBI ${yrLabel})`}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={bundle.topProvinsi} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="provinsi" tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: textColor }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="kejadian" name="Kejadian" radius={[4, 4, 0, 0]}>
              {bundle.topProvinsi.map((entry, i) => (
                <Cell key={i} fill={i < 2 ? '#ff7f11' : i < 5 ? '#35a7ff' : 'rgba(56,97,140,0.55)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardWrap>

      <CardWrap title="Ringkasan Dampak per Jenis" sub={`DIBI agregat ${yrLabel}`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
                {['Jenis Bencana', 'Kejadian', 'Meninggal', 'Pengungsi', 'Rumah Rusak'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Jenis Bencana' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bundle.perJenis.map((j, i) => (
                <tr key={j.jenis} style={{ borderBottom: '1px solid var(--border-faint)', background: i % 2 === 0 ? 'transparent' : 'rgba(53,167,255,0.025)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: j.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{j.jenis}</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>{j.kejadian.toLocaleString('id')}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: j.meninggal > 1000 ? '#ff7f11' : 'var(--text-muted)' }}>{j.meninggal.toLocaleString('id')}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>{j.pengungsi.toLocaleString('id')}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: j.rumah_rusak > 100000 ? '#35a7ff' : 'var(--text-muted)' }}>{j.rumah_rusak.toLocaleString('id')}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--border-subtle)', background: 'rgba(53,167,255,0.05)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--text-primary)' }}>TOTAL</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#35a7ff' }}>{bundle.total.kejadian.toLocaleString('id')}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#ff7f11' }}>{bundle.total.meninggal.toLocaleString('id')}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-secondary)' }}>{bundle.total.pengungsi.toLocaleString('id')}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#35a7ff' }}>{bundle.total.rumah_terdampak.toLocaleString('id')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardWrap>
    </div>
  );
}
