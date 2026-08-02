import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bentuk = searchParams.get('bentuk') || 'SD,SDLB';
  const provinsi = searchParams.get('provinsi') || '';

  if (!provinsi) {
    return NextResponse.json({ type: 'FeatureCollection', features: [] });
  }

  const targetUrl = `https://sepakat.bappenas.go.id/analisis-mandiri/map/point/dapodik?bentuk=${encodeURIComponent(bentuk)}&provinsi=${encodeURIComponent(provinsi)}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ type: 'FeatureCollection', features: [] }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ type: 'FeatureCollection', features: [], error: String(error) }, { status: 500 });
  }
}
