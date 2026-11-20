'use client';

import { useEffect, useMemo, useState } from 'react';
type VolcanoRow = {
  slug: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  alertLevel: number;
  province: string;
  regency: string;
  nearestCity?: string;
  elevation: number | null;
  hasVona: boolean;
  magmaApi?: string | null;
};

type VonaRow = {
  colour?: string;
  previousColour?: string;
  noticenumber?: string;
  cloudAboveSummitM?: number | null;
  issuedUtc?: string;
  summary?: string;
  magmaLink?: string;
};

type NoticeRow = {
  localTime?: string;
  heightAboveSummitM?: number | null;
  ashColour?: string;
  magmaLink?: string;
  alertLevel?: number | null;
};

type ReportRow = {
  date?: string;
  noticenumber?: string;
  visualId?: string;
  magmaLink?: string;
};

type SeismicDay = { date: string; total: number };

type DetailPayload = {
  vona?: VonaRow | null;
  vonaHistory?: VonaRow[];
  notice?: NoticeRow | null;
  notices?: NoticeRow[];
  report?: ReportRow | null;
  reports?: ReportRow[];
  seismic?: SeismicDay[];
};

type QuickFilter = 'all' | 'siaga' | 'waspada' | 'vona' | 'letusan';

type Props = {
  onFlyTo: (lat: number, lng: number, zoom?: number) => void;
  selectedSlug?: string | null;
  onSelectedSlugChange?: (slug: string | null) => void;
};

const LEVEL_META: Record<
  number,
  { label: string; color: string; bg: string; border: string }
