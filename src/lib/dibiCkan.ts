/**
 * Agregat DIBI dari CKAN data.bnpb.go.id (bukan microdata 50k baris).
 * Dipakai chart dashboard asesmen dampak.
 */

const CKAN_DATASTORE = 'https://data.bnpb.go.id/api/3/action/datastore_search';

/** Resource DataStore yang sudah diverifikasi (agregat jenis/provinsi × tahun). */
export const DIBI_CKAN_RESOURCES = {
  kejadianJenis: '9b41007e-c998-456b-8cbc-385b17986e46',
  pengungsiJenis: 'd7b61b56-43d5-4dcc-8d7b-45c993e1bdb0',
  rumahJenis: '27bbeb6b-6f86-4490-840a-c1bc6393102b',
  hilangJenis: 'a19366cf-0ac4-45d1-bc6e-89a020ab45a1',
  lukaJenis: 'ce67795b-57e4-4c84-8c2a-3bf03828ff0d',
  /** Meninggal: beberapa ID di katalog tidak aktif di DataStore — dicoba berurutan */
  meninggalJenisCandidates: [
    'b2fa5c46-9a07-4d30-a3bd-57e143e775f1',
    '69605ad2-73ea-4967-b2d5-639ad9291833', // fallback beda bentuk (provinsi 2024) — diabaikan jika bukan JENIS
  ],
  kejadianProvinsi: '5dfcae7e-acb3-4548-82b5-61d876ea478a',
} as const;

const JENIS_COLOR: Record<string, string> = {
  banjir: '#35A7FF',
  'cuaca ekstrem': '#38618C',
  longsor: '#FF7F11',
  kebakaran: '#F59E0B',
  'kebakaran hutan dan lahan': '#F59E0B',
  kekeringan: '#78716C',
  gempabumi: '#EF4444',
  gempa: '#EF4444',
  abrasi: '#06B6D4',
  'gelombang pasang dan abrasi': '#06B6D4',
  erupsi: '#8B5CF6',
  'erupsi gunung api': '#8B5CF6',
  tsunami: '#EC4899',
};

export type DibiPerTahun = { tahun: string; kejadian: number };
export type DibiPerJenis = {
  jenis: string;
  kejadian: number;
  meninggal: number;
  pengungsi: number;
  rumah_rusak: number;
  color: string;
};
export type DibiTopProvinsi = { provinsi: string; kejadian: number };
export type DibiDist = { name: string; value: number; color: string };

export type DibiAggregates = {
  perTahun: DibiPerTahun[];
  perJenis: DibiPerJenis[];
  topProvinsi: DibiTopProvinsi[];
  perBulan: { bulan: string; kejadian: number }[] | null;
  korbanDist: DibiDist[];
  pengungsiDist: DibiDist[];
  total: {
    kejadian: number;
    meninggal: number;
    hilang: number;
    luka: number;
    pengungsi: number;
    rumah_terdampak: number;
  };
  yearRange: { min: number; max: number };
  meninggalFromCkan: boolean;
};

function yearKeys(rec: Record<string, unknown>): string[] {
  return Object.keys(rec)
    .filter((k) => /^\d{4}(\.0)?$/.test(k))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sumYears(rec: Record<string, unknown>, keys: string[]): number {
  return keys.reduce((s, k) => s + num(rec[k]), 0);
}

function titleJenis(raw: string): string {
  const s = (raw || '').trim();
  if (!s) return 'Lainnya';
  // Title-case ringan
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
    .replace(/Gempabumi/i, 'Gempabumi')
    .replace(/Api/i, 'api');
}

function colorForJenis(label: string): string {
  const key = label.toLowerCase();
  for (const [k, c] of Object.entries(JENIS_COLOR)) {
    if (key.includes(k) || k.includes(key)) return c;
  }
  return '#64748b';
}

function indexByJenis(records: Record<string, unknown>[]): Map<string, Record<string, unknown>> {
  const m = new Map<string, Record<string, unknown>>();
  for (const r of records) {
    const raw = String(r['JENIS BENCANA'] || r['Jenis Bencana'] || '').trim();
    if (!raw) continue;
    m.set(raw.toUpperCase(), r);
  }
  return m;
}

async function datastoreAll(resourceId: string): Promise<Record<string, unknown>[]> {
  const url = `${CKAN_DATASTORE}?resource_id=${encodeURIComponent(resourceId)}&limit=500`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // Cache singkat di server Next — jangan hantam CKAN tiap buka tab
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`CKAN HTTP ${res.status}`);
  const json = (await res.json()) as {
    success?: boolean;
    error?: { message?: string };
    result?: { records?: Record<string, unknown>[] };
  };
  if (!json.success) throw new Error(json.error?.message || 'CKAN datastore gagal');
  return json.result?.records || [];
}

async function tryDatastore(resourceId: string): Promise<Record<string, unknown>[] | null> {
  try {
    return await datastoreAll(resourceId);
  } catch {
    return null;
  }
}

