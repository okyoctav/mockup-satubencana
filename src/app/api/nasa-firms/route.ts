import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/lib/upstreamFetch';

export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Key hanya dari env server — jangan hardcode / jangan echo ke client
  const key = process.env.NASA_FIRMS_MAP_KEY || '';
  const days = searchParams.get('days') || '1';
  const source = searchParams.get('source') || 'VIIRS_SNPP_NRT';
  const bbox = searchParams.get('bbox') || '95,-11,141,6';

  if (!key) {
    return NextResponse.json(
      {
        status: 200,
        count: 0,
        fires: [],
        notice: 'NASA_FIRMS_MAP_KEY belum diset di server. Pakai layer raster NASA GIBS bila tersedia.',
      },
      { status: 200, headers: CORS }
    );
  }

  const targetUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${bbox}/${days}`;

  const live = await fetchUpstream(targetUrl, {
    timeoutMs: 12_000,
    maxAttempts: 3,
    headers: { Accept: 'text/csv, application/json, */*' },
  });

  if (live.ok) {
    const csvText = live.text;

    if (csvText.trim().startsWith('Invalid') || csvText.trim().startsWith('Error')) {
      return NextResponse.json(
        {
          status: 200,
          source,
          notice: csvText.trim().slice(0, 200),
          message: 'API Key NASA FIRMS invalid/limit. Fallback layer raster bila ada.',
          count: 0,
          fires: [],
          attempts: live.attempts,
        },
        { status: 200, headers: CORS }
      );
    }

    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) {
      return NextResponse.json(
        { status: 200, count: 0, fires: [], attempts: live.attempts },
        { status: 200, headers: CORS }
      );
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const fires = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const obj: Record<string, string | number> = {};
      headers.forEach((h, idx) => {
        const val = values[idx];
        if (['latitude', 'longitude', 'brightness', 'bright_t31', 'frp'].includes(h)) {
          obj[h] = parseFloat(val) || 0;
        } else {
          obj[h] = val;
        }
      });
      return obj;
    });

    return NextResponse.json(
      {
        status: 200,
        count: fires.length,
        source,
        fires,
        attempts: live.attempts,
      },
      { status: 200, headers: CORS }
    );
  }

  console.warn('[nasa-firms] live gagal:', live.text.slice(0, 120));

  return NextResponse.json(
    {
      status: 200,
      notice: 'Fallback: upstream NASA FIRMS gagal/timeout',
      count: 0,
      fires: [],
      attempts: live.attempts,
    },
    { status: 200, headers: CORS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...CORS,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
