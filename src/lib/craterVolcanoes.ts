/** Status gunung api dari crater.id (turunan MAGMA). */

import fs from 'fs';
import path from 'path';
import { INARISK_PEAKS_WITHOUT_STATUS } from '@/data/inariskPeaksWithoutStatus';
import { fetchUpstream, fetchUpstreamJson } from '@/lib/upstreamFetch';

export const CRATER_BASE = 'https://crater.id/api/v1';

export type VolcanoAlertLevel = 0 | 1 | 2 | 3 | 4;

/** live = ada di crater/MAGMA; snapshot = hanya di file lokal; inarisk-only = puncak zona tanpa status live */
export type VolcanoStatusKind = 'live' | 'snapshot' | 'inarisk-only';

export type VolcanoItem = {
  slug: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  alertLevel: VolcanoAlertLevel;
  province: string;
  regency: string;
  nearestCity: string;
  elevation: number | null;
  region: string;
  hasVona: boolean;
  hasBulletin: boolean;
  gvpId: string | null;
  magmaApi: string | null;
  timezone: string | null;
  /** Asal penanda: live status vs puncak pelengkap InaRISK */
  statusKind?: VolcanoStatusKind;
};

export type VolcanoesPayload = {
  ok: boolean;
  source: string;
  syncedAt: string | null;
  statusAsOf: string | null;
  staleAfter: string | null;
  count: number;
  volcanoes: VolcanoItem[];
  note?: string;
  fallback?: boolean;
  attempts?: number;
};

type CraterListResponse = {
  statusAsOf?: string;
  syncedAt?: string;
  staleAfter?: string;
  source?: { en?: string; id?: string };
  sourceHref?: string;
  total?: number;
  items?: Array<{
    slug?: string;
    code?: string;
    name?: string;
    lat?: number;
    lon?: number;
    alertLevel?: number;
    province?: string;
    regency?: string;
    nearestCity?: string;
    elevation?: number;
    region?: string;
    hasVona?: boolean;
    hasBulletin?: boolean;
    gvpId?: string;
    magmaApi?: string;
    timezone?: string;
  }>;
};

const LEVEL_LABEL: Record<number, string> = {
  1: 'Normal',
  2: 'Waspada',
  3: 'Siaga',
  4: 'Awas',
};

export function alertLevelLabel(level: number): string {
  return LEVEL_LABEL[level] || `Level ${level}`;
}

function clampLevel(n: unknown): VolcanoAlertLevel {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  if (v > 4) return 4;
  return Math.round(v) as VolcanoAlertLevel;
}

export function normalizeCraterItem(raw: NonNullable<CraterListResponse['items']>[number]): VolcanoItem | null {
  const lat = Number(raw.lat);
  const lng = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const name = String(raw.name || '').trim();
  if (!name) return null;
  return {
    slug: String(raw.slug || name.toLowerCase().replace(/\s+/g, '-')),
    code: String(raw.code || ''),
    name,
    lat,
    lng,
    alertLevel: clampLevel(raw.alertLevel),
    province: String(raw.province || ''),
    regency: String(raw.regency || ''),
    nearestCity: String(raw.nearestCity || ''),
    elevation: Number.isFinite(Number(raw.elevation)) ? Number(raw.elevation) : null,
    region: String(raw.region || ''),
    hasVona: Boolean(raw.hasVona),
    hasBulletin: Boolean(raw.hasBulletin),
    gvpId: raw.gvpId ? String(raw.gvpId) : null,
    magmaApi: raw.magmaApi ? String(raw.magmaApi) : null,
    timezone: raw.timezone ? String(raw.timezone) : null,
  };
}

/** Map snapshot lama magma_volcanoes_v2.json → skema UI. */
export function normalizeSnapshotV2(raw: unknown): VolcanoItem[] {
  if (!raw || typeof raw !== 'object') return [];
  const list = (raw as { volcanoes?: unknown[] }).volcanoes;
  if (!Array.isArray(list)) return [];
  const out: VolcanoItem[] = [];
  for (const row of list) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const lat = Number(r.ga_lat_gapi);
    const lng = Number(r.ga_lon_gapi);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const name = String(r.ga_nama_gapi || '').trim();
    if (!name) continue;
    const code = String(r.ga_code || '');
    out.push({
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      code,
      name,
      lat,
      lng,
      alertLevel: clampLevel(r.ga_status),
      province: String(r.ga_prov_gapi || ''),
      regency: String(r.ga_kab_gapi || ''),
      nearestCity: String(r.ga_koter_gapi || ''),
      elevation: Number.isFinite(Number(r.ga_elev_gapi)) ? Number(r.ga_elev_gapi) : null,
      region: '',
      hasVona: Boolean(r.has_vona),
      hasBulletin: false,
      gvpId: null,
      magmaApi: null,
      timezone: null,
    });
  }
  return out;
}