> = {
  4: { label: 'Awas', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  3: { label: 'Siaga', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
  2: { label: 'Waspada', color: '#A16207', bg: '#FEFCE8', border: '#FDE68A' },
  1: { label: 'Normal', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  0: { label: 'Tanpa status', color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0' },
};

const VONA_COLOR: Record<string, string> = {
  RED: '#DC2626',
  ORANGE: '#EA580C',
  YELLOW: '#CA8A04',
  GREEN: '#16A34A',
};

function formatIssued(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isRecentNotice(localTime?: string, hours = 24) {
  if (!localTime) return false;
  const t = Date.parse(localTime);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= hours * 3600_000;
}

export default function VolcanoStatusPanel({
  onFlyTo: _onFlyTo,
  selectedSlug = null,
  onSelectedSlugChange,
}: Props) {
  void _onFlyTo;
  const [loading, setLoading] = useState(true);
  const [volcanoes, setVolcanoes] = useState<VolcanoRow[]>([]);
  const [vonaMap, setVonaMap] = useState<Record<string, VonaRow | null>>({});
  const [showNormal, setShowNormal] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [details, setDetails] = useState<Record<string, DetailPayload | 'loading' | 'error'>>({});
  const [moreOpen, setMoreOpen] = useState<Record<string, boolean>>({});
  /** Slug yang punya notice letusan (diisi saat detail di-load / batch ringan Siaga+) */
  const [letusanSlugs, setLetusanSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/volcanoes?vona=1', { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        const list = Array.isArray(json.volcanoes) ? (json.volcanoes as VolcanoRow[]) : [];
        setVolcanoes(list);
        setVonaMap((json.vona || {}) as Record<string, VonaRow | null>);

        // Prefetch notice untuk Siaga+ agar filter "Letusan" & ringkasan jalan
        const siaga = list.filter((v) => v.alertLevel >= 3).slice(0, 6);
        const found = new Set<string>();
        await Promise.all(
          siaga.map(async (v) => {
            try {
              const r = await fetch(`/api/volcanoes/${encodeURIComponent(v.slug)}`, {
                cache: 'no-store',
              });
              const d = await r.json();
              if (!d?.ok) return;
              if (cancelled) return;
              setDetails((prev) => ({
                ...prev,
                [v.slug]: {
                  vona: d.vona || null,
                  vonaHistory: d.vonaHistory || [],
                  notice: d.notice || null,
                  notices: d.notices || [],
                  report: d.report || null,
                  reports: d.reports || [],
                  seismic: d.seismic || [],
                },
              }));
              const notices = (d.notices || []) as NoticeRow[];
              if (notices.some((n) => isRecentNotice(n.localTime, 48)) || d.notice?.localTime) {
                found.add(v.slug);
              }
            } catch {
              /* ignore */
            }
          })
        );
        if (!cancelled) setLetusanSlugs(found);
      } catch {
        if (!cancelled) {
          setVolcanoes([]);
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

  useEffect(() => {
    if (!selectedSlug) return;
    const existing = details[selectedSlug];
    if (existing && existing !== 'error') return;

    let cancelled = false;
    const slug = selectedSlug;
    setDetails((prev) => ({ ...prev, [slug]: 'loading' }));
    fetch(`/api/volcanoes/${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json?.ok) {
          setDetails((prev) => ({ ...prev, [slug]: 'error' }));
          return;
        }
        const payload: DetailPayload = {
          vona: json.vona || null,
          vonaHistory: json.vonaHistory || [],
          notice: json.notice || null,
          notices: json.notices || [],
          report: json.report || null,
          reports: json.reports || [],
          seismic: json.seismic || [],
        };
        setDetails((prev) => ({ ...prev, [slug]: payload }));
        const notices = (json.notices || []) as NoticeRow[];
        if (notices.some((n) => isRecentNotice(n.localTime, 48)) || json.notice?.localTime) {
          setLetusanSlugs((prev) => new Set(prev).add(slug));
        }
      })
      .catch(() => {
        if (!cancelled) setDetails((prev) => ({ ...prev, [slug]: 'error' }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlug]);

  // Scroll baris terpilih ke pandangan (dari klik marker / deep-link)
  useEffect(() => {
    if (!selectedSlug) return;
    const el = document.querySelector(`[data-volcano-slug="${selectedSlug}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedSlug]);

  const counts = useMemo(() => {
    const c = { 4: 0, 3: 0, 2: 0, 1: 0, vona: 0, letusan: 0 };
    for (const v of volcanoes) {
      const lv = v.alertLevel as 1 | 2 | 3 | 4;
      if (c[lv] != null) c[lv] += 1;
      if (vonaMap[v.slug]?.colour) c.vona += 1;
      if (letusanSlugs.has(v.slug)) c.letusan += 1;
    }
    return c;
  }, [volcanoes, vonaMap, letusanSlugs]);

  const headline = useMemo(() => {
    const siaga = volcanoes.filter((v) => v.alertLevel >= 3);
    const vonaNames = siaga
      .filter((v) => vonaMap[v.slug]?.colour)
      .map((v) => {
        const col = vonaMap[v.slug]?.colour;
        return `${v.name}${col ? ` (${col})` : ''}`;
      });
    const parts: string[] = [];
    parts.push(`${counts[3] + counts[4]} Siaga+`);
    parts.push(`${counts[2]} Waspada`);
    if (vonaNames.length) parts.push(`VONA: ${vonaNames.slice(0, 3).join(', ')}`);
    if (counts.letusan) parts.push(`${counts.letusan} dengan letusan terkini`);
    return parts.join(' · ');
  }, [volcanoes, vonaMap, counts]);

  const focused = useMemo(() => {
    let list = [...volcanoes];
    switch (quickFilter) {
      case 'siaga':
        list = list.filter((v) => v.alertLevel >= 3);
        break;
      case 'waspada':
        list = list.filter((v) => v.alertLevel === 2);
        break;
      case 'vona':
        list = list.filter((v) => Boolean(vonaMap[v.slug]?.colour));
        break;
      case 'letusan':
        list = list.filter((v) => letusanSlugs.has(v.slug));
        break;
      default:
        list = list.filter((v) => (showNormal ? true : v.alertLevel >= 2));
        break;
    }
    return list.sort(
      (a, b) => b.alertLevel - a.alertLevel || a.name.localeCompare(b.name, 'id')
    );
  }, [volcanoes, quickFilter, showNormal, vonaMap, letusanSlugs]);

  const handleRow = (v: VolcanoRow) => {
    const next = selectedSlug === v.slug ? null : v.slug;
    onSelectedSlugChange?.(next);
    // Zoom/fokus ditangani peta (flyToBounds + kartu) lewat selectedSlug
  };

  const chips: { id: QuickFilter; label: string; n?: number }[] = [
    { id: 'all', label: 'Aktif' },
    { id: 'siaga', label: 'Siaga+', n: counts[3] + counts[4] },
    { id: 'waspada', label: 'Waspada', n: counts[2] },
    { id: 'vona', label: 'VONA', n: counts.vona },
    { id: 'letusan', label: 'Letusan', n: counts.letusan },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2.5 border-b border-slate-100 shrink-0 space-y-2">
        {!loading && headline && (
          <div className="text-[11px] text-slate-700 leading-snug font-medium bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2">
            {headline}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {chips.map((c) => {
            const on = quickFilter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setQuickFilter(c.id)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                  on
                    ? 'bg-[#0a1e36] text-white border-[#0a1e36]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.label}
                {c.n != null && (
                  <span className={on ? 'text-white/80' : 'text-slate-400'}>{c.n}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="text-[10px] text-slate-400">Klik baris · sinkron dengan marker peta</div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && (
          <div className="px-4 py-10 text-center text-xs text-slate-400">Memuat…</div>
        )}
        {!loading && focused.length === 0 && (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            Tidak ada gunung untuk filter ini
          </div>
        )}
        {focused.map((v) => {
          const meta = LEVEL_META[v.alertLevel] || LEVEL_META[1];
          const open = selectedSlug === v.slug;
          const vona = vonaMap[v.slug];
          const vonaColour = vona?.colour;
          const detail = open ? details[v.slug] : undefined;
          const expanded = moreOpen[v.slug] === true;
          const d = detail && detail !== 'loading' && detail !== 'error' ? detail : null;

          let seismic = d?.seismic || [];
          if (seismic.length && seismic[seismic.length - 1]?.total === 0) {
            seismic = seismic.slice(0, -1);
          }
          const recent = seismic.slice(expanded ? -14 : -7);
          const maxS = Math.max(1, ...recent.map((s) => s.total));
          const notices = (d?.notices || []).slice(0, expanded ? 15 : 3);
          const reports = (d?.reports?.length ? d.reports : d?.report ? [d.report] : []).slice(
            0,
            expanded ? 5 : 1
          );
          const vonaHist = (d?.vonaHistory || []).slice(0, expanded ? 8 : 0);
          const reportPreviewLen = expanded ? 900 : 160;

          return (
            <div
              key={v.slug}
              data-volcano-slug={v.slug}
              className={`border-b border-slate-100 ${open ? 'ring-1 ring-inset ring-[#1f8080]/40' : ''}`}
            >
              <button
                type="button"
                onClick={() => handleRow(v)}
                className={`w-full text-left px-3.5 py-3 transition-colors ${
                  open ? 'bg-teal-50/50' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex gap-2.5">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: meta.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-semibold text-slate-900 truncate">{v.name}</span>
                      <span
                        className="text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-full border"
                        style={{
                          color: meta.color,
                          borderColor: meta.border,
                          background: meta.bg,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                      {v.regency || '—'}
                      {v.province ? ` · ${v.province}` : ''}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                      {v.elevation != null && <span>{v.elevation} mdpl</span>}
                      {v.code && <span>· {v.code}</span>}
                      {vonaColour && (
                        <span
                          className="inline-flex items-center gap-1 font-medium"
                          style={{ color: VONA_COLOR[vonaColour] || meta.color }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: VONA_COLOR[vonaColour] || meta.color }}
                          />
                          VONA {vonaColour}
                        </span>
                      )}
                      {letusanSlugs.has(v.slug) && (
                        <span className="text-rose-600 font-medium">· Letusan</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {open && (
                <div className="px-3.5 pb-3.5 pt-2 text-[11px] text-slate-600 border-t border-slate-100/80 bg-slate-50/50 space-y-3">
                  {detail === 'loading' && (
                    <div className="text-slate-400 text-[11px]">Memuat detail…</div>
                  )}
                  {detail === 'error' && (
                    <div className="text-slate-400 text-[11px]">Detail belum tersedia</div>
                  )}

                  {/* Identitas singkat */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="rounded-md bg-white border border-slate-100 px-2 py-1.5">
                      <div className="text-slate-400 uppercase tracking-wide text-[9px]">Koordinat</div>
                      <div className="font-medium text-slate-700 tabular-nums">
                        {v.lat.toFixed(3)}, {v.lng.toFixed(3)}
                      </div>
                    </div>
                    <div className="rounded-md bg-white border border-slate-100 px-2 py-1.5">
                      <div className="text-slate-400 uppercase tracking-wide text-[9px]">Elevasi</div>
                      <div className="font-medium text-slate-700">
                        {v.elevation != null ? `${v.elevation} mdpl` : '—'}
                      </div>
                    </div>
                  </div>

                  {d?.vona?.colour && (
                    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 space-y-1">
                      <div
                        className="font-semibold"
                        style={{ color: VONA_COLOR[d.vona.colour] || meta.color }}
                      >
                        VONA {d.vona.colour}
                        {d.vona.previousColour && d.vona.previousColour !== d.vona.colour
                          ? ` (dari ${d.vona.previousColour})`
                          : ''}
                        {d.vona.noticenumber ? ` · ${d.vona.noticenumber}` : ''}
                      </div>
                      {d.vona.issuedUtc && (
                        <div className="text-[10px] text-slate-400">{formatIssued(d.vona.issuedUtc)}</div>
                      )}
                      <p className="text-[11px] text-slate-600 leading-snug">{d.vona.summary || '—'}</p>
                      {d.vona.cloudAboveSummitM != null && d.vona.cloudAboveSummitM > 0 && (
                        <div className="text-[10px] text-slate-500">
                          Abu ~{d.vona.cloudAboveSummitM} m di atas puncak
                        </div>
                      )}
                    </div>
                  )}

                  {d?.notice?.localTime && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-rose-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                        Letusan terbaru
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {d.notice.localTime}
                        {d.notice.heightAboveSummitM != null && d.notice.heightAboveSummitM > 0
                          ? ` · kolom ${d.notice.heightAboveSummitM} m`
                          : ''}
                        {d.notice.ashColour ? ` · ${d.notice.ashColour}` : ''}
                      </span>
                    </div>
                  )}

                  {notices.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Riwayat letusan ({notices.length}
                        {(d?.notices?.length || 0) > notices.length ? '+' : ''})
                      </div>
                      <div className={`space-y-1 ${expanded ? 'max-h-48 overflow-y-auto' : ''}`}>
                        {notices.map((n, i) => (
                          <div
                            key={`${n.localTime}-${i}`}
                            className="text-[10px] text-slate-600 flex gap-2 rounded-md bg-white border border-slate-100 px-2 py-1"
                          >
                            <span className="text-slate-800 font-medium shrink-0 w-[7.5rem]">
                              {n.localTime}
                            </span>
                            <span className="min-w-0">
                              {n.heightAboveSummitM != null && n.heightAboveSummitM > 0
                                ? `Kolom ${n.heightAboveSummitM} m`
                                : 'Tercatat'}
                              {n.ashColour ? ` · abu ${n.ashColour}` : ''}
                              {n.alertLevel != null ? ` · Lv ${n.alertLevel}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reports.map((rep, ri) => (
                    <div
                      key={`${rep.date}-${ri}`}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 space-y-1"
                    >
                      <div className="font-semibold text-slate-800 text-[11px]">
                        Laporan {rep.date}
                        {rep.noticenumber ? ` · ${rep.noticenumber}` : ''}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {(rep.visualId || '').slice(0, reportPreviewLen)}
                        {(rep.visualId || '').length > reportPreviewLen ? '…' : ''}
                      </p>
                    </div>
                  ))}

                  {expanded && vonaHist.length > 1 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Riwayat VONA
                      </div>
                      {vonaHist.map((vh, i) => (
                        <div
                          key={`${vh.noticenumber}-${i}`}
                          className="text-[10px] flex gap-2 rounded-md bg-white border border-slate-100 px-2 py-1"
                        >
                          <span
                            className="font-semibold shrink-0"
                            style={{ color: VONA_COLOR[vh.colour || ''] || '#64748B' }}
                          >
                            {vh.colour || '—'}
                          </span>
                          <span className="text-slate-500 shrink-0">{formatIssued(vh.issuedUtc)}</span>
                          <span className="text-slate-600 truncate">{vh.summary || vh.noticenumber}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {recent.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                        Seismik vulkanik · {recent.length} hari
                      </div>
                      <div className="flex items-end gap-0.5 h-8">
                        {recent.map((s) => {
                          const h = Math.max(3, Math.round((s.total / maxS) * 28));
                          return (
                            <span
                              key={s.date}
                              title={`${s.date}: ${s.total}`}
                              className="flex-1 rounded-sm opacity-85"
                              style={{ height: h, background: meta.color, minWidth: 4 }}
                            />
                          );
                        })}
                      </div>
                      {expanded ? (
                        <div className="mt-1.5 space-y-0.5 max-h-36 overflow-y-auto">
                          {[...recent].reverse().map((s) => (
                            <div
                              key={`row-${s.date}`}
                              className="flex justify-between text-[10px] tabular-nums text-slate-600"
                            >
                              <span>{s.date}</span>
                              <span className="font-medium">{s.total} event</span>
                            </div>
                          ))}
                          <div className="text-[10px] text-slate-400 pt-0.5">
                            Total {recent.reduce((a, s) => a + s.total, 0).toLocaleString('id')} event
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-[10px] text-slate-400 tabular-nums">
                          Total {recent.reduce((a, s) => a + s.total, 0).toLocaleString('id')} event
                        </div>
                      )}
                    </div>
                  )}

                  {expanded && (
                    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 space-y-1 text-[10px] text-slate-600">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Wilayah
                      </div>
                      <div>
                        <span className="text-slate-400">Kab/Kota </span>
                        {v.regency || '—'}
                      </div>
                      <div>
                        <span className="text-slate-400">Provinsi </span>
                        {v.province || '—'}
                      </div>
                      {v.nearestCity && (
                        <div>
                          <span className="text-slate-400">Kota terdekat </span>
                          {v.nearestCity}
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Kode </span>
                        {v.code || '—'}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoreOpen((prev) => ({ ...prev, [v.slug]: !expanded }));
                    }}
                    className="w-full text-[11px] font-semibold text-[#1f8080] hover:bg-teal-50 border border-teal-100 rounded-lg py-2"
                  >
                    {expanded ? 'Sembunyikan detail' : 'Lihat lebih lanjut'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!loading && counts[1] > 0 && quickFilter === 'all' && (
        <div className="shrink-0 border-t border-slate-100 px-3 py-2">
          <button
            type="button"
            onClick={() => setShowNormal((v) => !v)}
            className="w-full text-[11px] font-medium text-slate-500 hover:text-slate-800 py-1"
          >
            {showNormal ? 'Sembunyikan Normal' : `Tampilkan ${counts[1]} Normal`}
          </button>
        </div>
      )}
    </div>
  );
}
