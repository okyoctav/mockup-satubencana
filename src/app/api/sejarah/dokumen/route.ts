import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get('q')?.toLowerCase().trim() || searchParams.get('search')?.toLowerCase().trim() || '';
  const category = searchParams.get('category')?.toLowerCase().trim();
  const bappenasOnly = searchParams.get('is_bappenas') === 'true' || searchParams.get('bappenas') === 'true';
  const disasterIdParam = searchParams.get('disaster_id');
  const fullSections = searchParams.get('full') === 'true';

  let docs = blogData as BlogDoc[];

  if (bappenasOnly) {
    docs = docs.filter((d) => Boolean(d.isBappenas));
  }

  if (category) {
    docs = docs.filter((d) => d.category.toLowerCase().includes(category));
  }

  if (disasterIdParam) {
    const dId = parseInt(disasterIdParam, 10);
    if (!isNaN(dId)) {
      docs = docs.filter((d) => d.disasterId && d.disasterId.includes(dId));
    }
  }

  if (q) {
    docs = docs.filter((d) => {
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchExcerpt = d.excerpt.toLowerCase().includes(q);
      const matchAuthor = d.author.toLowerCase().includes(q);
      const matchNames = d.disasterNames?.some((n) => n.toLowerCase().includes(q));
      const matchSections = d.sections?.some((s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
      return matchTitle || matchExcerpt || matchAuthor || matchNames || matchSections;
    });
  }

  const formattedDocs = docs.map((d) => ({
    id: d.id,
    judul: d.title,
    kategori: d.category,
    ringkasan: d.excerpt,
    penulis: d.author,
    peran_penulis: d.authorRole || null,
    tanggal: d.date,
    waktu_baca: d.readTime,
    gambar: d.image || null,
    is_dokumen_bappenas: Boolean(d.isBappenas),
    link_unduh_pdf: extractDownloadLink(d),
    terkait_id_bencana: d.disasterId || [],
    terkait_nama_bencana: d.disasterNames || [],
    url_artikel_web: `/blog/${d.id}`,
    ...(fullSections ? { bagian_dokumen: d.sections || [] } : { total_bagian: d.sections?.length || 0 }),
  }));

  return NextResponse.json(
    {
      status: 'success',
      total: formattedDocs.length,
      timestamp: new Date().toISOString(),
      data: formattedDocs,
    },
    {
      status: 200,
      headers: CORS_HEADERS,
    }
  );
}