function loadLocalSnapshot(): { items: VolcanoItem[]; updatedAt: string | null } {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'magma_volcanoes_v2.json');
    if (!fs.existsSync(filePath)) return { items: [], updatedAt: null };
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return {
      items: normalizeSnapshotV2(raw).map((v) => ({ ...v, statusKind: 'snapshot' as const })),
      updatedAt: typeof raw.updated_at === 'string' ? raw.updated_at : null,
    };
  } catch {
    return { items: [], updatedAt: null };
  }
}

function inariskOnlyAsVolcanoItems(existingSlugs: Set<string>): VolcanoItem[] {
  return INARISK_PEAKS_WITHOUT_STATUS.filter((p) => !existingSlugs.has(p.slug)).map((p) => ({
    slug: p.slug,
    code: '',
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    alertLevel: 0,
    province: p.province,
    regency: p.regency || '',
    nearestCity: '',
    elevation: p.elevation ?? null,
    region: '',
    hasVona: false,
    hasBulletin: false,
    gvpId: null,
    magmaApi: null,
    timezone: null,
    statusKind: 'inarisk-only' as const,
  }));
}

/** Gabungkan live + gunung snapshot yang hilang + puncak InaRISK tanpa status. */
function mergeVolcanoCoverage(primary: VolcanoItem[], snapItems: VolcanoItem[]): VolcanoItem[] {
  const bySlug = new Map<string, VolcanoItem>();
  for (const v of primary) {
    bySlug.set(v.slug, { ...v, statusKind: v.statusKind || 'live' });
  }
  // Snapshot mengisi gunung yang ada di MAGMA lokal tapi absen di crater live (mis. Batutara, Hobal)
  for (const s of snapItems) {
    if (!bySlug.has(s.slug)) {
      bySlug.set(s.slug, { ...s, statusKind: 'snapshot' });
    }
  }
  const slugs = new Set(bySlug.keys());
  for (const extra of inariskOnlyAsVolcanoItems(slugs)) {
    bySlug.set(extra.slug, extra);
  }
  return Array.from(bySlug.values()).sort(
    (a, b) => b.alertLevel - a.alertLevel || a.name.localeCompare(b.name, 'id')
  );
}

