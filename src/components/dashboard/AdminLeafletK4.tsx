'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw';

interface Props {
  flyTo: { lat: number; lng: number; zoom: number } | null;
  theme: string;
}

type DrawTool = 'polygon' | 'rectangle' | 'circle' | 'marker' | 'circlemarker' | 'polyline' | null;

type GeoJsonFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>;

type DrawHandler = {
  enable: () => void;
  disable?: () => void;
};

type LeafletDrawCreatedEvent = {
  layer: L.Layer;
  layerType: string;
};

type DrawStatic = {
  Polygon: new (map: L.Map, options?: Record<string, unknown>) => DrawHandler;
  Rectangle: new (map: L.Map, options?: Record<string, unknown>) => DrawHandler;
  Circle: new (map: L.Map, options?: Record<string, unknown>) => DrawHandler;
  Marker: new (map: L.Map, options?: Record<string, unknown>) => DrawHandler;
  CircleMarker: new (map: L.Map, options?: Record<string, unknown>) => DrawHandler;
};

type ImpactDataK4 = {
  loading: boolean;
  totalLakiLaki: number;
  totalPerempuan: number;
  totalLansia: number;
  totalBalita: number;
  totalKeluarga: number;
  area: string;
  selectedCount: number;
};

const DRAW_TOOLS: Array<{ id: DrawTool; label: string; icon: string }> = [
  { id: 'polygon', label: 'Poligon', icon: '🔷' },
  { id: 'rectangle', label: 'Persegi', icon: '⬜' },
  { id: 'circle', label: 'Lingkaran', icon: '⭕' },
  { id: 'marker', label: 'Plot', icon: '📍' },
  { id: 'circlemarker', label: 'Plot Bulat', icon: '🔵' },
];

const hexStyle = {
  color: '#165176',
  weight: 1.2,
  opacity: 0.9,
  fillColor: '#1a8284',
  fillOpacity: 0.12,
};

function parseNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    return Number(value.replace(/[^0-9.-]/g, '')) || 0;
  }
  return 0;
}

function flattenLatLngs(latlngs: unknown): L.LatLng[] {
  const result: L.LatLng[] = [];
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node && typeof node === 'object' && 'lat' in node && 'lng' in node) {
      const maybeLatLng = node as { lat?: unknown; lng?: unknown };
      if (typeof maybeLatLng.lat === 'number' && typeof maybeLatLng.lng === 'number') {
        result.push(L.latLng(maybeLatLng.lat, maybeLatLng.lng));
      }
    }
  };
  visit(latlngs);
  return result;
}

function getPolygonLayersFromFeature(feature: GeoJsonFeature): L.Polygon[] {
  if (!feature || !feature.geometry) return [];
  try {
    const geoLayer = L.geoJSON(feature);
    const polygons: L.Polygon[] = [];
    geoLayer.eachLayer((subLayer) => {
      if (subLayer instanceof L.Polygon) {
        polygons.push(subLayer);
      }
    });
    return polygons;
  } catch {
    return [];
  }
}

function anyPointInsideLayer(layer: L.Layer, points: L.LatLng[]): boolean {
  return points.some((point) => isPointInsideLayer(layer, point));
}

function doesPolygonLayerIntersectDraw(polygon: L.Polygon, drawLayer: L.Layer): boolean {
  const polygonPoints = flattenLatLngs(polygon.getLatLngs());
  if (polygonPoints.length > 0 && anyPointInsideLayer(drawLayer, polygonPoints)) {
    return true;
  }

  if (drawLayer instanceof L.Polygon) {
    const drawPoints = flattenLatLngs(drawLayer.getLatLngs());
    if (drawPoints.length > 0 && anyPointInsideLayer(polygon, drawPoints)) {
      return true;
    }
  }

  if (drawLayer instanceof L.Circle) {
    const bounds = drawLayer.getBounds();
    if (polygon.getBounds().intersects(bounds)) {
      const circleCenter = drawLayer.getLatLng();
      if (anyPointInsideLayer(polygon, [circleCenter])) {
        return true;
      }
      if (anyPointInsideLayer(drawLayer, polygonPoints)) {
        return true;
      }
    }
  }

  const drawBounds = (drawLayer as L.Layer & { getBounds?: () => L.LatLngBounds }).getBounds?.();
  if (drawBounds) {
    return polygon.getBounds().intersects(drawBounds);
  }

  return false;
}

