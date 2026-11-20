import { NextResponse } from 'next/server';
import type { BmkgAlertItem } from '@/types/bmkgAlert';
import { fetchUpstreamJson } from '@/lib/upstreamFetch';

/**
 * Proxy + normalisasi early-warning gempa dari data terbuka BMKG.
 * Sumber: https://data.bmkg.go.id/gempabumi/
 *
 * Dipanggil dari AlertTicker (in-app saja), bukan notifikasi HP.
 */

export const dynamic = 'force-dynamic';

const BMKG = {
  auto: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
  terkini: 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
  dirasakan: 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json',
} as const;

type BmkgGempa = {
  Tanggal?: string;
  Jam?: string;
  DateTime?: string;
  Coordinates?: string;
  Magnitude?: string;
  Kedalaman?: string;
  Wilayah?: string;
  Potensi?: string;
  Dirasakan?: string;
};

function parseCoords(raw?: string): { lat: number; lng: number } | null {
  if (!raw) return null;
  const parts = raw.split(',').map((p) => Number(String(p).trim()));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return { lat: parts[0], lng: parts[1] };
}

function relativeTimeId(iso?: string, tanggal?: string, jam?: string): string {
  if (iso) {
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) {
      const diffMin = Math.max(0, Math.round((Date.now() - t) / 60000));
      if (diffMin < 1) return 'baru saja';
      if (diffMin < 60) return `${diffMin} menit lalu`;
      const diffJam = Math.round(diffMin / 60);
      if (diffJam < 24) return `${diffJam} jam lalu`;
      const diffHari = Math.round(diffJam / 24);
      return `${diffHari} hari lalu`;
    }
  }
  if (tanggal && jam) return `${tanggal} ${jam}`;
  if (tanggal) return tanggal;
  return 'waktu tidak diketahui';
}

function levelFromMagnitude(mag: number, isTsunamiRisk: boolean): BmkgAlertItem['level'] {
  if (isTsunamiRisk || mag >= 5) return 'tinggi';
  if (mag >= 4) return 'sedang';
  return 'rendah';
}

function colorForLevel(level: BmkgAlertItem['level']): string {
  if (level === 'tinggi') return '#EF4444';
  if (level === 'sedang') return '#F97316';
  return '#EAB308';
}

function normalizeOne(
  g: BmkgGempa,
  source: BmkgAlertItem['source'],
): BmkgAlertItem | null {
  const coords = parseCoords(g.Coordinates);
  if (!coords) return null;

  const magnitude = Number(g.Magnitude ?? 0);
  const potensi = (g.Potensi || '').toLowerCase();
  const isTsunamiRisk = potensi.includes('tsunami') && !potensi.includes('tidak berpotensi');
  const level = levelFromMagnitude(magnitude, isTsunamiRisk);
  const wilayahShort = (g.Wilayah || 'Lokasi tidak diketahui')
    .replace(/^Pusat gempa berada di\s*/i, '')
    .trim();

  const pesanParts = [
    `Gempa M${g.Magnitude ?? '?'}`,
    wilayahShort,
    g.Kedalaman ? `kedalaman ${g.Kedalaman}` : null,
    isTsunamiRisk ? 'berpotensi tsunami' : null,
    g.Dirasakan ? `dirasakan ${g.Dirasakan}` : null,
  ].filter(Boolean);

  return {
    id: `${source}-${g.DateTime || g.Coordinates}-${g.Magnitude}`,
    jenis: isTsunamiRisk ? 'tsunami' : 'gempa',
    level,
    pesan: pesanParts.join(' — '),
    waktu: relativeTimeId(g.DateTime, g.Tanggal, g.Jam),
    waktuIso: g.DateTime || null,
    lat: coords.lat,
    lng: coords.lng,
    color: colorForLevel(level),
    icon: isTsunamiRisk ? '🟠' : level === 'tinggi' ? '🔴' : '🟡',
    source,
    magnitude: Number.isFinite(magnitude) ? magnitude : 0,
    pinned: source === 'autogempa',
  };
}

function eventTimeMs(a: BmkgAlertItem): number {
  return Date.parse(a.waktuIso || '') || 0;
}

