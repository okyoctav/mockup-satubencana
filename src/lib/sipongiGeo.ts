/**
 * Resolusi spasial SIPONGI → master Kemendagri (wilayah snapshot).
 * Hotspot SIPONGI hanya agregat nama kab (tanpa lat/lng); titik peta harus
 * dipetakan ke kode/nama resmi agar tidak jatuh ke fallback radial.
 */

import {
  KODE_KEMENDAGRI_PROVINSI,
  WILAYAH_MASTER,
  type WilayahItem,
} from '@/lib/wilayahStore';
import {
  getKabupatenCoord,
  KABUPATEN_COORDINATES,
  PROVINCE_COORDINATES,
  type RegionCoord,
} from '@/data/provinceCoordinates';

export type CoordMatchQuality = 'kode' | 'nama' | 'legacy' | 'fallback';

export type ResolvedKabCoord = {
  lat: number;
  lng: number;
  quality: CoordMatchQuality;
  kode?: string;
  label?: string;
};

const PROVINCE_ALIASES: Record<string, string> = {
  'BANGKA BELITUNG': 'KEPULAUAN BANGKA BELITUNG',
  'KEP. BANGKA BELITUNG': 'KEPULAUAN BANGKA BELITUNG',
  'DI YOGYAKARTA': 'DAERAH ISTIMEWA YOGYAKARTA',
  'D.I. YOGYAKARTA': 'DAERAH ISTIMEWA YOGYAKARTA',
  'DIY': 'DAERAH ISTIMEWA YOGYAKARTA',
  'DKI JAKARTA': 'DKI JAKARTA',
  'JAKARTA': 'DKI JAKARTA',
};

