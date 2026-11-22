'use client';

import { useEffect, useMemo, useState } from 'react';
export type BmkgListItem = {
  key: string;
  Tanggal: string;
  Jam: string;
  DateTime?: string;
  Coordinates: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi?: string;
  Dirasakan?: string;
  lat: number;
  lng: number;
  source: 'terkini' | 'dirasakan' | 'auto';
};

export type BmkgPanelMode = 'terkini' | 'dirasakan';

type Props = {
  onFlyTo: (lat: number, lng: number, zoom?: number) => void;
  selectedKey?: string | null;
  onSelectedKeyChange?: (key: string | null) => void;
  /** Minta peta menampilkan ripple BMKG */
  onRequestShowMap?: () => void;
  onModeChange?: (mode: BmkgPanelMode) => void;
};

type Mode = BmkgPanelMode;

function parseCoords(raw?: string): { lat: number; lng: number } | null {
  if (!raw) return null;
  const parts = raw.split(',').map((p) => Number(String(p).trim()));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return { lat: parts[0], lng: parts[1] };
}

function magColor(m: number) {
  if (m >= 6) return '#DC2626';
  if (m >= 5) return '#EA580C';
  if (m >= 4) return '#CA8A04';
  return '#64748B';
}

export default function BmkgGempaPanel({
  onFlyTo,
  selectedKey = null,
  onSelectedKeyChange,
  onRequestShowMap,
  onModeChange,
}: Props) {
  const [mode, setMode] = useState<Mode>('terkini');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BmkgListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onRequestShowMap?.();
  }, [onRequestShowMap]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url =
          mode === 'terkini'
            ? 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json'
            : 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json';
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        const raw = (json?.Infogempa?.gempa || []) as Array<Record<string, string>>;
        const list: BmkgListItem[] = [];
        raw.forEach((g) => {
          const c = parseCoords(g.Coordinates);
          if (!c) return;
          const key = `${g.DateTime || `${g.Tanggal}|${g.Jam}`}|${g.Coordinates}`;
          list.push({
            key,
            Tanggal: g.Tanggal || '',
            Jam: g.Jam || '',
            DateTime: g.DateTime,
            Coordinates: g.Coordinates || '',
            Magnitude: g.Magnitude || '',
            Kedalaman: g.Kedalaman || '',
            Wilayah: g.Wilayah || '',
            Potensi: g.Potensi,
            Dirasakan: g.Dirasakan,
            lat: c.lat,
            lng: c.lng,
            source: mode,
          });
        });
        setItems(list);
      } catch {
        if (!cancelled) {
          setError('Gagal memuat data BMKG');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const summary = useMemo(() => {
    if (!items.length) return '';
    const mags = items.map((g) => parseFloat(g.Magnitude)).filter((n) => Number.isFinite(n));
    const max = mags.length ? Math.max(...mags) : 0;
    const strong = mags.filter((m) => m >= 5).length;
    return `${items.length} gempa · M max ${max.toFixed(1)}${strong ? ` · ${strong} ≥M5` : ''}`;
  }, [items]);

  const handleRow = (g: BmkgListItem) => {
    const next = selectedKey === g.key ? null : g.key;
    onSelectedKeyChange?.(next);
    if (next) onFlyTo(g.lat, g.lng, 8);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2.5 border-b border-slate-100 shrink-0 space-y-2">
        <div className="text-[11px] font-semibold text-slate-800">Gempa BMKG</div>
        {(error || summary || loading) && (
          <div className="text-[10px] text-slate-500">
            {error || (loading ? 'Memuat…' : summary)}
          </div>
        )}
        <div className="flex gap-1">
          {(
            [
              { id: 'terkini' as const, label: 'Terkini M≥5' },
              { id: 'dirasakan' as const, label: 'Dirasakan' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setMode(t.id);
                onModeChange?.(t.id);
                onSelectedKeyChange?.(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                mode === t.id
                  ? 'bg-[#0a1e36] text-white border-[#0a1e36]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-slate-400">Klik baris untuk fokus peta</div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && <div className="px-4 py-10 text-center text-xs text-slate-400">Memuat…</div>}
        {!loading && !items.length && (
          <div className="px-4 py-10 text-center text-xs text-slate-500">{error || 'Tidak ada gempa'}</div>
        )}
        {items.map((g) => {
          const mag = parseFloat(g.Magnitude);
          const color = magColor(mag);
          const open = selectedKey === g.key;
          return (
            <div key={g.key} className="border-b border-slate-100">
              <button
                type="button"
                onClick={() => handleRow(g)}
                className={`w-full text-left px-3.5 py-3 transition-colors ${
                  open ? 'bg-slate-50' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex gap-2.5">
                  <span
                    className="mt-1 w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: color }}
                  >
                    {Number.isFinite(mag) ? mag.toFixed(1) : '—'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-slate-900 truncate">{g.Wilayah}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {g.Tanggal} {g.Jam}
                      {g.Kedalaman ? ` · ${g.Kedalaman}` : ''}
                    </div>
                    {open && g.Potensi && (
                      <div className="mt-1 text-[10px] text-slate-500">{g.Potensi}</div>
                    )}
                    {open && g.Dirasakan && (
                      <div className="mt-1 text-[10px] text-slate-500 line-clamp-2">{g.Dirasakan}</div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
