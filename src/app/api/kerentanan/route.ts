import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://inarisk2.bnpb.go.id/api/kerentanan/get-data/7172', {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Gagal mengambil data kerentanan dari InARISK' }, { status: res.status });
    }

    const rawText = await res.text();
    return new NextResponse(rawText, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
