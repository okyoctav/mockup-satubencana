import { LEGACY_REDIRECTS } from './legacy-redirects.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Matikan strict mode untuk kompatibilitas Three.js di React 18
  reactStrictMode: false,
  transpilePackages: ['react-leaflet', 'leaflet', '@arcgis/core'],
  async redirects() {
    return [...LEGACY_REDIRECTS];
  },
};

export default nextConfig;
