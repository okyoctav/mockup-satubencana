/**
 * Kode wilayah filter (Kemendagri bertitik/tanpa titik) → path InaRISK kerentanan.
 * Contoh: "71.72" / "7172" → "7172"; "71" → "71".
 */
export function toInariskKerentananCode(kode?: string | null): string | null {
  if (!kode) return null;
  const digits = String(kode).replace(/\D/g, '');
  if (digits.length < 2 || digits.length > 10) return null;
  return digits;
}

/**
 * InaRISK kerentanan hanya untuk kab/kota (4+ digit).
 * Kode 2 digit = provinsi → terlalu berat / tidak diizinkan di API & UI.
 */
export function isKerentananKabKotaCode(code?: string | null): boolean {
  return typeof code === 'string' && /^\d{4,}$/.test(code);
}

/** Normalisasi + wajib kab/kota. */
export function toInariskKerentananKabCode(kode?: string | null): string | null {
  const code = toInariskKerentananCode(kode);
  if (!code || !isKerentananKabKotaCode(code)) return null;
  return code;
}
