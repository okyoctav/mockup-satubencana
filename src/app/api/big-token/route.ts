import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const TOKEN_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'big_token.json');

export interface BigTokenData {
  token: string;
  expires: number;
  ssl: boolean;
  updatedAt?: string;
}

const DEFAULT_TOKEN_FALLBACK: BigTokenData = {
  token:
    '-1djg_mpMNlhZJXNYZBJo8fjwPVW8QVh7hhgEcjm4ebj9xcgdy9sB_rXgmpsgYomCCuoEWZjhxs-PXXwGeV9wn8Ijau_qlNkjivtQ7kjbwBqU3nblmuagvHf62RZZN5NmTvUrd6qOrFqkrSLvarwgUsKV7uIq9k8JTeqaZ8ZuIY.',
  expires: 1795150289776,
  ssl: true,
  updatedAt: new Date().toISOString(),
};

let memoryTokenData: BigTokenData | null = null;

function readTokenData(): BigTokenData {
  if (memoryTokenData) return memoryTokenData;

  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      const raw = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.token === 'string' && parsed.token.trim().length > 0) {
        memoryTokenData = {
          token: parsed.token.trim(),
          expires: Number(parsed.expires) || DEFAULT_TOKEN_FALLBACK.expires,
          ssl: parsed.ssl !== undefined ? Boolean(parsed.ssl) : true,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
        return memoryTokenData;
      }
    }
  } catch (err) {
    console.warn('[big-token] Gagal membaca big_token.json, menggunakan fallback default:', err);
  }

  memoryTokenData = { ...DEFAULT_TOKEN_FALLBACK };
  return memoryTokenData;
}

function writeTokenData(data: BigTokenData): boolean {
  try {
    const dir = path.dirname(TOKEN_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    memoryTokenData = { ...data };
    return true;
  } catch (err) {
    console.error('[big-token] Gagal menyimpan big_token.json:', err);
    memoryTokenData = { ...data };
    return false;
  }
}

async function testTokenConnectivity(tokenToTest: string): Promise<{ valid: boolean; message: string; details?: unknown }> {
  try {
    const url = `https://geoservices.big.go.id/rbi/rest/services/BASEMAP/RBI5K_SULAWESI_2024/MapServer?f=json&token=${encodeURIComponent(
      tokenToTest
    )}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      cache: 'no-store',
    });
    const data = await res.json();

    if (data.error) {
      return {
        valid: false,
        message: data.error.message || 'Token ditolak oleh server BIG',
        details: data.error,
      };
    }

    return {
      valid: true,
      message: `Token valid! Terhubung ke service BIG: ${data.mapName || 'RBI Sulawesi'}`,
      details: { mapName: data.mapName, currentVersion: data.currentVersion },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menghubungi server BIG';
    return {
      valid: false,
      message: `Error koneksi: ${msg}`,
    };
  }
}

async function generateBigToken(
  username: string,
  password: string
): Promise<{ token: string; expires: number; ssl: boolean } | { error: string; status: number }> {
  const tokenUrl = 'https://geoservices.big.go.id/portal/sharing/rest/generateToken';
  const params = new URLSearchParams({
    f: 'json',
    username,
    password,
    client: 'referer',
    referer: 'https://geoservices.big.go.id',
    expiration: '120',
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
    const ssl = data.ssl !== undefined ? Boolean(data.ssl) : true;
    const tokenObj: BigTokenData = {
      token: data.token,
      expires,
      ssl,
      updatedAt: new Date().toISOString(),
    };
    writeTokenData(tokenObj);
    return { token: data.token, expires, ssl };
  }

  return { error: 'Respons token tidak valid dari server BIG', status: 500 };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const current = readTokenData();
  const isValid = Date.now() < current.expires - 300000;

  // Jika parameter action=test, uji langsung ke BIG Geoservices
  if (action === 'test') {
    const testResult = await testTokenConnectivity(current.token);
    return NextResponse.json(
      {
        ...testResult,
        token: current.token,
        expires: current.expires,
        ssl: current.ssl,
        updatedAt: current.updatedAt,
      },
      { headers: CORS }
    );
  }

  return NextResponse.json(
    {
      token: current.token,
      expires: current.expires,
      ssl: current.ssl,
      updatedAt: current.updatedAt,
      isValid,
      source: 'persistent-storage',
    },
    { headers: CORS }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Action: Test Token Connectivity Mode
    if (body.action === 'test') {
      const tokenToTest = body.token || readTokenData().token;
      if (!tokenToTest) {
        return NextResponse.json(
          { valid: false, message: 'Tidak ada token yang diberikan untuk diuji.' },
          { status: 400, headers: CORS }
        );
      }
      const testResult = await testTokenConnectivity(tokenToTest);
      return NextResponse.json(testResult, { headers: CORS });
    }

    // 2. Direct Token Registration / Update Mode (token, expires, ssl)
    if (body.token && typeof body.token === 'string') {
      const cleanToken = body.token.trim();
      let expiresVal = Number(body.expires);
      if (isNaN(expiresVal) || expiresVal <= 0) {
        // Default 24 jam jika tidak valid
        expiresVal = Date.now() + 24 * 60 * 60 * 1000;
      }

      const sslVal = body.ssl !== undefined ? Boolean(body.ssl) : true;
      const updatedData: BigTokenData = {
        token: cleanToken,
        expires: expiresVal,
        ssl: sslVal,
        updatedAt: new Date().toISOString(),
      };

      const saved = writeTokenData(updatedData);

      return NextResponse.json(
        {
          success: true,
          message: 'Token BIG berhasil diperbarui dan disimpan!',
          savedToDisk: saved,
          token: updatedData.token,
          expires: updatedData.expires,
          ssl: updatedData.ssl,
          updatedAt: updatedData.updatedAt,
        },
        { headers: CORS }
      );
    }

    // 3. Auto Generate via Username & Password Mode
    const username = body.username || process.env.BIG_USERNAME;
    const password = body.password || process.env.BIG_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        {
          error: 'Parameter tidak valid. Diperlukan objek { token, expires, ssl } atau { username, password }.',
          notice: 'Silakan isi token, expires, dan ssl.',
        },
        { status: 400, headers: CORS }
      );
    }

    const result = await generateBigToken(username, password);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status, headers: CORS });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Token BIG berhasil dibuat ulang dari server BIG!',
        ...result,
      },
      { headers: CORS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan server saat memproses token BIG';
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
