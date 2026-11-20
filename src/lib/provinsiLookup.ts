import { WILAYAH_MASTER, KODE_KEMENDAGRI_PROVINSI } from '@/lib/wilayahStore';

/** Kode BPS 2 digit → nama provinsi (untuk id_kab_sdi seperti "31.74"). */
const BPS_PROVINSI: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [nama, kode] of Object.entries(KODE_KEMENDAGRI_PROVINSI)) {
    if (!map[kode]) map[kode] = nama.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  // Prefer Title Case dari master
  for (const w of WILAYAH_MASTER) {
    if (w.tipe === 'provinsi' && w.kode) map[w.kode] = w.nama;
  }
  return map;
})();

function normalizeName(s: string) {
  return s
    .toLowerCase()
    .replace(/^kab(\.|upaten)?\s+/i, '')
    .replace(/^kota(\s+adm\.?)?\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lengkapi provinsi dari kode kab SDI/BPS atau nama kab (WILAYAH).
 * Hasil = Dilengkapi, bukan field live BNPB.
 */
export function resolveProvinsi(opts: {
  idKabSdi?: string | null;
  kabupaten?: string | null;
}): { provinsi: string; method: 'bps_kode' | 'nama_kab' | 'none' } {
  const code = (opts.idKabSdi || '').trim();
  if (code) {
    const prefix = code.split('.')[0]?.padStart(2, '0').slice(0, 2);
    if (prefix && BPS_PROVINSI[prefix]) {
      return { provinsi: BPS_PROVINSI[prefix], method: 'bps_kode' };
    }
  }

  const kab = normalizeName(opts.kabupaten || '');
  if (kab) {
    const hit = WILAYAH_MASTER.find((w) => {
      if (w.tipe === 'provinsi') return false;
      return normalizeName(w.nama) === kab || normalizeName(w.nama).includes(kab) || kab.includes(normalizeName(w.nama));
    });
    if (hit?.provinsi) return { provinsi: hit.provinsi, method: 'nama_kab' };
  }

  return { provinsi: '', method: 'none' };
}
