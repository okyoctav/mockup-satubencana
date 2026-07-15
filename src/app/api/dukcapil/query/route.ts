import { NextRequest, NextResponse } from 'next/server';

const DUKCAPIL_QUERY_URL = 'https://gis.dukcapil.kemendagri.go.id/arcgis/rest/services/AGR_VISUAL_KEL_FIX/MapServer/0/query';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const geometry = payload?.geometry;

    if (!geometry) {
      return NextResponse.json(
        { error: 'Missing geometry payload' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      where: payload?.where ?? '1=1',
      geometryType: payload?.geometryType ?? 'esriGeometryPolygon',
      spatialRel: payload?.spatialRel ?? 'esriSpatialRelIntersects',
      outFields: payload?.outFields ?? 'JUMLAH_PENDUDUK,JUMLAH_KK,PRIA,WANITA,NAMA_KEL',
      inSR: payload?.inSR ?? '4326',
      outSR: payload?.outSR ?? '4326',
      f: payload?.f ?? 'json',
      returnGeometry: payload?.returnGeometry ?? 'true',
      geometry: typeof geometry === 'string' ? geometry : JSON.stringify(geometry),
    });

    const upstreamResponse = await fetch(`${DUKCAPIL_QUERY_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const text = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get('content-type') ?? 'application/json';

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: 'Upstream query failed', status: upstreamResponse.status, body: text },
        { status: 502 }
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Dukcapil proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to query Dukcapil service' },
      { status: 500 }
    );
  }
}
