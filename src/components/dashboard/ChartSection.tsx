'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const TREND_DATA = [
  { tahun: '2016', kejadian: 2342 },
  { tahun: '2017', kejadian: 2862 },
  { tahun: '2018', kejadian: 3397 },
  { tahun: '2019', kejadian: 3814 },
  { tahun: '2020', kejadian: 4650 },
  { tahun: '2021', kejadian: 5402 },
  { tahun: '2022', kejadian: 3578 },
  { tahun: '2023', kejadian: 4109 },
  { tahun: '2024', kejadian: 3428 },
];

const KORBAN_DATA = [
  { name: 'Banjir',   value: 48, color: '#35A7FF' },
  { name: 'Gempa',    value: 32, color: '#FF7F11' },
  { name: 'Longsor',  value: 28, color: '#38618C' },
  { name: 'Erupsi',   value: 12, color: '#CCDBDC' },
  { name: 'Tsunami',  value: 5,  color: '#7ec4e8' },
  { name: 'Lainnya',  value: 2,  color: '#5a7d8a' },
];

const PENGUNGSI_DATA = [
  { name: 'Banjir',  value: 62, color: '#35A7FF' },
  { name: 'Gempa',   value: 18, color: '#FF7F11' },
  { name: 'Erupsi',  value: 11, color: '#38618C' },
  { name: 'Longsor', value: 7,  color: '#CCDBDC' },
  { name: 'Lainnya', value: 2,  color: '#5a7d8a' },
];

interface Props {
  theme: string;
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

export default function ChartSection({ theme }: Props) {
  const gridColor = theme === 'dark' ? '#38618c' : '#ccdbdc';
  const textColor = theme === 'dark' ? '#7aaab8' : '#38618c';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: 12,
        padding: '0 16px 16px',
      }}
    >
      {/* Trend Bar Chart */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-faint)',
          borderRadius: 14,
          padding: '16px 18px',
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            Tren Kejadian Bencana
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Jumlah kejadian per tahun (2016–2024)</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={TREND_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="tahun" tick={{ fontSize: 10, fill: textColor }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: textColor }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="kejadian" name="Kejadian" radius={[4, 4, 0, 0]}>
              {TREND_DATA.map((entry, index) => (
                <Cell
                  key={index}
                  fill={index === TREND_DATA.length - 1 ? '#35a7ff' : 'rgba(56, 97, 140, 0.55)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Korban Donut */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-faint)',
          borderRadius: 14,
          padding: '16px 18px',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            Korban per Jenis
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Distribusi (%) korban jiwa</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={KORBAN_DATA}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
            >
              {KORBAN_DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'center' }}>
          {KORBAN_DATA.map((d) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>

      {/* Pengungsi Donut */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-faint)',
          borderRadius: 14,
          padding: '16px 18px',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            Pengungsi per Jenis
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Distribusi (%) pengungsi</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={PENGUNGSI_DATA}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
            >
              {PENGUNGSI_DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'center' }}>
          {PENGUNGSI_DATA.map((d) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
