'use client';

import { useEffect, useRef } from 'react';

const JENIS_COLOR: Record<string, string> = {
  banjir: '#0EA5E9',
  longsor: '#F97316',
  gempa: '#EF4444',
  kebakaran: '#EAB308',
};

type Kejadian = {
  id: number;
  nama: string;
  provinsi: string;
  kabupaten: string;
  lat: number;
  lng: number;
  jenis: string;
  tanggal: string;
  korban_jiwa: number;
  pengungsi: number;
  status: string;
  level: string;
};

export default function LeafletMap({ data }: { data: Kejadian[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing map instance sebelum buat baru
    if (mapRef.current) {
      (mapRef.current as { remove: () => void }).remove();
      mapRef.current = null;
    }

    // Import Leaflet secara dinamis — hanya berjalan di browser
    import('leaflet').then((L) => {
      if (!containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [0.5, 101.5],
        zoom: 6,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      mapRef.current = map;

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 18,
        }).addTo(map);

      data.forEach((k) => {
        const color = JENIS_COLOR[k.jenis] ?? '#94A3B8';
        const radius = k.level === 'tinggi' ? 14 : k.level === 'sedang' ? 10 : 7;
        const tanggal = new Date(k.tanggal).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        const circle = L.circleMarker([k.lat, k.lng], {
          color,
          fillColor: color,
          fillOpacity: k.status === 'saat' ? 0.9 : 0.45,
          weight: k.status === 'saat' ? 2 : 1,
          radius,
        });

        const popupBg = document.documentElement.getAttribute('data-theme') === 'light' ? '#FFFFFF' : '#0A1628';
        const popupText = document.documentElement.getAttribute('data-theme') === 'light' ? '#1a1a1a' : '#F1F5F9';
        const popupMuted = document.documentElement.getAttribute('data-theme') === 'light' ? '#555' : '#94A3B8';

        circle.bindPopup(`
          <div style="min-width:180px;font-family:sans-serif;padding:4px;background:${popupBg};color:${popupText}">
            <div style="font-size:11px;font-weight:700;color:${color};margin-bottom:4px;text-transform:uppercase">
              ${k.jenis} · ${k.status === 'saat' ? '🔴 AKTIF' : '⚫ SELESAI'}
            </div>
            <div style="font-size:13px;font-weight:700;margin-bottom:4px">${k.nama}</div>
            <div style="font-size:11px;color:${popupMuted};margin-bottom:8px">${k.kabupaten}, ${k.provinsi}</div>
            <div style="font-size:11px;display:flex;gap:12px;margin-bottom:6px">
              <span>💀 <strong>${k.korban_jiwa}</strong> korban</span>
              <span>👥 <strong>${k.pengungsi.toLocaleString('id')}</strong> pengungsi</span>
            </div>
            <div style="font-size:10px;color:${popupMuted}">${tanggal}</div>
          </div>
        `);

        circle.addTo(map);
      });
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', background: '#0A1628' }}
    />
  );
}
