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

/**
 * SAKATA: set MONEV_SAKATA_URL ke endpoint distinct bila tersedia.
 * Default sementara sama dengan SADANA (upstream publik saat ini 404 → fallback lokal).
 */
const DEFAULT_URL = 'https://www.sadana.cloud/api/sandingan/monev/geojson';

export async function GET() {
  const targetUrl = process.env.MONEV_SAKATA_URL || process.env.MONEV_SADANA_URL || DEFAULT_URL;
  const localFilePath = path.join(process.cwd(), 'public', 'data', 'monev_sakata.geojson');

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
      console.error('[monev-sakata] gagal simpan cache:', err);
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

  console.warn('[monev-sakata] live gagal, fallback lokal:', live.error);

  try {
    if (fs.existsSync(localFilePath)) {
      const jsonData = JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
      return NextResponse.json(jsonData, {
        status: 200,
        headers: {
          ...CORS,
          'X-Cache': 'FALLBACK_LOCAL',
          'X-Data-Source': 'monev_sakata.geojson',
          'X-Upstream-Error': String(live.error || 'upstream gagal').slice(0, 120),
        },
      });
    }
  } catch (err) {
    console.error('[monev-sakata] gagal baca fallback:', err);
  }

  return NextResponse.json(
    { type: 'FeatureCollection', features: [], error: 'Gagal mengambil data Monev SAKATA' },
    { status: 500, headers: CORS },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
