'use client';

import { useEffect, useRef, useState } from 'react';

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

const BASEMAPS = [
  {
    id: 'esri',
    label: 'Citra Satelit (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
  {
    id: 'big',
    label: 'Rupabumi Indonesia (BIG)',
    url: 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/tile/{z}/{y}/{x}',
    attr: '© Badan Informasi Geospasial (BIG)',
    maxZoom: 16,
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '© OpenStreetMap contributors',
    maxZoom: 19,
  },
];

export default function LeafletMap({ data }: { data: Kejadian[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);

  const [activeBasemap, setActiveBasemap] = useState('esri');
  const [panelOpen, setPanelOpen] = useState(false);

  // Init map
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    import('leaflet').then((L) => {
      if (!containerRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center: [0.5, 101.5],
        zoom: 6,
        scrollWheelZoom: true,
        zoomControl: true,
      });
      mapRef.current = map;

      // Initial basemap
      const bm = BASEMAPS.find((b) => b.id === 'esri')!;
      tileRef.current = L.tileLayer(bm.url, { attribution: bm.attr, maxZoom: bm.maxZoom }).addTo(map);

      // Markers
      data.forEach((k) => {
        const color = JENIS_COLOR[k.jenis] ?? '#94A3B8';
        const radius = k.level === 'tinggi' ? 14 : k.level === 'sedang' ? 10 : 7;
        const tanggal = new Date(k.tanggal).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
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
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch basemap
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const bm = BASEMAPS.find((b) => b.id === activeBasemap);
    if (!bm) return;
    tileRef.current = L.tileLayer(bm.url, { attribution: bm.attr, maxZoom: bm.maxZoom }).addTo(map);
  }, [activeBasemap]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%', background: '#0A1628' }} />

      {/* Layer switcher panel */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Toggle button */}
        <button
          onClick={() => setPanelOpen((v) => !v)}
          style={{
            display: 'block',
            marginLeft: 'auto',
            padding: '5px 12px',
            fontSize: 12,
            fontWeight: 600,
            background: '#1E3A5F',
            color: '#E2E8F0',
            border: '1px solid #2D5A8E',
            borderRadius: 6,
            cursor: 'pointer',
            letterSpacing: '0.4px',
            userSelect: 'none',
          }}
        >
          Basemap {panelOpen ? '▲' : '▼'}
        </button>

        {/* Scrollable list panel */}
        {panelOpen && (
          <div
            style={{
              marginTop: 4,
              background: 'rgba(10,22,40,0.93)',
              border: '1px solid #2D5A8E',
              borderRadius: 8,
              padding: '8px 0',
              minWidth: 220,
              maxHeight: 260,
              overflowY: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                padding: '2px 12px 6px',
                fontSize: 10,
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                borderBottom: '1px solid #1E3A5F',
                marginBottom: 4,
              }}
            >
              Pilih Basemap
            </div>
            {BASEMAPS.map((bm) => (
              <label
                key={bm.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: activeBasemap === bm.id ? '#38BDF8' : '#CBD5E1',
                  background: activeBasemap === bm.id ? 'rgba(56,189,248,0.08)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (activeBasemap !== bm.id)
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    activeBasemap === bm.id ? 'rgba(56,189,248,0.08)' : 'transparent';
                }}
              >
                <input
                  type="radio"
                  name="basemap"
                  value={bm.id}
                  checked={activeBasemap === bm.id}
                  onChange={() => setActiveBasemap(bm.id)}
                  style={{ accentColor: '#38BDF8', cursor: 'pointer' }}
                />
                {bm.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
