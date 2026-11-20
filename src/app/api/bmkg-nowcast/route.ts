import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/lib/upstreamFetch';
import {
  type BmkgNowcastAlert,
  type BmkgNowcastPayload,
  filterAlertsByWilayah,
  dedupeNowcastAlerts,
  isAlertActive,
  parseCapAlert,
  parseNowcastRss,
  type RssNowcastItem,
} from '@/lib/bmkgNowcast';

export const dynamic = 'force-dynamic';

const RSS_URL = 'https://www.bmkg.go.id/alerts/nowcast/id/rss.xml';
const CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_CAP_FETCH = 28;
const CAP_CONCURRENCY = 5;

const CORS = {
  'Access-Control-Allow-Origin': '*',
};

type CacheEntry = {
  payload: BmkgNowcastPayload;
  timestamp: number;
};

let memoryCache: CacheEntry | null = null;

const XML_HEADERS = {
  Accept: 'application/xml, text/xml, */*',
  'User-Agent': 'SatuBencana-MDB/1.0 (+server-proxy)',
};

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => run());
  await Promise.all(runners);
  return results;
}

async function fetchCapAlert(item: RssNowcastItem): Promise<BmkgNowcastAlert | null> {
  const live = await fetchUpstream(item.link, {
    timeoutMs: 10_000,
    maxAttempts: 2,
    headers: XML_HEADERS,
  });
  if (!live.ok || !live.text) return null;
  try {
    return parseCapAlert(live.text, item);
  } catch (err) {
    console.warn('[bmkg-nowcast] parse CAP gagal:', item.link, err);
    return null;
  }
}

async function buildPayload(): Promise<{
  payload: BmkgNowcastPayload;
  attempts: number;
  error?: string;
}> {
  const rss = await fetchUpstream(RSS_URL, {
    timeoutMs: 12_000,
    maxAttempts: 3,
    headers: XML_HEADERS,
  });

  if (!rss.ok || !rss.text) {
    return {
      payload: {
        ok: false,
        source: 'bmkg-nowcast',
        updatedAt: new Date().toISOString(),
        count: 0,
        alerts: [],
        note: rss.text || 'RSS nowcast tidak tersedia',
      },
      attempts: rss.attempts,
      error: rss.text || `HTTP ${rss.status}`,
    };
  }

  const items = parseNowcastRss(rss.text).slice(0, MAX_CAP_FETCH);
  const parsed = await mapPool(items, CAP_CONCURRENCY, (item) => fetchCapAlert(item));
  const alerts = dedupeNowcastAlerts(
    parsed.filter((a): a is BmkgNowcastAlert => !!a).filter((a) => isAlertActive(a)),
  );

  const withPoly = alerts.filter((a) => a.polygonCount > 0).length;

  return {
    payload: {
      ok: true,
      source: 'bmkg-nowcast',
      updatedAt: new Date().toISOString(),
      count: alerts.length,
      alerts,
      note:
        withPoly < alerts.length
          ? `${withPoly}/${alerts.length} alert punya polygon`
          : undefined,
    },
    attempts: rss.attempts,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provinsi = searchParams.get('provinsi') || '';
  const kabupaten = searchParams.get('kabupaten') || '';

  const now = Date.now();
  const fresh = memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS;

  if (fresh && memoryCache) {
    const alerts = filterAlertsByWilayah(memoryCache.payload.alerts, {
      provinsiKey: provinsi && provinsi !== 'all' ? provinsi : null,
      kabKey: kabupaten || null,
    });
    return NextResponse.json(
      { ...memoryCache.payload, count: alerts.length, alerts },
      {
        status: 200,
        headers: {
          ...CORS,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Cache': 'CACHE',
          'X-Data-Source': 'bmkg-nowcast (memory)',
        },
      },
    );
  }

  const built = await buildPayload();

  if (built.payload.ok) {
    memoryCache = { payload: built.payload, timestamp: now };
    const alerts = filterAlertsByWilayah(built.payload.alerts, {
      provinsiKey: provinsi && provinsi !== 'all' ? provinsi : null,
      kabKey: kabupaten || null,
    });
    return NextResponse.json(
      { ...built.payload, count: alerts.length, alerts },
      {
        status: 200,
        headers: {
          ...CORS,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Cache': 'LIVE',
          'X-Data-Source': 'www.bmkg.go.id/alerts/nowcast',
          'X-Upstream-Attempts': String(built.attempts),
        },
      },
    );
  }

  if (memoryCache) {
    const alerts = filterAlertsByWilayah(memoryCache.payload.alerts, {
      provinsiKey: provinsi && provinsi !== 'all' ? provinsi : null,
      kabKey: kabupaten || null,
    });
    return NextResponse.json(
      {
        ...memoryCache.payload,
        count: alerts.length,
        alerts,
        note: built.error || memoryCache.payload.note,
      },
      {
        status: 200,
        headers: {
          ...CORS,
          'X-Cache': 'FALLBACK_STALE',
          'X-Data-Source': 'memory-stale',
          'X-Upstream-Error': String(built.error || '').slice(0, 120),
        },
      },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      source: 'bmkg-nowcast',
      updatedAt: new Date().toISOString(),
      count: 0,
      alerts: [],
      error: 'Gagal mengambil peringatan dini cuaca BMKG',
      details: built.error,
    },
    {
      status: 502,
      headers: {
        ...CORS,
        'X-Cache': 'ERROR',
        'X-Upstream-Error': String(built.error || '').slice(0, 120),
      },
    },
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
