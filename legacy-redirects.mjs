/**
 * Sumber tunggal redirect path lama → kanonik.
 * Dipakai next.config.mjs. Mirror TypeScript: src/lib/routes.ts
 */
export const LEGACY_REDIRECTS = [
  { source: '/dashboard_k1', destination: '/dashboard', permanent: true },
  { source: '/dashboard_k2', destination: '/dashboard', permanent: true },
  { source: '/dashboard_k3', destination: '/dashboard', permanent: true },
  { source: '/dashboard_k4', destination: '/dashboard', permanent: true },
  { source: '/dashboard_k5', destination: '/dashboard', permanent: true },
  { source: '/admin/simulasi-k3', destination: '/admin/simulasi-dampak', permanent: true },
  { source: '/admin/simulasi-k4', destination: '/admin/simulasi-dampak', permanent: true },
  { source: '/admin/statistik', destination: '/admin', permanent: true },
];
