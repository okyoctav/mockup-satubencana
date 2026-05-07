'use client';

import { useState, useEffect, useRef } from 'react';

interface Kejadian {
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
}

interface Props {
  data: Kejadian[];
  flyTo: { lat: number; lng: number; zoom: number } | null;
  theme: string;
}

interface BnpbLayer {
  id: string;
  label: string;
  color: string;
  emoji: string;
  url: string;
  type?: 'MapServer' | 'ImageServer' | 'VectorTileServer';
  group?: string;
}

const BASEMAPS = [
  {
    id: 'esri_imagery',
    label: 'Citra Satelit',
    emoji: '🛰️',
    layers: [
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri, Maxar, Earthstar Geographics' },
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
    ],
  },
  {
    id: 'esri_topo',
    label: 'Topografi',
    emoji: '🏔️',
    layers: [
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
    ],
  },
  {
    id: 'carto_dark',
    label: 'Dark',
    emoji: '🌑',
    layers: [
      { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap © CARTO' },
    ],
  },
  {
    id: 'carto_light',
    label: 'Light',
    emoji: '🌕',
    layers: [
      { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap © CARTO' },
    ],
  },
];

const BNPB_BASE = 'https://gis.bnpb.go.id/server/rest/services/inarisk';

const BNPB_LAYERS: BnpbLayer[] = [
  // BIG — Badan Informasi Geospasial
  { id: 'big_rbi_sulawesi_lot1',       label: 'RBI Sulawesi 2024 Lot 1',      color: '#A855F7', emoji: '🗺️', url: 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI_5K_Sulawesi_2024_Lot_1_Jul/VectorTileServer',         type: 'VectorTileServer', group: 'BIG' },
  { id: 'big_penutup_lahan_sulawesi',  label: 'Penutup Lahan Sulawesi 2024',  color: '#22C55E', emoji: '🌿', url: 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI5K_PENUTUP_LAHAN_SULAWESI_2024/VectorTileServer',    type: 'VectorTileServer', group: 'BIG' },
  { id: 'big_bangunan_fasum_sulawesi', label: 'Bangunan Fasum Sulawesi 2024', color: '#F59E0B', emoji: '🏛️', url: 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI5K_BANGUNAN_FASUM_SULAWESI_2024/VectorTileServer', type: 'VectorTileServer', group: 'BIG' },
  // BNPB InARISK
  { id: 'cuaca_ekstrim_img', label: 'Cuaca Ekstrim',      color: '#06B6D4', emoji: '🌪️', url: 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_cuaca_ekstrim/ImageServer', type: 'ImageServer', group: 'BNPB' },
  { id: 'banjir',        label: 'Bahaya Banjir',      color: '#0EA5E9', emoji: '🌊', url: `${BNPB_BASE}/layer_bahaya_banjir_30/MapServer`, group: 'BNPB' },
  { id: 'banjir_bandang',label: 'Banjir Bandang',     color: '#0369A1', emoji: '💧', url: `${BNPB_BASE}/layer_bahaya_banjir_bandang_30/MapServer`, group: 'BNPB' },
  { id: 'longsor',       label: 'Tanah Longsor',       color: '#F97316', emoji: '⛰️', url: `${BNPB_BASE}/layer_bahaya_tanah_longsor_30/MapServer`, group: 'BNPB' },
  { id: 'gempa',         label: 'Gempa Bumi',          color: '#EF4444', emoji: '📳', url: `${BNPB_BASE}/layer_bahaya_gempabumi_30/MapServer`, group: 'BNPB' },
  { id: 'tsunami',       label: 'Tsunami',             color: '#EC4899', emoji: '🌊', url: `${BNPB_BASE}/layer_bahaya_tsunami_30/MapServer`, group: 'BNPB' },
  { id: 'gunungapi',     label: 'Letusan Gunung Api',  color: '#8B5CF6', emoji: '🌋', url: `${BNPB_BASE}/layer_bahaya_letusan_gunungapi/MapServer`, group: 'BNPB' },
  { id: 'karhutla',      label: 'Kebakaran Hutan',     color: '#F59E0B', emoji: '🔥', url: `${BNPB_BASE}/layer_bahaya_kebakaran_hutan_dan_lahan_30/MapServer`, group: 'BNPB' },
  { id: 'kekeringan',    label: 'Kekeringan',          color: '#D97706', emoji: '☀️', url: `${BNPB_BASE}/layer_bahaya_kekeringan_30/MapServer`, group: 'BNPB' },
  { id: 'cuaca_ekstrim', label: 'Cuaca Ekstrim (MS)',  color: '#0891B2', emoji: '⛅', url: `${BNPB_BASE}/layer_bahaya_cuaca_ekstrim_30/MapServer`, group: 'BNPB' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createVectorTileLayer(L: any, serviceUrl: string, color: string): any {
  // ArcGIS VectorTileServer: tile/{z}/{y}/{x}.pbf  (row then col)
  const tileUrl = `${serviceUrl}/tile/{z}/{y}/{x}.pbf`;
  // vectorGrid is injected onto window.L by the non-bundled CDN script
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const VG = (L as any).vectorGrid ?? (window as any).L?.vectorGrid;
  if (!VG) return null;
  return VG.protobuf(tileUrl, {
    // render all sub-layers with a single style so features are visible
    vectorTileLayerStyles: new Proxy({}, {
      get: () => ({
        weight: 1,
        color,
        fillColor: color,
        fillOpacity: 0.35,
        opacity: 0.8,
        fill: true,
      }),
    }),
    interactive: false,
    attribution: '© BIG RBI',
    maxNativeZoom: 14,
    maxZoom: 20,
  });
}

const JENIS_COLOR: Record<string, string> = {
  banjir: '#0EA5E9', gempa: '#EF4444', longsor: '#F97316',
  kebakaran: '#F59E0B', erupsi: '#8B5CF6', tsunami: '#EC4899', puting_beliung: '#06B6D4',
};

const LEGEND_ITEMS = [
  { label: 'Banjir', color: '#0EA5E9' },
  { label: 'Gempa', color: '#EF4444' },
  { label: 'Longsor', color: '#F97316' },
  { label: 'Kebakaran', color: '#F59E0B' },
  { label: 'Erupsi', color: '#8B5CF6' },
  { label: 'Tsunami', color: '#EC4899' },
  { label: 'Puting Beliung', color: '#06B6D4' },
];

const DRAW_TOOLS = [
  { id: 'polyline',     label: 'Garis',     icon: '📏' },
  { id: 'polygon',      label: 'Poligon',   icon: '🔷' },
  { id: 'rectangle',    label: 'Persegi',   icon: '⬜' },
  { id: 'circle',       label: 'Lingkaran', icon: '⭕' },
  { id: 'marker',       label: 'Plot',      icon: '📍' },
  { id: 'circlemarker', label: 'Plot Bulat',icon: '🔵' },
];

function tileToBbox3857(x: number, y: number, z: number): string {
  const R = 20037508.342789244;
  const n = Math.pow(2, z);
  return `${(x/n)*2*R-R},${R-((y+1)/n)*2*R},${((x+1)/n)*2*R-R},${R-(y/n)*2*R}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createArcGISExportLayer(L: any, serviceUrl: string, opacity: number, isImageServer = false): any {
  const ArcLayer = L.GridLayer.extend({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createTile(coords: { x: number; y: number; z: number }, done: (e: Error | null, t: HTMLImageElement) => void): HTMLImageElement {
      const img = document.createElement('img');
      img.alt = '';
      if (isImageServer) {
        const params = new URLSearchParams({
          bbox: tileToBbox3857(coords.x, coords.y, coords.z),
          bboxSR: '3857', imageSR: '3857', size: '256,256',
          format: 'png', transparent: 'true', f: 'image',
        });
        img.src = `${serviceUrl}/exportImage?${params}`;
      } else {
        const params = new URLSearchParams({
          bbox: tileToBbox3857(coords.x, coords.y, coords.z),
          bboxSR: '3857', imageSR: '3857', size: '256,256',
          layers: 'show:0', format: 'png32', transparent: 'true', f: 'image',
        });
        img.src = `${serviceUrl}/export?${params}`;
      }
      img.onload = () => done(null, img);
      img.onerror = () => done(new Error('err'), img);
      return img;
    },
  });
  return new ArcLayer({ opacity, attribution: '© BNPB InARISK', tileSize: 256 });
}

type ActivePanel = 'basemap' | 'layers' | 'legend' | 'draw' | null;

export default function DashboardLeaflet({ data, flyTo, theme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseTileRefs = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bnpbLayersRef = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeDrawRef = useRef<any>(null);

  const [activeBasemap, setActiveBasemap] = useState('esri_imagery');
  const [activeOverlays, setActiveOverlays] = useState<string[]>(['cuaca_ekstrim_img']);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [activeDraw, setActiveDraw] = useState<string | null>(null);

  // Load Leaflet.draw CSS+JS once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.getElementById('leaflet-draw-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-draw-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.id = 'leaflet-draw-js';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js';
      document.head.appendChild(script);
    }
  }, []);

  // Init map
  useEffect(() => {
    let mounted = true;
    import('leaflet').then((L) => {
      if (!mounted || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      // Expose our imported L as window.L so non-bundled vectorgrid CDN can extend it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).L = L;
      // Load non-bundled vectorgrid AFTER window.L is set so it extends our instance
      if (!document.getElementById('leaflet-vectorgrid-js')) {
        const vgScript = document.createElement('script');
        vgScript.id = 'leaflet-vectorgrid-js';
        vgScript.src = 'https://unpkg.com/leaflet.vectorgrid@1.3.0/dist/Leaflet.VectorGrid.min.js';
        document.head.appendChild(vgScript);
      }

      const map = L.map(containerRef.current, {
        center: [-2.5, 118.0], zoom: 5,
        zoomControl: false, attributionControl: true,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;

      // Draw feature group
      const drawnItems = L.featureGroup().addTo(map);
      drawLayerRef.current = drawnItems;

      // Initial basemap
      const bm = BASEMAPS[0];
      baseTileRefs.current = bm.layers.map((l) =>
        L.tileLayer(l.url, { attribution: l.attr, maxZoom: 20 }).addTo(map)
      );

      // Markers
      data.forEach((k) => {
        const color = JENIS_COLOR[k.jenis] ?? '#94A3B8';
        const radius = Math.min(8 + k.korban_jiwa * 0.3 + k.pengungsi * 0.001, 22);
        const isActive = k.status === 'saat';
        const isDarkM = theme === 'dark';
        const popupBg = isDarkM ? '#0D1F3C' : '#FFFFFF';
        const popupText = isDarkM ? '#F1F5F9' : '#0F172A';
        const popupMuted = isDarkM ? '#94A3B8' : '#475569';
        const tanggal = new Date(k.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const circle = L.circleMarker([k.lat, k.lng], {
          radius, color: isActive ? '#EF4444' : color, fillColor: color,
          fillOpacity: isActive ? 0.9 : 0.65, weight: isActive ? 2.5 : 1.5,
        });
        circle.bindPopup(`
          <div style="min-width:200px;font-family:system-ui,sans-serif;border-radius:10px;overflow:hidden">
            <div style="background:${color}20;padding:10px 14px;border-bottom:1px solid ${color}30">
              <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">${k.jenis} · ${isActive ? '🔴 AKTIF' : '⚫ Selesai'}</div>
              <div style="font-size:14px;font-weight:700;color:${popupText}">${k.nama}</div>
              <div style="font-size:11px;color:${popupMuted};margin-top:2px">${k.kabupaten}, ${k.provinsi}</div>
            </div>
            <div style="padding:10px 14px;background:${popupBg}">
              <div style="display:flex;gap:14px;margin-bottom:6px">
                <div><div style="font-size:10px;color:${popupMuted}">Korban Jiwa</div><div style="font-size:16px;font-weight:700;color:#EF4444">${k.korban_jiwa}</div></div>
                <div><div style="font-size:10px;color:${popupMuted}">Pengungsi</div><div style="font-size:16px;font-weight:700;color:#0EA5E9">${k.pengungsi.toLocaleString('id')}</div></div>
                <div><div style="font-size:10px;color:${popupMuted}">Level</div><div style="font-size:13px;font-weight:700;color:${k.level==='tinggi'?'#EF4444':k.level==='sedang'?'#F97316':'#22C55E'}">${k.level.toUpperCase()}</div></div>
              </div>
              <div style="font-size:10px;color:${popupMuted};border-top:1px solid ${isDarkM?'#1E3A5F':'#E2E8F0'};padding-top:6px;margin-top:4px">📅 ${tanggal}</div>
            </div>
          </div>
        `, { maxWidth: 240 });
        circle.addTo(map);
        markersRef.current.push(circle);
      });
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
        bnpbLayersRef.current = {};
        baseTileRefs.current = [];
        drawLayerRef.current = null;
        activeDrawRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch basemap
  useEffect(() => {
    const L = leafletRef.current; const map = mapRef.current;
    if (!L || !map) return;
    baseTileRefs.current.forEach((t) => map.removeLayer(t));
    const bm = BASEMAPS.find((b) => b.id === activeBasemap);
    if (!bm) return;
    baseTileRefs.current = bm.layers.map((l) =>
      L.tileLayer(l.url, { attribution: l.attr, maxZoom: 20 }).addTo(map)
    );
    markersRef.current.forEach((m) => m.bringToFront?.());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBasemap]);

  // BNPB overlays
  useEffect(() => {
    const L = leafletRef.current; const map = mapRef.current;
    if (!L || !map) return;
    Object.keys(bnpbLayersRef.current).forEach((id) => {
      if (!activeOverlays.includes(id)) { map.removeLayer(bnpbLayersRef.current[id]); delete bnpbLayersRef.current[id]; }
    });
    activeOverlays.forEach((id) => {
      if (bnpbLayersRef.current[id]) return;
      const def = BNPB_LAYERS.find((l) => l.id === id);
      if (!def) return;
      if (def.type === 'VectorTileServer') {
        const tryAddVector = () => {
          if (!mapRef.current || bnpbLayersRef.current[id]) return;
          const vl = createVectorTileLayer(L, def.url, def.color);
          if (!vl) {
            // vectorgrid not loaded yet — wait for script load event
            const existing = document.getElementById('leaflet-vectorgrid-js');
            if (existing) existing.addEventListener('load', tryAddVector, { once: true });
            return;
          }
          bnpbLayersRef.current[id] = vl;
          vl.addTo(mapRef.current);
        };
        tryAddVector();
      } else {
        bnpbLayersRef.current[id] = createArcGISExportLayer(L, def.url, 0.72, def.type === 'ImageServer');
        bnpbLayersRef.current[id].addTo(map);
      }
    });
  }, [activeOverlays]);

  // FlyTo
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, { duration: 1.5 });
  }, [flyTo]);

  // Draw tools
  useEffect(() => {
    const L = leafletRef.current; const map = mapRef.current;
    if (!L || !map) return;
    if (activeDrawRef.current) {
      try { activeDrawRef.current.disable(); } catch { /* */ }
      activeDrawRef.current = null;
    }
    if (!activeDraw || !drawLayerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const D = (L as any).Draw;
    if (!D) return; // leaflet.draw not loaded yet

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handler: any;
    const opts = { shapeOptions: { color: '#0EA5E9', weight: 2 } };
    if (activeDraw === 'polyline')     handler = new D.Polyline(map, opts);
    if (activeDraw === 'polygon')      handler = new D.Polygon(map, opts);
    if (activeDraw === 'rectangle')    handler = new D.Rectangle(map, opts);
    if (activeDraw === 'circle')       handler = new D.Circle(map, opts);
    if (activeDraw === 'marker')       handler = new D.Marker(map, {});
    if (activeDraw === 'circlemarker') handler = new D.CircleMarker(map, opts);

    if (!handler) return;
    handler.enable();
    activeDrawRef.current = handler;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.once('draw:created', (e: any) => {
      drawLayerRef.current.addLayer(e.layer);
      setActiveDraw(null);
      activeDrawRef.current = null;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDraw]);

  const togglePanel = (panel: ActivePanel) =>
    setActivePanel((prev) => (prev === panel ? null : panel));

  const isDark = theme === 'dark';
  const panelBg    = isDark ? 'rgba(8,18,36,0.97)'     : 'rgba(255,255,255,0.97)';
  const panelText  = isDark ? '#F1F5F9'                 : '#0F172A';
  const panelBorder= isDark ? 'rgba(30,58,95,0.8)'     : 'rgba(0,0,0,0.1)';
  const panelMuted = isDark ? '#94A3B8'                 : '#64748B';
  const btnBg      = isDark ? 'rgba(8,18,36,0.92)'     : 'rgba(255,255,255,0.92)';

  const toolBtn = (isActive: boolean): React.CSSProperties => ({
    width: 34, height: 34,
    background: isActive ? '#0EA5E9' : btnBg,
    border: `1.5px solid ${isActive ? '#0EA5E9' : panelBorder}`,
    borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, color: isActive ? '#fff' : panelText,
    boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
    transition: 'all 0.15s', flexShrink: 0,
  });

  const panel: React.CSSProperties = {
    position: 'absolute', top: 0, right: 42,
    background: panelBg, border: `1.5px solid ${panelBorder}`,
    borderRadius: 10, width: 220,
    boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
    backdropFilter: 'blur(14px)', maxHeight: 360, overflowY: 'auto',
  };

  const pHead: React.CSSProperties = {
    padding: '9px 12px 7px', borderBottom: `1px solid ${panelBorder}`,
    fontSize: 11, fontWeight: 700, color: panelText,
    position: 'sticky', top: 0, background: panelBg, zIndex: 1,
  };

  const rowBtn = (isOn: boolean, color: string): React.CSSProperties => ({
    width: '100%', padding: '6px 12px',
    background: isOn ? `${color}18` : 'transparent',
    border: 'none', borderLeft: `3px solid ${isOn ? color : 'transparent'}`,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    textAlign: 'left', transition: 'background 0.15s',
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden' }} />

      {/* Right toolbar */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 800, display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Basemap selector */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activePanel === 'basemap')} onClick={() => togglePanel('basemap')} title="Pilih Basemap">🛰️</button>
          {activePanel === 'basemap' && (
            <div style={panel}>
              <div style={pHead}>Pilih Basemap</div>
              <div style={{ padding: '4px 0' }}>
                {BASEMAPS.map((bm) => {
                  const isOn = activeBasemap === bm.id;
                  return (
                    <button key={bm.id} onClick={() => { setActiveBasemap(bm.id); setActivePanel(null); }} style={rowBtn(isOn, '#0EA5E9')}>
                      <span style={{ width: 13, height: 13, borderRadius: '50%', flexShrink: 0, background: isOn ? '#0EA5E9' : 'transparent', border: `2px solid ${isOn ? '#0EA5E9' : panelMuted}` }} />
                      <span style={{ fontSize: 12, color: panelText, fontWeight: isOn ? 700 : 400 }}>{bm.emoji} {bm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* BNPB Layers */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activePanel === 'layers')} onClick={() => togglePanel('layers')} title="Layer Bahaya InARISK">🗺️</button>
          {activePanel === 'layers' && (
            <div style={panel}>
              <div style={pHead}>Layer Peta <span style={{ fontSize: 9, fontWeight: 400, color: panelMuted }}>© BNPB · BIG</span></div>
              {/* Group by source */}
              {['BIG', 'BNPB'].map((grp) => {
                const grpLayers = BNPB_LAYERS.filter((l) => l.group === grp);
                const grpColor: Record<string, string> = { BIG: '#22C55E', BNPB: '#35a7ff' };
                return (
                  <div key={grp}>
                    <div style={{ padding: '5px 12px 3px', fontSize: 9, fontWeight: 700, color: grpColor[grp] ?? panelMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {grp === 'BIG' ? '🌿 BIG — Geospasial' : '⚠️ BNPB — InARISK'}
                    </div>
                    {grpLayers.map((layer) => {
                      const isOn = activeOverlays.includes(layer.id);
                      const badge = layer.type === 'VectorTileServer' ? 'VT' : layer.type === 'ImageServer' ? 'IS' : 'MS';
                      return (
                        <button key={layer.id} onClick={() => setActiveOverlays((p) => isOn ? p.filter((x) => x !== layer.id) : [...p, layer.id])} style={rowBtn(isOn, layer.color)}>
                          <span style={{ width: 13, height: 13, borderRadius: 3, flexShrink: 0, background: isOn ? layer.color : 'transparent', border: `2px solid ${layer.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isOn && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </span>
                          <span style={{ fontSize: 11, color: panelText, fontWeight: isOn ? 600 : 400, flex: 1 }}>{layer.emoji} {layer.label}</span>
                          <span style={{ fontSize: 8, color: panelMuted, flexShrink: 0 }}>{badge}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              {activeOverlays.length > 0 && (
                <div style={{ padding: '6px 12px 8px', borderTop: `1px solid ${panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: panelMuted }}>{activeOverlays.length} aktif</span>
                  <button onClick={() => setActiveOverlays([])} style={{ fontSize: 9, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Reset</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activePanel === 'legend')} onClick={() => togglePanel('legend')} title="Legenda">📊</button>
          {activePanel === 'legend' && (
            <div style={{ ...panel, width: 186 }}>
              <div style={pHead}>Legenda</div>
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: panelMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Jenis Bencana</div>
                {LEGEND_ITEMS.map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', flexShrink: 0, background: item.color, boxShadow: `0 0 4px ${item.color}80` }} />
                    <span style={{ fontSize: 11, color: panelText }}>{item.label}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${panelBorder}`, marginTop: 6, paddingTop: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: panelMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: panelText }}>Aktif (saat ini)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'transparent', border: `1.5px solid ${panelMuted}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: panelText }}>Selesai / Pasca</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 9, color: panelMuted }}>Ukuran ∝ skala dampak</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Draw tools */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activePanel === 'draw' || activeDraw !== null)} onClick={() => { togglePanel('draw'); if (activeDraw) { if (activeDrawRef.current) { try { activeDrawRef.current.disable(); } catch{/**/ } activeDrawRef.current=null; } setActiveDraw(null); } }} title="Alat Gambar">✏️</button>
          {activePanel === 'draw' && (
            <div style={{ ...panel, width: 194 }}>
              <div style={pHead}>
                Alat Gambar
                {activeDraw && <span style={{ fontSize: 9, color: '#0EA5E9', marginLeft: 6 }}>{DRAW_TOOLS.find((t) => t.id === activeDraw)?.label} aktif</span>}
              </div>
              <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {DRAW_TOOLS.map((tool) => {
                  const isOn = activeDraw === tool.id;
                  return (
                    <button key={tool.id} onClick={() => setActiveDraw(isOn ? null : tool.id)} title={tool.label}
                      style={{ padding: '7px 4px', background: isOn ? 'rgba(14,165,233,0.2)' : 'transparent', border: `1.5px solid ${isOn ? '#0EA5E9' : panelBorder}`, borderRadius: 7, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.15s' }}>
                      <span style={{ fontSize: 16 }}>{tool.icon}</span>
                      <span style={{ fontSize: 8.5, color: isOn ? '#0EA5E9' : panelMuted, fontWeight: isOn ? 700 : 400 }}>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ padding: '4px 10px 8px', borderTop: `1px solid ${panelBorder}` }}>
                <button onClick={() => { drawLayerRef.current?.clearLayers(); }} style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  🗑️ Hapus semua gambar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
