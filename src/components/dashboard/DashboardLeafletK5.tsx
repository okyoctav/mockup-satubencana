'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useState, useEffect, useRef } from 'react';
import { Layers, Search, Check, X, Eye, Activity, MapPin, Pencil, BarChart2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet-draw';

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
  type?: 'MapServer' | 'ImageServer' | 'VectorTileServer' | 'WMS';
  group?: string;
  useLngLat?: boolean;
  layersParam?: string;
  extent?: [number, number, number, number];
}

interface MapServerLegendItem {
  label: string;
  imageData: string;
  layerName: string;
}

interface BmkgGempa {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi?: string;
}

const BASEMAPS = [
  {
    id: 'esri_imagery',
    label: 'Citra Satelit',
    emoji: '🛰️',
    layers: [
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri, Maxar' },
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
    ],
  },
  {
    id: 'openstreetmap',
    label: 'OpenStreetMap',
    emoji: '🗺️',
    layers: [
      { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap' },
    ],
  },
  {
    id: 'big_rbi',
    label: 'RBI Indonesia (BIG)',
    emoji: '🏛️',
    layers: [
      { url: 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/tile/{z}/{y}/{x}', attr: '© BIG' },
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
];

const HEXBIN_RES9_URL = 'https://geospasial.bappenas.go.id/server/rest/services/Produksi/hexbin_agg9/MapServer/0';

const BNPB_LAYERS: BnpbLayer[] = [
  {
    id: 'kjs_kabkota',
    label: 'BAPPENAS — KJS Kab/Kota Risk 2024',
    color: '#1aa7ed',
    emoji: '🏙️',
    url: 'https://geoservices.bappenas.go.id/arcgis/rest/services/KJS/KJS_KabKota_Risk_2024/MapServer',
    type: 'MapServer',
    group: 'BAPPENAS',
    extent: [95.0, -11.0, 141.0, 6.0],
  },
  {
    id: 'dukcapil_kabkota',
    label: 'Kemendagri — Dukcapil GeoJSON Population',
    color: '#0EA5E9',
    emoji: '👥',
    url: '/data/kjs_bencana.json',
    group: 'KEMENDAGRI',
  },
  {
    id: 'big_batas_prov',
    label: 'BIG — Batas Provinsi Indonesia',
    color: '#22C55E',
    emoji: '🌿',
    url: 'https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/Batas_Provinsi_2024/MapServer',
    type: 'MapServer',
    group: 'BIG',
    extent: [95.0, -11.0, 141.0, 6.0],
  },
  {
    id: 'banjir_img',
    label: 'Banjir — InARISK (BNPB)',
    color: '#35a7ff',
    emoji: '🌊',
    url: 'https://gis.bnpb.go.id/arcgis/rest/services/inarisk/bahaya_banjir/ImageServer',
    type: 'ImageServer',
    group: 'BNPB',
  },
  {
    id: 'gempa_img',
    label: 'Gempa Bumi — InARISK (BNPB)',
    color: '#ff7f11',
    emoji: '🌋',
    url: 'https://gis.bnpb.go.id/arcgis/rest/services/inarisk/bahaya_gempabumi/ImageServer',
    type: 'ImageServer',
    group: 'BNPB',
  },
  {
    id: 'tanah_longsor_img',
    label: 'Tanah Longsor — InARISK (BNPB)',
    color: '#84cc16',
    emoji: '⛰️',
    url: 'https://gis.bnpb.go.id/arcgis/rest/services/inarisk/bahaya_tanah_longsor/ImageServer',
    type: 'ImageServer',
    group: 'BNPB',
  },
  {
    id: 'tsunami_img',
    label: 'Tsunami — InARISK (BNPB)',
    color: '#06b6d4',
    emoji: '🌊',
    url: 'https://gis.bnpb.go.id/arcgis/rest/services/inarisk/bahaya_tsunami/ImageServer',
    type: 'ImageServer',
    group: 'BNPB',
  },
  {
    id: 'cuaca_ekstrim_img',
    label: 'Cuaca Ekstrem — InARISK (BNPB)',
    color: '#eab308',
    emoji: '⚡',
    url: 'https://gis.bnpb.go.id/arcgis/rest/services/inarisk/bahaya_cuaca_ekstrem/ImageServer',
    type: 'ImageServer',
    group: 'BNPB',
  },
];

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
  { id: 'polyline', label: 'Garis', icon: '📏' },
  { id: 'polygon', label: 'Poligon', icon: '🔷' },
  { id: 'rectangle', label: 'Persegi', icon: '⬜' },
  { id: 'circle', label: 'Lingkaran', icon: '⭕' },
  { id: 'marker', label: 'Plot', icon: '📍' },
];

function parseNumber(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const p = parseFloat(val);
    return isNaN(p) ? 0 : p;
  }
  return 0;
}

function flattenLatLngs(latlngs: unknown): L.LatLng[] {
  if (!Array.isArray(latlngs)) return [];
  if (latlngs.length > 0 && latlngs[0] instanceof L.LatLng) {
    return latlngs as L.LatLng[];
  }
  const result: L.LatLng[] = [];
  latlngs.forEach((item) => {
    result.push(...flattenLatLngs(item));
  });
  return result;
}

function circleToPolygonRing(circle: L.Circle, segments = 64): [number, number][] {
  const center = circle.getLatLng();
  const radius = circle.getRadius();
  const points: [number, number][] = [];
  const latRadians = (center.lat * Math.PI) / 180;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(latRadians);

  for (let i = 0; i <= segments; i += 1) {
    const angle = (Math.PI * 2 * i) / segments;
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;
    const lat = center.lat + dy / metersPerDegreeLat;
    const lng = center.lng + dx / metersPerDegreeLng;
    points.push([lng, lat]);
  }
  return points;
}

function ensureClosedRing(ring: [number, number][]): [number, number][] {
  if (ring.length < 1) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...ring, first];
  }
  return ring;
}

