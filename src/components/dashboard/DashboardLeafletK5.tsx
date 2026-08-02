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
  kodeKemendagri?: string;
  onDrawEstimation?: (stats: {
    totalPopulasi: number;
    totalLakiLaki: number;
    totalPerempuan: number;
    totalLansia: number;
    totalBalita: number;
    totalPd1: number;
    totalPd2: number;
    totalKeluarga: number;
    kelurahanDampak?: { namaKelurahan: string; namaKecamatan: string; namaKabupaten: string; namaProvinsi: string; kodeKemendagri?: string }[];
    sekolahDampak?: SekolahDampakItem[];
  }) => void;
  theme: string;
}

interface BnpbLayer {
  id: string;
  label: string;
  color: string;
  emoji: string;
  url: string;
  type?: 'ImageServer' | 'MapServer' | 'VectorTileServer' | 'WMS' | 'Dapodik';
  group?: string;
  useLngLat?: boolean;
  layersParam?: string;
  extent?: [number, number, number, number];
  requiresFilter?: boolean;
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

const BNPB_BASE = 'https://gis.bnpb.go.id/server/rest/services/inarisk';
const HEXBIN_RES9_URL = 'https://geospasial.bappenas.go.id/server/rest/services/Produksi/hexbin_agg9/MapServer/0';
const DUKCAPIL_KEL_URL = 'https://gis.dukcapil.kemendagri.go.id/arcgis/rest/services/AGR_VISUAL_KEL_FIX/MapServer/0';
const BIG_DESAKEL_URL = 'https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/BATAS_DESAKEL_AR/MapServer/0';

const BNPB_LAYERS: BnpbLayer[] = [
  // BIG & BAPPENAS
  { id: 'hexbin_res9', label: 'Penduduk DTSEN', color: '#1aa7ed', emoji: '👥', url: HEXBIN_RES9_URL, type: 'MapServer', group: 'BAPPENAS' },
  { id: 'dapodik_sd', label: 'Sekolah Dasar (Dapodik)', color: '#EF4444', emoji: '🏫', url: '/data/dapodik/sd', type: 'Dapodik', group: 'BAPPENAS', requiresFilter: true },
  { id: 'dapodik_smp', label: 'Sekolah Menengah Pertama (Dapodik)', color: '#3B82F6', emoji: '🏫', url: '/data/dapodik/smp', type: 'Dapodik', group: 'BAPPENAS', requiresFilter: true },
  { id: 'dapodik_sma', label: 'Sekolah Menengah Atas (Dapodik)', color: '#10B981', emoji: '🏫', url: '/data/dapodik/sma', type: 'Dapodik', group: 'BAPPENAS', requiresFilter: true },
  { id: 'dapodik_slb', label: 'Sekolah Luar Biasa (Dapodik)', color: '#8B5CF6', emoji: '🏫', url: '/data/dapodik/slb', type: 'Dapodik', group: 'BAPPENAS', requiresFilter: true },
  { id: 'dapodik_spk', label: 'Sekolah SPK (Dapodik)', color: '#F59E0B', emoji: '🏫', url: '/data/dapodik/spk', type: 'Dapodik', group: 'BAPPENAS', requiresFilter: true },
  { id: 'big_batas_desakel',           label: 'Batas Desa/Kelurahan (BIG)',   color: '#3B82F6', emoji: '🗺️', url: 'https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/BATAS_DESAKEL_AR/MapServer', type: 'MapServer', group: 'BIG' },
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
  const tileUrl = `${serviceUrl}/tile/{z}/{y}/{x}.pbf`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const VG = (L as any).vectorGrid ?? (window as any).L?.vectorGrid;
  if (!VG) return null;
  return VG.protobuf(tileUrl, {
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

function tileToBbox3857(x: number, y: number, z: number): string {
  const R = 20037508.342789244;
  const n = Math.pow(2, z);
  return `${(x/n)*2*R-R},${R-((y+1)/n)*2*R},${((x+1)/n)*2*R-R},${R-(y/n)*2*R}`;
}

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

type KelurahanDampak = {
  namaKelurahan: string;
  namaKecamatan: string;
  namaKabupaten: string;
  namaProvinsi: string;
  kodeKemendagri?: string;
};

async function queryDukcapilKelurahan(drawLayer: L.Layer): Promise<KelurahanDampak[]> {
  const queryGeometry = layerToEsriPolygon(drawLayer);
  if (!queryGeometry) return [];

  const list: KelurahanDampak[] = [];
  const seen = new Set<string>();

  // 1. Primary spatial query: BIG Batas Desa/Kelurahan MapServer Layer 0
  try {
    const queryUrl = `${BIG_DESAKEL_URL}/query`;
    const params = new URLSearchParams({
      f: 'json',
      geometry: JSON.stringify(queryGeometry.geometry),
      geometryType: queryGeometry.geometryType,
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      returnGeometry: 'false',
      outFields: '*',
      where: '1=1',
    });

    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (response.ok) {
      const json = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (json.features ?? []).forEach((ft: any) => {
        const a = ft.attributes ?? {};
        const prov = a.WADMPR || a.PROVINSI || a.PROV || a.field1 || a.FIELD1 || '';
        const kab  = a.WADMKK || a.KABUPATEN || a.KAB_KOTA || a.KAB || a.field2 || a.FIELD2 || '';
        const kec  = a.WADMKC || a.KECAMATAN || a.KEC || a.field3 || a.FIELD3 || '';
        const kel  = a.NAMOBJ || a.KELURAHAN || a.DESA || a.DESA_KEL || a.field4 || a.FIELD4 || a.NAMWS || a.NAME || '';
        const kode = a.KDPPUM || a.KDEPUM || a.KDKCUM || a.KDCPUM || a.KODE_WILAYAH || a.KODE_DESA || a.KODE_KEL || a.KODE || a.CODE || '';
        if (kel || kec || kab) {
          const key = `${kel}-${kec}-${kab}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              namaKelurahan: kel || 'Kelurahan/Desa',
              namaKecamatan: kec,
              namaKabupaten: kab,
              namaProvinsi: prov,
              kodeKemendagri: kode ? String(kode) : undefined,
            });
          }
        }
      });
    }
  } catch {
    /* fallback below */
  }

  // 2. Secondary spatial query: Kemendagri Dukcapil MapServer Layer 0 if BIG returns empty
  if (list.length === 0) {
    try {
      const queryUrl = `${DUKCAPIL_KEL_URL}/query`;
      const params = new URLSearchParams({
        f: 'json',
        geometry: JSON.stringify(queryGeometry.geometry),
        geometryType: queryGeometry.geometryType,
        spatialRel: 'esriSpatialRelIntersects',
        inSR: '4326',
        outSR: '4326',
        returnGeometry: 'false',
        outFields: '*',
        where: '1=1',
      });

      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (response.ok) {
        const json = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (json.features ?? []).forEach((ft: any) => {
          const a = ft.attributes ?? {};
          const prov = a.WADMPR || a.PROVINSI || a.PROV || a.field1 || a.FIELD1 || '';
          const kab  = a.WADMKK || a.KABUPATEN || a.KAB_KOTA || a.KAB || a.field2 || a.FIELD2 || '';
          const kec  = a.WADMKC || a.KECAMATAN || a.KEC || a.field3 || a.FIELD3 || '';
          const kel  = a.NAMOBJ || a.KELURAHAN || a.DESA || a.DESA_KEL || a.field4 || a.FIELD4 || a.NAMWS || a.NAME || '';
          const kode = a.KDPPUM || a.KDEPUM || a.KDKCUM || a.KDCPUM || a.KODE_WILAYAH || a.KODE_DESA || a.KODE_KEL || a.KODE || a.CODE || '';
          if (kel || kec || kab) {
            const key = `${kel}-${kec}-${kab}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                namaKelurahan: kel || 'Kelurahan/Desa',
                namaKecamatan: kec,
                namaKabupaten: kab,
                namaProvinsi: prov,
                kodeKemendagri: kode ? String(kode) : undefined,
              });
            }
          }
        });
      }
    } catch {
      /* fallback below */
    }
  }

