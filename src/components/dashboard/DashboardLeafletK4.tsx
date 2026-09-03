'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useState, useEffect, useRef } from 'react';
import { Layers, Map, Globe, BarChart2, Activity, Pencil, MapPin } from 'lucide-react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import L from 'leaflet';
import 'leaflet-draw';

interface WindowWithLeafletDraw extends Window {
  __leafletDrawLoaded?: boolean;
}

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
  type?: 'MapServer' | 'ImageServer' | 'VectorTileServer' | 'WMS' | 'Dapodik';
  group?: string;
  useLngLat?: boolean;               // use WGS84 (4326) bbox instead of Web Mercator
  layersParam?: string;              // override default 'show:0' layers param or WMS layers
  extent?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat] for auto-fly
}

function maskNikOrKk(str: string | number | undefined | null): string {
  if (!str) return '-';
  const s = String(str).trim();
  if (s.length <= 6) return s.slice(0, 2) + '****';
  if (s.length === 16) {
    return s.slice(0, 6) + '******' + s.slice(12);
  }
  return s.slice(0, 4) + '*****' + s.slice(-3);
}

function maskName(name: string | undefined | null): string {
  if (!name) return '-';
  const words = String(name).trim().split(/\s+/);
  return words
    .map((w) => {
      if (w.length <= 2) return w[0] + '*';
      if (w.length <= 4) return w.slice(0, 1) + '*'.repeat(w.length - 1);
      return w.slice(0, 2) + '*'.repeat(w.length - 2);
    })
    .join(' ');
}

interface MapServerLegendItem {
  label: string;
  imageData: string; // base64 PNG from MapServer legend endpoint
  layerName: string;
}