/** Normalisasi nama wilayah untuk matching longgar. */
export function normalizeWilayahKey(name: string | undefined | null): string {
  return String(name || '')
    .toUpperCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(KAB\.?|KABUPATEN|KOTA ADM\.?|KOTA)\s+/i, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function digitsKode(kode?: string | null): string {
  return String(kode || '').replace(/\D/g, '');
}

export function canonicalProvinsiName(provinsi: string): string {
  const key = normalizeWilayahKey(provinsi);
  return PROVINCE_ALIASES[key] || key;
}

type IndexMaps = {
  byKode: Map<string, WilayahItem>;
  byProvNama: Map<string, WilayahItem>;
};

let cachedIndex: IndexMaps | null = null;

function buildIndex(): IndexMaps {
  if (cachedIndex) return cachedIndex;
  const byKode = new Map<string, WilayahItem>();
  const byProvNama = new Map<string, WilayahItem>();

  for (const w of WILAYAH_MASTER) {
    if (w.tipe === 'provinsi') continue;
    const kode = digitsKode(w.kode);
    if (kode) byKode.set(kode, w);

    const prov = normalizeWilayahKey(w.provinsi);
    const nama = normalizeWilayahKey(w.nama);
    byProvNama.set(`${prov}::${nama}`, w);
    // Alias kota tanpa prefix
    if (w.tipe === 'kota') {
      byProvNama.set(`${prov}::KOTA ${nama}`, w);
    }
  }

  cachedIndex = { byKode, byProvNama };
  return cachedIndex;
}

/**
 * Opsional: peta nama SIPONGI → id_mendagri (dari luas_kabupaten).
 * Digunakan untuk matching kode yang lebih ketat.
 */
export function buildSipongiNamaToKode(
  rows: Array<{ id_mendagri?: string; nama?: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const nama = normalizeWilayahKey(row.nama);
    const kode = digitsKode(row.id_mendagri);
    if (nama && kode) map.set(nama, kode);
  }
  return map;
}

export function resolveSipongiKabCoord(
  provinsi: string,
  kabupaten: string,
  opts?: {
    indexHint?: number;
    totalHints?: number;
    namaToKode?: Map<string, string>;
  },
): ResolvedKabCoord {
  const { byKode, byProvNama } = buildIndex();
  const provKey = canonicalProvinsiName(provinsi);
  const kabKey = normalizeWilayahKey(kabupaten);
  const kodeFromLuas = opts?.namaToKode?.get(kabKey);

  if (kodeFromLuas && byKode.has(kodeFromLuas)) {
    const w = byKode.get(kodeFromLuas)!;
    return {
      lat: w.lat,
      lng: w.lng,
      quality: 'kode',
      kode: w.kode,
      label: w.nama,
    };
  }

  const direct = byProvNama.get(`${provKey}::${kabKey}`);
  if (direct) {
    return {
      lat: direct.lat,
      lng: direct.lng,
      quality: 'nama',
      kode: direct.kode,
      label: direct.nama,
    };
  }

  // Coba tanpa ketat provinsi (nama unik nasional)
  let soft: WilayahItem | undefined;
  Array.from(byProvNama.entries()).some(([key, w]) => {
    if (key.endsWith(`::${kabKey}`)) {
      soft = w;
      return true;
    }
    return false;
  });
  if (soft) {
    return {
      lat: soft.lat,
      lng: soft.lng,
      quality: 'nama',
      kode: soft.kode,
      label: soft.nama,
    };
  }

  // Kamus legacy provinceCoordinates
  const kabUpper = String(kabupaten || '')
    .toUpperCase()
    .trim();
  const stripped = kabUpper.replace(/^(KABUPATEN|KOTA)\s+/, '');
  if (KABUPATEN_COORDINATES[kabUpper] || KABUPATEN_COORDINATES[stripped]) {
    const c = KABUPATEN_COORDINATES[kabUpper] || KABUPATEN_COORDINATES[stripped];
    return { lat: c.lat, lng: c.lng, quality: 'legacy' };
  }

  // Fallback radial di sekitar pusat provinsi
  const fallback = getKabupatenCoord(
    provinsi,
    kabupaten,
    opts?.indexHint ?? 0,
    opts?.totalHints ?? 1,
  );
  return {
    lat: fallback.lat,
    lng: fallback.lng,
    quality: 'fallback',
  };
}

export function getProvinceView(provinsi: string): RegionCoord {
  if (!provinsi || provinsi === 'all') {
    return { lat: -2.5, lng: 118.0, zoom: 5 };
  }
  const key = canonicalProvinsiName(provinsi);
  return (
    PROVINCE_COORDINATES[key] ||
    PROVINCE_COORDINATES[normalizeWilayahKey(provinsi)] || {
      lat: -2.5,
      lng: 118.0,
      zoom: 5,
    }
  );
}

/** Alias nama provinsi SIPONGI ↔ opsi UI (luas_provinsi). */
export function matchProvinsiOption(
  raw: string,
  options: string[],
): string | null {
  if (!raw || raw === 'all') return 'all';
  const key = canonicalProvinsiName(raw);
  const hit = options.find((o) => canonicalProvinsiName(o) === key);
  return hit || null;
}

/** Nama provinsi dari kode Kemendagri (2 digit pertama). */
export function provinceNameFromKode(kode?: string | null): string | null {
  const dig = digitsKode(kode).slice(0, 2);
  if (!dig) return null;
  const entries = Object.entries(KODE_KEMENDAGRI_PROVINSI);
  for (let i = 0; i < entries.length; i++) {
    const [name, code] = entries[i];
    if (digitsKode(code).slice(0, 2) === dig) {
      // Prefer title-case dari master
      const master = WILAYAH_MASTER.find(
        (w) => w.tipe === 'provinsi' && digitsKode(w.kode).slice(0, 2) === dig,
      );
      return master?.nama || name;
    }
  }
  return null;
}

/**
 * Parameter `provinsi` untuk API SIPONGI sebaran, dari filter dashboard.
 * Kab/kota → pakai nama provinsi induk (API sebaran berlevel provinsi).
 */
export function resolveSipongiProvinsiParam(opts: {
  kodeKemendagri?: string | null;
  /** Nama provinsi jika filter provinsi, atau nama kab jika filter kab/kota */
  wilayahNama?: string | null;
  /** Nama provinsi induk saat filter kab/kota */
  wilayahProvinsi?: string | null;
}): string {
  if (opts.wilayahProvinsi && opts.wilayahProvinsi.trim()) {
    return opts.wilayahProvinsi.trim();
  }
  const fromKode = provinceNameFromKode(opts.kodeKemendagri);
  if (fromKode) {
    // Kode 4+ digit = kab; 2 digit = prov. Nama filter kab jangan dipakai sebagai provinsi.
    const dig = digitsKode(opts.kodeKemendagri);
    if (dig.length >= 4) return fromKode;
    if (dig.length === 2) return fromKode;
  }
  if (opts.wilayahNama && opts.wilayahNama.trim() && digitsKode(opts.kodeKemendagri).length <= 2) {
    return opts.wilayahNama.trim();
  }
  return 'all';
}

/** Apakah jenis kejadian termasuk kebakaran / karhutla. */
export function isKejadianKebakaran(jenis?: string | null, jenisLabel?: string | null): boolean {
  const s = `${jenis || ''} ${jenisLabel || ''}`.toLowerCase();
  return s.includes('bakar') || s.includes('karhutla') || s.includes('hutan dan lahan');
}

/**
 * Cocokkan nama kab longgar (Luwu ↔ Luwu Timur) untuk korelasi hotspot × kejadian.
 * Hindari match terlalu pendek (< 4 huruf).
 */
export function kabNamesLooselyMatch(a?: string | null, b?: string | null): boolean {
  const na = normalizeWilayahKey(a);
  const nb = normalizeWilayahKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length < 4 || nb.length < 4) return false;
  return na.includes(nb) || nb.includes(na);
}
