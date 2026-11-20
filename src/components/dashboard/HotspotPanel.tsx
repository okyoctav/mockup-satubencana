'use client';

import { useEffect, useMemo, useState } from 'react';

type FirePoint = {
  key: string;
  latitude: number;
  longitude: number;
  brightness?: number;
  frp?: number;
  confidence?: string | number;
  acq_date?: string;
  acq_time?: string;
  daynight?: string;
  satellite?: string;
};

type Props = {
  onFlyTo: (lat: number, lng: number, zoom?: number) => void;
  selectedKey?: string | null;
  onSelectedKeyChange?: (key: string | null) => void;
};

function confLabel(c: string | number | undefined) {
  const s = String(c || '').toLowerCase();
  if (s === 'h' || s === 'high' || Number(c) >= 80) return { t: 'Tinggi', color: '#DC2626' };
  if (s === 'n' || s === 'nominal' || Number(c) >= 50) return { t: 'Nominal', color: '#EA580C' };
  return { t: 'Rendah', color: '#CA8A04' };
}

export default function HotspotPanel({
  onFlyTo,
  selectedKey = null,
  onSelectedKeyChange,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [fires, setFires] = useState<FirePoint[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [onlyHigh, setOnlyHigh] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/nasa-firms?days=1', { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        const raw = Array.isArray(json.fires) ? json.fires : [];
        const list: FirePoint[] = raw
          .map((f: Record<string, string | number>, i: number) => {
            const lat = Number(f.latitude);
            const lng = Number(f.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return {
              key: `${lat},${lng}-${f.acq_date || ''}-${f.acq_time || ''}-${i}`,
              latitude: lat,
              longitude: lng,
              brightness: Number(f.brightness) || undefined,
              frp: Number(f.frp) || undefined,
              confidence: f.confidence,
              acq_date: String(f.acq_date || ''),
              acq_time: String(f.acq_time || ''),
              daynight: String(f.daynight || ''),
              satellite: String(f.satellite || ''),
            } as FirePoint;
          })
          .filter(Boolean) as FirePoint[];

        // Urut FRP / brightness tertinggi
        list.sort((a, b) => (b.frp || 0) - (a.frp || 0) || (b.brightness || 0) - (a.brightness || 0));
        setFires(list.slice(0, 80));

        if (!list.length) {
          setStatusMsg(json.notice || json.message || 'Tidak ada hotspot');
        } else {
          setStatusMsg(`${list.length} hotspot · 24 jam`);
        }
      } catch {
        if (!cancelled) {
          setFires([]);
          setStatusMsg('Gagal memuat hotspot');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!onlyHigh) return fires;
    return fires.filter((f) => {
      const c = confLabel(f.confidence);
      return c.t === 'Tinggi' || c.t === 'Nominal';
    });
  }, [fires, onlyHigh]);

  const handleRow = (f: FirePoint) => {
    const next = selectedKey === f.key ? null : f.key;
    onSelectedKeyChange?.(next);
    if (next) onFlyTo(f.latitude, f.longitude, 10);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2.5 border-b border-slate-100 shrink-0 space-y-2">
        <div className="text-[11px] font-semibold text-slate-800">Hotspot kebakaran</div>
        {(loading || statusMsg) && (
          <div className="text-[10px] text-slate-500">{loading ? 'Memuat…' : statusMsg}</div>
        )}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setOnlyHigh(true)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
              onlyHigh
                ? 'bg-[#0a1e36] text-white border-[#0a1e36]'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Tinggi / Nominal
          </button>
          <button
            type="button"
            onClick={() => setOnlyHigh(false)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
              !onlyHigh
                ? 'bg-[#0a1e36] text-white border-[#0a1e36]'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && <div className="px-4 py-10 text-center text-xs text-slate-400">Memuat…</div>}
        {!loading && !filtered.length && (
          <div className="px-4 py-8 text-center text-xs text-slate-500">
            <p>{statusMsg || 'Tidak ada hotspot'}</p>
          </div>
        )}
        {filtered.map((f) => {
          const conf = confLabel(f.confidence);
          const open = selectedKey === f.key;
          const time =
            f.acq_time && String(f.acq_time).length >= 3
              ? `${String(f.acq_time).padStart(4, '0').slice(0, 2)}:${String(f.acq_time).padStart(4, '0').slice(2, 4)}`
              : '';
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => handleRow(f)}
              className={`w-full text-left px-3.5 py-3 border-b border-slate-100 transition-colors ${
                open ? 'bg-slate-50' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="flex gap-2.5">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: conf.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-semibold text-slate-900 truncate">
                      {f.latitude.toFixed(3)}, {f.longitude.toFixed(3)}
                    </span>
                    <span
                      className="text-[10px] font-semibold shrink-0"
                      style={{ color: conf.color }}
                    >
                      {conf.t}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {f.acq_date || '—'}
                    {time ? ` ${time}` : ''}
                    {f.frp != null ? ` · FRP ${f.frp.toFixed?.(1) ?? f.frp}` : ''}
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