function geoJsonToEsriPolygon(geometry: GeoJSON.Geometry): { geometry: unknown; geometryType: string } | null {
  if (geometry.type === 'Polygon') {
    const rings = (geometry.coordinates as [number, number][][]).map(ensureClosedRing);
    return {
      geometry: { rings, spatialReference: { wkid: 4326 } },
      geometryType: 'esriGeometryPolygon',
    };
  }
  if (geometry.type === 'MultiPolygon') {
    const rings = ([] as [number, number][][]).concat(
      ...(geometry.coordinates as [number, number][][][]).map((polygon) => polygon.map(ensureClosedRing))
    );
    return {
      geometry: { rings, spatialReference: { wkid: 4326 } },
      geometryType: 'esriGeometryPolygon',
    };
  }
  return null;
}

function layerToEsriPolygon(drawLayer: L.Layer): { geometry: unknown; geometryType: string } | null {
  if (drawLayer instanceof L.Circle) {
    return {
      geometry: { rings: [circleToPolygonRing(drawLayer)], spatialReference: { wkid: 4326 } },
      geometryType: 'esriGeometryPolygon',
    };
  }
  if (drawLayer instanceof L.Polygon) {
    const latlngs = flattenLatLngs((drawLayer as L.Polygon).getLatLngs());
    if (latlngs.length < 3) return null;
    const ring = ensureClosedRing(latlngs.map((latlng) => [latlng.lng, latlng.lat] as [number, number]));
    return {
      geometry: { rings: [ring], spatialReference: { wkid: 4326 } },
      geometryType: 'esriGeometryPolygon',
    };
  }
  const anyLayer = drawLayer as { toGeoJSON?: () => GeoJSON.Feature };
  if (typeof anyLayer.toGeoJSON === 'function') {
    const feature = anyLayer.toGeoJSON();
    if (feature?.geometry) {
      return geoJsonToEsriPolygon(feature.geometry);
    }
  }
  return null;
}

type HexbinStats = {
  countHex: number;
  totalLakiLaki: number;
  totalPerempuan: number;
  totalLansia: number;
  totalBalita: number;
  totalPd1: number;
  totalPd2: number;
  totalKeluarga: number;
};

