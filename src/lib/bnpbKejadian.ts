import type { Kejadian } from '@/types/kejadian';
import { resolveProvinsi } from '@/lib/provinsiLookup';

const BNPB_LAYER =
  'https://gis.bnpb.go.id/server/rest/services/Kejadian_Bencana_Mingguan/FeatureServer/25';

export const BNPB_KEJADIAN_URL = BNPB_LAYER;

/** Field list + detail. Teks panjang ikut — pagination kecil. */
const OUT_FIELDS = [
  'ESRI_OID',
  'id',
  'id_kab_sdi',
  'kabupaten',
  'kategori_bencana',
  'tgl',
  'bulan',
  'tahun',
  'minggu',
  'jumlah_kejadian',
  'meninggal',
  'hilang',
  'luka_sakit',
  'menderita',
  'mengungsi',
  'menderita_mengungsi',
  'rumah_rusak_berat',
  'rumah_rusak_sedang',
  'rumah_rusak_ringan',
  'rumah_terendam',
  'rumah_rusak',
  'lahan_hektar',
  'estimasi_kerugian_rumah',
  'pendidikan_rusak',
  'rumah_ibadat_rusak',
  'fasyankes_rusak',
  'fasum_rusak',
  'kantor_rusak',
  'jembatan_rusak',
  'kronologis',
  'penyebab',
  'deskripsi',
  'kondisi_mutakhir',
  'upaya_',
].join(',');

type BnpbAttrs = {
  id?: string;
  ESRI_OID?: number;
  objectid?: number;
  id_kab_sdi?: string;
  kabupaten?: string;
  kategori_bencana?: string;
  tgl?: number;
  bulan?: number;
  tahun?: number;
  minggu?: number;
  jumlah_kejadian?: number;
  meninggal?: number;
  hilang?: number;
  luka_sakit?: number;
  menderita?: number;
  mengungsi?: number;
  menderita_mengungsi?: number;
  rumah_rusak_berat?: number;
  rumah_rusak_sedang?: number;
  rumah_rusak_ringan?: number;
  rumah_terendam?: number;
  rumah_rusak?: number;
  lahan_hektar?: number;
  estimasi_kerugian_rumah?: number;
  pendidikan_rusak?: number;
  rumah_ibadat_rusak?: number;
  fasyankes_rusak?: number;
  fasum_rusak?: number;
  kantor_rusak?: number;
  jembatan_rusak?: number;
  kronologis?: string;
  penyebab?: string;
  deskripsi?: string;
  kondisi_mutakhir?: string;
  upaya_?: string;
};

type Ring = number[][];

function polygonCentroid(rings: Ring[]): { lat: number; lng: number } | null {
  const ring = rings?.[0];
  if (!ring || ring.length < 3) return null;
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    area += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  area *= 0.5;
  if (!area) {
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    return {
      lng: xs.reduce((a, b) => a + b, 0) / xs.length,
      lat: ys.reduce((a, b) => a + b, 0) / ys.length,
    };
  }
  return { lng: cx / (6 * area), lat: cy / (6 * area) };
}

export function mapJenisBnpb(raw?: string): string {
  const s = (raw || '').toLowerCase().trim();
  if (!s) return 'lainnya';
  if (s.includes('banjir')) return 'banjir';
  if (s.includes('longsor') || s.includes('tanah longsor')) return 'longsor';
  if (s.includes('gempa')) return 'gempa';
  if (s.includes('tsunami') || s.includes('abrasi') || s.includes('gelombang')) return 'tsunami';
  if (s.includes('erupsi') || s.includes('gunung')) return 'erupsi';
  if (s.includes('kekeringan')) return 'kekeringan';
  if (s.includes('karhutla') || s.includes('kebakaran') || s.includes('hutan')) return 'kebakaran';
  if (s.includes('cuaca') || s.includes('angin') || s.includes('puting')) return 'angin puting beliung';
  return 'lainnya';
}