function pctDist(
  items: { name: string; value: number; color: string }[]
): DibiDist[] {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!total) return [];
  return items
    .filter((i) => i.value > 0)
    .map((i) => ({
      name: i.name,
      value: Math.round((i.value / total) * 100),
      color: i.color,
    }))
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value);
}

/**
 * Ambil agregat dari CKAN. Lempar error jika resource inti gagal.
 */
export async function fetchDibiAggregatesFromCkan(): Promise<DibiAggregates> {
  const [kejadianRows, pengungsiRows, rumahRows, hilangRows, lukaRows, provRows] =
    await Promise.all([
      datastoreAll(DIBI_CKAN_RESOURCES.kejadianJenis),
      datastoreAll(DIBI_CKAN_RESOURCES.pengungsiJenis),
      datastoreAll(DIBI_CKAN_RESOURCES.rumahJenis),
      datastoreAll(DIBI_CKAN_RESOURCES.hilangJenis),
      datastoreAll(DIBI_CKAN_RESOURCES.lukaJenis),
      datastoreAll(DIBI_CKAN_RESOURCES.kejadianProvinsi),
    ]);

  let meninggalRows: Record<string, unknown>[] | null = null;
  for (const id of DIBI_CKAN_RESOURCES.meninggalJenisCandidates) {
    const rows = await tryDatastore(id);
    if (rows?.length && rows[0] && ('JENIS BENCANA' in rows[0] || 'Jenis Bencana' in rows[0])) {
      meninggalRows = rows;
      break;
    }
  }

  const kejIdx = indexByJenis(kejadianRows);
  const ungIdx = indexByJenis(pengungsiRows);
  const rumIdx = indexByJenis(rumahRows);
  const hilIdx = indexByJenis(hilangRows);
  const lukIdx = indexByJenis(lukaRows);
  const menIdx = meninggalRows ? indexByJenis(meninggalRows) : new Map();

  const sample = kejadianRows[0] || {};
  const ykeys = yearKeys(sample);
  const years = ykeys.map((k) => parseInt(k, 10));
  const yearRange = {
    min: Math.min(...years),
    max: Math.max(...years),
  };

  // per tahun = jumlah semua jenis
  const perTahun: DibiPerTahun[] = ykeys.map((yk) => {
    let kejadian = 0;
    for (const r of Array.from(kejIdx.values())) kejadian += num(r[yk]);
    return { tahun: String(parseInt(yk, 10)), kejadian };
  });

  const perJenis: DibiPerJenis[] = [];
  for (const [key, r] of Array.from(kejIdx.entries())) {
    const label = titleJenis(key);
    const ung = ungIdx.get(key);
    const rum = rumIdx.get(key);
    const men = menIdx.get(key);
    perJenis.push({
      jenis: label,
      kejadian: sumYears(r, ykeys),
      meninggal: men ? sumYears(men, yearKeys(men)) : 0,
      pengungsi: ung ? sumYears(ung, yearKeys(ung)) : 0,
      rumah_rusak: rum ? sumYears(rum, yearKeys(rum)) : 0,
      color: colorForJenis(label),
    });
  }
  perJenis.sort((a, b) => b.kejadian - a.kejadian);

  const topProvinsi: DibiTopProvinsi[] = provRows
    .map((r) => {
      const name = String(r['Nama Provinsi'] || r['PROVINSI'] || '').trim();
      const keys = yearKeys(r);
      return {
        provinsi: titleJenis(name)
          .replace(/\bNtt\b/i, 'NTT')
          .replace(/\bNtb\b/i, 'NTB')
          .replace(/\bDki\b/i, 'DKI'),
        kejadian: sumYears(r, keys),
      };
    })
    .filter((p) => p.provinsi && p.kejadian > 0)
    .sort((a, b) => b.kejadian - a.kejadian)
    .slice(0, 10);

  let hilang = 0;
  let luka = 0;
  for (const r of Array.from(hilIdx.values())) hilang += sumYears(r, yearKeys(r));
  for (const r of Array.from(lukIdx.values())) luka += sumYears(r, yearKeys(r));

  const total = {
    kejadian: perJenis.reduce((s, j) => s + j.kejadian, 0),
    meninggal: perJenis.reduce((s, j) => s + j.meninggal, 0),
    hilang,
    luka,
    pengungsi: perJenis.reduce((s, j) => s + j.pengungsi, 0),
    rumah_terdampak: perJenis.reduce((s, j) => s + j.rumah_rusak, 0),
  };

  const korbanDist = pctDist(
    perJenis.map((j) => ({ name: j.jenis, value: j.meninggal, color: j.color }))
  );
  const pengungsiDist = pctDist(
    perJenis.map((j) => ({ name: j.jenis, value: j.pengungsi, color: j.color }))
  );

  return {
    perTahun,
    perJenis,
    topProvinsi,
    perBulan: null, // tidak ada di agregat CKAN publik
    korbanDist,
    pengungsiDist,
    total,
    yearRange,
    meninggalFromCkan: Boolean(meninggalRows?.length),
  };
}