function isFeatureSelected(feature: GeoJsonFeature, drawLayer: L.Layer): boolean {
  const polygonLayers = getPolygonLayersFromFeature(feature);
  return polygonLayers.some((polygon) => doesPolygonLayerIntersectDraw(polygon, drawLayer));
}

function isPointInsideLayer(layer: L.Layer, point: L.LatLng): boolean {
  if (layer instanceof L.Circle) {
    return layer.getLatLng().distanceTo(point) <= layer.getRadius();
  }
  if (layer instanceof L.Polygon) {
    const latlngs = layer.getLatLngs();
    if (!Array.isArray(latlngs) || latlngs.length === 0) return false;
    const ring = Array.isArray(latlngs[0]) ? (latlngs[0] as L.LatLng[]) : (latlngs as L.LatLng[]);
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i].lng;
      const yi = ring[i].lat;
      const xj = ring[j].lng;
      const yj = ring[j].lat;
      const intersect = ((yi > point.lat) !== (yj > point.lat)) && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  return false;
}

function buildImpactHtmlK4(data: ImpactDataK4): string {
  if (data.loading) {
    return `<div style="width:280px;font-family:system-ui,sans-serif;color:#0F172A;padding:14px;">` +
      `<div style="font-size:11px;font-weight:700;color:#0EA5E9;letter-spacing:.8px;margin-bottom:8px">📐 Simulasi K4</div>` +
      `<div style="font-size:12px;color:#64748B">Menghitung data dari GeoJSON lokal...</div>` +
      `</div>`;
  }

  return `<div style="width:280px;font-family:system-ui,sans-serif;color:#0F172A">` +
    `<div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1.5px solid #E2E8F0">` +
      `<div style="font-size:11px;font-weight:700;color:#0EA5E9;letter-spacing:.8px">📐 Simulasi K4</div>` +
      `<div style="font-size:10px;color:#64748B;margin-top:3px">` +
        `Luas terpilih ≈ <strong style="color:#0F172A">${data.area} km²</strong> · ${data.selectedCount} hex` +
      `</div>` +
    `</div>` +
    `<table style="width:100%;border-collapse:collapse;line-height:1.5">` +
      `<tr><td style="font-size:11px;color:#475569">👨 Laki-laki</td><td style="text-align:right;font-size:13px;font-weight:700;color:#0EA5E9">${data.totalLakiLaki.toLocaleString('id')}</td></tr>` +
      `<tr><td style="font-size:11px;color:#475569">👩 Perempuan</td><td style="text-align:right;font-size:13px;font-weight:700;color:#EC4899">${data.totalPerempuan.toLocaleString('id')}</td></tr>` +
      `<tr><td style="font-size:11px;color:#475569">👴 Lansia</td><td style="text-align:right;font-size:13px;font-weight:700;color:#F59E0B">${data.totalLansia.toLocaleString('id')}</td></tr>` +
      `<tr><td style="font-size:11px;color:#475569">🧒 Balita</td><td style="text-align:right;font-size:13px;font-weight:700;color:#22C55E">${data.totalBalita.toLocaleString('id')}</td></tr>` +
      `<tr><td style="font-size:11px;color:#475569">🏠 Keluarga</td><td style="text-align:right;font-size:13px;font-weight:700;color:#0F172A">${data.totalKeluarga.toLocaleString('id')}</td></tr>` +
    `</table>` +
  `</div>`;
}

