import { NextRequest, NextResponse } from 'next/server';

let cachedToken: string | null = "bXRZnUldjcX9an6nsX6P7TpV7OCxgKf5sAoSwP0r5Bdfwbf7FhFbcLayR5A62njwsWtCYciB6osucRUMJKVfRBvEK11t_BToxoxG_BAubOCSG3jS9cIfuocsJ4chV05gIu5FHflMHbQZ4Eoi1hKuX02rfbPRDKpkqHN-CZRMgEI.";
let tokenExpiresAt = 1786760505418;

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
      return NextResponse.json({ error: 'Username/password atau objek { token, expires } diperlukan.' }, { status: 400 });
    }

    // Check cached token validity (valid with 5 minutes margin)
    if (cachedToken && Date.now() < tokenExpiresAt - 300000) {
      return NextResponse.json({ token: cachedToken, expires: tokenExpiresAt });
    }

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
      return NextResponse.json({ error: data.error.message || 'Gagal generate token BIG' }, { status: 400 });
    }

    if (data.token) {
      cachedToken = data.token;
      tokenExpiresAt = data.expires || Date.now() + 120 * 60 * 1000;
      return NextResponse.json({ token: data.token, expires: tokenExpiresAt });
    }

    return NextResponse.json({ error: 'Respons token tidak valid dari server BIG' }, { status: 500 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  if (cachedToken && Date.now() < tokenExpiresAt - 300000) {
    return NextResponse.json({ token: cachedToken, expires: tokenExpiresAt });
  }
  return NextResponse.json({ token: null, message: 'Belum ada token aktif.' });
}
