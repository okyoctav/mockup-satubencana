'use client';

const JENIS_LIST = ['Semua', 'banjir', 'gempa', 'longsor', 'kebakaran', 'erupsi', 'tsunami'];
const STATUS_LIST = ['Semua', 'pra', 'saat', 'pasca'];
const LEVEL_LIST = ['Semua', 'tinggi', 'sedang', 'rendah'];

const JENIS_COLOR: Record<string, string> = {
  banjir: '#0EA5E9',
  gempa: '#EF4444',
  longsor: '#F97316',
  kebakaran: '#F59E0B',
  erupsi: '#8B5CF6',
  tsunami: '#EC4899',
  tsunami2: '#06B6D4',
};

const STATUS_LABEL: Record<string, string> = { saat: 'Sedang Terjadi', pasca: 'Pasca Bencana', pra: 'Pra Bencana' };
const LEVEL_COLOR: Record<string, string> = { tinggi: '#EF4444', sedang: '#F97316', rendah: '#22C55E' };

interface Kejadian {
  id: number;
  nama: string;
  provinsi: string;
  kabupaten: string;
  jenis: string;
  tanggal: string;
  korban_jiwa: number;
  pengungsi: number;
  status: string;
  level: string;
  lat: number;
  lng: number;
}

interface Filters {
  jenis: string;
  status: string;
  level: string;
}

interface Props {
  data: Kejadian[];
  filters: Filters;
  onFilter: (f: Filters) => void;
  onEventClick: (lat: number, lng: number) => void;
}

export default function FilterPanel({ data, filters, onFilter, onEventClick }: Props) {
  const filtered = data.filter((k) => {
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
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Panel title */}
      <div
        style={{
          padding: '12px 14px 8px',
          borderBottom: '1px solid var(--border-faint)',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Kontrol & Filter
        </div>
      </div>

      {/* Filters */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 space-y-3 shrink-0">
        {/* Jenis */}
        <div>
          <label className="text-[10px] font-bold text-[#19506e] uppercase tracking-wider block mb-1.5">
            Jenis Bencana
          </label>
          <div className="flex flex-wrap gap-1.5">
            {JENIS_LIST.map((j) => {
              const isSelected = filters.jenis === j;
              return (
                <button
                  key={j}
                  onClick={() => onFilter({ ...filters, jenis: j })}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-[#1f8080] text-white border-[#1f8080] shadow-xs scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#1f8080] hover:text-[#1f8080]'
                  } capitalize`}
                >
                  {j}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-[10px] font-bold text-[#19506e] uppercase tracking-wider block mb-1.5">
            Status Terjadi
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {STATUS_LIST.map((s) => {
              const isSelected = filters.status === s;
              return (
                <button
                  key={s}
                  onClick={() => onFilter({ ...filters, status: s })}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border text-center ${
                    isSelected
                      ? 'bg-[#19506e] text-white border-[#19506e] shadow-xs scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#19506e] hover:text-[#19506e]'
                  }`}
                >
                  {s === 'Semua' ? 'Semua Status' : STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="text-[10px] font-bold text-[#19506e] uppercase tracking-wider block mb-1.5">
            Level Dampak
          </label>
          <div className="flex gap-1.5">
            {LEVEL_LIST.map((l) => {
              const isSelected = filters.level === l;
              return (
                <button
                  key={l}
                  onClick={() => onFilter({ ...filters, level: l })}
                  className={`flex-1 py-1 rounded-xl text-xs font-bold transition-all border text-center ${
                    isSelected
                      ? 'bg-[#1f8080] text-white border-[#1f8080] shadow-xs scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#1f8080] hover:text-[#1f8080]'
                  } capitalize`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        <div style={{ padding: '4px 14px 8px', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Daftar Kejadian ({filtered.length})
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            Tidak ada data sesuai filter
          </div>
        )}
        {filtered.map((k) => {
          const color = JENIS_COLOR[k.jenis] ?? '#94A3B8';
          const isActive = k.status === 'saat';
          return (
            <button
              key={k.id}
              onClick={() => onEventClick(k.lat, k.lng)}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-faint)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    marginTop: 4,
                    flexShrink: 0,
                    boxShadow: isActive ? `0 0 0 3px ${color}30` : 'none',
                    animation: isActive ? 'pulse-dot 1.5s infinite' : 'none',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {k.nama}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {k.kabupaten}, {k.provinsi}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: `${color}20`, color, fontWeight: 700, textTransform: 'capitalize' }}>
                      {k.jenis}
                    </span>
                    {isActive && (
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontWeight: 700 }}>
                        AKTIF
                      </span>
                    )}
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: `${LEVEL_COLOR[k.level] ?? '#94A3B8'}15`, color: LEVEL_COLOR[k.level] ?? '#94A3B8', fontWeight: 700, textTransform: 'capitalize' }}>
                      {k.level}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>
                    {k.korban_jiwa > 0 ? `${k.korban_jiwa} korban` : '-'}
                  </div>
                  <div style={{ fontSize: 10, color: '#0EA5E9' }}>
                    {k.pengungsi > 0 ? `${k.pengungsi.toLocaleString('id')} jiwa` : '-'}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
