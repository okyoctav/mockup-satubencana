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
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://sepakat.bappenas.go.id/',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ type: 'FeatureCollection', features: [] }, { status: response.status });
    }

    const rawData = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = Array.isArray(rawData?.data) ? rawData.data : Array.isArray(rawData) ? rawData : [];

    // Convert array items to GeoJSON FeatureCollection
    const features = items
      .map((item) => {
        const lat = parseFloat(item.latitude || item.lat);
        const lng = parseFloat(item.longitude || item.lng);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          properties: {
            npsn: item.npsn || '',
            nama: item.nama_sekolah || item.nama || 'Sekolah',
            bentuk: item.bentuk_pendidikan || item.bentuk || '',
            status: item.status_sekolah || item.status || '',
            alamat: item.alamat || '',
            kecamatan: item.kecamatan || '',
            kab_kota: item.kab_kota || '',
            provinsi: item.provinsi || '',
            jml_guru: item.jml_guru || '0',
            rombel: item.rombel || '0',
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json({ type: 'FeatureCollection', features });
  } catch (error) {
    return NextResponse.json({ type: 'FeatureCollection', features: [], error: String(error) }, { status: 500 });
  }
}
