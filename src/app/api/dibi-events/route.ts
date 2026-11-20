import { NextResponse } from 'next/server';
import { DIBI_LOCAL_AS_OF, DIBI_LOCAL_FILE, getDibiEventRows } from '@/lib/dibiLocalStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Semua kejadian DIBI lokal untuk /analisis-data.
 * - Tidak memotong baris / agregat (kualitas analisis sama)
 * - Field dirapikan (tanpa kolom Excel sampah) → payload lebih kecil dari file mentah 42MB
 * - Cache memori di server + Cache-Control browser untuk kunjungan ulang
 */
export async function GET() {
  try {
    const rows = await getDibiEventRows();
    return NextResponse.json(
      {
        ok: true,
        count: rows.length,
        asOf: DIBI_LOCAL_AS_OF,
        file: DIBI_LOCAL_FILE,
        rows,
      },
      {
        headers: {
          // Data file lokal jarang berubah — boleh di-cache browser sebentar
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        },
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Gagal baca DIBI lokal';
    return NextResponse.json({ ok: false, error: msg, rows: [], count: 0 }, { status: 500 });
  }
}
