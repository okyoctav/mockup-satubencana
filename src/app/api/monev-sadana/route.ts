import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fetchUpstreamJson } from '@/lib/upstreamFetch';

export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

/** Override via MONEV_SADANA_URL bila endpoint Bappenas berubah. */
const DEFAULT_URL = 'https://www.sadana.cloud/api/sandingan/monev/geojson';

export async function GET() {
  const targetUrl = process.env.MONEV_SADANA_URL || DEFAULT_URL;
  const localFilePath = path.join(process.cwd(), 'public', 'data', 'monev_sadana.geojson');

  const live = await fetchUpstreamJson(targetUrl, {
    timeoutMs: 8_000,
    maxAttempts: 3,
    headers: { Accept: 'application/geo+json, application/json, */*' },
  });

  if (live.data != null) {
    try {
      const dstDir = path.join(process.cwd(), 'public', 'data');
      if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
      fs.writeFileSync(localFilePath, JSON.stringify(live.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[monev-sadana] gagal simpan cache:', err);
    }

    return NextResponse.json(live.data, {
      status: 200,
      headers: {
        ...CORS,
        'X-Cache': 'LIVE',
        'X-Data-Source': 'sadana.cloud',
        'X-Upstream-Attempts': String(live.meta.attempts),
      },
    });
  }

  console.warn('[monev-sadana] live gagal, fallback lokal:', live.error);

  try {
    if (fs.existsSync(localFilePath)) {
      const jsonData = JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
      return NextResponse.json(jsonData, {
        status: 200,
        headers: {
          ...CORS,
          'X-Cache': 'FALLBACK_LOCAL',
          'X-Data-Source': 'monev_sadana.geojson',
          'X-Upstream-Error': String(live.error || 'upstream gagal').slice(0, 120),
        },
      });
    }
  } catch (err) {
    console.error('[monev-sadana] gagal baca fallback:', err);
  }

  return NextResponse.json(
    { type: 'FeatureCollection', features: [], error: 'Gagal mengambil data Monev SADANA' },
    { status: 500, headers: CORS },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
