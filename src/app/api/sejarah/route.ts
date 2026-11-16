import { NextResponse } from 'next/server';
import rawDisasters from '../../../../public/data/scbencana-code-1788147361819.json';
import blogData from '@/data/blog.json';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

interface RawDisaster {
  ID: number;
  Tanggal?: string;
  Tahun?: number;
  Nama_Bencana?: string;
  Jenis_Bencana?: string;
  Provinsi?: string;
  Lokasi_Utama?: string;
  Latitude?: number | null;
  Longitude?: number | null;
  Tipe_Koordinat?: string | null;
  Parameter_Utama?: string | null;
  VEI?: number | null;
  Magnitude?: number | null;
  Meninggal?: number | null;
  Hilang?: number | null;
  Luka?: number | null;
  Terdampak_Mengungsi?: number | null;
  Rumah_Rusak?: number | null;
  Kerugian_Rp?: string | number | null;
  Deskripsi?: string | null;
  Confidence?: string | null;
  Sumber?: string | null;
  URL_Sumber?: string | null;
}

interface BlogDoc {
  id: string;
  disasterId?: number[];
  disasterNames?: string[];
  category: string;
  tagColor?: string;
  title: string;
  excerpt: string;
  author: string;
  authorRole?: string;
  date: string;
  readTime: string;
  image?: string;
  externalUrl?: string;
  isBappenas?: boolean;
  sections?: Array<{ id: string; title: string; content: string }>;
}

function extractDownloadLink(doc: BlogDoc): string | null {
  if (doc.externalUrl) return doc.externalUrl;
  if (!doc.sections) return null;
  for (const s of doc.sections) {
    const match = s.content?.match(/https:\/\/(?:drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+|drive\.google\.com\/open\?id=[a-zA-Z0-9_-]+)/);
    if (match) return match[0];
  }
  return null;
}

