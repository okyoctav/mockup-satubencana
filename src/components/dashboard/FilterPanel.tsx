'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Kejadian } from '@/types/kejadian';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

export const JENIS_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  Semua: { label: 'Semua', icon: '🌐', color: '#0a1e36' },
  banjir: { label: 'Banjir', icon: '💧', color: '#0284c7' },
  gempa: { label: 'Gempa', icon: '🏚️', color: '#ef4444' },
  longsor: { label: 'Longsor', icon: '⛰️', color: '#d97706' },
  kebakaran: { label: 'Kebakaran', icon: '🔥', color: '#ea580c' },
  erupsi: { label: 'Erupsi', icon: '🌋', color: '#8b5cf6' },
  tsunami: { label: 'Tsunami', icon: '🌊', color: '#06b6d4' },
  kekeringan: { label: 'Kekeringan', icon: '☀️', color: '#ca8a04' },
  'angin puting beliung': { label: 'Cuaca Ekstrem', icon: '🌪️', color: '#4f46e5' },
  lainnya: { label: 'Lainnya', icon: '📍', color: '#64748b' },
};

export const JENIS_LIST = Object.keys(JENIS_CONFIG);
export const STATUS_LIST = ['Semua', 'pra', 'saat', 'pasca'];
export const LEVEL_LIST = ['Semua', 'tinggi', 'sedang', 'rendah'];

export const JENIS_COLOR: Record<string, string> = {
  banjir: '#0284c7',
  gempa: '#ef4444',
  longsor: '#d97706',
  kebakaran: '#ea580c',
  erupsi: '#8b5cf6',
  tsunami: '#06b6d4',
  kekeringan: '#ca8a04',
  'angin puting beliung': '#4f46e5',
  lainnya: '#64748b',
};

const STATUS_LABEL: Record<string, string> = {
  saat: 'Sedang terjadi',
  pasca: 'Pasca',
  pra: 'Pra',
};
const LEVEL_LABEL: Record<string, string> = {
  tinggi: 'Tinggi',
  sedang: 'Sedang',
  rendah: 'Rendah',
};

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
  /** Sinkron highlight marker di peta */
  selectedId?: number | null;
  onSelectedIdChange?: (id: number | null) => void;
  /** Sedang memuat feed kejadian */
  loading?: boolean;
  /** Catatan status singkat (bukan label kualitas sumber) */
  statusNote?: string;
}

function formatDateId(iso: string, full = false) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return full ? `${d} ${months[m - 1]} ${y}` : `${d} ${months[m - 1]}`;
}

function impactLine(k: Kejadian): string {
  const parts: string[] = [];
  const n = k.menderita || k.pengungsi || 0;
  if (n > 0) parts.push(`${n.toLocaleString('id')} terdampak`);
  if ((k.rumah_terendam || 0) > 0) parts.push(`${k.rumah_terendam} terendam`);
  else if ((k.rumah_terdampak || 0) > 0) parts.push(`${k.rumah_terdampak} rumah`);
  if (k.korban_jiwa > 0) parts.push(`${k.korban_jiwa} korban`);
  return parts.slice(0, 2).join(' · ');
}

function MiniStat({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <div className="rounded-md bg-white border border-slate-200/80 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold leading-none">
        {label}
      </div>
      <div className="text-[13px] font-semibold text-slate-800 tabular-nums mt-0.5">
        {value.toLocaleString('id')}
      </div>
    </div>
  );
}

function DetailBlock({
  title,
  text,
  clamp,
}: {
  title: string;
  text?: string;
  clamp?: boolean;
}) {
  const [more, setMore] = useState(false);
  if (!text) return null;
  const long = text.length > 180;
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
        {title}
      </div>
      <p
        className={`whitespace-pre-line leading-relaxed text-slate-700 ${
          clamp && !more ? 'line-clamp-3' : ''
        }`}
      >
        {text}
      </p>
      {clamp && long && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMore((v) => !v);
          }}
          className="mt-0.5 text-[11px] font-medium text-[#1f8080] hover:underline"
        >
          {more ? 'Sembunyikan' : 'Selengkapnya'}
        </button>
      )}
    </div>
  );
}

