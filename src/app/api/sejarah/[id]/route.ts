import { NextResponse } from 'next/server';
import rawDisasters from '../../../../../public/data/scbencana-code-1788147361819.json';
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const paramId = params.id?.trim();
  const numId = parseInt(paramId, 10);

  const allDisasters = rawDisasters as RawDisaster[];

  // Find by ID or by slug/name match
  const disaster = allDisasters.find((d) => {
    if (!isNaN(numId) && d.ID === numId) return true;
    if (d.Nama_Bencana) {
      const cleanSlug = d.Nama_Bencana.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const targetSlug = paramId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return cleanSlug.includes(targetSlug) || targetSlug.includes(cleanSlug);
    }
    return false;
  });

  if (!disaster) {
    return NextResponse.json(
      {
        status: 'error',
        message: `Data peristiwa sejarah bencana dengan ID '${paramId}' tidak ditemukan.`,
        petunjuk: 'Gunakan GET /api/sejarah untuk melihat seluruh daftar data yang tersedia.',
      },
      {
        status: 404,
        headers: CORS_HEADERS,
      }
    );
  }

  // Find related docs
  const relatedDocs = (blogData as BlogDoc[])
    .filter((b) => {
      if (b.disasterId && b.disasterId.includes(disaster.ID)) return true;
      if (disaster.Nama_Bencana && b.disasterNames) {
        const dName = disaster.Nama_Bencana.toLowerCase();
        return b.disasterNames.some((name) => {
          const n = name.toLowerCase();
          return dName.includes(n) || n.includes(dName);
        });
      }
      return false;
    })
    .map((doc) => ({
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
      url_artikel: `/blog/${doc.id}`,
      bagian_dokumen: doc.sections || [],
    }));

  // Find nearby/related disasters in same province or same disaster type
  const nearbyDisasters = allDisasters
    .filter((d) => d.ID !== disaster.ID && (d.Provinsi === disaster.Provinsi || d.Jenis_Bencana === disaster.Jenis_Bencana))
    .slice(0, 5)
    .map((d) => ({
      id: d.ID,
      nama_bencana: d.Nama_Bencana,
      tahun: d.Tahun,
      jenis_bencana: d.Jenis_Bencana,
      provinsi: d.Provinsi,
      korban_meninggal: d.Meninggal,
      url_api: `/api/sejarah/${d.ID}`,
    }));

  return NextResponse.json(
    {
      status: 'success',
      data: {
        id: disaster.ID,
        nama_bencana: disaster.Nama_Bencana,
        tanggal: disaster.Tanggal || null,
        tahun: disaster.Tahun || null,
        jenis_bencana: disaster.Jenis_Bencana,
        provinsi: disaster.Provinsi,
        lokasi_utama: disaster.Lokasi_Utama,
        koordinat: {
          latitude: disaster.Latitude ?? null,
          longitude: disaster.Longitude ?? null,
          tipe: disaster.Tipe_Koordinat || null,
        },
        parameter_fisik: {
          magnitude: disaster.Magnitude ?? null,
          vei: disaster.VEI ?? null,
          parameter_utama: disaster.Parameter_Utama || null,
        },
        dampak: {
          meninggal: disaster.Meninggal ?? null,
          hilang: disaster.Hilang ?? null,
          luka: disaster.Luka ?? null,
          terdampak_mengungsi: disaster.Terdampak_Mengungsi ?? null,
          rumah_rusak: disaster.Rumah_Rusak ?? null,
          kerugian_rp: disaster.Kerugian_Rp || null,
        },
        deskripsi: disaster.Deskripsi || null,
        tingkat_akurasi: disaster.Confidence || null,
        sumber_data: disaster.Sumber || null,
        url_sumber: disaster.URL_Sumber || null,
        dokumen_terkait: relatedDocs,
        kejadian_terkait: nearbyDisasters,
      },
    },
    {
      status: 200,
      headers: CORS_HEADERS,
    }
  );
}