export async function fetchCraterVolcanoes(): Promise<VolcanoesPayload> {
  const live = await fetchUpstreamJson<CraterListResponse>(`${CRATER_BASE}/volcanoes`, {
    timeoutMs: 12_000,
    maxAttempts: 3,
  });
  const snap = loadLocalSnapshot();

  if (live.data?.items?.length) {
    const primary = live.data.items
      .map(normalizeCraterItem)
      .filter((v): v is VolcanoItem => v != null)
      .map((v) => ({ ...v, statusKind: 'live' as const }));
    const volcanoes = mergeVolcanoCoverage(primary, snap.items);
    const liveCount = primary.length;
    const extra = volcanoes.length - liveCount;

    return {
      ok: true,
      source: 'crater.id',
      syncedAt: live.data.syncedAt ?? null,
      statusAsOf: live.data.statusAsOf ?? null,
      staleAfter: live.data.staleAfter ?? null,
      count: volcanoes.length,
      volcanoes,
      attempts: live.meta.attempts,
      note:
        (live.data.source?.id || 'Sync harian dari MAGMA via crater.id') +
        (extra > 0 ? ` · +${extra} puncak pelengkap (InaRISK tanpa status MAGMA)` : ''),
    };
  }

  const volcanoes = mergeVolcanoCoverage(snap.items, []);
  return {
    ok: volcanoes.length > 0,
    source: 'magma_volcanoes_v2.json (fallback lokal)',
    syncedAt: snap.updatedAt,
    statusAsOf: snap.updatedAt,
    staleAfter: null,
    count: volcanoes.length,
    volcanoes,
    fallback: true,
    attempts: live.meta?.attempts,
    note:
      (!live.data && 'error' in live ? live.error : null) ||
      'crater.id gagal; memakai data lokal + puncak InaRISK',
  };
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols: string[] = [];
    let cur = '';
    let q = false;
    for (const ch of lines[i]) {
      if (ch === '"') {
        q = !q;
        continue;
      }
      if (ch === ',' && !q) {
        cols.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    cols.push(cur);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] || '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

export type VonaRow = {
  issuedUtc: string;
  noticenumber: string;
  colour: string;
  previousColour: string;
  cloudAboveSummitM: number | null;
  cloudTopAslM: number | null;
  summary: string;
  magmaLink: string;
};

export async function fetchCraterVona(slug: string): Promise<VonaRow[]> {
  const res = await fetchUpstream(`${CRATER_BASE}/volcanoes/${encodeURIComponent(slug)}/vona.csv`, {
    timeoutMs: 12_000,
    maxAttempts: 2,
    headers: { Accept: 'text/csv, */*' },
  });
  if (!res.ok) return [];
  return parseCsv(res.text).map((r) => ({
    issuedUtc: r.issued_utc || '',
    noticenumber: r.noticenumber || '',
    colour: (r.aviation_colour_code || '').toUpperCase(),
    previousColour: (r.previous_colour_code || '').toUpperCase(),
    cloudAboveSummitM: Number.isFinite(Number(r.cloud_above_summit_m))
      ? Number(r.cloud_above_summit_m)
      : null,
    cloudTopAslM: Number.isFinite(Number(r.cloud_top_asl_m)) ? Number(r.cloud_top_asl_m) : null,
    summary: r.summary || '',
    magmaLink: r.magma_link || '',
  }));
}

export type ReportRow = {
  date: string;
  noticenumber: string;
  visualId: string;
  magmaLink: string;
};

export async function fetchCraterReports(slug: string, limit = 5): Promise<ReportRow[]> {
  const res = await fetchUpstream(`${CRATER_BASE}/volcanoes/${encodeURIComponent(slug)}/reports.csv`, {
    timeoutMs: 15_000,
    maxAttempts: 2,
    headers: { Accept: 'text/csv, */*' },
  });
  if (!res.ok) return [];
  return parseCsv(res.text)
    .slice(0, limit)
    .map((r) => ({
      date: r.date || '',
      noticenumber: r.noticenumber || '',
      visualId: r.visual_id || '',
      magmaLink: r.magma_link || '',
    }));
}

export async function fetchCraterLatestReport(slug: string): Promise<ReportRow | null> {
  const rows = await fetchCraterReports(slug, 1);
  return rows[0] || null;
}

export type NoticeRow = {
  localTime: string;
  alertLevel: number | null;
  heightAboveSummitM: number | null;
  ashColour: string;
  magmaLink: string;
};

export async function fetchCraterNotices(slug: string): Promise<NoticeRow[]> {
  const res = await fetchUpstream(
    `${CRATER_BASE}/volcanoes/${encodeURIComponent(slug)}/activity/notices.csv`,
    {
      timeoutMs: 12_000,
      maxAttempts: 2,
      headers: { Accept: 'text/csv, */*' },
    }
  );
  if (!res.ok) return [];
  return parseCsv(res.text).map((r) => ({
    localTime: r.local_time || '',
    alertLevel: Number.isFinite(Number(r.alert_level)) ? Number(r.alert_level) : null,
    heightAboveSummitM: Number.isFinite(Number(r.height_above_summit_m))
      ? Number(r.height_above_summit_m)
      : null,
    ashColour: r.ash_colour || '',
    magmaLink: r.magma_link || '',
  }));
}

export type SeismicDay = {
  date: string;
  total: number;
};

export async function fetchCraterSeismicRecent(slug: string, days = 14): Promise<SeismicDay[]> {
  const res = await fetchUpstream(
    `${CRATER_BASE}/volcanoes/${encodeURIComponent(slug)}/activity/seismic.csv`,
    {
      timeoutMs: 12_000,
      maxAttempts: 2,
      headers: { Accept: 'text/csv, */*' },
    }
  );
  if (!res.ok) return [];
  const rows = parseCsv(res.text);
  const mapped = rows
    .map((r) => {
      const date = r.date || '';
      let total = 0;
      let hasValue = false;
      for (const [k, v] of Object.entries(r)) {
        if (k === 'date') continue;
        const raw = (v || '').trim();
        // crater: sel kosong = belum tercatat, bukan nol
        if (!raw) continue;
        const n = Number(raw);
        if (Number.isFinite(n)) {
          hasValue = true;
          total += n;
        }
      }
      return { date, total, hasValue };
    })
    .filter((r) => r.date && r.hasValue)
    .map(({ date, total }) => ({ date, total }));
  return mapped.slice(-days);
}

/** VONA batch untuk gunung hasVona / Siaga+ (dipakai animasi abu). */
export async function fetchVonaForVolcanoes(
  volcanoes: VolcanoItem[],
  limit = 8
): Promise<Record<string, VonaRow | null>> {
  const targets = volcanoes
    .filter((v) => v.hasVona || v.alertLevel >= 3)
    .sort((a, b) => b.alertLevel - a.alertLevel)
    .slice(0, limit);

  const out: Record<string, VonaRow | null> = {};
  await Promise.all(
    targets.map(async (v) => {
      const rows = await fetchCraterVona(v.slug);
      out[v.slug] = rows[0] || null;
    })
  );
  return out;
}
