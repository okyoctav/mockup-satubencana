import { NextResponse } from 'next/server';
import { fetchBnpbKejadianMingguan } from '@/lib/bnpbKejadian';
import bencanaFallback from '@/data/bencana.json';
import type { Kejadian } from '@/types/kejadian';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK = (bencanaFallback.kejadian || []).map((k) => ({
  ...k,
  source: 'bencana_json' as const,
})) as Kejadian[];

/**
 * Proxy Kejadian Bencana Mingguan BNPB (FeatureServer/25).
 * Timeout + retry di sisi fetch; fallback bencana.json jika feed gagal (staging/prod).
 */
const ATTEMPTS_META = {
  pageSize: 25,
  timeoutMs: 12_000,
  maxAttempts: 3,
};

export async function GET() {
  const fetchedAt = new Date().toISOString();
  try {
    const { items, rawCount, attemptsMeta } = await fetchBnpbKejadianMingguan();
    if (!items.length) {
      return NextResponse.json({
        ok: true,
        source: 'bencana.json (fallback kosong)',
        fetchedAt,
        count: FALLBACK.length,
        rawCount,
        attemptsMeta: attemptsMeta ?? ATTEMPTS_META,
        kejadian: FALLBACK,
        note: 'Data lokal (feed kosong)',
        fallback: true,
      });
    }
    return NextResponse.json({
      ok: true,
      source: 'gis.bnpb.go.id / Kejadian_Bencana_Mingguan / 25',
      fetchedAt,
      count: items.length,
      rawCount,
      attemptsMeta: attemptsMeta ?? ATTEMPTS_META,
      kejadian: items,
      note: 'BNPB Mingguan',
      fallback: false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Gagal fetch BNPB';
    // Log server untuk monitoring staging/prod
    console.error('[kejadian-bnpb] feed gagal, fallback bencana.json:', msg);
    return NextResponse.json(
      {
        ok: false,
        source: 'bencana.json (fallback error)',
        fetchedAt,
        count: FALLBACK.length,
        kejadian: FALLBACK,
        error: msg,
        attemptsMeta: ATTEMPTS_META,
        note: 'Data lokal (feed gagal)',
        fallback: true,
      },
      { status: 200 }
    );
  }
}
