import { NextRequest, NextResponse } from 'next/server';

/** In-memory cache only — no hardcoded stub token. */
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function generateBigToken(username: string, password: string): Promise<{ token: string; expires: number } | { error: string; status: number }> {
  const tokenUrl = 'https://geoservices.big.go.id/portal/sharing/rest/generateToken';
  const params = new URLSearchParams({
    f: 'json',
    username,
    password,
    client: 'referer',
    referer: 'https://geoservices.big.go.id',
    expiration: '120', // Token valid for 2 hours (120 minutes)
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();

  if (data.error) {
    return { error: data.error.message || 'Gagal generate token BIG', status: 400 };
  }

  if (data.token) {
    const expires = data.expires || Date.now() + 120 * 60 * 1000;
    cachedToken = data.token;
    tokenExpiresAt = expires;
    return { token: data.token, expires };
  }

  return { error: 'Respons token tidak valid dari server BIG', status: 500 };
}

function cachedIfValid(): { token: string; expires: number } | null {
  if (cachedToken && Date.now() < tokenExpiresAt - 300000) {
    return { token: cachedToken, expires: tokenExpiresAt };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Direct Token Registration Mode
    if (body.token) {
      cachedToken = body.token;
      tokenExpiresAt = body.expires || Date.now() + 24 * 60 * 60 * 1000;
      return NextResponse.json({
        success: true,
        message: 'Token BIG berhasil didaftarkan!',
        token: cachedToken,
        expires: tokenExpiresAt,
      });
    }

    // 2. Auto Generate via Username & Password Mode
    const username = body.username || process.env.BIG_USERNAME;
    const password = body.password || process.env.BIG_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        {
          error: 'Username/password atau objek { token, expires } diperlukan.',
          notice: 'Set BIG_USERNAME / BIG_PASSWORD di .env.local (atau Vercel).',
        },
        { status: 400 },
      );
    }

    const hit = cachedIfValid();
    if (hit) {
      return NextResponse.json(hit);
    }

    const result = await generateBigToken(username, password);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const hit = cachedIfValid();
  if (hit) {
    return NextResponse.json({ ...hit, source: 'memory-cache' });
  }

  const username = process.env.BIG_USERNAME;
  const password = process.env.BIG_PASSWORD;
  if (username && password) {
    try {
      const result = await generateBigToken(username, password);
      if ('error' in result) {
        return NextResponse.json(
          {
            token: null,
            message: result.error,
            notice: 'BIG credentials ada tetapi generateToken gagal.',
          },
          { status: 502 },
        );
      }
      return NextResponse.json({ ...result, source: 'generateToken' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal generate token BIG';
      return NextResponse.json({ token: null, message }, { status: 502 });
    }
  }

  return NextResponse.json({
    token: null,
    message: 'Belum ada token aktif.',
    notice: 'Set BIG_USERNAME / BIG_PASSWORD di server, atau POST { token, expires }.',
  });
}