interface BmkgGempa {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string; // "lat,lng"
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
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri, Maxar, Earthstar Geographics' },
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
    ],
  },
  {
    id: 'openstreetmap',
    label: 'OpenStreetMap',
    emoji: '🗺️',
    layers: [
      { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
    ],
  },
  {
    id: 'big_rbi',
    label: 'RBI Indonesia (BIG)',
    emoji: '🏛️',
    layers: [
      { url: 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/tile/{z}/{y}/{x}', attr: '© Badan Informasi Geospasial (BIG)' },
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
const HEXBIN_RES9_URL = 'https://geospasial.bappenas.go.id/server/rest/services/Produksi/hexbin_agg9/MapServer/0';

const BNPB_LAYERS: BnpbLayer[] = [
  // BIG — Badan Informasi Geospasial
  { id: 'hexbin_res9', label: 'Penduduk DTSEN', color: '#1aa7ed', emoji: '👥', url: HEXBIN_RES9_URL, type: 'MapServer', group: 'BAPPENAS' },
  { id: 'satupeta_geotagging', label: 'Satupeta Geotagging (BAPPENAS DTSEN)', color: '#059669', emoji: '📍', url: '/api/satupeta-geotagging', type: 'Dapodik', group: 'BAPPENAS' },
  { id: 'big_rbi_sulawesi_lot1',       label: 'RBI Sulawesi 2024 Lot 1',      color: '#A855F7', emoji: '🗺️', url: 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI_5K_Sulawesi_2024_Lot_1_Jul/VectorTileServer',         type: 'VectorTileServer', group: 'BIG' },
  { id: 'big_penutup_lahan_sulawesi',  label: 'Penutup Lahan Sulawesi 2024',  color: '#22C55E', emoji: '🌿', url: 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI5K_PENUTUP_LAHAN_SULAWESI_2024/VectorTileServer',    type: 'VectorTileServer', group: 'BIG' },
  { id: 'big_bangunan_fasum_sulawesi', label: 'Bangunan Fasum Sulawesi 2024', color: '#F59E0B', emoji: '🏛️', url: 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI5K_BANGUNAN_FASUM_SULAWESI_2024/VectorTileServer', type: 'VectorTileServer', group: 'BIG' },
  { id: 'petadasar_bitung', label: 'Peta Dasar Bitung 2024', color: '#F472B6', emoji: '🏢', url: 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/PETADASAR_SULAWESI_BITUNG_2024_5K/MapServer/18', type: 'MapServer', group: 'BIG', useLngLat: true, layersParam: 'show:all', extent: [125.088, 1.375, 125.229, 1.476] },
  // BNPB InARISK
  { id: 'banjir_wms', label: 'Banjir WMS', color: '#0EA5E9', emoji: '🌊', url: 'https://inarisk1.bnpb.go.id:8443/geoserver/raster/wms', type: 'WMS', group: 'BNPB', layersParam: 'raster:INDEKS_BAHAYA_BANJIR1' },
  { id: 'longsor_wms', label: 'Longsor WMS', color: '#F97316', emoji: '⛰️', url: 'https://inarisk1.bnpb.go.id:8443/geoserver/raster/wms', type: 'WMS', group: 'BNPB', layersParam: 'raster:INDEKS_BAHAYA_TANAHLONGSOR1' },
  { id: 'cuacaekstrim_wms', label: 'Cuaca Ekstrim WMS', color: '#F97316', emoji: '⛰️', url: 'https://inarisk1.bnpb.go.id:8443/geoserver/raster/wms', type: 'WMS', group: 'BNPB', layersParam: 'raster:INDEKS_BAHAYA_CUACAEKSTRIM1' },
  // NEW
  { id: 'cuaca_ekstrim_img', label: 'Cuaca Ekstrim',      color: '#06B6D4', emoji: '🌪️', url: 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_cuaca_ekstrim/ImageServer', type: 'ImageServer', group: 'BNPB' },
  { id: 'banjir',        label: 'Bahaya Banjir',      color: '#0EA5E9', emoji: '🌊', url: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIR/ImageServer', type: 'ImageServer',group: 'BNPB' },
  { id: 'banjir_bandang',label: 'Banjir Bandang',     color: '#0369A1', emoji: '💧', url: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIRBANDANG/ImageServer', type: 'ImageServer', group: 'BNPB' },
  { id: 'longsor',       label: 'Tanah Longsor',       color: '#F97316', emoji: '⛰️', url: `${BNPB_BASE}/layer_bahaya_tanah_longsor_30/MapServer`, group: 'BNPB' },
  { id: 'gempa',         label: 'Gempa Bumi',          color: '#EF4444', emoji: '📳', url: `${BNPB_BASE}/layer_bahaya_gempabumi_30/MapServer`, group: 'BNPB' },
  { id: 'tsunami',       label: 'Tsunami',             color: '#EC4899', emoji: '🌊', url: `${BNPB_BASE}/layer_bahaya_tsunami_30/MapServer`, group: 'BNPB' },
  { id: 'gunungapi',     label: 'Letusan Gunung Api',  color: '#8B5CF6', emoji: '🌋', url: `${BNPB_BASE}/layer_bahaya_letusan_gunungapi/MapServer`, group: 'BNPB' },
  { id: 'karhutla',      label: 'Kebakaran Hutan',     color: '#F59E0B', emoji: '🔥', url: `${BNPB_BASE}/layer_bahaya_kebakaran_hutan_dan_lahan_30/MapServer`, group: 'BNPB' },
  { id: 'kekeringan',    label: 'Kekeringan',          color: '#D97706', emoji: '☀️', url: `${BNPB_BASE}/layer_bahaya_kekeringan_30/MapServer`, group: 'BNPB' },
  { id: 'cuaca_ekstrim', label: 'Cuaca Ekstrim (MS)',  color: '#0891B2', emoji: '⛅', url: `${BNPB_BASE}/layer_bahaya_cuaca_ekstrim_30/MapServer`, group: 'BNPB' },
  { id: 'dukcapil_kel_fix', label: 'Kependudukan Kelurahan', color: '#3B82F6', emoji: '👥', url: 'https://gis.dukcapil.kemendagri.go.id/arcgis/rest/services/AGR_VISUAL_KEL_FIX/MapServer/0', type: 'MapServer', group: 'KEMENDAGRI' },
  { id: 'Peta_Curah_Hujan_dan_Hari_Hujan', label: 'Curah Hujan', color: '#3B82F6', emoji: '👥', url: 'https://gis.bmkg.go.id/arcgis/rest/services/Peta_Curah_Hujan_dan_Hari_Hujan/MapServer/0', type: 'MapServer', group: 'BMKG' },
  { id: 'Peta_Curah_Hujan_dan_Hari_Hujan_sebaran', label: 'Curah Hujan Sebaran', color: '#3B82F6', emoji: '👥', url: 'https://gis.bmkg.go.id/arcgis/rest/services/Peta_Curah_Hujan_dan_Hari_Hujan/MapServer/1570', type: 'MapServer', group: 'BMKG' },
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

// Convert tile XYZ to WGS84 (lon/lat) bounding box — for services that use geographic CRS
function tileToBbox4326(x: number, y: number, z: number): string {
  const n = Math.pow(2, z);
  const west  = (x / n) * 360 - 180;
  const east  = ((x + 1) / n) * 360 - 180;
  const north = (Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180) / Math.PI;
  const south = (Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180) / Math.PI;
  return `${west},${south},${east},${north}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createArcGISExportLayer(L: any, serviceUrl: string, opacity: number, isImageServer = false, useLngLat = false, layersParam = 'show:0'): any {
  let cleanUrl = serviceUrl;
  let localLayersParam = layersParam;
  const match = serviceUrl.match(/\/MapServer\/(\d+)$/);
  if (match && match.index !== undefined) {
    cleanUrl = serviceUrl.substring(0, match.index + 10);
    localLayersParam = `show:${match[1]}`;
  }

  const ArcLayer = L.GridLayer.extend({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createTile(coords: { x: number; y: number; z: number }, done: (e: Error | null, t: HTMLImageElement) => void): HTMLImageElement {
      const img = document.createElement('img');
      img.alt = '';
      const bbox   = useLngLat ? tileToBbox4326(coords.x, coords.y, coords.z) : tileToBbox3857(coords.x, coords.y, coords.z);
      const bboxSR = useLngLat ? '4326' : '3857';
      const imgSR  = useLngLat ? '4326' : '3857';
      if (isImageServer) {
        const params = new URLSearchParams({
          bbox, bboxSR, imageSR: imgSR, size: '256,256',
          format: 'png', transparent: 'true', f: 'image',
        });
        img.src = `${cleanUrl}/exportImage?${params}`;
      } else {
        const params = new URLSearchParams({
          bbox, bboxSR, imageSR: imgSR, size: '256,256',
          layers: localLayersParam, format: 'png32', transparent: 'true', f: 'image',
        });
        img.src = `${cleanUrl}/export?${params}`;
      }
      img.onload = () => done(null, img);
      img.onerror = () => done(new Error('err'), img);
      return img;
    },
  });
  return new ArcLayer({ opacity, attribution: '© BIG / BNPB', tileSize: 256 });
}

type ImpactDataK4 = {
  loading: boolean;
  totalLakiLaki: number;
  totalPerempuan: number;
  totalLansia: number;
  totalBalita: number;
  totalPd1: number;
  totalPd2: number;
  totalKeluarga: number;
  area: string;
  selectedCount: number;
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

function circleToPolygonRing(circle: L.Circle, segments = 36): [number, number][][] {
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

  return [points];
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
      geometry: { rings: circleToPolygonRing(drawLayer), spatialReference: { wkid: 4326 } },
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
    return {
      countHex: 0,
      totalLakiLaki: 0,
      totalPerempuan: 0,
      totalLansia: 0,
      totalBalita: 0,
      totalPd1: 0,
      totalPd2: 0,
      totalKeluarga: 0,
    };
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
  if (!response.ok) throw new Error(`Query hexbin_res9 failed: ${response.status}`);
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

function buildImpactHtmlK4(data: ImpactDataK4): string {
  if (data.loading) {
    return `<div style="width:280px;font-family:system-ui,sans-serif;color:#0F172A;padding:14px;">` +
      `<div style="font-size:11px;font-weight:700;color:#0EA5E9;letter-spacing:.8px;margin-bottom:8px">📐 Simulasi K4</div>` +
      `<div style="font-size:12px;color:#64748B">Menghitung data dari layer BAPPENAS (hexbin_res9)...</div>` +
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
      `<tr><td style="font-size:11px;color:#475569">🧾 Disabilitas Berat</td><td style="text-align:right;font-size:13px;font-weight:700;color:#06B6D4">${data.totalPd1.toLocaleString('id')}</td></tr>` +
      `<tr><td style="font-size:11px;color:#475569">📊 Disabilitas Sedang</td><td style="text-align:right;font-size:13px;font-weight:700;color:#8B5CF6">${data.totalPd2.toLocaleString('id')}</td></tr>` +
      `<tr><td style="font-size:11px;color:#475569">🏠 Keluarga</td><td style="text-align:right;font-size:13px;font-weight:700;color:#0F172A">${data.totalKeluarga.toLocaleString('id')}</td></tr>` +
    `</table>` +
  `</div>`;
}

function isLeafletDrawReady(): boolean {
  if (typeof window === 'undefined') return false;
  const leafletWindow = window as WindowWithLeafletDraw & { L?: typeof L & { Draw?: unknown } };
  return Boolean(leafletWindow.L?.Draw);
}

type ActivePanel = 'basemap' | 'layers' | 'legend' | 'draw' | 'bmkg' | null;

export default function DashboardLeafletK4({ data, flyTo, theme }: Props) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildingLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bmkgMarkersRef = useRef<any[]>([]);
  const kjsLayerRef = useRef<L.GeoJSON | null>(null);

  const [activeBasemap, setActiveBasemap] = useState('esri_imagery');
  const [activeOverlays, setActiveOverlays] = useState<string[]>(['cuaca_ekstrim_img']);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [activeDraw, setActiveDraw] = useState<string | null>(null);
  const [bmkgData, setBmkgData] = useState<BmkgGempa[]>([]);
  const [showBmkg, setShowBmkg] = useState(true);
  const [showKjsLayer, setShowKjsLayer] = useState(true);
  const [showBencanaData, setShowBencanaData] = useState(false);
  const [bmkgLastUpdate, setBmkgLastUpdate] = useState<Date | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapserverLegends, setMapserverLegends] = useState<Record<string, MapServerLegendItem[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const fetchedLegendsRef = useRef<Set<string>>(new Set());

  // Fetch MapServer legends dynamically when a MapServer layer is activated
  useEffect(() => {
    const msLayers = BNPB_LAYERS.filter(
      (l) => l.type === 'MapServer' && activeOverlays.includes(l.id)
    );
    msLayers.forEach((layer) => {
      if (fetchedLegendsRef.current.has(layer.id)) return;
      fetchedLegendsRef.current.add(layer.id);

      let cleanLegendUrl = layer.url;
      let targetLayerId: number | null = null;
      const match = layer.url.match(/\/MapServer\/(\d+)$/);
      if (match && match.index !== undefined) {
        cleanLegendUrl = layer.url.substring(0, match.index + 10);
        targetLayerId = parseInt(match[1], 10);
      }

      fetch(`${cleanLegendUrl}/legend?f=pjson`)
        .then((r) => r.json())
        .then((json) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items: MapServerLegendItem[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (json?.layers ?? []).forEach((lyr: any) => {
            if (targetLayerId !== null && lyr.layerId !== targetLayerId) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (lyr.legend ?? []).forEach((item: any) => {
              if (item.imageData) {
                items.push({
                  label: item.label || lyr.layerName || '—',
                  imageData: item.imageData,
                  layerName: lyr.layerName ?? '',
                });
              }
            });
          });
          setMapserverLegends((p) => ({ ...p, [layer.id]: items }));
        })
        .catch(() => {
          // allow retry on next activation
          fetchedLegendsRef.current.delete(layer.id);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOverlays]);

  // Inject BMKG ripple animation CSS once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('bmkg-anim-css')) return;
    const style = document.createElement('style');
    style.id = 'bmkg-anim-css';
    style.textContent = `
      @keyframes bmkgRipple {
        0%   { transform: translate(-50%,-50%) scale(0.6); opacity: 0.9; }
        100% { transform: translate(-50%,-50%) scale(3.6); opacity: 0; }
      }
      @keyframes bmkgGlow {
        0%,100% { box-shadow: 0 0 0 0 rgba(var(--bmkg-rgb),0.7); }
        50%      { box-shadow: 0 0 0 5px rgba(var(--bmkg-rgb),0); }
      }
      .bmkg-wrap { position:relative; display:inline-block; cursor:pointer; }
      .bmkg-ring {
        position:absolute; top:50%; left:50%;
        border-radius:50%; border:2px solid;
        animation: bmkgRipple 2.2s ease-out infinite;
        pointer-events:none;
      }
      .bmkg-ring:nth-child(2) { animation-delay:0.75s; }
      .bmkg-ring:nth-child(3) { animation-delay:1.5s; }
      .bmkg-dot {
        position:absolute; top:50%; left:50%;
        transform:translate(-50%,-50%);
        border-radius:50%;
        border:2px solid rgba(255,255,255,0.9);
        z-index:3;
        animation: bmkgGlow 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Fetch BMKG gempa terkini (refresh every 5 min)
  useEffect(() => {
    const fetchBmkg = async () => {
      try {
        const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', {
          cache: 'no-store',
        });
        const json = await res.json();
        const gempa: BmkgGempa[] = json?.Infogempa?.gempa ?? [];
        setBmkgData(gempa);
        setBmkgLastUpdate(new Date());
      } catch {
        // silent — network/CORS may fail; markers stay empty
      }
    };
    fetchBmkg();
    const timer = setInterval(fetchBmkg, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Render BMKG animated markers
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // Remove previous BMKG markers
    bmkgMarkersRef.current.forEach((m) => map.removeLayer(m));
    bmkgMarkersRef.current = [];
    if (!showBmkg || bmkgData.length === 0) return;

    bmkgData.forEach((g) => {
      const parts = g.Coordinates.split(',');
      if (parts.length < 2) return;
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) return;

      const mag = parseFloat(g.Magnitude);
      const dotPx  = Math.max(8, Math.min(20, mag * 3));
      const ringPx = dotPx * 2.4;
      const wrapPx = Math.ceil(ringPx * 3.8);

      // Color by magnitude
      let color = '#22C55E'; let rgb = '34,197,94';
      if (mag >= 6)   { color = '#DC2626'; rgb = '220,38,38'; }
      else if (mag >= 5) { color = '#F97316'; rgb = '249,115,22'; }
      else if (mag >= 4) { color = '#FBBF24'; rgb = '251,191,36'; }

      const half = wrapPx / 2;
      const icon = L.divIcon({
        className: '',
        html: `<div class="bmkg-wrap" style="width:${wrapPx}px;height:${wrapPx}px;--bmkg-rgb:${rgb}">
          <div class="bmkg-ring" style="width:${ringPx}px;height:${ringPx}px;border-color:${color};"></div>
          <div class="bmkg-ring" style="width:${ringPx}px;height:${ringPx}px;border-color:${color};"></div>
          <div class="bmkg-ring" style="width:${ringPx}px;height:${ringPx}px;border-color:${color};"></div>
          <div class="bmkg-dot" style="width:${dotPx}px;height:${dotPx}px;background:${color};"></div>
        </div>`,
        iconSize: [wrapPx, wrapPx],
        iconAnchor: [half, half],
      });

      const isDarkM = theme === 'dark';
      const popupBg   = isDarkM ? '#0D1F3C' : '#FFFFFF';
      const popupText = isDarkM ? '#F1F5F9' : '#0F172A';
      const popupMuted= isDarkM ? '#94A3B8' : '#475569';
      const potensi   = g.Potensi ?? '';
      const tsunamiRisk = potensi.toLowerCase().includes('berpotensi tsunami') && !potensi.toLowerCase().includes('tidak');

      const marker = L.marker([lat, lng], { icon, zIndexOffset: 2000 });
      marker.bindPopup(
        `<div style="min-width:230px;font-family:system-ui,sans-serif;border-radius:10px;overflow:hidden">
          <div style="background:${color}20;padding:10px 14px;border-bottom:1.5px solid ${color}40">
            <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">📳 GEMPA TERKINI · BMKG</div>
            <div style="font-size:17px;font-weight:800;color:${popupText}">M ${g.Magnitude}</div>
            <div style="font-size:11px;color:${popupMuted};margin-top:2px;line-height:1.4">${g.Wilayah}</div>
          </div>
          <div style="padding:10px 14px;background:${popupBg}">
            <div style="display:flex;gap:12px;margin-bottom:8px;flex-wrap:wrap">
              <div><div style="font-size:9px;color:${popupMuted};text-transform:uppercase;letter-spacing:.5px">Kedalaman</div><div style="font-size:13px;font-weight:700;color:#0EA5E9">${g.Kedalaman}</div></div>
              <div><div style="font-size:9px;color:${popupMuted};text-transform:uppercase;letter-spacing:.5px">Lintang</div><div style="font-size:12px;font-weight:600;color:${popupText}">${g.Lintang}</div></div>
              <div><div style="font-size:9px;color:${popupMuted};text-transform:uppercase;letter-spacing:.5px">Bujur</div><div style="font-size:12px;font-weight:600;color:${popupText}">${g.Bujur}</div></div>
            </div>
            ${potensi ? `<div style="background:${tsunamiRisk ? '#FEF2F2' : '#F0FDF4'};border:1px solid ${tsunamiRisk ? '#FECACA' : '#BBF7D0'};border-radius:6px;padding:6px 8px;font-size:10px;color:${tsunamiRisk ? '#DC2626' : '#16A34A'};font-weight:600;margin-bottom:8px">${tsunamiRisk ? '⚠️' : '✅'} ${potensi}</div>` : ''}
            <div style="font-size:10px;color:${popupMuted};border-top:1px solid ${isDarkM ? '#1E3A5F' : '#E2E8F0'};padding-top:6px">📅 ${g.Tanggal} · ${g.Jam}</div>
          </div>
        </div>`,
        { maxWidth: 300 }
      );
      marker.addTo(map);
      bmkgMarkersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bmkgData, showBmkg, theme, mapReady]);

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
    setMapError(null);
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
      const handleResize = () => map.invalidateSize();
      requestAnimationFrame(handleResize);
      window.addEventListener('resize', handleResize);
      (map as unknown as { __resizeHandler?: () => void }).__resizeHandler = handleResize;
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.scale({ position: 'bottomleft', maxWidth: 140 }).addTo(map);
      const compassControl = L.Control.extend({
        options: { position: 'bottomright' },
        onAdd: () => {
          const div = L.DomUtil.create('div');
          div.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:999px;background:${theme === 'dark' ? 'rgba(8,18,36,0.94)' : 'rgba(255,255,255,0.95)'};border:1px solid ${theme === 'dark' ? 'rgba(30,58,95,0.8)' : 'rgba(0,0,0,0.12)'};box-shadow:0 4px 12px rgba(0,0,0,0.22);color:${theme === 'dark' ? '#f8fafc' : '#0f172a'};font-weight:800;font-size:16px;">
              N
            </div>
          `;
          return div;
        },
      });
      new compassControl().addTo(map);
      mapRef.current = map;
      setMapReady(true);

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
    if (!mapRef.current) {
      setMapError('Leaflet gagal dimuat. Coba refresh halaman atau cek koneksi jaringan.');
    }

    return () => {
      mounted = false;
      if (mapRef.current) {
        const handleResize = (mapRef.current as unknown as { __resizeHandler?: () => void }).__resizeHandler;
        if (handleResize) {
          window.removeEventListener('resize', handleResize);
        }
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
      if (id === 'satupeta_geotagging') {
        if (!mapRef.current || bnpbLayersRef.current[id]) return;
        fetch('/data/satupeta_geotagging.json', { cache: 'no-store' })
          .then((r) => {
            if (!r.ok) return fetch('/api/satupeta-geotagging', { cache: 'no-store' });
            return r;
          })
          .then((r) => r.json())
          .then((json) => {
            if (!mapRef.current) return;
            const items = Array.isArray(json) ? json : json?.data || [];
            const markers: L.Marker[] = [];
            items.forEach((item: Record<string, unknown>) => {
              const kk = (item.kepala_keluarga as Record<string, unknown>) || {};
              const latVal = item.lat || item.latitude || kk.lat;
              const lngVal = item.long || item.longitude || kk.long;
              if (latVal == null || lngVal == null) return;
              const lat = parseFloat(String(latVal));
              const lng = parseFloat(String(lngVal));
              if (isNaN(lat) || isNaN(lng)) return;
              const icon = L.divIcon({
                className: '',
                html: '<div style="background:#059669; width:22px; height:22px; border-radius:50%; border:2px solid #FFFFFF; box-shadow:0 2px 6px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:#FFF; font-size:12px; font-weight:bold;">📍</div>',
                iconSize: [22, 22],
                iconAnchor: [11, 11],
              });
              const anggotaList = (item.anggota_keluarga as Array<Record<string, unknown>>) || [];
              const marker = L.marker([lat, lng], { icon });
              marker.bindPopup(`
                <div style="font-family:sans-serif; min-width:270px; max-width:320px; font-size:11px; color:#333; line-height:1.5;">
                  <div style="font-weight:bold; color:#059669; font-size:12px; border-bottom:1px solid #E2E8F0; padding-bottom:4px; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
                    <span>📍 Satupeta Geotagging (BAPPENAS DTSEN)</span>
                  </div>
                  <div style="font-size:10.5px; margin-bottom:4px; background:#ECFDF5; padding:4px 6px; border-radius:4px; border:1px solid #A7F3D0; color:#065F46;">
                    <b>No. KK:</b> ${maskNikOrKk(item.no_kk as string)} &nbsp;|&nbsp; <b>Geotag:</b> ${item.geotag_status ? '✅ Terverifikasi' : '❌ Belum'}
                  </div>
                  <table style="width:100%; border-collapse:collapse; font-size:10.5px; margin-bottom:6px;">
                    <tr><td style="color:#64748b; padding:2px 0;">Kepala Keluarga:</td><td style="font-weight:600;">${maskName(kk.nama_lengkap as string)} (${maskNikOrKk(kk.nik as string)})</td></tr>
                    <tr><td style="color:#64748b; padding:2px 0;">Jumlah Anggota:</td><td style="font-weight:600;">${item.jumlah_anggota || anggotaList.length || '-'} Jiwa</td></tr>
                    <tr><td style="color:#64748b; padding:2px 0;">Desil Kesejahteraan:</td><td style="font-weight:700; color:#059669;">Desil ${kk.desil_kesejahteraan || '-'} (Skor: ${kk.skor_kesejahteraan || '-'})</td></tr>
                    <tr><td style="color:#64748b; padding:2px 0;">Status Bangunan:</td><td style="font-weight:600;">${kk.status_bangunan || '-'}</td></tr>
                  </table>
                </div>
              `);
              markers.push(marker);
            });
            const group = L.layerGroup(markers);
            bnpbLayersRef.current[id] = group;
            group.addTo(mapRef.current);
          })
          .catch(() => null);
      } else if (def.type === 'VectorTileServer') {
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
      } else if (def.type === 'WMS') {
        bnpbLayersRef.current[id] = L.tileLayer.wms(def.url, {
          layers: def.layersParam ?? '',
          format: 'image/png',
          transparent: true,
          version: '1.1.0',
          attribution: '© BNPB',
          crs: L.CRS.EPSG3857,
          opacity: 0.72,
        });
        bnpbLayersRef.current[id].addTo(map);
      } else if (def.type !== 'Dapodik' && !def.url.startsWith('/')) {
        bnpbLayersRef.current[id] = createArcGISExportLayer(
          L, def.url, 0.72,
          def.type === 'ImageServer',
          def.useLngLat ?? false,
          def.layersParam ?? 'show:0',
        );
        bnpbLayersRef.current[id].addTo(map);
        // Auto-fly to extent when layer first activated and extent is defined
        if (def.extent && mapRef.current) {
          const [minLng, minLat, maxLng, maxLat] = def.extent;
          mapRef.current.flyToBounds([[minLat, minLng], [maxLat, maxLng]], { duration: 1.5, padding: [20, 20] });
        }
      }
    });
  }, [activeOverlays]);

  // FlyTo
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, { duration: 1.5 });
  }, [flyTo]);

  // KJS GeoJSON layer
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (!showKjsLayer) {
      if (kjsLayerRef.current && map.hasLayer(kjsLayerRef.current)) {
        map.removeLayer(kjsLayerRef.current);
      }
      return;
    }

    if (kjsLayerRef.current) {
      if (!map.hasLayer(kjsLayerRef.current)) {
        kjsLayerRef.current.addTo(map);
      }
      return;
    }

    fetch('/geojson/gj_hexkab_reso9v1.geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((geojson) => {
        const layer = L.geoJSON(geojson, {
          style: () => ({
            color: '#165176',
            weight: 1.2,
            opacity: 0.9,
            fillColor: '#1a8284',
            fillOpacity: 0.12,
          }),
          onEachFeature: (feature, layerItem) => {
            const props = feature.properties as Record<string, unknown> | null;
            const label = props?.nama_kab as string || props?.nama_kabupaten as string || props?.nama_prop as string || 'HexKab';
            layerItem.bindTooltip(label, { sticky: true, direction: 'center', className: 'hexkab-tooltip' });
          },
        });
        layer.addTo(map);
        kjsLayerRef.current = layer;
      })
      .catch((err) => {
        console.error('Gagal memuat layer GeoJSON KJS:', err);
      });
  }, [mapReady, showKjsLayer]);

  // Toggle bencana.json markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => {
      if (showBencanaData) {
        if (!map.hasLayer(m)) m.addTo(map);
      } else {
        if (map.hasLayer(m)) map.removeLayer(m);
      }
    });
  }, [showBencanaData, mapReady]);

  // Draw tools
  useEffect(() => {
    const L = leafletRef.current; const map = mapRef.current;
    if (!L || !map) return;
    // cancel any active draw handler
    if (activeDrawRef.current) {
      try { activeDrawRef.current.disable(); } catch { /* */ }
      activeDrawRef.current = null;
    }
    if (!activeDraw || !drawLayerRef.current) return;

    const activateDrawTool = () => {
      if (!isLeafletDrawReady()) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const D = (L as any).Draw;
      if (!D) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let handler: any;
      const opts = { shapeOptions: { color: '#0EA5E9', weight: 2, fillOpacity: 0.15 } };
      if (activeDraw === 'polyline')     handler = new D.Polyline(map, { ...opts, shapeOptions: { color: '#0EA5E9', weight: 2 } });
      if (activeDraw === 'polygon')      handler = new D.Polygon(map, opts);
      if (activeDraw === 'rectangle')    handler = new D.Rectangle(map, opts);
      if (activeDraw === 'circle')       handler = new D.Circle(map, opts);
      if (activeDraw === 'marker')       handler = new D.Marker(map, {});
      if (activeDraw === 'circlemarker') handler = new D.CircleMarker(map, opts);
      if (!handler) return;

      handler.enable();
      activeDrawRef.current = handler;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.once('draw:created', async (e: any) => {
        const layer = e.layer;
        drawLayerRef.current.addLayer(layer);
        setActiveDraw(null);
        activeDrawRef.current = null;

        // Skip impact for point types
        if (e.layerType === 'marker' || e.layerType === 'circlemarker' || e.layerType === 'polyline') return;

        // --- Estimate area ---
        let area = '—';
        try {
          if (e.layerType === 'circle') {
            const r = layer.getRadius(); // meters
            const areaKm2 = Math.PI * (r / 1000) * (r / 1000);
            area = areaKm2 < 0.01 ? areaKm2.toFixed(3) : areaKm2.toFixed(2);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pts: any[] = layer.getLatLngs()[0];
            if (Array.isArray(pts) && pts.length >= 3) {
              const n = pts.length;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const avgLat = pts.reduce((s: number, p: any) => s + p.lat, 0) / n;
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
        } catch { /* */ }

        // Clear previous building footprint layer
        if (buildingLayerRef.current) { map.removeLayer(buildingLayerRef.current); buildingLayerRef.current = null; }

        // Open native Leaflet popup at polygon center (loading state)
        const popupCenter = layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng();
        const popup = L.popup({ maxWidth: 360, minWidth: 300, className: 'impact-popup', closeButton: true, autoClose: false })
          .setLatLng(popupCenter)
          .setContent(buildImpactHtmlK4({
            loading: true,
            totalLakiLaki: 0,
            totalPerempuan: 0,
            totalLansia: 0,
            totalBalita: 0,
            totalPd1: 0,
            totalPd2: 0,
            totalKeluarga: 0,
            area,
            selectedCount: 0,
          }))
          .openOn(map);
        popupRef.current = popup;
        popup.on('remove', () => {
          popupRef.current = null;
          if (buildingLayerRef.current) { map.removeLayer(buildingLayerRef.current); buildingLayerRef.current = null; }
        });
        layer.bindPopup(popup);
        layer.on('click', () => {
          if (!popupRef.current) {
            popupRef.current = popup;
          }
          layer.openPopup();
        });

        let stats: HexbinStats = {
          countHex: 0,
          totalLakiLaki: 0,
          totalPerempuan: 0,
          totalLansia: 0,
          totalBalita: 0,
          totalPd1: 0,
          totalPd2: 0,
          totalKeluarga: 0,
        };
        try {
          stats = await queryHexbinRes9Stats(layer);
        } catch (error) {
          console.error('Gagal query hexbin_res9:', error);
        }

        if (popupRef.current) {
          popupRef.current.setContent(buildImpactHtmlK4({
            loading: false,
            totalLakiLaki: stats.totalLakiLaki,
            totalPerempuan: stats.totalPerempuan,
            totalLansia: stats.totalLansia,
            totalBalita: stats.totalBalita,
            totalPd1: stats.totalPd1,
            totalPd2: stats.totalPd2,
            totalKeluarga: stats.totalKeluarga,
            area,
            selectedCount: stats.countHex,
          }));
        }
      });
    };

    activateDrawTool();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDraw]);

  const togglePanel = (panel: ActivePanel) =>
    setActivePanel((prev) => (prev === panel ? null : panel));

  const handleSearchLocation = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchStatus('Ketik lokasi yang ingin dicari.');
      return;
    }

    try {
      setSearchStatus('Mencari lokasi...');
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`);
      const results = (await response.json()) as Array<{ display_name: string; lat: string; lon: string }>;

      if (!results.length) {
        setSearchResults([]);
        setSearchStatus('Lokasi tidak ditemukan.');
        return;
      }

      setSearchResults(results);
      const [first] = results;
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon) && mapRef.current) {
        mapRef.current.flyTo([lat, lon], 13, { duration: 1.5 });
        setSearchStatus(`Memfokuskan ke ${first.display_name}`);
      }
    } catch {
      setSearchStatus('Gagal mencari lokasi. Coba lagi.');
    }
  };

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
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, width: 280, maxWidth: 'calc(100% - 24px)' }}>
        <div style={{ display: 'flex', gap: 8, background: isDark ? 'rgba(8,18,36,0.92)' : 'rgba(255,255,255,0.95)', border: `1px solid ${isDark ? 'rgba(30,58,95,0.8)' : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' }}>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleSearchLocation();
              }
            }}
            placeholder="Cari lokasi, contoh: Ciomas Bogor"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: panelText, fontSize: 12 }}
          />
          <button
            type="button"
            onClick={() => void handleSearchLocation()}
            style={{ border: 'none', borderRadius: 10, background: '#0EA5E9', color: '#fff', padding: '8px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            Cari
          </button>
        </div>
        {searchStatus ? (
          <div style={{ marginTop: 6, fontSize: 11, color: isDark ? '#cbd5e1' : '#475569', paddingLeft: 2 }}>{searchStatus}</div>
        ) : null}
        {searchResults.length > 0 ? (
          <div style={{ marginTop: 8, borderRadius: 12, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(30,58,95,0.8)' : 'rgba(0,0,0,0.12)'}`, background: isDark ? 'rgba(8,18,36,0.92)' : 'rgba(255,255,255,0.95)' }}>
            {searchResults.map((item) => (
              <button
                key={`${item.display_name}-${item.lat}-${item.lon}`}
                type="button"
                onClick={() => {
                  const lat = parseFloat(item.lat);
                  const lon = parseFloat(item.lon);
                  if (!Number.isNaN(lat) && !Number.isNaN(lon) && mapRef.current) {
                    mapRef.current.flyTo([lat, lon], 13, { duration: 1.5 });
                    setSearchStatus(`Memfokuskan ke ${item.display_name}`);
                  }
                }}
                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: 'transparent', color: panelText, cursor: 'pointer', fontSize: 11 }}
              >
                {item.display_name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden' }} />
      {mapError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.85)', color: '#f8fafc', fontSize: 12, padding: 20, textAlign: 'center', zIndex: 1500 }}>
          {mapError}
        </div>
      )}

      {/* Right toolbar */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 800, display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Basemap selector */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activePanel === 'basemap')} onClick={() => togglePanel('basemap')} title="Pilih Basemap">
            <Layers size={16} />
          </button>
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
          <button style={toolBtn(activePanel === 'layers')} onClick={() => togglePanel('layers')} title="Layer Bahaya InARISK">
            <Map size={16} />
          </button>
          {activePanel === 'layers' && (
            <div style={panel}>
              <div style={pHead}>Layer Peta <span style={{ fontSize: 9, fontWeight: 400, color: panelMuted }}>© BNPB · BIG · BMKG · BAPPENAS</span></div>
              {/* Group by source */}
              {['BAPPENAS', 'BIG', 'BNPB', 'BMKG', 'KEMENDAGRI'].map((grp) => {
                const grpLayers = BNPB_LAYERS.filter((l) => l.group === grp);
                const grpColor: Record<string, string> = { BAPPENAS: '#1aa7ed', BIG: '#22C55E', BNPB: '#35a7ff', BMKG: '#8B5CF6', KEMENDAGRI: '#3B82F6' };
                return (
                  <div key={grp}>
                    <div style={{ padding: '5px 12px 3px', fontSize: 9, fontWeight: 700, color: grpColor[grp] ?? panelMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {grp === 'BIG' ? '🌿 BIG — Geospasial' : grp === 'BNPB' ? '⚠️ BNPB — InARISK' : grp === 'BMKG' ? '📡 BMKG — Meteorologi' : grp === 'BAPPENAS' ? '🏛️ BAPPENAS — KJS' : '👥 KEMENDAGRI — Dukcapil'}
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
          <button style={toolBtn(activePanel === 'legend')} onClick={() => togglePanel('legend')} title="Legenda">
            <BarChart2 size={16} />
          </button>
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
                <div style={{ borderTop: `1px solid ${panelBorder}`, marginTop: 6, paddingTop: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: panelMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>📳 Gempa Terkini (BMKG)</div>
                  {[{ label: '≥ M6.0', color: '#DC2626' }, { label: 'M5.0 – 5.9', color: '#F97316' }, { label: 'M4.0 – 4.9', color: '#FBBF24' }, { label: '< M4.0', color: '#22C55E' }].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ position: 'relative', width: 14, height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${item.color}`, position: 'absolute', opacity: 0.5 }} />
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, position: 'absolute' }} />
                      </span>
                      <span style={{ fontSize: 10, color: panelText }}>{item.label}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 4, fontSize: 9, color: panelMuted }}>Animasi sinyal = gempa aktif · Klik untuk detail</div>
                </div>
                {/* Dynamic MapServer Layer Legends */}
                {BNPB_LAYERS.filter((l) => l.type === 'MapServer' && activeOverlays.includes(l.id)).map((layer) => {
                  const items = mapserverLegends[layer.id];
                  if (items === undefined) {
                    return (
                      <div key={layer.id} style={{ borderTop: `1px solid ${panelBorder}`, marginTop: 6, paddingTop: 6 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: layer.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {layer.emoji} {layer.label}
                        </div>
                        <div style={{ fontSize: 10, color: panelMuted }}>⏳ Memuat legenda…</div>
                      </div>
                    );
                  }
                  if (items.length === 0) return null;
                  const grouped: Record<string, MapServerLegendItem[]> = {};
                  items.forEach((item) => {
                    if (!grouped[item.layerName]) grouped[item.layerName] = [];
                    grouped[item.layerName].push(item);
                  });
                  return (
                    <div key={layer.id} style={{ borderTop: `1px solid ${panelBorder}`, marginTop: 6, paddingTop: 6 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: layer.color, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {layer.emoji} {layer.label}
                      </div>
                      {Object.entries(grouped).map(([grpName, grpItems]) => (
                        <div key={grpName} style={{ marginBottom: 4 }}>
                          {grpName && (
                            <div style={{ fontSize: 9, color: panelMuted, marginBottom: 3, fontStyle: 'italic' }}>{grpName}</div>
                          )}
                          {grpItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`data:image/png;base64,${item.imageData}`}
                                alt={item.label}
                                style={{ width: 20, height: 20, flexShrink: 0, objectFit: 'contain', imageRendering: 'pixelated' }}
                              />
                              <span style={{ fontSize: 10, color: panelText }}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* KJS GeoJSON Layer */}
        <div style={{ position: 'relative' }}>
          <button
            style={toolBtn(showKjsLayer)}
            onClick={() => setShowKjsLayer((v) => !v)}
            title={showKjsLayer ? 'Sembunyikan layer GeoJSON KJS' : 'Tampilkan layer GeoJSON KJS'}
          >
            <Globe size={16} />
          </button>
          {showKjsLayer && (
            <div style={{
              position: 'absolute', top: 0, right: 40,
              background: '#0EA5E9', color: '#fff',
              borderRadius: 10, padding: '2px 6px',
              fontSize: 9, fontWeight: 700,
              whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }}>
              KJS GeoJSON Aktif
            </div>
          )}
        </div>

        {/* BMKG Live Earthquakes */}
        <div style={{ position: 'relative' }}>
          <button
            style={toolBtn(showBmkg)}
            onClick={() => setShowBmkg((v) => !v)}
            title={showBmkg ? `Sembunyikan gempa BMKG (${bmkgData.length} titik)` : 'Tampilkan gempa terkini BMKG'}
          >
            <Activity size={16} />
          </button>
          {showBmkg && bmkgData.length > 0 && (
            <div style={{
              position: 'absolute', top: 0, right: 40,
              background: '#DC2626', color: '#fff',
              borderRadius: 10, padding: '2px 6px',
              fontSize: 9, fontWeight: 700,
              whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }}>
              🔴 LIVE {bmkgData.length}
              {bmkgLastUpdate && (
                <span style={{ fontWeight: 400, marginLeft: 4, opacity: 0.85 }}>
                  {bmkgLastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Toggle Bencana Data */}
        <div style={{ position: 'relative' }}>
          <button
            style={toolBtn(showBencanaData)}
            onClick={() => setShowBencanaData((v) => !v)}
            title={showBencanaData ? 'Sembunyikan data bencana.json' : 'Tampilkan data bencana.json'}
          >
            <MapPin size={16} />
          </button>
          {showBencanaData && (
            <div style={{
              position: 'absolute', top: 0, right: 40,
              background: '#0EA5E9', color: '#fff',
              borderRadius: 10, padding: '2px 6px',
              fontSize: 9, fontWeight: 700,
              whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }}>
              {data.length} Kejadian
            </div>
          )}
        </div>

        {/* Draw tools */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activePanel === 'draw' || activeDraw !== null)} onClick={() => { togglePanel('draw'); if (activeDraw) { if (activeDrawRef.current) { try { activeDrawRef.current.disable(); } catch{/**/ } activeDrawRef.current=null; } setActiveDraw(null); } }} title="Alat Gambar">
            <Pencil size={16} />
          </button>
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

      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 12,
          zIndex: 1000,
          display: 'flex', justifyContent: 'center', gap: 12,
          pointerEvents: 'none',
        }}
      >
        {['/logo/logo_bnpb.png', '/logo/logo_bmkg.png', '/logo/logo_big.png', '/logo/logo_brin.png', '/logo/logo_kemendagri.png'].map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={src.split('/').pop()?.replace('logo_', '').replace('.png', '').toUpperCase()}
            style={{ width: 20, height: 20, objectFit: 'contain', opacity: 0.92 }}
          />
        ))}
      </div>
    </div>
  );
}
