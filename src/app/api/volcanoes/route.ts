import { NextResponse } from 'next/server';
import { fetchCraterVolcanoes, fetchVonaForVolcanoes } from '@/lib/craterVolcanoes';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

/** Status gunung api: crater.id + fallback snapshot lokal. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const withVona = searchParams.get('vona') === '1' || searchParams.get('vona') === 'true';

  try {
    const payload = await fetchCraterVolcanoes();
    let vona: Record<string, unknown> | undefined;
    if (withVona && payload.volcanoes.length) {
      vona = await fetchVonaForVolcanoes(payload.volcanoes, 8);
    }

    return NextResponse.json(
      {
        ...payload,
        ...(vona ? { vona } : {}),
      },
      { status: payload.ok ? 200 : 503, headers: CORS }
    );
  } catch (err) {
    console.error('[api/volcanoes]', err);
    return NextResponse.json(
      {
        ok: false,
        source: 'error',
        volcanoes: [],
        count: 0,
        note: err instanceof Error ? err.message : 'Gagal memuat volcanoes',
      },
      { status: 500, headers: CORS }
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