export default function AdminLeafletK4({ flyTo, theme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const drawLayerRef = useRef<L.FeatureGroup | null>(null);
  const activeDrawRef = useRef<DrawHandler | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeDraw, setActiveDraw] = useState<DrawTool>(null);
  const [hexFeatures, setHexFeatures] = useState<GeoJsonFeature[]>([]);
  const [showHexLayer, setShowHexLayer] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    leafletRef.current = L;
    const map = L.map(containerRef.current, {
      center: [-2.5, 118.0],
      zoom: 5,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', maxWidth: 140 }).addTo(map);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    drawLayerRef.current = L.featureGroup().addTo(map);
    mapRef.current = map;
    setMapReady(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!showHexLayer) {
      if (hexLayerRef.current && map.hasLayer(hexLayerRef.current)) {
        map.removeLayer(hexLayerRef.current);
      }
      return;
    }
  }, [mapReady, showHexLayer]);

  const hexLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    if (hexLayerRef.current) {
      if (!map.hasLayer(hexLayerRef.current)) {
        hexLayerRef.current.addTo(map);
      }
      return;
    }

    fetch('/geojson/gj_hexkab_reso9v1.geojson')
      .then((res) => res.json())
      .then((geojson) => {
        setHexFeatures(geojson.features || []);
        const layer = L.geoJSON(geojson, {
          style: () => hexStyle,
          onEachFeature: (feature: GeoJsonFeature, layer: L.Layer) => {
            const props = feature.properties || {};
            const label = (props.nama_kab as string) || (props.nama_kabupaten as string) || (props.nama_prop as string) || 'HexKab';
            layer.bindTooltip(label, { sticky: true, direction: 'center', className: 'hexkab-tooltip' });
          },
        });
        layer.addTo(map);
        hexLayerRef.current = layer;
      })
      .catch((err) => {
        console.error('Gagal memuat GeoJSON K4:', err);
        setMapError('Gagal memuat layer GeoJSON K4. Coba refresh halaman.');
      });
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const Lns = leafletRef.current;
    if (!map || !Lns) return;

    if (activeDrawRef.current) {
      try {
        activeDrawRef.current.disable?.();
      } catch {
        // ignore
      }
      activeDrawRef.current = null;
    }
    if (!activeDraw || !drawLayerRef.current) return;

    const D = (Lns as unknown as { Draw?: DrawStatic }).Draw;
    if (!D) return;

    let handler: DrawHandler | null = null;
    const opts = { shapeOptions: { color: '#0EA5E9', weight: 2, fillOpacity: 0.15 } };
    if (activeDraw === 'polygon') handler = new D.Polygon(map, opts);
    if (activeDraw === 'rectangle') handler = new D.Rectangle(map, opts);
    if (activeDraw === 'circle') handler = new D.Circle(map, opts);
    if (activeDraw === 'marker') handler = new D.Marker(map, opts);
    if (activeDraw === 'circlemarker') handler = new D.CircleMarker(map, opts);
    if (!handler) return;

    handler.enable();
    activeDrawRef.current = handler;

    map.once('draw:created', (event: unknown) => {
      const drawEvent = event as LeafletDrawCreatedEvent;
      const layer = drawEvent.layer;
      drawLayerRef.current?.addLayer(layer);
      setActiveDraw(null);
      activeDrawRef.current = null;

      if (drawEvent.layerType === 'marker' || drawEvent.layerType === 'circlemarker' || drawEvent.layerType === 'polyline') return;

      let area = '—';
      try {
        if (drawEvent.layerType === 'circle' && layer instanceof L.Circle) {
          const r = layer.getRadius();
          const areaKm2 = Math.PI * (r / 1000) * (r / 1000);
          area = areaKm2 < 0.01 ? areaKm2.toFixed(3) : areaKm2.toFixed(2);
        } else if (layer instanceof L.Polygon) {
          const latlngs = layer.getLatLngs() as L.LatLng[][];
          const pts = Array.isArray(latlngs?.[0]) ? latlngs[0] : [];
          if (pts.length >= 3) {
            const n = pts.length;
            const avgLat = pts.reduce((sum, p) => sum + p.lat, 0) / n;
            const mPerDegLat = 111320;
            const mPerDegLng = 111320 * Math.cos(avgLat * Math.PI / 180);
            let A = 0;
            for (let i = 0; i < n; i++) {
              const j = (i + 1) % n;
              A += (pts[i].lng * mPerDegLng) * (pts[j].lat * mPerDegLat);
              A -= (pts[j].lng * mPerDegLng) * (pts[i].lat * mPerDegLat);
            }
            const areaKm2 = Math.abs(A) / 2 / 1e6;
            area = areaKm2 < 0.01 ? areaKm2.toFixed(3) : areaKm2.toFixed(2);
          }
        }
      } catch {
        area = '—';
      }

      const layerWithBounds = layer as L.Layer & { getBounds?: () => L.LatLngBounds; getLatLng?: () => L.LatLng };
      const popupCenter = layerWithBounds.getBounds?.()?.getCenter() ?? layerWithBounds.getLatLng?.() ?? L.latLng(0, 0);
      const popup = L.popup({ maxWidth: 360, minWidth: 300, className: 'impact-popup', closeButton: true, autoClose: false })
        .setLatLng(popupCenter)
        .setContent(buildImpactHtmlK4({ loading: true, totalLakiLaki: 0, totalPerempuan: 0, totalLansia: 0, totalBalita: 0, totalKeluarga: 0, area, selectedCount: 0 }))
        .openOn(map);
      popupRef.current = popup;

      let matchingFeatures: GeoJsonFeature[] = [];
      try {
        matchingFeatures = hexFeatures.filter((feature) => isFeatureSelected(feature, layer));
      } catch (err) {
        console.error('Error selecting K4 hex features:', err);
      }

      const totals = matchingFeatures.reduce(
        (sum, feature) => {
          const props = feature.properties || {};
          sum.totalLakiLaki += parseNumber(props.agg_trp3b_reso9_jml_lakilaki);
          sum.totalPerempuan += parseNumber(props.agg_trp3b_reso9_jml_perempuan);
          sum.totalLansia += parseNumber(props.agg_trp3b_reso9_jml_lansia);
          sum.totalBalita += parseNumber(props.agg_trp3b_reso9_jml_balita);
          sum.totalKeluarga += parseNumber(props.agg_trp3b_reso9_jml_klg);
          return sum;
        },
        { totalLakiLaki: 0, totalPerempuan: 0, totalLansia: 0, totalBalita: 0, totalKeluarga: 0 }
      );

      if (popupRef.current) {
        popupRef.current.setContent(buildImpactHtmlK4({
          loading: false,
          totalLakiLaki: totals.totalLakiLaki,
          totalPerempuan: totals.totalPerempuan,
          totalLansia: totals.totalLansia,
          totalBalita: totals.totalBalita,
          totalKeluarga: totals.totalKeluarga,
          area,
          selectedCount: matchingFeatures.length,
        }));
      }
    });
  }, [activeDraw, hexFeatures, mapReady]);

  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, { duration: 1.5 });
  }, [flyTo]);

  const isDark = theme === 'dark';
  const panelBg = isDark ? 'rgba(8,18,36,0.97)' : 'rgba(255,255,255,0.97)';
  const panelText = isDark ? '#F1F5F9' : '#0F172A';
  const panelBorder = isDark ? 'rgba(30,58,95,0.8)' : 'rgba(0,0,0,0.1)';
  const panelMuted = isDark ? '#94A3B8' : '#64748B';
  const btnBg = isDark ? 'rgba(8,18,36,0.92)' : 'rgba(255,255,255,0.92)';

  const toolBtn = (isActive: boolean): React.CSSProperties => ({
    width: 34,
    height: 34,
    background: isActive ? '#0EA5E9' : btnBg,
    border: `1.5px solid ${isActive ? '#0EA5E9' : panelBorder}`,
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    color: isActive ? '#fff' : panelText,
    boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
    transition: 'all 0.15s',
    flexShrink: 0,
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, width: 280, maxWidth: 'calc(100% - 24px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: 14, padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: panelText, minWidth: 82 }}>Simulasi K4</div>
            <div style={{ flex: 1, fontSize: 11, lineHeight: 1.4, color: panelMuted }}>Gunakan polygon/circle untuk memilih area K4 dari data GeoJSON lokal.</div>
          </div>
        </div>
      </div>

      <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />

      {mapError ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.88)', color: '#fff', fontSize: 13, textAlign: 'center', padding: 20, zIndex: 1500 }}>
          {mapError}
        </div>
      ) : null}

      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 800, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activeDraw !== null)} onClick={() => setActiveDraw(activeDraw ? null : 'polygon')} title="Gambar Poligon">
            🔷
          </button>
          {activeDraw && (
            <div style={{ position: 'absolute', top: 0, right: 40, background: '#0EA5E9', color: '#fff', borderRadius: 10, padding: '2px 6px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.35)', pointerEvents: 'none' }}>
              {DRAW_TOOLS.find((tool) => tool.id === activeDraw)?.label} aktif
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(showHexLayer)} onClick={() => setShowHexLayer((value) => !value)} title={showHexLayer ? 'Sembunyikan layer GeoJSON K4' : 'Tampilkan layer GeoJSON K4'}>
            🌐
          </button>
          {showHexLayer && (
            <div style={{ position: 'absolute', top: 0, right: 40, background: '#165176', color: '#fff', borderRadius: 10, padding: '2px 6px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.35)', pointerEvents: 'none' }}>
              Layer GeoJSON Aktif
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