/** Urutan early-warning: pin autogempa dulu, lalu kejadian paling baru. */
function sortForEarlyWarning(items: BmkgAlertItem[]): BmkgAlertItem[] {
  const pinned = items
    .filter((a) => a.pinned || a.source === 'autogempa')
    .sort((a, b) => eventTimeMs(b) - eventTimeMs(a));

  const pinnedKeys = new Set(
    pinned.map((a) => `${a.waktuIso || a.pesan}|${a.lat.toFixed(2)}|${a.lng.toFixed(2)}`),
  );

  const rest = items
    .filter((a) => {
      const key = `${a.waktuIso || a.pesan}|${a.lat.toFixed(2)}|${a.lng.toFixed(2)}`;
      return !pinnedKeys.has(key);
    })
    .sort((a, b) => {
      // Tsunami risk naik sedikit, tapi waktu tetap dominan
      const tsunamiBoost = (x: BmkgAlertItem) => (x.jenis === 'tsunami' ? 1 : 0);
      const tb = tsunamiBoost(b) - tsunamiBoost(a);
      if (tb !== 0 && Math.abs(eventTimeMs(b) - eventTimeMs(a)) < 6 * 3600 * 1000) return tb;
      return eventTimeMs(b) - eventTimeMs(a);
    });

  return [...pinned, ...rest];
}

/** Prefer kejadian <= maxAgeHours; jika terlalu sedikit, longgarkan. */
function preferRecent(items: BmkgAlertItem[], maxAgeHours: number, minKeep: number): BmkgAlertItem[] {
  const now = Date.now();
  const recent = items.filter((a) => {
    if (a.pinned || a.source === 'autogempa') return true;
    const t = eventTimeMs(a);
    if (!t) return true;
    return now - t <= maxAgeHours * 3600 * 1000;
  });
  if (recent.length >= minKeep) return recent;
  return items;
}

async function fetchJson(url: string): Promise<unknown | null> {
  const result = await fetchUpstreamJson(url, {
    timeoutMs: 8_000,
    maxAttempts: 3,
    headers: { Accept: 'application/json' },
  });
  return result.data;
}

function asGempaList(payload: unknown): BmkgGempa[] {
  if (!payload || typeof payload !== 'object') return [];
  const info = (payload as { Infogempa?: { gempa?: BmkgGempa | BmkgGempa[] } }).Infogempa;
  if (!info?.gempa) return [];
  return Array.isArray(info.gempa) ? info.gempa : [info.gempa];
}

export async function GET() {
  const [autoRaw, terkiniRaw, dirasakanRaw] = await Promise.all([
    fetchJson(BMKG.auto),
    fetchJson(BMKG.terkini),
    fetchJson(BMKG.dirasakan),
  ]);

  const collected: BmkgAlertItem[] = [];
  for (const g of asGempaList(autoRaw)) {
    const item = normalizeOne(g, 'autogempa');
    if (item) collected.push(item);
  }
  for (const g of asGempaList(terkiniRaw).slice(0, 5)) {
    const item = normalizeOne(g, 'gempaterkini');
    if (item) collected.push(item);
  }
  for (const g of asGempaList(dirasakanRaw).slice(0, 5)) {
    const item = normalizeOne(g, 'gempadirasakan');
    if (item) collected.push(item);
  }

  // Deduplikasi kasar: DateTime + koordinat dibulatkan
  const seen = new Set<string>();
  const unique = collected.filter((a) => {
    const key = `${a.waktuIso || a.pesan}|${a.lat.toFixed(2)}|${a.lng.toFixed(2)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Early-warning: pin autogempa → urut waktu terbaru → prefer 48 jam terakhir
  const ordered = preferRecent(sortForEarlyWarning(unique), 48, 3);
  const alerts = ordered.slice(0, 8);
  const ok = alerts.length > 0;
  const newestIso = alerts[0]?.waktuIso || null;

  return NextResponse.json(
    {
      ok,
      sourceLabel: 'BMKG TEWS',
      fetchedAt: new Date().toISOString(),
      newestEventAt: newestIso,
      count: alerts.length,
      alerts,
      endpoints: BMKG,
    },
    {
      status: 200,
      headers: {
        // Cache singkat di edge/browser agar tidak memukul BMKG tiap render
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}
