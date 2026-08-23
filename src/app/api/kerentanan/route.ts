import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '7171';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const targetUrl = 'https://inarisk2.bnpb.go.id/api/kerentanan/get-data/' + code;
    const res = await fetch(targetUrl, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
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
  } catch (e) {
    console.error('Fetch inarisk error:', e);
  }

  // Fallback to local file if fetch fails or times out
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'kerentanan_7172.json');
    if (fs.existsSync(filePath)) {
      const localData = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(localData, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }
  } catch {
    // ignore
  }

  return NextResponse.json([], { status: 200 });
}