function getRelatedDocs(disaster: RawDisaster) {
  const docs = (blogData as BlogDoc[]).filter((b) => {
    if (b.disasterId && b.disasterId.includes(disaster.ID)) return true;
    if (disaster.Nama_Bencana && b.disasterNames) {
      const dName = disaster.Nama_Bencana.toLowerCase();
      return b.disasterNames.some((name) => {
        const n = name.toLowerCase();
        return dName.includes(n) || n.includes(dName);
      });
    }
    return false;
  });

  return docs.map((doc) => ({
    id: doc.id,
    judul: doc.title,
    kategori: doc.category,
    ringkasan: doc.excerpt,
    penulis: doc.author,
    peran_penulis: doc.authorRole || null,
    tanggal: doc.date,
    waktu_baca: doc.readTime,
    is_dokumen_bappenas: Boolean(doc.isBappenas),
    link_unduh: extractDownloadLink(doc),
    total_bagian: doc.sections?.length || 0,
    url_artikel: `/blog/${doc.id}`,
  }));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const q = searchParams.get('q')?.trim() || searchParams.get('search')?.trim() || '';
  const idParam = searchParams.get('id')?.trim();
  const tahunParam = searchParams.get('year') || searchParams.get('tahun');
  const fromParam = searchParams.get('from') || searchParams.get('start_year');
  const toParam = searchParams.get('to') || searchParams.get('end_year');
  const jenisParam = searchParams.get('jenis')?.toLowerCase().trim();
  const provinsiParam = searchParams.get('provinsi')?.toLowerCase().trim();
  const hasDocsParam = searchParams.get('has_docs')?.toLowerCase();
  const bappenasOnly = searchParams.get('is_bappenas') === 'true' || searchParams.get('bappenas') === 'true';
  const format = searchParams.get('format')?.toLowerCase() || 'json';
  const sort = searchParams.get('sort')?.toLowerCase() || 'year_desc';
  const statsRequested = searchParams.get('stats') === 'true';

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const rawLimit = searchParams.get('limit');
  const isNoLimit = rawLimit === 'all' || rawLimit === '0' || format === 'geojson';
  const limit = isNoLimit ? 1000 : Math.max(1, Math.min(100, parseInt(rawLimit || '20', 10) || 20));

  let items = (rawDisasters as RawDisaster[]).map((d) => ({
    ...d,
    dokumen_terkait: getRelatedDocs(d),
  }));

  // Filter: Single ID or list of IDs
  if (idParam) {
    const ids = idParam.split(',').map((x) => parseInt(x.trim(), 10)).filter((x) => !isNaN(x));
    if (ids.length > 0) {
      items = items.filter((d) => ids.includes(d.ID));
    }
  }

  // Filter: Search Keyword (q)
  if (q) {
    const kw = q.toLowerCase();
    items = items.filter((d) => {
      const matchName = d.Nama_Bencana?.toLowerCase().includes(kw);
      const matchLoc = d.Lokasi_Utama?.toLowerCase().includes(kw);
      const matchProv = d.Provinsi?.toLowerCase().includes(kw);
      const matchType = d.Jenis_Bencana?.toLowerCase().includes(kw);
      const matchDesc = d.Deskripsi?.toLowerCase().includes(kw);
      const matchSource = d.Sumber?.toLowerCase().includes(kw);
      const matchDocs = d.dokumen_terkait.some((doc) => doc.judul.toLowerCase().includes(kw) || doc.ringkasan.toLowerCase().includes(kw));
      return matchName || matchLoc || matchProv || matchType || matchDesc || matchSource || matchDocs;
    });
  }

  // Filter: Tahun tepat
  if (tahunParam) {
    const y = parseInt(tahunParam, 10);
    if (!isNaN(y)) {
      items = items.filter((d) => d.Tahun === y);
    }
  }

  // Filter: Rentang Tahun
  if (fromParam) {
    const fromY = parseInt(fromParam, 10);
    if (!isNaN(fromY)) {
      items = items.filter((d) => d.Tahun != null && d.Tahun >= fromY);
    }
  }
  if (toParam) {
    const toY = parseInt(toParam, 10);
    if (!isNaN(toY)) {
      items = items.filter((d) => d.Tahun != null && d.Tahun <= toY);
    }
  }

  // Filter: Jenis Bencana
  if (jenisParam) {
    items = items.filter((d) => d.Jenis_Bencana?.toLowerCase().includes(jenisParam));
  }

  // Filter: Provinsi
  if (provinsiParam) {
    items = items.filter((d) => d.Provinsi?.toLowerCase().includes(provinsiParam));
  }

  // Filter: Memiliki Dokumen
  if (hasDocsParam === 'true' || hasDocsParam === '1') {
    items = items.filter((d) => d.dokumen_terkait.length > 0);
  }

  // Filter: Khusus Dokumen Bappenas
  if (bappenasOnly) {
    items = items.filter((d) => d.dokumen_terkait.some((doc) => doc.is_dokumen_bappenas));
  }

  // Sorting
  items.sort((a, b) => {
    if (sort === 'year_asc') return (a.Tahun || 0) - (b.Tahun || 0);
    if (sort === 'casualties_desc') return (b.Meninggal || 0) - (a.Meninggal || 0);
    if (sort === 'casualties_asc') return (a.Meninggal || 0) - (b.Meninggal || 0);
    if (sort === 'name_asc') return (a.Nama_Bencana || '').localeCompare(b.Nama_Bencana || '');
    // Default: year_desc
    return (b.Tahun || 0) - (a.Tahun || 0);
  });

  const total = items.length;
  const totalPages = isNoLimit ? 1 : Math.max(1, Math.ceil(total / limit));
  const paginatedItems = isNoLimit ? items : items.slice((page - 1) * limit, page * limit);

  // Formatting output
  const formattedData = paginatedItems.map((d) => ({
    id: d.ID,
    nama_bencana: d.Nama_Bencana,
    tanggal: d.Tanggal || null,
    tahun: d.Tahun || null,
    jenis_bencana: d.Jenis_Bencana,
    provinsi: d.Provinsi,
    lokasi_utama: d.Lokasi_Utama,
    koordinat: {
      latitude: d.Latitude ?? null,
      longitude: d.Longitude ?? null,
      tipe: d.Tipe_Koordinat || null,
    },
    parameter_fisik: {
      magnitude: d.Magnitude ?? null,
      vei: d.VEI ?? null,
      parameter_utama: d.Parameter_Utama || null,
    },
    dampak: {
      meninggal: d.Meninggal ?? null,
      hilang: d.Hilang ?? null,
      luka: d.Luka ?? null,
      terdampak_mengungsi: d.Terdampak_Mengungsi ?? null,
      rumah_rusak: d.Rumah_Rusak ?? null,
      kerugian_rp: d.Kerugian_Rp || null,
    },
    deskripsi: d.Deskripsi || null,
    tingkat_akurasi: d.Confidence || null,
    sumber_data: d.Sumber || null,
    url_sumber: d.URL_Sumber || null,
    jumlah_dokumen: d.dokumen_terkait.length,
    dokumen_terkait: d.dokumen_terkait,
  }));

  // GeoJSON output support
  if (format === 'geojson') {
    const geojson = {
      type: 'FeatureCollection',
      features: formattedData
        .filter((d) => d.koordinat.latitude != null && d.koordinat.longitude != null)
        .map((d) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [d.koordinat.longitude, d.koordinat.latitude],
          },
          properties: {
            id: d.id,
            nama_bencana: d.nama_bencana,
            tahun: d.tahun,
            tanggal: d.tanggal,
            jenis_bencana: d.jenis_bencana,
            provinsi: d.provinsi,
            lokasi_utama: d.lokasi_utama,
            magnitude: d.parameter_fisik.magnitude,
            vei: d.parameter_fisik.vei,
            meninggal: d.dampak.meninggal,
            terdampak_mengungsi: d.dampak.terdampak_mengungsi,
            deskripsi: d.deskripsi,
            sumber: d.sumber_data,
            url_sumber: d.url_sumber,
            jumlah_dokumen: d.jumlah_dokumen,
            dokumen_terkait: d.dokumen_terkait,
          },
        })),
      meta: {
        total_fitur: formattedData.filter((d) => d.koordinat.latitude != null).length,
        sistem_koordinat: 'EPSG:4326 (WGS 84)',
        deskripsi: 'Data Spasial Sejarah Kebencanaan Indonesia - Satu Bencana',
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(geojson, { status: 200, headers: CORS_HEADERS });
  }

  // Statistical summary if requested or root overview
  let statistics = undefined;
  if (statsRequested || q === 'stats') {
    const perJenis: Record<string, number> = {};
    const perProv: Record<string, number> = {};
    let totalMeninggal = 0;
    let totalMengungsi = 0;

    items.forEach((d) => {
      const j = d.Jenis_Bencana || 'Lainnya';
      perJenis[j] = (perJenis[j] || 0) + 1;
      const p = d.Provinsi || 'Lainnya';
      perProv[p] = (perProv[p] || 0) + 1;
      if (typeof d.Meninggal === 'number') totalMeninggal += d.Meninggal;
      if (typeof d.Terdampak_Mengungsi === 'number') totalMengungsi += d.Terdampak_Mengungsi;
    });

    statistics = {
      total_kejadian: total,
      total_korban_jiwa: totalMeninggal,
      total_mengungsi: totalMengungsi,
      distribusi_jenis: perJenis,
      distribusi_provinsi: perProv,
    };
  }

  const baseUrl = origin || 'https://satudatabencana.bappenas.go.id';

  return NextResponse.json(
    {
      status: 'success',
      meta: {
        total,
        page,
        limit: isNoLimit ? total : limit,
        totalPages,
        timestamp: new Date().toISOString(),
        dokumentasi: {
          deskripsi: 'API Terbuka Sejarah Kebencanaan Indonesia & Arsip Dokumen Bappenas/ANRI/PVMBG',
          cors_enabled: true,
          format_tersedia: ['json', 'geojson'],
          parameter_query: {
            q: 'Pencarian kata kunci (nama, lokasi, provinsi, dokumen)',
            id: 'Filter ID spesifik (bisa jamak: ?id=10,12)',
            year: 'Filter tahun kejadian (contoh: ?year=2004)',
            from: 'Tahun awal rentang (contoh: ?from=1900)',
            to: 'Tahun akhir rentang (contoh: ?to=2024)',
            jenis: 'Filter jenis bencana (contoh: ?jenis=tsunami)',
            provinsi: 'Filter provinsi (contoh: ?provinsi=aceh)',
            has_docs: 'Hanya yang memiliki dokumen riset/arsip (?has_docs=true)',
            is_bappenas: 'Hanya dokumen masterplan Bappenas (?is_bappenas=true)',
            format: 'Format output: json (default) atau geojson',
            sort: 'Urutan: year_desc (default), year_asc, casualties_desc, name_asc',
            stats: 'Tampilkan statistik agregat (?stats=true)',
            page: 'Nomor halaman (default: 1)',
            limit: 'Jumlah data per halaman (default: 20, atau limit=all)',
          },
          contoh_penggunaan: [
            `${baseUrl}/api/sejarah`,
            `${baseUrl}/api/sejarah?q=aceh`,
            `${baseUrl}/api/sejarah?year=2004`,
            `${baseUrl}/api/sejarah?from=2000&to=2024&jenis=gempa`,
            `${baseUrl}/api/sejarah?is_bappenas=true`,
            `${baseUrl}/api/sejarah?format=geojson`,
            `${baseUrl}/api/sejarah/10`,
            `${baseUrl}/api/sejarah/dokumen`,
          ],
        },
      },
      ...(statistics ? { statistik: statistics } : {}),
      data: formattedData,
    },
    {
      status: 200,
      headers: CORS_HEADERS,
    }
  );
}