export default function FilterPanel({
  data,
  filters,
  onFilter,
  onEventClick,
  selectedId = null,
  onSelectedIdChange,
  loading = false,
  statusNote,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return data.filter((k) => {
      if (filters.jenis !== 'Semua' && k.jenis !== filters.jenis) return false;
      if (filters.status !== 'Semua' && k.status !== filters.status) return false;
      if (filters.level !== 'Semua' && k.level !== filters.level) return false;
      return true;
    });
  }, [data, filters]);

  const jenisSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const k of data) {
      counts.set(k.jenis, (counts.get(k.jenis) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([jenis, count]) => ({
        jenis,
        count,
        label: JENIS_CONFIG[jenis]?.label || jenis,
        color: JENIS_COLOR[jenis] || '#64748b',
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  // Jika filter menghilangkan item terpilih → lepas highlight
  useEffect(() => {
    if (selectedId == null) return;
    if (!filtered.some((k) => k.id === selectedId)) {
      onSelectedIdChange?.(null);
    }
  }, [filtered, selectedId, onSelectedIdChange]);

  // Klik marker peta → scroll baris list ke pandangan
  useEffect(() => {
    if (selectedId == null) return;
    const el = document.querySelector(`[data-kejadian-id="${selectedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const activeFilterCount =
    (filters.jenis !== 'Semua' ? 1 : 0) +
    (filters.status !== 'Semua' ? 1 : 0) +
    (filters.level !== 'Semua' ? 1 : 0);

  const handleRow = (k: Kejadian) => {
    const next = selectedId === k.id ? null : k.id;
    onSelectedIdChange?.(next);
    onEventClick(k.lat, k.lng);
  };

  const handleJenisChip = (jenis: string) => {
    if (filters.jenis === jenis) {
      onFilter({ ...filters, jenis: 'Semua' });
    } else {
      onFilter({ ...filters, jenis });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2.5 border-b border-slate-100 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-800 tracking-tight">
              {loading ? 'Memuat kejadian…' : `${data.length} kejadian`}
              {!loading && filtered.length !== data.length && (
                <span className="font-normal text-slate-400"> · tampil {filtered.length}</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {statusNote || (loading ? 'Mengambil feed BNPB…' : 'Ringkasan feed · klik jenis untuk filter')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {jenisSummary.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {jenisSummary.map((item) => {
              const on = filters.jenis === item.jenis;
              return (
                <button
                  key={item.jenis}
                  type="button"
                  onClick={() => handleJenisChip(item.jenis)}
                  title={on ? 'Lepas filter jenis' : `Filter ${item.label}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors"
                  style={{
                    background: on ? item.color : '#fff',
                    color: on ? '#fff' : '#475569',
                    borderColor: on ? item.color : '#e2e8f0',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: on ? '#fff' : item.color }}
                  />
                  {item.label}
                  <span className={`tabular-nums ${on ? 'text-white/90' : 'text-slate-400'}`}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="px-3 py-2.5 border-b border-slate-100 space-y-2.5 shrink-0 bg-slate-50/60">
          <div className="flex flex-wrap gap-1">
            {JENIS_LIST.filter((j) => j === 'Semua' || data.some((d) => d.jenis === j)).map((j) => {
              const cfg = JENIS_CONFIG[j];
              const on = filters.jenis === j;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => onFilter({ ...filters, jenis: j })}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium border"
                  style={{
                    background: on ? cfg.color : '#fff',
                    color: on ? '#fff' : '#475569',
                    borderColor: on ? cfg.color : '#e2e8f0',
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_LIST.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onFilter({ ...filters, status: s })}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                  filters.status === s
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {s === 'Semua' ? 'Status' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {LEVEL_LIST.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onFilter({ ...filters, level: l })}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize ${
                  filters.level === l
                    ? 'bg-[#1f8080] text-white border-[#1f8080]'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {l === 'Semua' ? 'Level' : LEVEL_LABEL[l] || l}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400">Status & level = estimasi dari feed.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-xs text-slate-500">Tidak ada data sesuai filter</div>
        )}
        {filtered.map((k) => {
          const color = JENIS_COLOR[k.jenis] ?? '#94A3B8';
          const label = JENIS_CONFIG[k.jenis]?.label || k.jenisLabel || k.jenis;
          const open = selectedId === k.id;
          const impact = impactLine(k);
          return (
            <div key={k.id} data-kejadian-id={k.id} className="border-b border-slate-100">
              <button
                type="button"
                onClick={() => handleRow(k)}
                className={`w-full text-left px-3.5 py-3 transition-colors ${
                  open ? 'bg-slate-50' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex gap-2.5">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-semibold text-slate-900 truncate">
                        {k.kabupaten}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">{formatDateId(k.tanggal)}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                      <span style={{ color }} className="font-medium">
                        {label}
                      </span>
                      {k.provinsi ? ` · ${k.provinsi}` : ''}
                    </div>
                    {impact && (
                      <div className="mt-1 text-[11px] text-slate-600">{impact}</div>
                    )}
                  </div>
                </div>
              </button>

              {open && (
                <div className="px-3.5 pb-3.5 pt-2 text-[12px] text-slate-600 space-y-2.5 border-t border-slate-100/80 bg-slate-50/50">
                  <div className="text-[11px] text-slate-500 leading-snug">
                    {formatDateId(k.tanggal, true)}
                    {k.minggu ? ` · Minggu ke-${k.minggu}` : ''}
                    {(k.jumlah_kejadian || 0) > 1 ? ` · ${k.jumlah_kejadian} kejadian` : ''}
                    {k.provinsi ? ` · ${k.provinsi}` : ''}
                    {k.provinsiDilengkapi ? ' (dilengkapi)' : ''}
                  </div>

                  {((k.meninggal ?? k.korban_jiwa) > 0 ||
                    (k.hilang || 0) > 0 ||
                    (k.luka_sakit || 0) > 0 ||
                    (k.menderita || 0) > 0 ||
                    (k.mengungsi_detail || k.pengungsi || 0) > 0 ||
                    (k.rumah_terendam || 0) > 0 ||
                    (k.rumah_rusak_berat || 0) > 0 ||
                    (k.rumah_rusak_sedang || 0) > 0 ||
                    (k.rumah_rusak_ringan || 0) > 0) && (
                    <div className="grid grid-cols-3 gap-1.5">
                      <MiniStat label="Meninggal" value={k.meninggal ?? k.korban_jiwa} />
                      <MiniStat label="Hilang" value={k.hilang || 0} />
                      <MiniStat label="Luka" value={k.luka_sakit || 0} />
                      <MiniStat label="Menderita" value={k.menderita || 0} />
                      <MiniStat label="Mengungsi" value={k.mengungsi_detail || k.pengungsi || 0} />
                      <MiniStat label="Terendam" value={k.rumah_terendam || 0} />
                      <MiniStat label="Rusak B" value={k.rumah_rusak_berat || 0} />
                      <MiniStat label="Rusak S" value={k.rumah_rusak_sedang || 0} />
                      <MiniStat label="Rusak R" value={k.rumah_rusak_ringan || 0} />
                    </div>
                  )}

                  {((k.pendidikan_rusak || 0) > 0 ||
                    (k.fasyankes_rusak || 0) > 0 ||
                    (k.jembatan_rusak || 0) > 0 ||
                    (k.rumah_ibadat_rusak || 0) > 0 ||
                    (k.fasum_rusak || 0) > 0 ||
                    (k.kantor_rusak || 0) > 0 ||
                    (k.lahan_hektar || 0) > 0) && (
                    <div className="grid grid-cols-3 gap-1.5">
                      <MiniStat label="Sekolah" value={k.pendidikan_rusak || 0} />
                      <MiniStat label="Fasyankes" value={k.fasyankes_rusak || 0} />
                      <MiniStat label="Ibadat" value={k.rumah_ibadat_rusak || 0} />
                      <MiniStat label="Jembatan" value={k.jembatan_rusak || 0} />
                      <MiniStat label="Kantor" value={k.kantor_rusak || 0} />
                      <MiniStat label="Fasum" value={k.fasum_rusak || 0} />
                      <MiniStat label="Lahan ha" value={Math.round(k.lahan_hektar || 0)} />
                    </div>
                  )}

                  <DetailBlock title="Kondisi mutakhir" text={k.kondisi_mutakhir} />
                  <DetailBlock title="Kronologis" text={k.kronologis} clamp />
                  <DetailBlock title="Upaya" text={k.upaya} clamp />
                  <DetailBlock title="Penyebab" text={k.penyebab} clamp />

                  <div className="text-[10px] text-slate-400 pt-0.5">
                    Status {STATUS_LABEL[k.status] || k.status} · Level {LEVEL_LABEL[k.level] || k.level}{' '}
                    — estimasi dari kondisi/dampak feed
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
