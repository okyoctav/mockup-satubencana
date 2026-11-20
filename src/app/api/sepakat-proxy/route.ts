import { NextResponse } from 'next/server';
import { fetchUpstream } from '@/lib/upstreamFetch';

export const dynamic = 'force-dynamic';

/**
 * Proxy SEPAKAT — kredensial hanya dari env server.
 * Response debug dibatasi (tanpa dump penuh) agar tidak bocor di staging.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const app = searchParams.get('app') || 'bitung_kolut';
  const individu = searchParams.get('individu') || '1';
  const page = searchParams.get('page') || '1';

  const username = process.env.SEPAKAT_USERNAME;
  const password = process.env.SEPAKAT_PASSWORD;

  if (!username || !password) {
    return NextResponse.json(
      {
        error: 'SEPAKAT_USERNAME / SEPAKAT_PASSWORD belum diset di server',
      },
      { status: 503 }
    );
  }

  const targetUrl = `https://sepakat.bappenas.go.id/pk-api/?app=${encodeURIComponent(app)}&individu=${encodeURIComponent(individu)}&page=${encodeURIComponent(page)}`;
  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

  const live = await fetchUpstream(targetUrl, {
    timeoutMs: 12_000,
    maxAttempts: 3,
    acceptHttpError: true,
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
  });

  const isCloudflareBlocked =
    live.text.includes('Just a moment...') || live.text.includes('challenge-platform');

  let parsed: unknown = null;
  if (live.ok && !isCloudflareBlocked) {
    try {
      parsed = JSON.parse(live.text);
    } catch {
      parsed = null;
    }
  }

  return NextResponse.json({
    ok: live.ok && !isCloudflareBlocked,
    status: live.status,
    isCloudflareBlocked,
    attempts: live.attempts,
    previewSnippet: live.text.slice(0, 400),
    data: parsed,
  });
}
