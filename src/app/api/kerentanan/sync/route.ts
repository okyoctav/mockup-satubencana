import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = body.code || '7172';

    const targetUrl = 'https://inarisk2.bnpb.go.id/api/kerentanan/get-data/' + code;
    const res = await fetch(targetUrl, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Gagal fetch dari InARISK' }, { status: res.status });
    }

    const rawText = await res.text();
    const dstDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }

    const fileName = 'kerentanan_' + code + '.json';
    const filePath = path.join(dstDir, fileName);
    fs.writeFileSync(filePath, rawText, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'File public/data/' + fileName + ' berhasil diperbarui secara realtime!',
      bytes: rawText.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui file JSON lokal';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