async function queryHexbinRes9Stats(drawLayer: L.Layer): Promise<HexbinStats> {
  const queryGeometry = layerToEsriPolygon(drawLayer);
  if (!queryGeometry) {
    return { countHex: 0, totalLakiLaki: 0, totalPerempuan: 0, totalLansia: 0, totalBalita: 0, totalPd1: 0, totalPd2: 0, totalKeluarga: 0 };
  }

  const queryUrl = `${HEXBIN_RES9_URL}/query`;
  const outStatistics = JSON.stringify([
    { statisticType: 'count', onStatisticField: 'objectid', outStatisticFieldName: 'cnt_hex' },
    { statisticType: 'sum', onStatisticField: 'jml_lakila', outStatisticFieldName: 'sum_jml_lakila' },
    { statisticType: 'sum', onStatisticField: 'jml_peremp', outStatisticFieldName: 'sum_jml_peremp' },
    { statisticType: 'sum', onStatisticField: 'jml_lansia', outStatisticFieldName: 'sum_jml_lansia' },
    { statisticType: 'sum', onStatisticField: 'jml_balita', outStatisticFieldName: 'sum_jml_balita' },
    { statisticType: 'sum', onStatisticField: 'jml_pd1', outStatisticFieldName: 'sum_jml_pd1' },
    { statisticType: 'sum', onStatisticField: 'jml_pd2', outStatisticFieldName: 'sum_jml_pd2' },
    { statisticType: 'sum', onStatisticField: 'jml_klg', outStatisticFieldName: 'sum_jml_klg' },
  ]);

  const params = new URLSearchParams({
    f: 'json',
    geometry: JSON.stringify(queryGeometry.geometry),
    geometryType: queryGeometry.geometryType,
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    outSR: '4326',
    returnGeometry: 'false',
    outStatistics,
    where: '1=1',
  });

  const response = await fetch(queryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) throw new Error(`Query failed: ${response.status}`);
  const json = await response.json();
  const attrs = (json.features?.[0]?.attributes ?? {}) as Record<string, unknown>;
  return {
    countHex: parseNumber(attrs.cnt_hex),
    totalLakiLaki: parseNumber(attrs.sum_jml_lakila),
    totalPerempuan: parseNumber(attrs.sum_jml_peremp),
    totalLansia: parseNumber(attrs.sum_jml_lansia),
    totalBalita: parseNumber(attrs.sum_jml_balita),
    totalPd1: parseNumber(attrs.sum_jml_pd1),
    totalPd2: parseNumber(attrs.sum_jml_pd2),
    totalKeluarga: parseNumber(attrs.sum_jml_klg),
  };
}

