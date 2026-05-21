/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Matikan strict mode untuk kompatibilitas Three.js di React 18
  reactStrictMode: false,
  transpilePackages: ['react-leaflet', 'leaflet', '@arcgis/core'],
};

export default nextConfig;