  // 3. Fallback spatial query: BAPPENAS hexbin_res9 layer
  if (list.length === 0) {
    try {
      const queryUrl = `${HEXBIN_RES9_URL}/query`;
      const params = new URLSearchParams({
        f: 'json',
        geometry: JSON.stringify(queryGeometry.geometry),
        geometryType: queryGeometry.geometryType,
        spatialRel: 'esriSpatialRelIntersects',
        inSR: '4326',
        outSR: '4326',
        returnGeometry: 'false',
        outFields: '*',
        where: '1=1',
      });

      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (response.ok) {
        const json = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (json.features ?? []).forEach((ft: any) => {
          const a = ft.attributes ?? {};
          const kel = a.namobj || a.desa || a.kelurahan || a.nama_kel || a.kab_kota || 'Wilayah Terdampak';
          const kec = a.kecamatan || a.wadmkc || '';
          const kab = a.wadmkk || a.kabupaten || a.kab_kota || '';
          const prov = a.wadmpr || a.provinsi || '';
          const kode = a.kdppum || a.kdepum || a.kode_wilayah || a.kode || '';
          const key = `${kel}-${kec}-${kab}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              namaKelurahan: kel,
              namaKecamatan: kec,
              namaKabupaten: kab,
              namaProvinsi: prov,
              kodeKemendagri: kode ? String(kode) : undefined,
            });
          }
        });
      }
    } catch {
      /* ignore */
    }
  }

  return list;
}

export type SekolahDampakItem = {
  nama: string;
  bentuk: string;
  status?: string;
  alamat?: string;
  kecamatan?: string;
  jmlGuru?: number;
  rombel?: number;
  jmlTendik?: number;
  jmlLab?: number;
  jmlPerpus?: number;
};

async function queryDapodikSekolahDampak(drawLayer: L.Layer, kodeKemendagri?: string): Promise<SekolahDampakItem[]> {
  const result: SekolahDampakItem[] = [];
  if (!kodeKemendagri || typeof window === 'undefined' || !L) return result;

  const types = ['sd', 'smp', 'sma', 'slb', 'spk'];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dl = drawLayer as any;
  const isCircle = !!dl.getRadius;
  const circleCenter = isCircle ? dl.getLatLng() : null;
  const circleRadius = isCircle ? dl.getRadius() : 0;
  const bounds = dl.getBounds ? dl.getBounds() : null;

  for (const t of types) {
    try {
      const url = `/data/dapodik/${t}/${kodeKemendagri}.json`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const geoJson = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (geoJson.features ?? []).forEach((ft: any) => {
        const coords = ft.geometry?.coordinates;
        if (!coords || coords.length < 2) return;
        const latlng = L.latLng(coords[1], coords[0]);
        let inside = false;

        if (isCircle && circleCenter) {
          if (circleCenter.distanceTo(latlng) <= circleRadius) {
            inside = true;
          }
        } else if (bounds) {
          if (bounds.contains(latlng)) {
            inside = true;
          }
        }

        if (inside) {
          const p = ft.properties || {};
          const nama = p.nama || p.NAMA || p.nama_sekolah || 'Sekolah';
          const bentuk = p.bentuk || p.BENTUK || t.toUpperCase();
          const status = p.status || p.status_sekolah || '';
          const alamat = p.alamat || '';
          const kecamatan = p.kecamatan || '';
          const jmlGuru = parseInt(p.jml_guru) || 0;
          const rombel = parseInt(p.rombel) || 0;
          const jmlTendik = parseInt(p.jml_tendik) || 0;
          const jmlLab = parseInt(p.jml_lab) || 0;
          const jmlPerpus = parseInt(p.jml_perpus) || 0;

          if (!result.find((s) => s.nama === nama)) {
            result.push({ nama, bentuk, status, alamat, kecamatan, jmlGuru, rombel, jmlTendik, jmlLab, jmlPerpus });
          }
        }
      });
    } catch {
      /* ignore */
    }
  }

  return result;
}

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

export default function DashboardLeafletK5({ data, flyTo, kodeKemendagri, onDrawEstimation }: Props) {
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

  // Render Disaster JSON Markers (Smaller size for clean aesthetic)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (!showBencanaData) return;

    data.forEach((k) => {
      const color = JENIS_COLOR[k.jenis] ?? '#94A3B8';
      // Reduced radius for cleaner thematic look
      const radius = Math.min(4 + k.korban_jiwa * 0.15 + k.pengungsi * 0.0005, 12);
      const circle = L.circleMarker([k.lat, k.lng], {
        radius, color: k.status === 'saat' ? '#EF4444' : color, fillColor: color, fillOpacity: 0.8, weight: 1.5,
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
    if (!showLayerModal) return;

    const timer = setTimeout(() => {
      if (!previewContainerRef.current) return;

      if (previewMapRef.current) {
        previewMapRef.current.remove();
        previewMapRef.current = null;
        previewOverlayLayersRef.current = {};
        previewBaseLayersRef.current = {};
      }

      const pMap = L.map(previewContainerRef.current, {
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

      pMap.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [showLayerModal]);

  // Update Preview Map Basemap & Overlays Live
  useEffect(() => {
    if (!previewMapRef.current || !showLayerModal) return;
    const pMap = previewMapRef.current;

    Object.keys(previewBaseLayersRef.current).forEach((id) => {
      if (id === draftBasemap) previewBaseLayersRef.current[id].addTo(pMap);
      else pMap.removeLayer(previewBaseLayersRef.current[id]);
    });

    Object.keys(previewOverlayLayersRef.current).forEach((id) => {
      if (!draftOverlays.includes(id)) {
        pMap.removeLayer(previewOverlayLayersRef.current[id]);
        delete previewOverlayLayersRef.current[id];
      }
    });

    draftOverlays.forEach((id) => {
      if (previewOverlayLayersRef.current[id]) return;
      const def = BNPB_LAYERS.find((l) => l.id === id);
      if (!def) return;
      if (def.type === 'WMS') {
        previewOverlayLayersRef.current[id] = L.tileLayer.wms(def.url, {
          layers: def.layersParam ?? '',
          format: 'image/png',
          transparent: true,
          version: '1.1.0',
          crs: L.CRS.EPSG3857,
          opacity: 0.75,
        });
        previewOverlayLayersRef.current[id].addTo(pMap);
      } else {
        previewOverlayLayersRef.current[id] = createArcGISExportLayer(
          L, def.url, 0.75,
          def.type === 'ImageServer',
          def.useLngLat ?? false,
          def.layersParam ?? 'show:0'
        );
        previewOverlayLayersRef.current[id].addTo(pMap);
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

  // Update Main Map Overlays (Re-rendered in array order for drag-and-drop z-index)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.keys(overlayLayersRef.current).forEach((id) => {
      if (!activeOverlays.includes(id)) {
        map.removeLayer(overlayLayersRef.current[id]);
        delete overlayLayersRef.current[id];
      }
    });

    activeOverlays.forEach((id) => {
      if (overlayLayersRef.current[id]) {
        overlayLayersRef.current[id].bringToFront?.();
        return;
      }
      const def = BNPB_LAYERS.find((l) => l.id === id);
      if (!def) return;

      if (def.type === 'VectorTileServer') {
        const tryAddVector = () => {
          if (!mapRef.current || overlayLayersRef.current[id]) return;
          const vl = createVectorTileLayer(L, def.url, def.color);
          if (!vl) {
            const existing = document.getElementById('leaflet-vectorgrid-js');
            if (existing) existing.addEventListener('load', tryAddVector, { once: true });
            return;
          }
          overlayLayersRef.current[id] = vl;
          vl.addTo(mapRef.current);
        };
        tryAddVector();
      } else if (def.type === 'Dapodik') {
        if (!kodeKemendagri) return;
        const staticJsonUrl = `${def.url}/${kodeKemendagri}.json`;
        fetch(staticJsonUrl)
          .then((r) => {
            if (!r.ok) throw new Error('Static file not found, trying API proxy...');
            return r.json();
          })
          .catch(() => {
            const apiProxyUrl = `/api/dapodik?bentuk=${def.id === 'dapodik_sd' ? 'SD,SDLB' : def.id === 'dapodik_smp' ? 'SMP,SMPLB' : def.id === 'dapodik_sma' ? 'SMA,SMLB' : def.id === 'dapodik_slb' ? 'SLB' : 'SPK%20SD,SPK%20SMA,SPK%20SMP'}&provinsi=${kodeKemendagri}`;
            return fetch(apiProxyUrl).then((r) => r.json());
          })
          .then((geoJson) => {
            if (!mapRef.current) return;
            const dapodikLayer = L.geoJSON(geoJson, {
              pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                  radius: 6,
                  fillColor: def.color,
                  color: '#FFFFFF',
                  weight: 1.5,
                  opacity: 1,
                  fillOpacity: 0.9,
                });
              },
              onEachFeature: (feature, layer) => {
                const p = feature.properties || {};
                const nama = p.nama || p.NAMA || p.nama_sekolah || p.NAMA_SEKOLAH || 'Sekolah';
                const bentuk = p.bentuk || p.BENTUK || '';
                const status = p.status || p.status_sekolah || '';
                const alamat = p.alamat || p.ALAMAT || '';
                const jmlGuru = p.jml_guru || '0';
                const rombel = p.rombel || '0';
                const jmlTendik = p.jml_tendik || '0';
                const jmlLab = p.jml_lab || '0';
                const jmlPerpus = p.jml_perpus || '0';

                layer.bindPopup(`
                  <div style="font-family:sans-serif; min-width:210px; padding:2px;">
                    <div style="font-weight:bold; color:${def.color}; font-size:12px;">🏫 ${nama}</div>
                    <div style="font-size:10px; color:#64748B; margin-top:1px;">Jenjang: <b>${bentuk}</b> ${status ? `(${status})` : ''}</div>
                    <div style="margin-top:6px; padding:4px 6px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; font-size:10px; grid grid-cols-3 gap-1">
                      <div>👨‍🏫 Guru: <b>${jmlGuru}</b></div>
                      <div>📐 Rombel: <b>${rombel}</b></div>
                      <div>📋 Tendik: <b>${jmlTendik}</b></div>
                      <div>🔬 Lab: <b>${jmlLab}</b></div>
                      <div>📚 Perpus: <b>${jmlPerpus}</b></div>
                    </div>
                    ${alamat ? `<div style="font-size:10px; color:#475569; margin-top:4px;">📍 ${alamat}</div>` : ''}
                  </div>
                `);
              },
            });
            overlayLayersRef.current[id] = dapodikLayer;
            dapodikLayer.addTo(mapRef.current);
          })
          .catch(() => null);
      } else if (def.type === 'WMS') {
        overlayLayersRef.current[id] = L.tileLayer.wms(def.url, {
          layers: def.layersParam ?? '',
          format: 'image/png',
          transparent: true,
          version: '1.1.0',
          attribution: '© BNPB',
          crs: L.CRS.EPSG3857,
          opacity: 0.72,
        });
        overlayLayersRef.current[id].addTo(map);
      } else {
        overlayLayersRef.current[id] = createArcGISExportLayer(
          L, def.url, 0.72,
          def.type === 'ImageServer',
          def.useLngLat ?? false,
          def.layersParam ?? 'show:0',
        );
        overlayLayersRef.current[id].addTo(map);
        if (def.extent && mapRef.current) {
          const [minLng, minLat, maxLng, maxLat] = def.extent;
          mapRef.current.flyToBounds([[minLat, minLng], [maxLat, maxLng]], { duration: 1.5, padding: [20, 20] });
        }
      }
    });
  }, [activeOverlays, kodeKemendagri]);

  // Function to calculate & attach estimation popup to draw shapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachEstimationPopup = async (layer: any) => {
    const map = mapRef.current;
    if (!map) return;

    const popupCenter = layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng();
    const popup = L.popup({ maxWidth: 320 })
      .setLatLng(popupCenter)
      .setContent('<div style="font-size:11px; color:#1f8080; font-weight:bold;">⏳ Menghitung estimasi BAPPENAS & wilayah Kemendagri...</div>')
      .openOn(map);

    try {
      const [stats, kelList, sekolahList] = await Promise.all([
        queryHexbinRes9Stats(layer),
        queryDukcapilKelurahan(layer),
        queryDapodikSekolahDampak(layer, kodeKemendagri),
      ]);

      // Group kelurahanDampak by Provinsi & Kabupaten for clean popup display
      type RegionGroup = { prov: string; kab: string; kels: string[] };
      const regionGroups: RegionGroup[] = [];

      kelList.forEach((k) => {
        const rawProv = k.namaProvinsi && k.namaProvinsi !== '-' ? k.namaProvinsi : '';
        const rawKab = k.namaKabupaten && k.namaKabupaten !== '-' ? k.namaKabupaten : (k.namaKecamatan && k.namaKecamatan !== '-' ? k.namaKecamatan : '');
        const prov = rawProv || 'Wilayah Terdampak';
        const kab = rawKab;

        let group = regionGroups.find((g) => g.prov === prov && g.kab === kab);
        if (!group) {
          group = { prov, kab, kels: [] };
          regionGroups.push(group);
        }
        if (k.namaKelurahan && k.namaKelurahan !== '-' && !group.kels.includes(k.namaKelurahan)) {
          group.kels.push(k.namaKelurahan);
        }
      });

      const kelHtml = regionGroups.length > 0
        ? `<div style="margin-top:8px; padding-top:6px; border-top:1.5px solid #E2E8F0;">
             <div style="font-weight:700; color:#19506e; margin-bottom:4px; font-size:11px;">🏛️ Wilayah Terdampak (${kelList.length} Kel/Desa):</div>
             <div style="max-height:110px; overflow-y:auto; font-size:10px; color:#334155;">
               ${regionGroups.map((g) => {
                 const title = g.kab ? `📍 ${g.prov}, ${g.kab}` : `📍 ${g.prov}`;
                 return `
                   <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:4px 6px; margin-bottom:4px;">
                     <div style="font-weight:700; color:#19506e;">${title}</div>
                     <div style="color:#475569; margin-top:2px;">• <b>Kel/Desa:</b> ${
                       g.kels.map((kName) => {
                         const item = kelList.find((x) => x.namaKelurahan === kName);
                         return item?.kodeKemendagri
                           ? `${kName} <span style="font-size:9px; background:#E2E8F0; padding:1px 4px; border-radius:4px; font-weight:bold; color:#0F172A;">(${item.kodeKemendagri})</span>`
                           : kName;
                       }).join(', ')
                     }</div>
                   </div>
                 `;
               }).join('')}
             </div>
           </div>`
        : '';

      const content = `
        <div style="font-family:sans-serif; min-width:260px; font-size:11px; color:#0F172A;">
          <div style="font-weight:bold; color:#19506e; border-bottom:1.5px solid #E2E8F0; padding-bottom:4px; margin-bottom:6px;">📐 Estimasi Cepat Area Terdampak</div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>👨 Laki-laki:</span><b>${stats.totalLakiLaki.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>👩 Perempuan:</span><b>${stats.totalPerempuan.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>👴 Lansia:</span><b>${stats.totalLansia.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>🧒 Balita:</span><b>${stats.totalBalita.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px; color:#06B6D4;"><span>🧾 Disabilitas Berat (PD1):</span><b>${stats.totalPd1.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px; color:#8B5CF6;"><span>📊 Disabilitas Sedang (PD2):</span><b>${stats.totalPd2.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-top:4px; padding-top:4px; border-top:1px dashed #DDD;"><span>🏠 Total Keluarga:</span><b>${stats.totalKeluarga.toLocaleString('id')}</b></div>
          ${kelHtml}
        </div>
      `;
      popup.setContent(content);
      layer.bindPopup(content);

      if (onDrawEstimation) {
        onDrawEstimation({
          totalPopulasi: stats.totalLakiLaki + stats.totalPerempuan,
          totalLakiLaki: stats.totalLakiLaki,
          totalPerempuan: stats.totalPerempuan,
          totalLansia: stats.totalLansia,
          totalBalita: stats.totalBalita,
          totalPd1: stats.totalPd1,
          totalPd2: stats.totalPd2,
          totalKeluarga: stats.totalKeluarga,
          kelurahanDampak: kelList,
          sekolahDampak: sekolahList,
        });
      }
    } catch {
      popup.setContent('<div style="font-size:11px; color:red;">Gagal menghitung estimasi kependudukan.</div>');
    }
  };

  // Clear all drawn shapes
  const handleClearDraw = () => {
    if (drawLayerRef.current) {
      drawLayerRef.current.clearLayers();
    }
  };

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

        // Click event on drawn shape to reopen popup anytime
        layer.on('click', () => {
          attachEstimationPopup(layer);
        });

        if (e.layerType === 'marker' || e.layerType === 'polyline') return;
        attachEstimationPopup(layer);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDraw]);

  // Handle FlyTo
  useEffect(() => {
    if (mapRef.current && flyTo) mapRef.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, { duration: 1.5 });
  }, [flyTo]);

  // Drag and drop handlers for layer order
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const newDraft = [...draftOverlays];
    const [movedItem] = newDraft.splice(draggedIndex, 1);
    newDraft.splice(dropIndex, 0, movedItem);
    setDraftOverlays(newDraft);
    setDraggedIndex(null);
  };

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

      {/* 2. FLOATING CONTROL BUTTONS (DRAW ESTIMATOR, LIVE BMKG, BENCANA JSON, LEGENDA) - ICON ONLY */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {/* Toggle BMKG Live */}
        <button
          onClick={() => setShowBmkg(!showBmkg)}
          className={`p-2.5 rounded-2xl border backdrop-blur-xl shadow-md transition-all flex items-center justify-center ${
            showBmkg ? 'bg-[#19506e] text-white border-white/40' : 'bg-white/80 text-slate-700 border-white/80'
          }`}
          title="Toggle BMKG Gempa Terkini"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Toggle Draw Tools Estimator */}
        <button
          onClick={() => setShowDrawTools(!showDrawTools)}
          className={`p-2.5 rounded-2xl border backdrop-blur-xl shadow-md transition-all flex items-center justify-center ${
            showDrawTools ? 'bg-[#1f8080] text-white border-white/40' : 'bg-white/80 text-slate-700 border-white/80'
          }`}
          title="Simulasi Estimasi Demografi Draw"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Draw Tool Panel */}
        {showDrawTools && (
          <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-2xl p-2 shadow-xl space-y-1">
            <div className="flex items-center justify-between px-2 pb-1 border-b">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pilih Alat Ukur</span>
              <button
                onClick={handleClearDraw}
                className="text-[10px] font-bold text-rose-500 hover:underline"
              >
                Hapus Semua Draw
              </button>
            </div>
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
          className={`p-2.5 rounded-2xl border backdrop-blur-xl shadow-md transition-all flex items-center justify-center ${
            showBencanaData ? 'bg-[#19506e] text-white border-white/40' : 'bg-white/80 text-slate-700 border-white/80'
          }`}
          title="Toggle Titik Kejadian Bencana"
        >
          <MapPin className="w-4 h-4 text-sky-400" />
        </button>

        {/* Toggle Legenda */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`p-2.5 rounded-2xl border backdrop-blur-xl shadow-md transition-all flex items-center justify-center ${
            showLegend ? 'bg-[#19506e] text-white border-white/40' : 'bg-white/80 text-slate-700 border-white/80'
          }`}
          title="Tampilkan Legenda Peta"
        >
          <BarChart2 className="w-4 h-4" />
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
            {/* GRID 1: LEFT 30% WIDTH - SEARCH & LAYER SELECTION LIST (REMOVED EMOJI ICONS) */}
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

              {/* Available Layers List (NO EMOJIS) */}
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
                          <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1.5 flex-wrap">
                            <span>{layer.label}</span>
                            {layer.requiresFilter && !kodeKemendagri && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold border border-amber-300">
                                ⚠️ Butuh Filter Provinsi
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{layer.group} · {layer.type}</div>
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
                        <option key={bm.id} value={bm.id}>{bm.label}</option>
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

              {/* GRID 3 (BOTTOM): SELECTED LAYERS MANAGEMENT WITH DRAG AND DROP REORDERING */}
              <div className="h-1/2 p-5 flex flex-col justify-between bg-slate-50/40">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#19506e] uppercase tracking-wider block">3. Layer Yang Dipilih ({draftOverlays.length})</span>
                      <span className="text-[10px] text-slate-400">Geser (Drag & Drop) urutan item untuk mengatur layer atas/bawah</span>
                    </div>
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
                      draftOverlays.map((id, index) => {
                        const lyr = BNPB_LAYERS.find((l) => l.id === id);
                        if (!lyr) return null;
                        return (
                          <div
                            key={id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(index)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#1f8080]/50 text-xs font-bold text-[#19506e] shadow-2xs cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-all"
                            title="Drag untuk mengubah urutan layer stack"
                          >
                            <span className="text-slate-400 text-xs">⋮⋮</span>
                            <span>{lyr.label}</span>
                            <button
                              onClick={() => setDraftOverlays((prev) => prev.filter((x) => x !== id))}
                              className="text-slate-400 hover:text-rose-500 ml-1"
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
