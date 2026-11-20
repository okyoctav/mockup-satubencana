/**
 * Route kanonik aplikasi MDB.
 * Redirect path lama: `legacy-redirects.mjs` (dipakai next.config.mjs).
 */
export const DEFAULT_DASHBOARD_PATH = '/dashboard';
export const SIMULASI_DAMPAK_PATH = '/admin/simulasi-dampak';
export const SIMULASI_MODELING_PATH = '/simulasi-modeling';

/** Mirror daftar source di legacy-redirects.mjs (dokumentasi / tes). */
export const LEGACY_DASHBOARD_PATHS = [
  '/dashboard_k1',
  '/dashboard_k2',
  '/dashboard_k3',
  '/dashboard_k4',
  '/dashboard_k5',
] as const;

export const LEGACY_ADMIN_SIMULASI_PATHS = [
  '/admin/simulasi-k3',
  '/admin/simulasi-k4',
] as const;

export const LOGIN_PATH = '/login';

export function loginUrlWithNext(next: string = DEFAULT_DASHBOARD_PATH): string {
  return `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}
