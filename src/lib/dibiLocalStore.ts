import { promises as fs } from 'fs';
import path from 'path';

/**
 * Store lokal DIBI (file public/20260505_072732.json).
 * Di-cache di memori proses server agar parse 42MB tidak berulang.
 * Field yang dikirim = yang dipakai AnalysisDashboard (kualitas analisis sama).
 */

export type DibiEventRow = {
  Tahun: number;
  Bulan: number;
  Minggu?: number;
  Provinsi: string;
  'Kode Provinsi'?: number | string;
  Kabupaten: string;
  'Kode Kabupaten'?: string;
  'Jenis Bencana': string;
  'Jumlah Kejadian': number;
  Meninggal: number;
  Hilang: number;
  'Luka / Sakit': number;
  menderita_mengungsi: number;
  'Rumah Rusak Berat': number;
  'Rumah Rusak Sedang': number;
  'Rumah Rusak Ringan': number;
  'Rumah Terendam': number;
  'Satuan Pendidikan Rusak': number;
  'Rumah Ibadat Rusak': number;
  'Fasilitas Pelayanan Kesehatan Rusak': number;
  'Kantor Rusak': number;
  'Jembatan Rusak': number;
};

export const DIBI_LOCAL_AS_OF = '2026-05-05';
export const DIBI_LOCAL_FILE = '20260505_072732.json';

type RawRow = Record<string, unknown>;

let cache: DibiEventRow[] | null = null;
let loadPromise: Promise<DibiEventRow[]> | null = null;

function n(v: unknown): number {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function slim(r: RawRow): DibiEventRow {
  return {
    Tahun: n(r.Tahun),
    Bulan: n(r.Bulan),
    Minggu: r.Minggu != null ? n(r.Minggu) : undefined,
    Provinsi: String(r.Provinsi || ''),
    'Kode Provinsi': (r['Kode Provinsi'] as number | string | undefined) ?? undefined,
    Kabupaten: String(r.Kabupaten || ''),
    'Kode Kabupaten': r['Kode Kabupaten'] != null ? String(r['Kode Kabupaten']) : undefined,
    'Jenis Bencana': String(r['Jenis Bencana'] || ''),
    'Jumlah Kejadian': n(r['Jumlah Kejadian']),
    Meninggal: n(r.Meninggal),
    Hilang: n(r.Hilang),
    'Luka / Sakit': n(r['Luka / Sakit']),
    menderita_mengungsi: n(r.menderita_mengungsi),
    'Rumah Rusak Berat': n(r['Rumah Rusak Berat']),
    'Rumah Rusak Sedang': n(r['Rumah Rusak Sedang']),
    'Rumah Rusak Ringan': n(r['Rumah Rusak Ringan']),
    'Rumah Terendam': n(r['Rumah Terendam']),
    'Satuan Pendidikan Rusak': n(r['Satuan Pendidikan Rusak']),
    'Rumah Ibadat Rusak': n(r['Rumah Ibadat Rusak']),
    'Fasilitas Pelayanan Kesehatan Rusak': n(r['Fasilitas Pelayanan Kesehatan Rusak']),
    'Kantor Rusak': n(r['Kantor Rusak']),
    'Jembatan Rusak': n(r['Jembatan Rusak']),
  };
}

async function loadFromDisk(): Promise<DibiEventRow[]> {
  const file = path.join(process.cwd(), 'public', DIBI_LOCAL_FILE);
  const raw = await fs.readFile(file, 'utf8');
  const json = JSON.parse(raw) as { Sheet1?: RawRow[] } | RawRow[];
  const rows = Array.isArray(json) ? json : json.Sheet1 || [];
  return rows.map(slim);
}

/** Semua baris DIBI lokal (lengkap untuk analisis). */
export async function getDibiEventRows(): Promise<DibiEventRow[]> {
  if (cache) return cache;
  if (!loadPromise) {
    loadPromise = loadFromDisk()
      .then((rows) => {
        cache = rows;
        return rows;
      })
      .catch((err) => {
        loadPromise = null;
        throw err;
      });
  }
  return loadPromise;
}
