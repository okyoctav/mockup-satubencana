import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 1. Try Live InARISK API with 3s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://inarisk2.bnpb.go.id/api/kerentanan/get-data/7172', {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const rawText = await res.text();
      return new NextResponse(rawText, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }
  } catch {
    // Fallback to local cached JSON if server network is blocked/slow
  }

  // 2. Local JSON Cache Fallback (/public/data/kerentanan_7172.json)
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'kerentanan_7172.json');
    if (fs.existsSync(filePath)) {
      const localData = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(localData, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat cache lokal';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Data kerentanan tidak ditemukan' }, { status: 404 });
}
