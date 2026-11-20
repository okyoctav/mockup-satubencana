import { NextResponse } from 'next/server';
import { fetchDibiAggregatesFromCkan, type DibiAggregates } from '@/lib/dibiCkan';
import {
  DIBI_PER_TAHUN,
  DIBI_PER_JENIS,
  DIBI_TOP_PROVINSI,
  DIBI_PER_BULAN,
  DIBI_TOTAL,
  KORBAN_DIST,
  PENGUNGSI_DIST,
} from '@/data/dibiStats';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function snapshotAggregates(): DibiAggregates {
  return {
    perTahun: DIBI_PER_TAHUN.map((x) => ({ ...x })),
    perJenis: DIBI_PER_JENIS.map((x) => ({ ...x })),
    topProvinsi: DIBI_TOP_PROVINSI.map((x) => ({ ...x })),
    perBulan: DIBI_PER_BULAN.map((x) => ({ ...x })),
    korbanDist: KORBAN_DIST.map((x) => ({ ...x })),
    pengungsiDist: PENGUNGSI_DIST.map((x) => ({ ...x })),
    total: { ...DIBI_TOTAL },
    yearRange: { min: 2011, max: 2026 },
    meninggalFromCkan: false,
  };
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Lengkapi meninggal dari snapshot lokal jika CKAN resource meninggal tidak aktif. */
function fillMeninggalFromSnapshot(agg: DibiAggregates): DibiAggregates {
  if (agg.meninggalFromCkan && agg.total.meninggal > 0) return agg;
  const perJenis = agg.perJenis.map((j) => {
    const hit = DIBI_PER_JENIS.find((s) => {
      const a = norm(s.jenis);
      const b = norm(j.jenis);
      return a === b || a.includes(b) || b.includes(a);
    });
    return { ...j, meninggal: hit?.meninggal ?? j.meninggal };
  });
  const meninggal = perJenis.reduce((s, j) => s + j.meninggal, 0);
  const total = { ...agg.total, meninggal };
  const korbanDist = (() => {
    if (!meninggal) return agg.korbanDist;
    return perJenis
      .filter((j) => j.meninggal > 0)
      .map((j) => ({
        name: j.jenis,
        value: Math.round((j.meninggal / meninggal) * 100),
        color: j.color,
      }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  })();
  return {
    ...agg,
    perJenis,
    total,
    korbanDist,
    // tetap false = angka meninggal dilengkapi snapshot
    meninggalFromCkan: false,
  };
}

/**
 * Agregat DIBI untuk chart dashboard.
 * Utama: CKAN data.bnpb.go.id (cache-friendly).
 * Cadangan: dibiStats.ts (snapshot lokal).
 * Pola musiman bulanan: hanya ada di snapshot (CKAN publik tidak sediakan).
 */
export async function GET() {
  const fetchedAt = new Date().toISOString();
  try {
    let agg = await fetchDibiAggregatesFromCkan();
    agg = fillMeninggalFromSnapshot(agg);
    // Bulanan tidak ada di CKAN → pakai snapshot agar chart musiman tetap ada
    agg = { ...agg, perBulan: DIBI_PER_BULAN.map((x) => ({ ...x })) };

    const notes: string[] = [];
    if (!agg.meninggalFromCkan) notes.push('meninggal dilengkapi snapshot');
    notes.push('bulan dari snapshot');

    return NextResponse.json({
      ok: true,
      source: 'data.bnpb.go.id CKAN datastore (agregat)',
      fetchedAt,
      note: notes.join(' · '),
      ...agg,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'CKAN gagal';
    const snap = snapshotAggregates();
    return NextResponse.json({
      ok: false,
      source: 'dibiStats.ts (fallback)',
      fetchedAt,
      error: msg,
      note: 'Portal CKAN gagal — memakai agregat lokal',
      ...snap,
    });
  }
}
