import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { toInariskKerentananKabCode } from '@/lib/inariskKerentananCode';
import { fetchUpstream } from '@/lib/upstreamFetch';

export const dynamic = 'force-dynamic';

function localPathFor(code: string) {
  return path.join(process.cwd(), 'public', 'data', `kerentanan_${code}.json`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('code');
  const code = toInariskKerentananKabCode(raw);

  if (!code) {
    const digits = String(raw || '').replace(/\D/g, '');
    const needKab = digits.length > 0 && digits.length < 4;
    return NextResponse.json([], {
      status: 200,
      headers: {
        'X-Cache': needKab ? 'NEED_KAB' : 'EMPTY',
        'X-Data-Source': 'none',
        'X-Upstream-Error': needKab
          ? 'kode provinsi ditolak; gunakan kab/kota (4+ digit)'
          : 'kode wilayah tidak valid',
      },
    });
  }

  const targetUrl = `https://inarisk2.bnpb.go.id/api/kerentanan/get-data/${code}`;

  const live = await fetchUpstream(targetUrl, {
    timeoutMs: 15_000,
    maxAttempts: 2,
    headers: { Accept: 'application/json' },
  });

  if (live.ok) {
    try {
      JSON.parse(live.text);
      const dstDir = path.join(process.cwd(), 'public', 'data');
      if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
      fs.writeFileSync(localPathFor(code), live.text, 'utf-8');
    } catch (err) {
      console.error('[kerentanan] gagal simpan cache lokal:', err);
    }

    return new NextResponse(live.text, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Cache': 'LIVE',
        'X-Data-Source': 'inarisk2.bnpb.go.id',
        'X-Upstream-Attempts': String(live.attempts),
      },
    });
  }

  console.warn('[kerentanan] live gagal, fallback lokal:', live.text.slice(0, 120));

  try {
    const filePath = localPathFor(code);
    if (fs.existsSync(filePath)) {
      const localData = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(localData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Cache': 'FALLBACK_LOCAL',
          'X-Data-Source': `kerentanan_${code}.json`,
          'X-Upstream-Error': live.text.slice(0, 80),
        },
      });
    }
  } catch {
    // ignore
  }

  return NextResponse.json([], {
    status: 200,
    headers: {
      'X-Cache': 'EMPTY',
      'X-Data-Source': 'none',
    },
  });
}
