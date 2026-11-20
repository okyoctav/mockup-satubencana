/**
 * Master wilayah untuk staging/prod: snapshot resmi + fallback wilayah.ts.
 * Snapshot di-refresh berkala via: npm run build:wilayah
 */

import { WILAYAH, type Wilayah } from '@/data/wilayah';
import snapshot from '@/data/wilayah_snapshot.json';

export type WilayahItem = Wilayah & {
  kode?: string;
  kode_bps?: string;
  coordSource?: string;
};

type SnapshotFile = {
  asOf?: string;
  source?: string;
  counts?: Record<string, number>;
  items?: Array<{
    nama: string;
    tipe: 'provinsi' | 'kabupaten' | 'kota';
    provinsi: string;
    kode?: string;
    kode_bps?: string;
    lat: number;
    lng: number;
    zoom: number;
    coordSource?: string;
  }>;
};

const snap = snapshot as SnapshotFile;

function fromSnapshot(): WilayahItem[] {
  const items = snap.items;
  if (!Array.isArray(items) || items.length < 40) return [];
  return items.map((i) => ({
    nama: i.nama,
    tipe: i.tipe,
    provinsi: i.provinsi,
    lat: i.lat,
    lng: i.lng,
    zoom: i.zoom,
    kode: i.kode,
    kode_bps: i.kode_bps,
    coordSource: i.coordSource,
  }));
}

const SNAPSHOT_ITEMS = fromSnapshot();
const USING_SNAPSHOT = SNAPSHOT_ITEMS.length > 0;

/** Daftar wilayah aktif (snapshot jika valid, else hardcode lama). */
export const WILAYAH_MASTER: WilayahItem[] = USING_SNAPSHOT
  ? SNAPSHOT_ITEMS
  : WILAYAH.map((w) => ({ ...w }));

export const WILAYAH_META = {
  usingSnapshot: USING_SNAPSHOT,
  asOf: snap.asOf ?? null,
  source: USING_SNAPSHOT ? snap.source ?? 'wilayah_snapshot.json' : 'wilayah.ts (fallback)',
  counts: USING_SNAPSHOT
    ? snap.counts ?? { total: WILAYAH_MASTER.length }
    : { total: WILAYAH_MASTER.length, fallback: true },
};

/** Label tampilan: bedakan Kab. X vs Kota X saat nama sama. */
export function formatWilayahLabel(w: Pick<WilayahItem, 'nama' | 'tipe'>): string {
  if (w.tipe === 'provinsi') return w.nama;
  if (w.tipe === 'kota') return `Kota ${w.nama}`;
  return `Kab. ${w.nama}`;
}

export const PROVINSI_LIST: string[] = Array.from(
  new Set(WILAYAH_MASTER.filter((w) => w.tipe === 'provinsi').map((w) => w.nama))
).sort((a, b) => a.localeCompare(b, 'id'));

export type KabListItem = {
  nama: string;
  lat: number;
  lng: number;
  tipe: 'kabupaten' | 'kota';
  kode?: string;
  label: string;
  key: string;
};

/** Semua kab+kota per provinsi — tidak dedupe nama (Kab & Kota Bandung keduanya ada). */
export const KAB_BY_PROV: Record<string, KabListItem[]> = (() => {
  const map: Record<string, KabListItem[]> = {};
  for (const w of WILAYAH_MASTER) {
    if (w.tipe === 'provinsi') continue;
    if (!map[w.provinsi]) map[w.provinsi] = [];
    const key = w.kode || `${w.tipe}:${w.nama}`;
    if (map[w.provinsi].some((x) => x.key === key)) continue;
    map[w.provinsi].push({
      nama: w.nama,
      lat: w.lat,
      lng: w.lng,
      tipe: w.tipe,
      kode: w.kode,
      label: formatWilayahLabel(w),
      key,
    });
  }
  for (const arr of Object.values(map)) {
    arr.sort(
      (a, b) => a.nama.localeCompare(b.nama, 'id') || a.tipe.localeCompare(b.tipe, 'id')
    );
  }
  return map;
})();

export const PROV_CENTER: Record<string, { lat: number; lng: number; kode?: string }> = (() => {
  const map: Record<string, { lat: number; lng: number; kode?: string }> = {};
  for (const w of WILAYAH_MASTER) {
    if (w.tipe !== 'provinsi') continue;
    map[w.nama] = { lat: w.lat, lng: w.lng, kode: w.kode };
  }
  return map;
})();

/** Kode Kemendagri 2-digit dari nama provinsi (uppercase key). */
export const KODE_KEMENDAGRI_PROVINSI: Record<string, string> = (() => {
  const map: Record<string, string> = {
    'DKI JAKARTA': '31',
    'DAERAH KHUSUS IBUKOTA JAKARTA': '31',
    'DI YOGYAKARTA': '34',
    'DAERAH ISTIMEWA YOGYAKARTA': '34',
    'D.I. YOGYAKARTA': '34',
  };
  for (const w of WILAYAH_MASTER) {
    if (w.tipe !== 'provinsi' || !w.kode) continue;
    map[w.nama.toUpperCase()] = w.kode;
  }
  return map;
})();

export function searchWilayah(query: string, limit = 8): WilayahItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return WILAYAH_MASTER.filter((w) => {
    const label = formatWilayahLabel(w).toLowerCase();
    return (
      w.nama.toLowerCase().includes(q) ||
      w.provinsi.toLowerCase().includes(q) ||
      label.includes(q) ||
      (w.kode || '').includes(q)
    );
  }).slice(0, limit);
}
