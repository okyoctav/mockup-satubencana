import { NextResponse } from 'next/server';
import {
  fetchCraterNotices,
  fetchCraterReports,
  fetchCraterSeismicRecent,
  fetchCraterVona,
} from '@/lib/craterVolcanoes';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

type Ctx = { params: Promise<{ slug: string }> };

/** Detail gunung: VONA terbaru, notice, report, seismic (untuk popup + animasi). */
export async function GET(_request: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'slug wajib' }, { status: 400, headers: CORS });
  }

  try {
    const [vonaRows, notices, reports, seismic] = await Promise.all([
      fetchCraterVona(slug),
      fetchCraterNotices(slug),
      fetchCraterReports(slug, 7),
      fetchCraterSeismicRecent(slug, 14),
    ]);

    return NextResponse.json(
      {
        ok: true,
        source: 'crater.id',
        slug,
        vona: vonaRows[0] || null,
        vonaHistory: vonaRows.slice(0, 10),
        notice: notices[0] || null,
        notices: notices.slice(0, 20),
        report: reports[0] || null,
        reports,
        seismic,
      },
      { status: 200, headers: CORS }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        slug,
        error: err instanceof Error ? err.message : 'detail gagal',
      },
      { status: 502, headers: CORS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...CORS,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