export default function DashboardLeafletK5({ data, flyTo }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previewMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseLayersRef = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previewBaseLayersRef = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlayLayersRef = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previewOverlayLayersRef = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bmkgMarkersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeDrawRef = useRef<any>(null);
  const kjsLayerRef = useRef<L.GeoJSON | null>(null);

  const [activeBasemap, setActiveBasemap] = useState('esri_imagery');
  const [draftBasemap, setDraftBasemap] = useState('esri_imagery');
  const [activeOverlays, setActiveOverlays] = useState<string[]>(['cuaca_ekstrim_img']);
  const [draftOverlays, setDraftOverlays] = useState<string[]>(['cuaca_ekstrim_img']);
  const [showLayerModal, setShowLayerModal] = useState(false);
  const [layerSearch, setLayerSearch] = useState('');
  const [layerGroupFilter, setLayerGroupFilter] = useState('ALL');
  
  const [showBmkg, setShowBmkg] = useState(true);
  const [bmkgData, setBmkgData] = useState<BmkgGempa[]>([]);
  const [showBencanaData, setShowBencanaData] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [showDrawTools, setShowDrawTools] = useState(false);
  const [activeDraw, setActiveDraw] = useState<string | null>(null);
  const [mapserverLegends, setMapserverLegends] = useState<Record<string, MapServerLegendItem[]>>({});
  
  const [glassSearchQuery, setGlassSearchQuery] = useState('');
  const [glassSearchResults, setGlassSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);

  const handleOpenLayerModal = () => {
    setDraftBasemap(activeBasemap);
    setDraftOverlays([...activeOverlays]);
    setShowLayerModal(true);
  };

  const handleApplyLayers = () => {
    setActiveBasemap(draftBasemap);
    setActiveOverlays([...draftOverlays]);
    setShowLayerModal(false);
  };

  const handleGlassSearch = async () => {
    if (!glassSearchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(glassSearchQuery)}&countrycodes=id`);
      const json = await res.json();
      setGlassSearchResults(json || []);
    } catch {
      setGlassSearchResults([]);
    }
  };

  // Inject BMKG animation CSS
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('bmkg-anim-css')) return;
    const style = document.createElement('style');
    style.id = 'bmkg-anim-css';
    style.textContent = `
      @keyframes bmkgRipple { 0% { transform: translate(-50%,-50%) scale(0.6); opacity: 0.9; } 100% { transform: translate(-50%,-50%) scale(3.6); opacity: 0; } }
      .bmkg-wrap { position:relative; display:inline-block; cursor:pointer; }
      .bmkg-ring { position:absolute; top:50%; left:50%; border-radius:50%; border:2px solid; animation: bmkgRipple 2.2s ease-out infinite; pointer-events:none; }
      .bmkg-dot { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); border-radius:50%; border:2px solid rgba(255,255,255,0.9); z-index:3; }
    `;
    document.head.appendChild(style);
  }, []);

  // Fetch BMKG earthquakes
  useEffect(() => {
    const fetchBmkg = async () => {
      try {
        const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', { cache: 'no-store' });
        const json = await res.json();
        setBmkgData(json?.Infogempa?.gempa ?? []);
      } catch {
        setBmkgData([]);
      }
    };
    fetchBmkg();
    const timer = setInterval(fetchBmkg, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch MapServer Legends
  useEffect(() => {
    BNPB_LAYERS.filter((l) => l.type === 'MapServer' && activeOverlays.includes(l.id)).forEach((layer) => {
      fetch(`${layer.url}/legend?f=pjson`)
        .then((r) => r.json())
        .then((json) => {
          const items: MapServerLegendItem[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (json?.layers ?? []).forEach((lyr: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (lyr.legend ?? []).forEach((item: any) => {
              if (item.imageData) items.push({ label: item.label || lyr.layerName || '—', imageData: item.imageData, layerName: lyr.layerName ?? '' });
            });
          });
          setMapserverLegends((p) => ({ ...p, [layer.id]: items }));
        })
        .catch(() => null);
    });
  }, [activeOverlays]);

  // Load Leaflet.draw CDN
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

  // Initialize Main Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).L = L;
    const map = L.map(containerRef.current, { center: [-2.5489, 118.0149], zoom: 5, zoomControl: false });
    mapRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    drawLayerRef.current = L.featureGroup().addTo(map);

    // Setup Basemaps
    BASEMAPS.forEach((bm) => {
      const group = L.layerGroup();
      bm.layers.forEach((l) => L.tileLayer(l.url, { attribution: l.attr, maxZoom: 19 }).addTo(group));
      baseLayersRef.current[bm.id] = group;
    });

    if (baseLayersRef.current['esri_imagery']) baseLayersRef.current['esri_imagery'].addTo(map);

    // Load GeoJSON
    fetch('/data/kjs_bencana.json')
      .then((r) => r.json())
      .then((geoJsonData) => {
        const geoLayer = L.geoJSON(geoJsonData, {
          style: { color: '#0EA5E9', weight: 1.5, opacity: 0.8, fillOpacity: 0.15 },
          onEachFeature: (feature, layer) => {
            const prop = feature.properties || {};
            layer.bindPopup(`
              <div style="font-family:sans-serif; padding:4px;">
                <div style="font-weight:bold; color:#19506e; font-size:12px;">${prop.WADMKK || prop.NAMOBJ || 'Wilayah Dukcapil'}</div>
                <div style="font-size:11px; color:#555; margin-top:2px;">Provinsi: ${prop.WADMPR || '-'}</div>
              </div>
            `);
          },
        });
        kjsLayerRef.current = geoLayer;
        geoLayer.addTo(map);
      })
      .catch(() => null);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render Disaster JSON Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (!showBencanaData) return;

    data.forEach((k) => {
      const color = JENIS_COLOR[k.jenis] ?? '#94A3B8';
      const radius = Math.min(8 + k.korban_jiwa * 0.3 + k.pengungsi * 0.001, 22);
      const circle = L.circleMarker([k.lat, k.lng], {
        radius, color: k.status === 'saat' ? '#EF4444' : color, fillColor: color, fillOpacity: 0.7, weight: 2,
      });
      circle.bindPopup(`
        <div style="font-family:sans-serif; min-width:180px;">
          <div style="font-weight:bold; color:${color}; font-size:12px;">${k.jenis.toUpperCase()} · ${k.nama}</div>
          <div style="font-size:11px; color:#666;">${k.kabupaten}, ${k.provinsi}</div>
          <div style="font-size:11px; margin-top:4px;">Korban: <b>${k.korban_jiwa}</b> | Pengungsi: <b>${k.pengungsi}</b></div>
        </div>
      `);
      circle.addTo(map);
      markersRef.current.push(circle);
    });
  }, [data, showBencanaData]);

  // Render BMKG Earthquakes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    bmkgMarkersRef.current.forEach((m) => map.removeLayer(m));
    bmkgMarkersRef.current = [];

    if (!showBmkg) return;

    bmkgData.forEach((g) => {
      const parts = g.Coordinates.split(',');
      if (parts.length < 2) return;
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) return;

      const mag = parseFloat(g.Magnitude);
      const color = mag >= 6 ? '#DC2626' : mag >= 5 ? '#F97316' : '#FBBF24';
      const icon = L.divIcon({
        className: '',
        html: `<div class="bmkg-wrap" style="width:30px;height:30px">
          <div class="bmkg-ring" style="width:20px;height:20px;border-color:${color};"></div>
          <div class="bmkg-dot" style="width:10px;height:10px;background:${color};"></div>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([lat, lng], { icon });
      marker.bindPopup(`
        <div style="font-family:sans-serif;">
          <div style="font-weight:bold; color:${color}; font-size:12px;">📳 GEMPA M ${g.Magnitude}</div>
          <div style="font-size:11px; color:#333;">${g.Wilayah}</div>
          <div style="font-size:10px; color:#666;">Kedalaman: ${g.Kedalaman} | ${g.Tanggal} ${g.Jam}</div>
        </div>
      `);
      marker.addTo(map);
      bmkgMarkersRef.current.push(marker);
    });
  }, [bmkgData, showBmkg]);

  // Initialize Modal Preview Map Canvas
  useEffect(() => {
    if (!showLayerModal || !previewContainerRef.current) return;

    let pMap = previewMapRef.current;
    if (!pMap) {
      pMap = L.map(previewContainerRef.current, {
        center: mapRef.current ? mapRef.current.getCenter() : [-2.5489, 118.0149],
        zoom: mapRef.current ? mapRef.current.getZoom() : 5,
        zoomControl: false,
        attributionControl: false,
      });
      previewMapRef.current = pMap;

      BASEMAPS.forEach((bm) => {
        const group = L.layerGroup();
        bm.layers.forEach((l) => L.tileLayer(l.url, { maxZoom: 19 }).addTo(group));
        previewBaseLayersRef.current[bm.id] = group;
      });
    }

    setTimeout(() => pMap.invalidateSize(), 100);
  }, [showLayerModal]);

  // Update Preview Map Basemap & Overlays Live
  useEffect(() => {
    if (!previewMapRef.current || !showLayerModal) return;
    const pMap = previewMapRef.current;

    Object.keys(previewBaseLayersRef.current).forEach((id) => {
      if (id === draftBasemap) previewBaseLayersRef.current[id].addTo(pMap);
      else pMap.removeLayer(previewBaseLayersRef.current[id]);
    });

    BNPB_LAYERS.forEach((l) => {
      if (draftOverlays.includes(l.id)) {
        if (!previewOverlayLayersRef.current[l.id]) {
          if (l.type === 'ImageServer' || l.type === 'MapServer') {
            previewOverlayLayersRef.current[l.id] = L.tileLayer(`${l.url}/tile/{z}/{y}/{x}`, { maxZoom: 19, opacity: 0.75 });
          }
        }
        if (previewOverlayLayersRef.current[l.id]) previewOverlayLayersRef.current[l.id].addTo(pMap);
      } else {
        if (previewOverlayLayersRef.current[l.id]) pMap.removeLayer(previewOverlayLayersRef.current[l.id]);
      }
    });
  }, [draftBasemap, draftOverlays, showLayerModal]);

  // Update Main Map Basemap
  useEffect(() => {
    if (!mapRef.current) return;
    Object.keys(baseLayersRef.current).forEach((id) => {
      if (id === activeBasemap) baseLayersRef.current[id].addTo(mapRef.current);
      else mapRef.current.removeLayer(baseLayersRef.current[id]);
    });
  }, [activeBasemap]);

  // Update Main Map Overlays
  useEffect(() => {
    if (!mapRef.current) return;
    BNPB_LAYERS.forEach((l) => {
      if (activeOverlays.includes(l.id)) {
        if (!overlayLayersRef.current[l.id]) {
          if (l.type === 'ImageServer' || l.type === 'MapServer') {
            overlayLayersRef.current[l.id] = L.tileLayer(`${l.url}/tile/{z}/{y}/{x}`, { maxZoom: 19, opacity: 0.75 });
          }
        }
        if (overlayLayersRef.current[l.id]) overlayLayersRef.current[l.id].addTo(mapRef.current);
      } else {
        if (overlayLayersRef.current[l.id]) mapRef.current.removeLayer(overlayLayersRef.current[l.id]);
      }
    });
  }, [activeOverlays]);

  // Handle Leaflet Draw Event & BAPPENAS Estimation
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (activeDrawRef.current) {
      try { activeDrawRef.current.disable(); } catch { /* empty */ }
      activeDrawRef.current = null;
    }

    if (!activeDraw) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const D = (L as any).Draw;
    if (!D) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handler: any;
    const opts = { shapeOptions: { color: '#1f8080', weight: 2, fillOpacity: 0.2 } };
    if (activeDraw === 'polyline') handler = new D.Polyline(map, opts);
    if (activeDraw === 'polygon') handler = new D.Polygon(map, opts);
    if (activeDraw === 'rectangle') handler = new D.Rectangle(map, opts);
    if (activeDraw === 'circle') handler = new D.Circle(map, opts);
    if (activeDraw === 'marker') handler = new D.Marker(map, {});

    if (handler) {
      handler.enable();
      activeDrawRef.current = handler;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.once('draw:created', async (e: any) => {
        const layer = e.layer;
        drawLayerRef.current.addLayer(layer);
        setActiveDraw(null);

        if (e.layerType === 'marker' || e.layerType === 'polyline') return;

        const popupCenter = layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng();
        const popup = L.popup({ maxWidth: 300 })
          .setLatLng(popupCenter)
          .setContent('<div style="font-size:11px; color:#1f8080; font-weight:bold;">⏳ Menghitung estimasi kependudukan BAPPENAS...</div>')
          .openOn(map);

        try {
          const stats = await queryHexbinRes9Stats(layer);
          popup.setContent(`
            <div style="font-family:sans-serif; min-width:220px; font-size:11px;">
              <div style="font-weight:bold; color:#19506e; border-b:1px solid #ddd; pb-1; margin-bottom:6px;">📐 Estimasi Dampak Kependudukan (BAPPENAS)</div>
              <div>👨 Laki-laki: <b>${stats.totalLakiLaki.toLocaleString('id')}</b></div>
              <div>👩 Perempuan: <b>${stats.totalPerempuan.toLocaleString('id')}</b></div>
              <div>👴 Lansia: <b>${stats.totalLansia.toLocaleString('id')}</b></div>
              <div>🧒 Balita: <b>${stats.totalBalita.toLocaleString('id')}</b></div>
              <div>🏠 Total Keluarga: <b>${stats.totalKeluarga.toLocaleString('id')}</b></div>
            </div>
          `);
        } catch {
          popup.setContent('<div style="font-size:11px; color:red;">Gagal menghitung estimasi kependudukan.</div>');
        }
      });
    }
  }, [activeDraw]);

  // Handle FlyTo
  useEffect(() => {
    if (mapRef.current && flyTo) mapRef.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, { duration: 1.5 });
  }, [flyTo]);

  const filteredModalLayers = BNPB_LAYERS.filter((l) => {
    const matchesSearch = l.label.toLowerCase().includes(layerSearch.toLowerCase()) || l.group?.toLowerCase().includes(layerSearch.toLowerCase());
    const matchesGroup = layerGroupFilter === 'ALL' || l.group === layerGroupFilter;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="relative w-full h-full overflow-hidden font-sans">
      {/* Map Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* 1. GLASSMORPHIC ELEGANT SEARCH FLOATING TOOLBAR */}
      <div className="absolute top-4 left-4 z-[400] max-w-sm w-full space-y-2">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-lg transition-all duration-200 focus-within:bg-white/70 focus-within:border-white">
          <input
            type="text"
            placeholder="Cari lokasi / wilayah..."
            value={glassSearchQuery}
            onChange={(e) => setGlassSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGlassSearch()}
            className="flex-1 bg-transparent border-none outline-none px-3 text-xs text-slate-900 placeholder:text-slate-600 font-medium"
          />
          <button
            onClick={handleGlassSearch}
            className="w-8 h-8 rounded-xl bg-[#1f8080]/80 hover:bg-[#1f8080] text-white flex items-center justify-center backdrop-blur-md shadow-xs transition-all hover:scale-105"
            title="Cari"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenLayerModal}
            className="px-3 h-8 rounded-xl bg-white/50 hover:bg-white/80 text-[#19506e] font-bold text-xs flex items-center gap-1.5 border border-white/80 shadow-xs transition-all hover:scale-105"
          >
            <Layers className="w-4 h-4 text-[#1f8080]" />
            <span className="hidden sm:inline">Layer ({activeOverlays.length})</span>
          </button>
        </div>

        {/* Search Results */}
        {glassSearchResults.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl p-2 shadow-xl space-y-1 max-h-48 overflow-y-auto">
            {glassSearchResults.map((res, i) => (
              <button
                key={i}
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.flyTo([parseFloat(res.lat), parseFloat(res.lon)], 11);
                    setGlassSearchResults([]);
                  }
                }}
                className="w-full text-left p-2 rounded-xl text-xs hover:bg-[#1f8080]/10 hover:text-[#19506e] transition-colors truncate font-medium text-slate-700"
              >
                📍 {res.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. FLOATING CONTROL BUTTONS (DRAW ESTIMATOR, LIVE BMKG, BENCANA JSON, LEGENDA) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {/* Toggle BMKG Live */}
        <button
          onClick={() => setShowBmkg(!showBmkg)}
          className={`p-2.5 rounded-2xl border backdrop-blur-xl shadow-md transition-all flex items-center gap-2 ${
            showBmkg ? 'bg-[#19506e] text-white border-white/40' : 'bg-white/80 text-slate-700 border-white/80'
          }`}
          title="Toggle BMKG Gempa Terkini"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold hidden sm:inline">BMKG ({bmkgData.length})</span>
        </button>

        {/* Toggle Draw Tools Estimator */}
        <button
          onClick={() => setShowDrawTools(!showDrawTools)}
          className={`p-2.5 rounded-2xl border backdrop-blur-xl shadow-md transition-all flex items-center gap-2 ${
            showDrawTools ? 'bg-[#1f8080] text-white border-white/40' : 'bg-white/80 text-slate-700 border-white/80'
          }`}
          title="Simulasi Estimasi Demografi Draw"
        >
          <Pencil className="w-4 h-4" />
          <span className="text-xs font-bold hidden sm:inline">Draw Estimator</span>
        </button>

        {/* Draw Tool Panel */}
        {showDrawTools && (
          <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-2xl p-2 shadow-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase block">Pilih Alat Ukur</span>
            {DRAW_TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveDraw(activeDraw === t.id ? null : t.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeDraw === t.id ? 'bg-[#1f8080] text-white' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Toggle Bencana JSON Markers */}
        <button
          onClick={() => setShowBencanaData(!showBencanaData)}
          className={`p-2.5 rounded-2xl border backdrop-blur-xl shadow-md transition-all flex items-center gap-2 ${
            showBencanaData ? 'bg-[#19506e] text-white border-white/40' : 'bg-white/80 text-slate-700 border-white/80'
          }`}
          title="Toggle Titik Kejadian Bencana"
        >
          <MapPin className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold hidden sm:inline">Data Bencana</span>
        </button>

        {/* Toggle Legenda */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`p-2.5 rounded-2xl border backdrop-blur-xl shadow-md transition-all flex items-center gap-2 ${
            showLegend ? 'bg-[#19506e] text-white border-white/40' : 'bg-white/80 text-slate-700 border-white/80'
          }`}
          title="Tampilkan Legenda Peta"
        >
          <BarChart2 className="w-4 h-4" />
          <span className="text-xs font-bold hidden sm:inline">Legenda</span>
        </button>

        {/* Legenda Floating Box */}
        {showLegend && (
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-3 shadow-xl space-y-2 max-w-xs text-xs">
            <span className="font-bold text-[#19506e] block border-b pb-1">Legenda Jenis Bencana</span>
            <div className="space-y-1.5">
              {LEGEND_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-slate-700 font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            {/* MapServer Dynamic Legend Render */}
            {activeOverlays.map((lyrId) => {
              const items = mapserverLegends[lyrId];
              if (!items || items.length === 0) return null;
              return (
                <div key={lyrId} className="border-t pt-2 space-y-1">
                  <span className="font-bold text-[10px] text-slate-500 uppercase block">Layer: {lyrId}</span>
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <img src={`data:image/png;base64,${it.imageData}`} alt={it.label} className="w-4 h-4 object-contain" />
                      <span className="text-[11px] text-slate-700">{it.label}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. FULL MODAL/POPUP LAYER SELECTION (EXPANDED TO MAP CANVAS AREA) */}
      {showLayerModal && (
        <div className="absolute inset-4 z-[500] bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="bg-[#19506e] text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#1f8080] text-white shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm tracking-tight text-white">Pusat Layer Geospasial & Tematik Bencana (K5)</h2>
                <p className="text-[11px] text-slate-300">Pilih layer geospasial resmi BNPB, BAPPENAS, BIG, dan Dukcapil</p>
              </div>
            </div>
            <button onClick={() => setShowLayerModal(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: 3 GRID LAYOUT */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
            {/* GRID 1: LEFT 30% WIDTH - SEARCH & LAYER SELECTION LIST */}
            <div className="lg:col-span-4 border-r border-slate-200/80 p-5 flex flex-col gap-4 bg-slate-50/60 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#19506e] uppercase tracking-wider block">1. Cari & Filter Layer</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter nama layer / sumber..."
                    value={layerSearch}
                    onChange={(e) => setLayerSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-[#1f8080] font-medium"
                  />
                </div>
              </div>

              {/* Group Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['ALL', 'BNPB', 'BIG', 'BAPPENAS', 'KEMENDAGRI'].map((grp) => (
                  <button
                    key={grp}
                    onClick={() => setLayerGroupFilter(grp)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      layerGroupFilter === grp ? 'bg-[#1f8080] text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:border-[#1f8080]'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>

              {/* Available Layers List */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Layer Tersedia ({filteredModalLayers.length})</label>
                {filteredModalLayers.map((layer) => {
                  const isSelected = draftOverlays.includes(layer.id);
                  return (
                    <div
                      key={layer.id}
                      onClick={() => {
                        setDraftOverlays((prev) => isSelected ? prev.filter((id) => id !== layer.id) : [...prev, layer.id]);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected ? 'bg-white border-[#1f8080] shadow-sm ring-2 ring-[#1f8080]/20' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-[#1f8080] border-[#1f8080] text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 leading-tight">{layer.emoji} {layer.label}</div>
                          <span className="text-[10px] text-slate-500 font-medium">{layer.group}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600">
                        {layer.type || 'GIS'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SIDE GRID 2 & GRID 3 (70% WIDTH) */}
            <div className="lg:col-span-8 flex flex-col h-full bg-white">
              {/* GRID 2 (TOP): LIVE INTERACTIVE PREVIEW MAP CANVAS SECTION */}
              <div className="h-1/2 p-4 border-b border-slate-200 flex flex-col relative">
                <div className="flex items-center justify-between mb-2 z-10">
                  <span className="text-xs font-bold text-[#19506e] uppercase tracking-wider flex items-center gap-2 bg-white/90 px-3 py-1 rounded-xl shadow-xs border border-slate-200">
                    <Eye className="w-4 h-4 text-[#1f8080]" />
                    <span>2. Pratinjau Skema Basemap & Layer Aktif</span>
                  </span>
                  <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-xl shadow-xs border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Pilih Basemap:</span>
                    <select
                      value={draftBasemap}
                      onChange={(e) => setDraftBasemap(e.target.value)}
                      className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-0.5 text-xs font-bold text-[#19506e] outline-none cursor-pointer"
                    >
                      {BASEMAPS.map((bm) => (
                        <option key={bm.id} value={bm.id}>{bm.emoji} {bm.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Mini Leaflet Preview Container */}
                <div className="flex-1 rounded-2xl border-2 border-[#1f8080]/30 overflow-hidden relative shadow-inner">
                  <div ref={previewContainerRef} className="w-full h-full z-0 bg-slate-900" />
                  <div className="absolute bottom-3 left-3 z-[400] bg-[#19506e]/90 text-white backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold border border-white/20 shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1f8080] animate-pulse" />
                    <span>Live Pratinjau: {BASEMAPS.find((b) => b.id === draftBasemap)?.label} ({draftOverlays.length} Layer)</span>
                  </div>
                </div>
              </div>

              {/* GRID 3 (BOTTOM): SELECTED LAYERS MANAGEMENT & APPLY BUTTON */}
              <div className="h-1/2 p-5 flex flex-col justify-between bg-slate-50/40">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#19506e] uppercase tracking-wider">3. Layer Yang Dipilih ({draftOverlays.length})</span>
                    {draftOverlays.length > 0 && (
                      <button onClick={() => setDraftOverlays([])} className="text-xs font-semibold text-rose-500 hover:underline">
                        Reset Pilihan
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {draftOverlays.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-4">Belum ada layer terpilih. Silakan pilih dari panel sebelah kiri.</div>
                    ) : (
                      draftOverlays.map((id) => {
                        const lyr = BNPB_LAYERS.find((l) => l.id === id);
                        if (!lyr) return null;
                        return (
                          <div
                            key={id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#1f8080]/40 text-xs font-bold text-[#19506e] shadow-2xs"
                          >
                            <span>{lyr.emoji} {lyr.label}</span>
                            <button
                              onClick={() => setDraftOverlays((prev) => prev.filter((x) => x !== id))}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer Apply Button */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Klik &quot;Terapkan Layer&quot; untuk merender data pada peta utama.</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowLayerModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleApplyLayers}
                      className="px-6 py-2.5 rounded-xl bg-[#1f8080] hover:bg-[#1f8080]/90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 hover:scale-105"
                    >
                      <Check className="w-4 h-4" />
                      <span>Terapkan Layer Ke Peta</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