function mapStatus(kondisi?: string): string {
  const s = (kondisi || '').toLowerCase();
  if (!s) return 'saat';
  if (
    s.includes('surut') ||
    s.includes('selesai') ||
    s.includes('normal') ||
    s.includes('sudah ditangani') ||
    s.includes('pembersihan')
  ) {
    return 'pasca';
  }
  if (s.includes('ancaman') || s.includes('siaga') || s.includes('potensi')) return 'pra';
  return 'saat';
}

function mapLevel(a: BnpbAttrs): string {
  const korban = (a.meninggal || 0) + (a.hilang || 0);
  const rusakBerat = a.rumah_rusak_berat || 0;
  const terdampak = (a.menderita_mengungsi || 0) + (a.mengungsi || 0) + (a.rumah_terendam || 0);
  if (korban > 0 || rusakBerat > 0) return 'tinggi';
  if (terdampak >= 50 || (a.rumah_rusak || 0) >= 10) return 'sedang';
  return 'rendah';
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function mapTanggal(a: BnpbAttrs): string {
  const y = a.tahun;
  const m = a.bulan;
  const d = a.tgl;
  if (y && m && d) return `${y}-${pad2(m)}-${pad2(d)}`;
  return new Date().toISOString().slice(0, 10);
}

function stableNumericId(sourceId: string, oid?: number): number {
  if (typeof oid === 'number' && oid > 0) return oid;
  let h = 0;
  for (let i = 0; i < sourceId.length; i++) {
    h = (h * 31 + sourceId.charCodeAt(i)) >>> 0;
  }
  return h || 1;
}

function cleanText(s?: string | null): string | undefined {
  const t = (s || '').replace(/\r/g, '').trim();
  return t || undefined;
}

export function featureToKejadian(feature: {
  attributes?: BnpbAttrs;
  geometry?: { rings?: Ring[]; x?: number; y?: number };
  centroid?: { x?: number; y?: number };
}): Kejadian | null {
  const a = feature.attributes || {};
  const g = feature.geometry || {};
  let lat = 0;
  let lng = 0;

  if (typeof feature.centroid?.x === 'number' && typeof feature.centroid?.y === 'number') {
    lng = feature.centroid.x;
    lat = feature.centroid.y;
  } else if (typeof g.x === 'number' && typeof g.y === 'number') {
    lng = g.x;
    lat = g.y;
  } else if (g.rings?.length) {
    const c = polygonCentroid(g.rings);
    if (!c) return null;
    lat = c.lat;
    lng = c.lng;
  } else {
    return null;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const kab = (a.kabupaten || 'Lokasi tidak diketahui').trim();
  const jenisLabel = (a.kategori_bencana || 'Bencana').trim();
  const sourceId = a.id || String(a.ESRI_OID || a.objectid || '');
  const meninggal = a.meninggal || 0;
  const hilang = a.hilang || 0;
  const korban = meninggal + hilang;
  const mengungsi = a.mengungsi || 0;
  const menderita = a.menderita || 0;
  const pengungsi = mengungsi || a.menderita_mengungsi || menderita || 0;
  const rumah =
    (a.rumah_rusak || 0) +
    (a.rumah_terendam || 0) +
    (a.rumah_rusak_berat || 0) +
    (a.rumah_rusak_sedang || 0) +
    (a.rumah_rusak_ringan || 0);

  const resolved = resolveProvinsi({ idKabSdi: a.id_kab_sdi, kabupaten: kab });

  return {
    id: stableNumericId(sourceId, a.ESRI_OID ?? a.objectid),
    nama: `${jenisLabel} · ${kab}`,
    provinsi: resolved.provinsi,
    kabupaten: kab,
    lat,
    lng,
    jenis: mapJenisBnpb(jenisLabel),
    jenisLabel,
    tanggal: mapTanggal(a),
    korban_jiwa: korban,
    pengungsi,
    rumah_terdampak: rumah || undefined,
    status: mapStatus(a.kondisi_mutakhir),
    level: mapLevel(a),
    source: 'bnpb_mingguan',
    sourceId,
    provinsiDilengkapi: resolved.method !== 'none',
    minggu: a.minggu,
    jumlah_kejadian: a.jumlah_kejadian,
    meninggal,
    hilang,
    luka_sakit: a.luka_sakit || 0,
    menderita,
    mengungsi_detail: mengungsi,
    rumah_rusak_berat: a.rumah_rusak_berat || 0,
    rumah_rusak_sedang: a.rumah_rusak_sedang || 0,
    rumah_rusak_ringan: a.rumah_rusak_ringan || 0,
    rumah_terendam: a.rumah_terendam || 0,
    rumah_rusak: a.rumah_rusak || 0,
    lahan_hektar: a.lahan_hektar || 0,
    estimasi_kerugian_rumah: a.estimasi_kerugian_rumah || 0,
    pendidikan_rusak: a.pendidikan_rusak || 0,
    rumah_ibadat_rusak: a.rumah_ibadat_rusak || 0,
    fasyankes_rusak: a.fasyankes_rusak || 0,
    fasum_rusak: a.fasum_rusak || 0,
    kantor_rusak: a.kantor_rusak || 0,
    jembatan_rusak: a.jembatan_rusak || 0,
    kronologis: cleanText(a.kronologis),
    penyebab: cleanText(a.penyebab),
    deskripsi: cleanText(a.deskripsi),
    kondisi_mutakhir: cleanText(a.kondisi_mutakhir),
    upaya: cleanText(a.upaya_),
    id_kab_sdi: a.id_kab_sdi,
  };
}

const BNPB_TIMEOUT_MS = 12_000;
const BNPB_MAX_ATTEMPTS = 3;

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Fetch JSON dengan timeout + retry (untuk staging/prod; ArcGIS BNPB sering 5xx/timeout). */
async function fetchBnpbJson(url: string): Promise<unknown> {
  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= BNPB_MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), BNPB_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: ctrl.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        // ArcGIS Web Adaptor sering mengembalikan HTML saat 500
        const hint = text.trimStart().startsWith('<') ? ' (HTML error dari server GIS)' : '';
        throw new Error(`BNPB HTTP ${res.status}${hint}`);
      }
      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new Error('BNPB response bukan JSON');
      }
    } catch (e) {
      const err =
        e instanceof Error
          ? e.name === 'AbortError'
            ? new Error(`BNPB timeout ${BNPB_TIMEOUT_MS}ms`)
            : e
          : new Error('BNPB fetch gagal');
      lastErr = err;
      if (attempt < BNPB_MAX_ATTEMPTS) {
        await sleep(400 * attempt * attempt); // 400, 1600, …
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error('BNPB fetch gagal');
}

export async function fetchBnpbKejadianMingguan(): Promise<{
  items: Kejadian[];
  rawCount: number;
  attemptsMeta?: { pageSize: number; timeoutMs: number; maxAttempts: number };
}> {
  const pageSize = 25;
  let offset = 0;
  const items: Kejadian[] = [];
  let rawCount = 0;

  for (;;) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: OUT_FIELDS,
      returnGeometry: 'true',
      returnCentroid: 'true',
      outSR: '4326',
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      f: 'json',
    });
    const url = `${BNPB_LAYER}/query?${params.toString()}`;

    const data = (await fetchBnpbJson(url)) as {
      features?: Array<{
        attributes?: BnpbAttrs;
        geometry?: { rings?: Ring[] };
        centroid?: { x?: number; y?: number };
      }>;
      exceededTransferLimit?: boolean;
      error?: { message?: string; details?: string[] };
    };
    if (data.error) {
      throw new Error(
        data.error.message ||
          (data.error.details && data.error.details[0]) ||
          'BNPB query error'
      );
    }

    const feats = data.features || [];
    rawCount += feats.length;
    for (const f of feats) {
      const k = featureToKejadian(f);
      if (k) items.push(k);
    }

    if (!data.exceededTransferLimit || feats.length === 0) break;
    offset += pageSize;
    if (offset > 5000) break;
  }

  items.sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0));
  return {
    items,
    rawCount,
    attemptsMeta: {
      pageSize,
      timeoutMs: BNPB_TIMEOUT_MS,
      maxAttempts: BNPB_MAX_ATTEMPTS,
    },
  };
}
