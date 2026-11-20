import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { toInariskKerentananKabCode } from '@/lib/inariskKerentananCode';
import { fetchUpstream } from '@/lib/upstreamFetch';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = toInariskKerentananKabCode(body.code);
    if (!code) {
      return NextResponse.json(
        {
          error:
            'Kode kab/kota tidak valid. Gunakan kode Kemendagri 4+ digit (bukan hanya provinsi).',
        },
        { status: 400 },
      );
    }
    const targetUrl = `https://inarisk2.bnpb.go.id/api/kerentanan/get-data/${code}`;

    const live = await fetchUpstream(targetUrl, {
      timeoutMs: 15_000,
      maxAttempts: 3,
      headers: { Accept: 'application/json' },
    });

    if (!live.ok) {
      return NextResponse.json(
        {
          error: 'Gagal fetch dari InARISK',
          detail: live.text.slice(0, 200),
          attempts: live.attempts,
        },
        { status: live.status || 502 }
      );
    }

    const dstDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });

    const fileName = `kerentanan_${code}.json`;
    const filePath = path.join(dstDir, fileName);
    fs.writeFileSync(filePath, live.text, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `File public/data/${fileName} berhasil diperbarui`,
      bytes: live.text.length,
      attempts: live.attempts,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui file JSON lokal';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
