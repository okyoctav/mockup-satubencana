import { NextResponse } from 'next/server';

// In-memory cache to prevent overloading SIPONGI server and provide instant speed
const memoryCache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'sebaran';

  let targetUrl = '';

  if (action === 'sebaran') {
    const late = searchParams.get('late') || '24';
    const satelit = searchParams.get('satelit') || 'all-nasa';
    const confidence = searchParams.get('confidence') || 'all';
    const provinsi = searchParams.get('provinsi') || 'all';
    targetUrl = `https://opsroom.sipongidata.my.id/api/sebaran?late=${encodeURIComponent(late)}&satelit=${encodeURIComponent(satelit)}&confidence=${encodeURIComponent(confidence)}&provinsi=${encodeURIComponent(provinsi)}`;
  } else if (action === 'grafik_hotspot') {
    const text = searchParams.get('text') || 'NASA-TERRA/AQUA';
    const satelit = searchParams.get('satelit') || 'NASA-MODIS';
    const tahun = searchParams.get('tahun') || '2026';
    targetUrl = `https://opsroom.sipongidata.my.id/api/grafik/hotspot?text=${encodeURIComponent(text)}&satelit=${encodeURIComponent(satelit)}&tahun=${encodeURIComponent(tahun)}`;
  } else if (action === 'luas_provinsi') {
    const tahunAwal = searchParams.get('tahunAwal') || '2015';
    const tahunAkhir = searchParams.get('tahunAkhir') || '2026';
    targetUrl = `https://opsroom.sipongidata.my.id/api/list/luas-kebakaran/provinsi?tahunAwal=${encodeURIComponent(tahunAwal)}&tahunAkhir=${encodeURIComponent(tahunAkhir)}`;
  } else if (action === 'luas_kabupaten') {
    const provinsi = searchParams.get('provinsi') || 'all';
    const tahunAwal = searchParams.get('tahunAwal') || '2015';
    const tahunAkhir = searchParams.get('tahunAkhir') || '2026';
    targetUrl = `https://opsroom.sipongidata.my.id/api/list/luas-kebakaran/kabupaten?provinsi=${encodeURIComponent(provinsi)}&tahunAwal=${encodeURIComponent(tahunAwal)}&tahunAkhir=${encodeURIComponent(tahunAkhir)}`;
  } else {
    return NextResponse.json({ error: 'Action parameter tidak valid' }, { status: 400 });
  }

  // Check cache first
  const cacheKey = targetUrl;
  const cached = memoryCache[cacheKey];
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return NextResponse.json(cached.data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'application/json, text/plain, */*',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Sipongi API responded with HTTP status ${res.status}`);
    }

    const data = await res.json();

    // Save to cache
    memoryCache[cacheKey] = {
      data,
      timestamp: now,
    };

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Error fetching Sipongi data [${targetUrl}]:`, errorMessage);

    // If cache exists even if expired, return it as fallback
    if (cached) {
      return NextResponse.json(cached.data, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'FALLBACK_STALE',
        },
      });
    }

    return NextResponse.json({
      error: 'Gagal mengambil data dari SIPONGI',
      details: errorMessage,
      targetUrl,
    }, {
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
