'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layers, Search, Check, X, Eye, Activity, MapPin, Pencil, Home, Maximize2, Minimize2, BookOpen, ChevronDown, ChevronUp, RotateCcw, Sparkles, Flame, CloudLightning } from 'lucide-react';
import { JENIS_CONFIG } from '@/components/dashboard/FilterPanel';
import { DISASTER_CATEGORIES, DashboardLayer } from '@/types/layer';
import { DEFAULT_DASHBOARD_LAYERS } from '@/data/defaultLayers';
import {
  createArcGISExportLayer,
  createVectorTileLayer,
} from '@/lib/arcgisLeafletLayers';
import {
  BIG_DESAKEL_URL,
  DASHBOARD_BASEMAPS,
  DASHBOARD_DRAW_TOOLS,
  DASHBOARD_JENIS_COLOR,
  DASHBOARD_LEGEND_ITEMS,
  DASHBOARD_PREDEFINED_LAYER_LEGENDS,
  DUKCAPIL_KEL_URL,
  HEXBIN_RES9_URL,
  INARISK_NEIGHBOR_PEAKS,
  VOLCANO_FOCUS_ZOOM,
  VOLCANO_STATUS_COLOR,
} from '@/lib/dashboardMapConfig';
import {
  isKerentananKabKotaCode,
  toInariskKerentananCode,
} from '@/lib/inariskKerentananCode';
import {
  isKejadianKebakaran,
  kabNamesLooselyMatch,
  normalizeWilayahKey,
  resolveSipongiKabCoord,
  resolveSipongiProvinsiParam,
} from '@/lib/sipongiGeo';
import {
  type BmkgNowcastAlert,
  dedupeNowcastAlerts,
  filterAlertsByWilayah,
  isKejadianCuacaTerkait,
  normalizeCapProvinsi,
  provinsiKeysMatch,
  severityColor,
  severityRank,
} from '@/lib/bmkgNowcast';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

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

type SipongiHotspotRow = {
  provinsi: string;
  kabupaten: string;
  sumber: string;
  confidence: string;
  counter: number;
};

interface Props {
  data: Kejadian[];
  flyTo: { lat: number; lng: number; zoom: number } | null;
  kodeKemendagri?: string;
  wilayahNama?: string;
  wilayahProvinsi?: string;
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
  selectedJenis?: string;
  /** Highlight marker kejadian dari panel list */
  selectedKejadianId?: number | null;
  /** Klik marker → sinkron ke panel list */
  onKejadianMarkerClick?: (id: number) => void;
  selectedVolcanoSlug?: string | null;
  onVolcanoMarkerClick?: (slug: string) => void;
  selectedBmkgKey?: string | null;
  onBmkgMarkerClick?: (key: string) => void;
  bmkgShowSignal?: number;
  bmkgPreferredMode?: 'terkini' | 'dirasakan' | 'autogempa';
  onActiveOverlaysChange?: (activeOverlays: string[]) => void;
}

interface FotoGeotagItem {
  objectid?: number;
  name?: string;
  datetime?: number;
  x?: number;
  y?: number;
  z?: number;
  jenis?: string;
  path?: string;
}

interface KerentananData {
  [key: string]: unknown;
  no_kuesioner?: string;
  nama_responden?: string;
  hubungan_dengan_penghuni?: string;
  jenis_kelamin?: string;
  usia?: string;
  pendidikan_terakhir?: string;
  nama_desa?: string;
  kecamatan?: string;
  rt?: string;
  rw?: string;
  latitude?: string;
  longitude?: string;
  foto?: string[];
  hasil_jumlah_penghuni?: number;
  hasil_penghuni_siang?: string;
  hasil_penghuni_malam?: string;
  ada_perempuan?: string;
  hasil_perempuan?: number;
  ada_balita?: string;
  hasil_balita?: number;
  ada_manula?: string;
  hasil_manula?: number;
  ada_difabel?: string;
  hasil_difabel?: number;
  risk?: number;
  hasil_penderita_penyakit?: number;
  terima_pkh?: string;
  penghasilan?: string;
  answer_date?: string;
  fungsi_bangunan?: string;
  nilai_index_kerentanan?: string;
}

interface BnpbLayer {
  id: string;
  label: string;
  color: string;
  emoji: string;
  url: string;
  type?: 'ImageServer' | 'MapServer' | 'VectorTileServer' | 'WMS' | 'Dapodik' | 'GeoJSON';
  group?: string;
  useLngLat?: boolean;
  layersParam?: string;
  extent?: [number, number, number, number];
  requiresFilter?: boolean;
  ignoreScale?: boolean;
  requiresToken?: boolean;
  disasterTypes?: string[];
  disaster_types?: string[];
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

const BASEMAPS = DASHBOARD_BASEMAPS;
const BNPB_LAYERS: BnpbLayer[] = DEFAULT_DASHBOARD_LAYERS as unknown as BnpbLayer[];

export const DISASTER_DEFAULT_LAYERS: Record<string, string[]> = {
  'Semua': ['cuaca_ekstrim_img', 'bappenas_batas_desakel'],
  'banjir': [
    'banjir',
    'banjir_bandang',
    'banjir_wms',
    'bmkg_curah_hujan_bulanan',
    'Peta_Curah_Hujan_dan_Hari_Hujan',
    'Peta_Curah_Hujan_dan_Hari_Hujan_sebaran',
    'bappenas_batas_desakel',
  ],
  'gempa': [
    'gempa',
    'sesar_wms',
    'Faults_new',
    'bmkg_seismisitas_dangkal',
    'bmkg_seismisitas_menengah',
    'gempa_ntt_2026_v2',
    'foto_geotag_ntt',
    'bappenas_batas_desakel',
  ],
  'longsor': [
    'longsor',
    'longsor_wms',
    'trpppb_zrb_bansor_sumatras',
    'bmkg_curah_hujan_bulanan',
    'bappenas_batas_desakel',
  ],
  'kebakaran': [
    'karhutla',
    'nasa_firms_active_fires',
    'nasa_gibs_fire_viirs',
    'nasa_gibs_fire_modis',
    'bappenas_batas_desakel',
  ],
  'erupsi': [
    'gunungapi',
    'magma_status',
    'bappenas_batas_desakel',
  ],
  'tsunami': [
    'tsunami',
    'sesar_wms',
    'Faults_new',
    'bappenas_batas_desakel',
  ],
  'kekeringan': [
    'kekeringan',
    'bmkg_sifat_hujan_bulanan',
    'Peta_Curah_Hujan_dan_Hari_Hujan',
    'bappenas_batas_desakel',
  ],
  'angin puting beliung': [
    'cuaca_ekstrim_img',
    'cuaca_ekstrim',
    'cuacaekstrim_wms',
    'bmkg_curah_hujan_10hari',
    'Peta_Curah_Hujan_dan_Hari_Hujan',
    'bappenas_batas_desakel',
  ],
};

export function getLayersForDisaster(jenis: string, layers: (BnpbLayer | DashboardLayer)[]): string[] {
  const fallback = DISASTER_DEFAULT_LAYERS[jenis] ?? ['cuaca_ekstrim_img', 'bappenas_batas_desakel'];
  if (!jenis || jenis === 'Semua') return DISASTER_DEFAULT_LAYERS['Semua'] ?? fallback;

  // Check if any layer in catalogue has this disaster tag (skip inactive/legacy)
  const tagged = (layers || [])
    .filter((l) => {
      const active = (l as DashboardLayer)?.is_active;
      if (active === false) return false;
      const types = (l as DashboardLayer)?.disasterTypes || (l as DashboardLayer)?.disaster_types;
      return Array.isArray(types) && types.includes(jenis);
    })
    .map((l) => l.id);

  if (tagged.length > 0) {
    // Prefer curated default order (InaRISK + magma_status); selalu include preferred erupsi
    // walau cache localStorage masih layer legacy.
    const preferred = DISASTER_DEFAULT_LAYERS[jenis] || [];
    const legacyVolcano = new Set(['magma_volcanoes', 'magma_volcanoes_v2']);
    const ordered = [
      ...preferred,
      ...tagged.filter((id) => !preferred.includes(id) && !legacyVolcano.has(id)),
      'bappenas_batas_desakel',
    ];
    return Array.from(new Set(ordered));
  }
  return fallback;
}

const JENIS_COLOR = DASHBOARD_JENIS_COLOR;
const LEGEND_ITEMS = DASHBOARD_LEGEND_ITEMS;
const PREDEFINED_LAYER_LEGENDS = DASHBOARD_PREDEFINED_LAYER_LEGENDS;
const DRAW_TOOLS = DASHBOARD_DRAW_TOOLS;

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

/** Ukuran segitiga — hierarki status, tetap kompak di fullscreen. */
function volcanoTriangleSize(level: number, selected: boolean): number {
  if (level >= 4) return selected ? 18 : 16;
  if (level >= 3) return selected ? 16 : 14;
  if (level >= 2) return selected ? 13 : 12;
  return selected ? 12 : 11; // Normal / tanpa-status: sedikit lebih besar agar terbaca
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
    /* fallback to Kemendagri Dukcapil below */
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
        } else if (bounds && bounds.contains(latlng)) {
          // Precise Point-in-Polygon Check for Custom Drawn Shapes
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const latLngs = dl.getLatLngs ? (Array.isArray(dl.getLatLngs()[0]) ? dl.getLatLngs()[0] : dl.getLatLngs()) : null;
          if (latLngs && latLngs.length > 2) {
            const x = latlng.lat, y = latlng.lng;
            let intersects = false;
            for (let i = 0, j = latLngs.length - 1; i < latLngs.length; j = i++) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const xi = (latLngs[i] as any).lat, yi = (latLngs[i] as any).lng;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const xj = (latLngs[j] as any).lat, yj = (latLngs[j] as any).lng;
              const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
              if (intersect) intersects = !intersects;
            }
            inside = intersects;
          } else {
            inside = true; // Fallback to bounds check if non-polygon
          }
        }

        if (inside) {
          const p = ft.properties || {};
          const nama = p.nama || p.NAMA || p.nama_sekolah || p.NAMA_SEKOLAH || 'Sekolah';
          const bentuk = p.bentuk || p.BENTUK || p.bentuk_pendidikan || p.BENTUK_PENDIDIKAN || t.toUpperCase();
          const status = p.status || p.STATUS || p.status_sekolah || p.STATUS_SEKOLAH || '';
          const alamat = p.alamat || p.ALAMAT || '';
          const kecamatan = p.kecamatan || p.KECAMATAN || '';

          const rawGuru = p.jml_guru ?? p.JML_GURU ?? p.jmlGuru ?? p.guru ?? 0;
          const rawRombel = p.rombel ?? p.ROMBEL ?? p.jml_rombel ?? 0;
          const rawTendik = p.jml_tendik ?? p.JML_TENDIK ?? p.jmlTendik ?? p.tendik ?? 0;
          const rawLab = p.jml_lab ?? p.JML_LAB ?? p.jmlLab ?? p.lab ?? 0;
          const rawPerpus = p.jml_perpus ?? p.JML_PERPUS ?? p.jmlPerpus ?? p.perpus ?? 0;

          const jmlGuru = typeof rawGuru === 'number' ? rawGuru : parseInt(String(rawGuru), 10) || 0;
          const rombel = typeof rawRombel === 'number' ? rawRombel : parseInt(String(rawRombel), 10) || 0;
          const jmlTendik = typeof rawTendik === 'number' ? rawTendik : parseInt(String(rawTendik), 10) || 0;
          const jmlLab = typeof rawLab === 'number' ? rawLab : parseInt(String(rawLab), 10) || 0;
          const jmlPerpus = typeof rawPerpus === 'number' ? rawPerpus : parseInt(String(rawPerpus), 10) || 0;

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
// Dictionary for BIG Bitung 2024 Layer 18 Penutup Lahan (JNSPL Coded Values)
const JNSPL_DICTIONARY: Record<number, string> = {
  101010101: 'Bangunan Kesehatan',
  101010102: 'Bangunan Perdagangan dan Jasa',
  101010103: 'Bangunan Pariwisata, Seni, dan Budaya',
  101010104: 'Bangunan Perkantoran',
  101010105: 'Bangunan Industri',
  101010106: 'Bangunan Peribadatan',
  101010107: 'Bangunan Olahraga',
  101010108: 'Bangunan Pertahanan dan Keamanan',
  101010109: 'Bangunan Pendidikan',
  101010110: 'Bangunan Sosial',
  101010111: 'Bangunan Transportasi',
  101010112: 'Bangunan Utilitas',
  101010113: 'Bangunan Non-Permukiman Lain',
  101010201: 'Bangunan Hunian',
  101010202: 'Pekarangan',
  102010101: 'Pertambangan',
  102010201: 'Tempat Penimbunan dan Pembuangan Sampah',
  102010301: 'Hutan Kota',
  102010302: 'Taman',
  102010303: 'Jalur Hijau',
  102010304: 'Lapangan Tidak Diperkeras',
  102010305: 'Pemakaman',
  102010401: 'Landas Pacu',
  102010402: 'Taxiway',
  102010501: 'Rel Kereta',
  102010601: 'Jalan',
  102010701: 'Padang Golf',
  102010801: 'Permukaan/Lapangan Diperkeras',
  102010802: 'Area Parkir',
  201010101: 'Sawah',
  202010201: 'Tegalan/Ladang',
  202020101: 'Perkebunan',
  202020201: 'Kebun Campuran',
  301010101: 'Hutan',
  301020101: 'Padang Rumput',
  301030101: 'Semak Belukar',
  401010101: 'Hamparan Pasir',
  401010201: 'Rataan Lumpur',
  401010301: 'Tanah Terbuka',
  401010401: 'Hamparan Batuan',
  501010101: 'Sungai',
  501010201: 'Rawa',
  501010301: 'Danau',
  501010401: 'Laguna',
  501010501: 'Laut',
  501020101: 'Waduk',
  501020201: 'Kolam',
  501020202: 'Kolam Renang',
  501020301: 'Saluran Air',
  501020401: 'Tambak',
};

export type BitungLandCoverStat = { label: string; count: number };

async function queryBitungBasemapLayer18(drawLayer: L.Layer): Promise<BitungLandCoverStat[]> {
  const queryGeometry = layerToEsriPolygon(drawLayer);
  if (!queryGeometry) return [];

  try {
    let token = '';
    try {
      const tokRes = await fetch('/api/big-token').then((r) => r.json());
      if (tokRes?.token) token = tokRes.token;
    } catch { /* ignore */ }

    const queryUrl = 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/RBI5K_SULAWESI_2024/MapServer/36/query';
    const queryParams: Record<string, string> = {
      f: 'json',
      geometry: JSON.stringify(queryGeometry.geometry),
      geometryType: queryGeometry.geometryType,
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      returnGeometry: 'false',
      outFields: 'JNSPL',
      groupByFieldsForStatistics: 'JNSPL',
      outStatistics: JSON.stringify([
        { statisticType: 'count', onStatisticField: 'OBJECTID', outStatisticFieldName: 'jumlah' },
      ]),
      where: '1=1',
    };
    if (token) queryParams.token = token;

    const params = new URLSearchParams(queryParams);

    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) return [];
    const json = await response.json();
    const result: BitungLandCoverStat[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (json.features ?? []).forEach((ft: any) => {
      const jnspl = ft.attributes?.JNSPL;
      const count = Number(ft.attributes?.jumlah || 0);
      if (jnspl && count > 0) {
        const label = JNSPL_DICTIONARY[jnspl] || `Fasilitas (${jnspl})`;
        result.push({ label, count });
      }
    });

    // Sort descending by count
    return result.sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

export type HakAtasTanahStat = { label: string; count: number };

async function queryAtrBpnHakAtasTanah(drawLayer: L.Layer): Promise<HakAtasTanahStat[]> {
  const queryGeometry = layerToEsriPolygon(drawLayer);
  if (!queryGeometry) return [];

  try {
    const queryUrl = 'https://geospasial.bappenas.go.id/server/rest/services/Produksi/test_hat_sul/MapServer/0/query';
    const params = new URLSearchParams({
      f: 'json',
      geometry: JSON.stringify(queryGeometry.geometry),
      geometryType: queryGeometry.geometryType,
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      returnGeometry: 'false',
      outFields: 'tipehak',
      groupByFieldsForStatistics: 'tipehak',
      outStatistics: JSON.stringify([
        { statisticType: 'count', onStatisticField: 'objectid', outStatisticFieldName: 'jumlah' },
      ]),
      where: '1=1',
    });

    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) return [];
    const json = await response.json();
    const result: HakAtasTanahStat[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (json.features ?? []).forEach((ft: any) => {
      const tipehak = ft.attributes?.tipehak || 'Lainnya';
      const count = Number(ft.attributes?.jumlah || 0);
      if (tipehak && count > 0) {
        result.push({ label: tipehak, count });
      }
    });

    // Sort descending by count
    return result.sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

export default function DashboardLeaflet({
  data,
  flyTo,
  kodeKemendagri,
  wilayahNama,
  wilayahProvinsi,
  selectedJenis,
  selectedKejadianId = null,
  onKejadianMarkerClick,
  selectedVolcanoSlug = null,
  onVolcanoMarkerClick,
  selectedBmkgKey = null,
  onBmkgMarkerClick,
  bmkgShowSignal = 0,
  bmkgPreferredMode = 'terkini',
  onDrawEstimation,
  onActiveOverlaysChange,
}: Props) {
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
  const onKejadianMarkerClickRef = useRef(onKejadianMarkerClick);
  onKejadianMarkerClickRef.current = onKejadianMarkerClick;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bmkgMarkersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeDrawRef = useRef<any>(null);

  const [activeBasemap, setActiveBasemap] = useState('esri_imagery');
  const [draftBasemap, setDraftBasemap] = useState('esri_imagery');
  const [activeOverlays, setActiveOverlays] = useState<string[]>(['cuaca_ekstrim_img', 'bappenas_batas_desakel']);
  const [layersList, setLayersList] = useState<BnpbLayer[]>(BNPB_LAYERS);

  // Sync custom layers from /manajemen-data-bencana if available
  // Merge dengan DEFAULT agar layer baru (mis. magma_status) tidak hilang dari cache lama
  useEffect(() => {
    const cached = localStorage.getItem('satubencana_dashboard_layers_v1');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activeOnly = parsed.filter((l: any) => l.is_active !== false).map((l: any) => ({
            id: l.id,
            label: l.label,
            color: l.color,
            emoji: l.emoji,
            url: l.url,
            type: l.type,
            group: l.group || l.group_name,
            useLngLat: l.useLngLat ?? l.use_lng_lat,
            layersParam: l.layersParam ?? l.layers_param,
            extent: l.extent,
            requiresFilter: l.requiresFilter ?? l.requires_filter,
            ignoreScale: l.ignoreScale ?? l.ignore_scale,
            requiresToken: l.requiresToken ?? l.requires_token,
            disasterTypes: l.disasterTypes ?? l.disaster_types ?? [],
            disaster_types: l.disasterTypes ?? l.disaster_types ?? [],
          }));
          if (activeOnly.length > 0) {
            const byId = new Map<string, BnpbLayer>();
            (BNPB_LAYERS as BnpbLayer[]).forEach((l) => byId.set(l.id, l));
            activeOnly.forEach((l: BnpbLayer) => byId.set(l.id, { ...(byId.get(l.id) || {}), ...l }));
            // Pastikan layer erupsi inti selalu ada
            ['magma_status', 'gunungapi'].forEach((id) => {
              const def = (BNPB_LAYERS as BnpbLayer[]).find((l) => l.id === id);
              if (def && !byId.has(id)) byId.set(id, def);
            });
            setLayersList(Array.from(byId.values()));
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Automatically select thematic GIS layers when disaster type changes
  useEffect(() => {
    if (!selectedJenis) return;
    const targetLayers = getLayersForDisaster(selectedJenis, layersList);
    setActiveOverlays(targetLayers);
    setDraftOverlays(targetLayers);

    // Set balanced default opacity (0.75) for newly activated hazard layers
    setLayerOpacities((prev) => {
      const next = { ...prev };
      targetLayers.forEach((id) => {
        if (next[id] === undefined) {
          next[id] = 0.75;
        }
      });
      return next;
    });

    if (selectedJenis === 'gempa') {
      setShowBmkg(true);
      setBmkgMode('terkini');
    }
    // Erupsi: InaRISK + status gunung — BMKG tidak auto (hindari peta ramai)
    if (selectedJenis === 'erupsi') {
      setShowBmkg(false);
      setLayerOpacities((prev) => ({
        ...prev,
        gunungapi: prev.gunungapi ?? 0.65,
        magma_status: prev.magma_status ?? 1,
      }));
    }

    if (selectedJenis !== 'Semua') {
      setIsDisasterTrayOpen(true);
      setModalDisasterFilter(selectedJenis);
    }
  }, [selectedJenis, layersList]);

  useEffect(() => {
    onActiveOverlaysChange?.(activeOverlays);
  }, [activeOverlays, onActiveOverlaysChange]);
  const [draftOverlays, setDraftOverlays] = useState<string[]>(['cuaca_ekstrim_img', 'bappenas_batas_desakel']);
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({});
  const [draftOpacities, setDraftOpacities] = useState<Record<string, number>>({});
  const [showLayerModal, setShowLayerModal] = useState(false);
  const [layerSearch, setLayerSearch] = useState('');
  const [layerGroupFilter, setLayerGroupFilter] = useState('ALL');
  const [modalDisasterFilter, setModalDisasterFilter] = useState<string>('ALL');
  const [isDisasterTrayOpen, setIsDisasterTrayOpen] = useState(true);

  // Modal searchable select dropdown states
  const [isDisasterDropdownOpen, setIsDisasterDropdownOpen] = useState(false);
  const [disasterFilterSearch, setDisasterFilterSearch] = useState('');
  const disasterDropdownRef = useRef<HTMLDivElement>(null);

  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
  const [agencyFilterSearch, setAgencyFilterSearch] = useState('');
  const agencyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (disasterDropdownRef.current && !disasterDropdownRef.current.contains(e.target as Node)) {
        setIsDisasterDropdownOpen(false);
      }
      if (agencyDropdownRef.current && !agencyDropdownRef.current.contains(e.target as Node)) {
        setIsAgencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableAgencies = useMemo(() => {
    const base = ['BNPB', 'BIG', 'BAPPENAS', 'ATR/BPN', 'KEMENDAGRI', 'BMKG', 'NASA', 'ESDM'];
    layersList.forEach((l) => {
      if (l.group && !base.includes(l.group)) {
        base.push(l.group);
      }
    });
    return base;
  }, [layersList]);

  const filteredDisasterCategories = useMemo(() => {
    if (!disasterFilterSearch.trim()) return DISASTER_CATEGORIES;
    const q = disasterFilterSearch.toLowerCase();
    return DISASTER_CATEGORIES.filter((c) => c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [disasterFilterSearch]);

  const matchesSemuaDisaster = useMemo(() => {
    if (!disasterFilterSearch.trim()) return true;
    const q = disasterFilterSearch.toLowerCase();
    return 'semua skenario'.includes(q) || 'all'.includes(q);
  }, [disasterFilterSearch]);

  const filteredAgencies = useMemo(() => {
    if (!agencyFilterSearch.trim()) return availableAgencies;
    const q = agencyFilterSearch.toLowerCase();
    return availableAgencies.filter((a) => a.toLowerCase().includes(q));
  }, [availableAgencies, agencyFilterSearch]);

  const matchesSemuaAgency = useMemo(() => {
    if (!agencyFilterSearch.trim()) return true;
    const q = agencyFilterSearch.toLowerCase();
    return 'semua instansi sumber'.includes(q) || 'all'.includes(q);
  }, [agencyFilterSearch]);

  const selectedDisasterCategory = useMemo(() => {
    if (modalDisasterFilter === 'ALL') return null;
    return DISASTER_CATEGORIES.find((c) => c.id === modalDisasterFilter);
  }, [modalDisasterFilter]);
  
  const [showBmkg, setShowBmkg] = useState(false);
  type VolcanoFeedItem = {
    slug: string;
    code: string;
    name: string;
    lat: number;
    lng: number;
    alertLevel: number;
    province: string;
    regency: string;
    elevation: number | null;
    hasVona: boolean;
    statusKind?: 'live' | 'snapshot' | 'inarisk-only';
  };
  type VolcanoVona = {
    colour?: string;
    noticenumber?: string;
    cloudAboveSummitM?: number | null;
    magmaLink?: string;
    summary?: string;
  };
  const [volcanoFeed, setVolcanoFeed] = useState<{
    volcanoes: VolcanoFeedItem[];
    vona: Record<string, VolcanoVona | null>;
    syncedAt: string | null;
  } | null>(null);
  const onVolcanoMarkerClickRef = useRef(onVolcanoMarkerClick);
  onVolcanoMarkerClickRef.current = onVolcanoMarkerClick;
  const onBmkgMarkerClickRef = useRef(onBmkgMarkerClick);
  onBmkgMarkerClickRef.current = onBmkgMarkerClick;
  /** Marker gunung + level — zoom hanya show/hide, tidak rebuild. */
  const volcanoMarkersBySlugRef = useRef<Map<string, { marker: L.Marker; level: number }>>(new Map());
  const volcanoMarkerGroupRef = useRef<L.LayerGroup | null>(null);
  const volcanoNeighborGroupRef = useRef<L.LayerGroup | null>(null);
  const volcanoFocusSlugRef = useRef<string | null>(null);
  type VolcanoFocusCard = {
    slug: string;
    name: string;
    level: number;
    levelLabel: string;
    color: string;
    place: string;
    elev: string;
    vonaColour?: string;
    neighbors: { name: string; blurb: string }[];
  };
  const [volcanoFocusCard, setVolcanoFocusCard] = useState<VolcanoFocusCard | null>(null);

  useEffect(() => {
    if (bmkgShowSignal > 0) {
      setShowBmkg(true);
      setBmkgMode(bmkgPreferredMode || 'terkini');
    }
  }, [bmkgShowSignal, bmkgPreferredMode]);

  useEffect(() => {
    if (selectedJenis === 'gempa' || bmkgShowSignal > 0) {
      setBmkgMode(bmkgPreferredMode || 'terkini');
    }
  }, [bmkgPreferredMode, selectedJenis, bmkgShowSignal]);
  const [bmkgMode, setBmkgMode] = useState<'terkini' | 'dirasakan' | 'autogempa'>('terkini');
  const [bmkgDirasakanData, setBmkgDirasakanData] = useState<BmkgGempa[]>([]);
  const [bmkgAutoData, setBmkgAutoData] = useState<BmkgGempa[]>([]);
  const [bmkgData, setBmkgData] = useState<BmkgGempa[]>([]);
  const [showBencanaData, setShowBencanaData] = useState(true);
  const [showKerentanan, setShowKerentanan] = useState(false);
  /** Kode InaRISK dari filter wilayah dashboard (71.72 → 7172). */
  const kerentananCode = useMemo(() => toInariskKerentananCode(kodeKemendagri), [kodeKemendagri]);
  const kerentananKabOk = isKerentananKabKotaCode(kerentananCode);
  const [kerentananData, setKerentananData] = useState<KerentananData[]>([]);
  /** State visual tanpa label teks di UI */
  const [kerentananFeed, setKerentananFeed] = useState<
    'live' | 'fallback' | 'empty' | 'error' | 'loading' | 'need-wilayah' | 'need-kab' | null
  >(null);
  const kerentananClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const kerentananFitCodeRef = useRef<string | null>(null);

  /** Layer ringkas hotspot SIPONGI (agregat kab, 48 jam, High) */
  const [showSipongi, setShowSipongi] = useState(false);
  const [sipongiData, setSipongiData] = useState<SipongiHotspotRow[]>([]);
  const [sipongiFeed, setSipongiFeed] = useState<
    'live' | 'cache' | 'fallback' | 'empty' | 'error' | 'loading' | null
  >(null);
  const sipongiLayerRef = useRef<L.LayerGroup | null>(null);
  const sipongiFitKeyRef = useRef<string | null>(null);

  /** Layer peringatan dini cuaca BMKG (Nowcast CAP polygon) */
  const [showNowcast, setShowNowcast] = useState(false);
  const [nowcastAlerts, setNowcastAlerts] = useState<BmkgNowcastAlert[]>([]);
  const [nowcastFeed, setNowcastFeed] = useState<
    'live' | 'cache' | 'fallback' | 'empty' | 'error' | 'loading' | null
  >(null);
  const nowcastLayerRef = useRef<L.LayerGroup | null>(null);
  const nowcastFitKeyRef = useRef<string | null>(null);

  const sipongiProvinsiParam = useMemo(
    () =>
      resolveSipongiProvinsiParam({
        kodeKemendagri,
        wilayahNama,
        wilayahProvinsi,
      }),
    [kodeKemendagri, wilayahNama, wilayahProvinsi],
  );

  const nowcastProvinsiKey = useMemo(() => {
    if (sipongiProvinsiParam && sipongiProvinsiParam !== 'all') {
      return normalizeCapProvinsi(sipongiProvinsiParam);
    }
    return null;
  }, [sipongiProvinsiParam]);

  const nowcastRelevantJenis = useMemo(() => {
    if (!selectedJenis || selectedJenis === 'Semua') return false;
    return isKejadianCuacaTerkait(selectedJenis);
  }, [selectedJenis]);

  const sipongiKabFilterKey = useMemo(() => {
    // Filter kab aktif: kode 4+ digit atau ada wilayahProvinsi (artinya filter kab/kota)
    const dig = String(kodeKemendagri || '').replace(/\D/g, '');
    if (wilayahProvinsi && wilayahNama) return normalizeWilayahKey(wilayahNama);
    if (dig.length >= 4 && wilayahNama) return normalizeWilayahKey(wilayahNama);
    return null;
  }, [kodeKemendagri, wilayahNama, wilayahProvinsi]);

  const sipongiHotspotByKab = useMemo(() => {
    const map = new Map<string, { total: number; high: number }>();
    sipongiData.forEach((h) => {
      const key = normalizeWilayahKey(h.kabupaten);
      if (!key) return;
      const cur = map.get(key) || { total: 0, high: 0 };
      cur.total += h.counter || 0;
      if (String(h.confidence).toLowerCase() === 'high') cur.high += h.counter || 0;
      map.set(key, cur);
    });
    return map;
  }, [sipongiData]);

  const findSipongiForKab = useCallback(
    (kabupaten?: string | null) => {
      const key = normalizeWilayahKey(kabupaten);
      if (!key) return null;
      const exact = sipongiHotspotByKab.get(key);
      if (exact) return exact;
      // Soft match (Luwu ↔ Luwu Timur)
      for (const [sipKab, val] of Array.from(sipongiHotspotByKab.entries())) {
        if (kabNamesLooselyMatch(key, sipKab)) return val;
      }
      return null;
    },
    [sipongiHotspotByKab],
  );

  const sipongiKejadianOverlap = useMemo(() => {
    if (!showSipongi || sipongiHotspotByKab.size === 0) {
      return { kabCount: 0, kejadianCount: 0, hotspotTitik: 0, highTitik: 0 };
    }
    let kejadianCount = 0;
    const overlapKabs = new Set<string>();
    let hotspotTitik = 0;
    let highTitik = 0;
    data.forEach((k) => {
      if (!isKejadianKebakaran(k.jenis)) return;
      const hit = findSipongiForKab(k.kabupaten);
      if (!hit) return;
      kejadianCount += 1;
      const key = normalizeWilayahKey(k.kabupaten) || k.kabupaten;
      if (!overlapKabs.has(key)) {
        overlapKabs.add(key);
        hotspotTitik += hit.total;
        highTitik += hit.high;
      }
    });
    return { kabCount: overlapKabs.size, kejadianCount, hotspotTitik, highTitik };
  }, [showSipongi, sipongiHotspotByKab, data, findSipongiForKab]);

  const nowcastVisibleAlerts = useMemo(() => {
    if (!showNowcast) return [];
    return filterAlertsByWilayah(nowcastAlerts, {
      provinsiKey: nowcastProvinsiKey,
      kabKey: sipongiKabFilterKey,
    });
  }, [showNowcast, nowcastAlerts, nowcastProvinsiKey, sipongiKabFilterKey]);

  /** Kosong di wilayah aktif — beda dari feed sumber (bisa masih CACHE/LIVE nasional). */
  const nowcastUiEmpty = useMemo(
    () =>
      !!showNowcast &&
      !!nowcastFeed &&
      nowcastFeed !== 'loading' &&
      nowcastFeed !== 'error' &&
      nowcastVisibleAlerts.length === 0,
    [showNowcast, nowcastFeed, nowcastVisibleAlerts.length],
  );

  const nowcastKejadianOverlap = useMemo(() => {
    if (!showNowcast || nowcastVisibleAlerts.length === 0) {
      return { alertCount: 0, kejadianCount: 0, provCount: 0 };
    }
    const alertProvKeys = nowcastVisibleAlerts.map((a) => normalizeCapProvinsi(a.provinsi));
    let kejadianCount = 0;
    const hitProv = new Set<string>();
    data.forEach((k) => {
      if (!isKejadianCuacaTerkait(k.jenis)) return;
      const kp = normalizeCapProvinsi(k.provinsi);
      const hit = alertProvKeys.some((ap) => provinsiKeysMatch(ap, kp));
      if (!hit) return;
      kejadianCount += 1;
      hitProv.add(kp);
    });
    return {
      alertCount: nowcastVisibleAlerts.length,
      kejadianCount,
      provCount: hitProv.size,
    };
  }, [showNowcast, nowcastVisibleAlerts, data]);

  const nowcastMaxSeverity = useMemo(() => {
    if (!nowcastVisibleAlerts.length) return null;
    return nowcastVisibleAlerts.reduce((best, a) =>
      severityRank(a.severity) > severityRank(best.severity) ? a : best,
    ).severity;
  }, [nowcastVisibleAlerts]);

  const [showLegend, setShowLegend] = useState(false);
  const [showDrawTools, setShowDrawTools] = useState(false);
  const [activeDraw, setActiveDraw] = useState<string | null>(null);
  const [mapserverLegends, setMapserverLegends] = useState<Record<string, MapServerLegendItem[]>>({});
  
  const [glassSearchQuery, setGlassSearchQuery] = useState('');
  const [glassSearchResults, setGlassSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);

  const handleOpenLayerModal = () => {
    setDraftBasemap(activeBasemap);
    setDraftOverlays([...activeOverlays]);
    setDraftOpacities({ ...layerOpacities });
    if (selectedJenis && selectedJenis !== 'Semua') {
      setModalDisasterFilter(selectedJenis);
    }
    setIsDisasterDropdownOpen(false);
    setIsAgencyDropdownOpen(false);
    setDisasterFilterSearch('');
    setAgencyFilterSearch('');
    setShowLayerModal(true);
  };

  const handleApplyLayers = () => {
    setActiveBasemap(draftBasemap);
    setActiveOverlays([...draftOverlays]);
    setLayerOpacities({ ...draftOpacities });
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

  // Inject BMKG + volcano animation CSS (hormati prefers-reduced-motion)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const style =
      document.getElementById('bmkg-anim-css') ||
      (() => {
        const el = document.createElement('style');
        el.id = 'bmkg-anim-css';
        document.head.appendChild(el);
        return el;
      })();
    style.textContent = `
      @keyframes bmkgRipple { 0% { transform: translate(-50%,-50%) scale(0.6); opacity: 0.9; } 100% { transform: translate(-50%,-50%) scale(3.6); opacity: 0; } }
      /* Level animasi segitiga — makin tinggi status, makin tegas */
      @keyframes magmaAnimL0 {
        0%, 100% { transform: scale(1); opacity: 0.92; }
        50% { transform: scale(1.14); opacity: 1; }
      }
      @keyframes magmaAnimL1 {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 1px 2px rgba(15,23,42,0.45)); }
        50% { transform: scale(1.2); filter: drop-shadow(0 0 5px rgba(226,232,240,0.85)); }
      }
      @keyframes magmaAnimL2 {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 1px 2px rgba(15,23,42,0.4)); }
        50% { transform: scale(1.26); filter: drop-shadow(0 0 8px rgba(161,98,7,0.75)); }
      }
      @keyframes magmaAnimL3 {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 1px 2px rgba(15,23,42,0.4)); }
        50% { transform: scale(1.32); filter: drop-shadow(0 0 10px rgba(194,65,12,0.85)); }
      }
      @keyframes magmaAnimL4 {
        0%, 100% { transform: scale(1) translateX(0); filter: drop-shadow(0 1px 2px rgba(15,23,42,0.45)); }
        25% { transform: scale(1.28) translateX(-1px); }
        50% { transform: scale(1.38) translateX(0); filter: drop-shadow(0 0 12px rgba(185,28,28,0.95)); }
        75% { transform: scale(1.28) translateX(1px); }
      }
      @keyframes magmaGlowRing {
        0% { transform: translate(-50%,-50%) scale(0.55); opacity: 0.7; }
        70% { opacity: 0.2; }
        100% { transform: translate(-50%,-50%) scale(1.55); opacity: 0; }
      }
      .bmkg-wrap { position:relative; display:inline-block; cursor:pointer; }
      .bmkg-ring { position:absolute; top:50%; left:50%; border-radius:50%; border:2px solid; animation: bmkgRipple 2.2s ease-out infinite; pointer-events:none; }
      .bmkg-dot { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); border-radius:50%; border:2px solid rgba(255,255,255,0.9); z-index:3; }
      .magma-divicon { background: transparent !important; border: none !important; }
      .magma-tri-wrap {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        transform-origin: 50% 65%;
        filter: drop-shadow(0 1px 2px rgba(15,23,42,0.45));
        cursor: pointer;
      }
      .magma-tri-wrap.anim-l0 { animation: magmaAnimL0 2.8s ease-in-out infinite; }
      .magma-tri-wrap.anim-l1 { animation: magmaAnimL1 2.4s ease-in-out infinite; }
      .magma-tri-wrap.anim-l2 { animation: magmaAnimL2 2.1s ease-in-out infinite; }
      .magma-tri-wrap.anim-l3 { animation: magmaAnimL3 1.7s ease-in-out infinite; }
      .magma-tri-wrap.anim-l4 { animation: magmaAnimL4 1.35s ease-in-out infinite; }
      .magma-tri-wrap.is-selected { filter: drop-shadow(0 0 6px rgba(15,23,42,0.55)); }
      .magma-tri-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 160%;
        height: 160%;
        border-radius: 50%;
        border: 2px solid var(--magma-glow, #C2410C);
        box-shadow: 0 0 8px var(--magma-glow, #C2410C);
        pointer-events: none;
        z-index: 0;
        animation: magmaGlowRing 2s ease-out infinite;
      }
      .magma-tri-glow.is-fast { animation-duration: 1.45s; }
      .magma-tri-glow.is-delayed { animation-delay: 0.7s; }
      .magma-tri { position: relative; z-index: 1; display: block; overflow: visible; }
      .magma-neighbor-divicon { background: transparent !important; border: none !important; }
      .magma-label-tooltip {
        background: rgba(15, 23, 42, 0.88) !important;
        color: #F8FAFC !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 4px 8px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        box-shadow: 0 4px 14px rgba(15,23,42,0.28) !important;
      }
      .magma-label-tooltip::before { border-top-color: rgba(15,23,42,0.88) !important; }
      .inarisk-fade-layer { transition: opacity 0.55s ease; }
      @media (prefers-reduced-motion: reduce) {
        .bmkg-ring,
        .magma-tri-wrap.anim-l0,
        .magma-tri-wrap.anim-l1,
        .magma-tri-wrap.anim-l2,
        .magma-tri-wrap.anim-l3,
        .magma-tri-wrap.anim-l4,
        .magma-tri-glow { animation: none !important; }
        .magma-tri-glow { opacity: 0.35; transform: translate(-50%,-50%) scale(1); }
      }
    `;
  }, []);

  // Fetch InARISK kerentanan mengikuti filter wilayah (hanya kab/kota)
  useEffect(() => {
    if (!showKerentanan) return;

    if (!kerentananCode) {
      setKerentananData([]);
      setKerentananFeed('need-wilayah');
      kerentananFitCodeRef.current = null;
      return;
    }

    if (!kerentananKabOk) {
      setKerentananData([]);
      setKerentananFeed('need-kab');
      kerentananFitCodeRef.current = null;
      return;
    }

    const ac = new AbortController();
    setKerentananData([]);
    setKerentananFeed('loading');
    kerentananFitCodeRef.current = null;

    const fetchKerentanan = async () => {
      try {
        const res = await fetch(`/api/kerentanan?code=${encodeURIComponent(kerentananCode)}`, {
          cache: 'no-store',
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        if (!res.ok) {
          setKerentananData([]);
          setKerentananFeed('error');
          return;
        }
        const cacheHdr = (res.headers.get('x-cache') || '').toUpperCase();
        let json: unknown;
        try {
          json = await res.json();
        } catch {
          if (!ac.signal.aborted) {
            setKerentananData([]);
            setKerentananFeed('error');
          }
          return;
        }
        if (ac.signal.aborted) return;
        const items = Array.isArray(json) ? json : (json as { data?: KerentananData[] })?.data || [];
        setKerentananData(items);
        if (items.length === 0) {
          setKerentananFeed('empty');
        } else if (cacheHdr === 'FALLBACK_LOCAL') {
          setKerentananFeed('fallback');
        } else {
          setKerentananFeed('live');
        }
      } catch {
        if (ac.signal.aborted) return;
        setKerentananData([]);
        setKerentananFeed('error');
      }
    };
    fetchKerentanan();
    return () => {
      ac.abort();
    };
  }, [kerentananCode, kerentananKabOk, showKerentanan]);

  // Fetch hotspot SIPONGI (48 jam, High) mengikuti filter wilayah
  useEffect(() => {
    if (!showSipongi) {
      setSipongiData([]);
      setSipongiFeed(null);
      return;
    }

    const ac = new AbortController();
    setSipongiData([]);
    setSipongiFeed('loading');
    sipongiFitKeyRef.current = null;

    const prov = encodeURIComponent(sipongiProvinsiParam || 'all');
    // confidence=all agar bisa dikorelasikan dengan laporan BNPB (sering Medium)
    fetch(
      `/api/sipongi?action=sebaran&late=48&satelit=all-nasa&confidence=all&provinsi=${prov}`,
      { cache: 'no-store', signal: ac.signal },
    )
      .then(async (res) => {
        const cacheHdr = (res.headers.get('x-cache') || '').toUpperCase();
        const json = await res.json().catch(() => ({}));
        if (ac.signal.aborted) return;
        if (!res.ok || json?.error) {
          setSipongiData([]);
          setSipongiFeed('error');
          return;
        }
        let list: SipongiHotspotRow[] = Array.isArray(json?.data) ? json.data : [];
        if (sipongiKabFilterKey) {
          list = list.filter((h) => normalizeWilayahKey(h.kabupaten) === sipongiKabFilterKey);
        }
        setSipongiData(list);
        if (list.length === 0) setSipongiFeed('empty');
        else if (cacheHdr === 'FALLBACK_STALE') setSipongiFeed('fallback');
        else if (cacheHdr === 'CACHE' || cacheHdr === 'HIT') setSipongiFeed('cache');
        else setSipongiFeed('live');
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.error('[sipongi map]', err);
        setSipongiData([]);
        setSipongiFeed('error');
      });

    return () => ac.abort();
  }, [showSipongi, sipongiProvinsiParam, sipongiKabFilterKey]);

  // Fetch BMKG Nowcast CAP (peringatan dini cuaca) — filter wilayah di client
  useEffect(() => {
    if (!showNowcast) {
      setNowcastAlerts([]);
      setNowcastFeed(null);
      return;
    }

    const ac = new AbortController();
    setNowcastFeed('loading');
    nowcastFitKeyRef.current = null;

    fetch('/api/bmkg-nowcast', { cache: 'no-store', signal: ac.signal })
      .then(async (res) => {
        const cacheHdr = (res.headers.get('x-cache') || '').toUpperCase();
        const json = await res.json().catch(() => ({}));
        if (ac.signal.aborted) return;
        if (!res.ok || json?.ok === false) {
          setNowcastAlerts([]);
          setNowcastFeed('error');
          return;
        }
        const list: BmkgNowcastAlert[] = dedupeNowcastAlerts(
          Array.isArray(json?.alerts) ? json.alerts : [],
        );
        setNowcastAlerts(list);
        if (list.length === 0) setNowcastFeed('empty');
        else if (cacheHdr === 'FALLBACK_STALE') setNowcastFeed('fallback');
        else if (cacheHdr === 'CACHE' || cacheHdr === 'HIT') setNowcastFeed('cache');
        else setNowcastFeed('live');
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.error('[bmkg-nowcast map]', err);
        setNowcastAlerts([]);
        setNowcastFeed('error');
      });

    return () => ac.abort();
  }, [showNowcast]);

  // Fetch all 3 BMKG Earthquake Endpoints (Gempa Terkini, Gempa Dirasakan, Gempa Terbaru/Autogempa)
  useEffect(() => {
    const fetchBmkg = async () => {
      try {
        // 1. Gempa Terkini (M >= 5.0)
        const r1 = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', { cache: 'no-store' });
        const j1 = await r1.json();
        setBmkgData(j1?.Infogempa?.gempa ?? []);

        // 2. Gempa Dirasakan
        const r2 = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json', { cache: 'no-store' });
        const j2 = await r2.json();
        setBmkgDirasakanData(j2?.Infogempa?.gempa ?? []);

        // 3. Gempa Terbaru (Autogempa)
        const r3 = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', { cache: 'no-store' });
        const j3 = await r3.json();
        const autoObj = j3?.Infogempa?.gempa;
        setBmkgAutoData(autoObj ? [autoObj] : []);
      } catch {
        setBmkgData([]);
        setBmkgDirasakanData([]);
        setBmkgAutoData([]);
      }
    };
    fetchBmkg();
    const timer = setInterval(fetchBmkg, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch MapServer Legends
  useEffect(() => {
    layersList.filter((l) => l.type === 'MapServer' && !l.url.endsWith('.json') && activeOverlays.includes(l.id)).forEach((layer) => {
      const fetchLegendWithToken = (tok?: string) => {
        let cleanLegendUrl = layer.url;
        let targetLayerId: number | null = null;
        const match = layer.url.match(/\/MapServer\/(\d+)$/);
        if (match && match.index !== undefined) {
          cleanLegendUrl = layer.url.substring(0, match.index + 10);
          targetLayerId = parseInt(match[1], 10);
        }

        const tokenParam = tok ? `&token=${tok}` : '';
        const legendUrl = `${cleanLegendUrl}/legend?f=pjson${tokenParam}`;
        fetch(legendUrl)
          .then((r) => r.json())
          .then((json) => {
            const items: MapServerLegendItem[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (json?.layers ?? []).forEach((lyr: any) => {
              if (targetLayerId !== null && lyr.layerId !== targetLayerId) return;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (lyr.legend ?? []).forEach((item: any) => {
                if (item.imageData) items.push({ label: item.label || lyr.layerName || '—', imageData: item.imageData, layerName: lyr.layerName ?? '' });
              });
            });
            setMapserverLegends((p) => ({ ...p, [layer.id]: items }));
          })
          .catch(() => null);
      };

      const needsToken = layer.requiresToken || (layer as unknown as { requires_token?: boolean }).requires_token || layer.url.includes('geoservices.big.go.id');
      if (needsToken) {
        fetch('/api/big-token')
          .then((r) => r.json())
          .then((res) => fetchLegendWithToken(res?.token))
          .catch(() => fetchLegendWithToken());
      } else {
        fetchLegendWithToken();
      }
    });
  }, [activeOverlays, layersList]);

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
      if (bm.isMapServerExport && bm.url) {
        const exportUrl = bm.url;
        const group = L.layerGroup();
        const addLayerToGroup = (tok?: string) => {
          const arcLayer = createArcGISExportLayer(L, exportUrl, 1, false, true, 'show:all', tok);
          arcLayer.addTo(group);
        };
        if (bm.requiresToken) {
          fetch('/api/big-token')
            .then((r) => r.json())
            .then((res) => addLayerToGroup(res?.token))
            .catch(() => addLayerToGroup());
        } else {
          addLayerToGroup();
        }
        baseLayersRef.current[bm.id] = group;
      } else if (bm.layers) {
        const group = L.layerGroup();
        bm.layers.forEach((l) => L.tileLayer(l.url, { attribution: l.attr, maxZoom: 19 }).addTo(group));
        baseLayersRef.current[bm.id] = group;
      }
    });

    if (baseLayersRef.current['esri_imagery']) baseLayersRef.current['esri_imagery'].addTo(map);

    // kjs_bencana.json disabled as requested
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render Disaster Markers — highlight/dim saat ada pilihan dari panel
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (!showBencanaData) return;

    // Skenario erupsi / status gunung aktif: sembunyikan titik kejadian ungu (hindari tabrakan)
    const magmaOn =
      activeOverlays.includes('magma_status') ||
      activeOverlays.includes('magma_volcanoes') ||
      activeOverlays.includes('magma_volcanoes_v2');
    const hideErupsiKejadian = magmaOn || selectedJenis === 'erupsi';

    if (typeof document !== 'undefined' && !document.getElementById('kejadian-marker-style')) {
      const style = document.createElement('style');
      style.id = 'kejadian-marker-style';
      style.textContent = `
        @keyframes kejadian-halo-pulse {
          0% { opacity: 0.45; }
          70% { opacity: 0.12; }
          100% { opacity: 0.45; }
        }
        .kejadian-marker-halo {
          animation: kejadian-halo-pulse 1.8s ease-out infinite;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }

    const hasSelection = selectedKejadianId != null;
    const ordered = [...data].sort((a, b) => {
      if (a.id === selectedKejadianId) return 1;
      if (b.id === selectedKejadianId) return -1;
      return 0;
    });

    // Cast: beberapa build leaflet types membuat CircleMarker sempit/never
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let selectedMarker: any = null;

    ordered.forEach((k) => {
      if (hideErupsiKejadian && String(k.jenis).toLowerCase() === 'erupsi') return;

      const color = JENIS_COLOR[k.jenis] ?? '#94A3B8';
      // Radius lebih ketat agar fullscreen tidak penuh blob
      const baseRadius = Math.min(3.5 + k.korban_jiwa * 0.1 + k.pengungsi * 0.00035, 9);
      const isSelected = hasSelection && k.id === selectedKejadianId;
      const isDimmed = hasSelection && !isSelected;
      const sipongiHit =
        showSipongi && isKejadianKebakaran(k.jenis)
          ? findSipongiForKab(k.kabupaten)
          : null;
      const hasSipongiOverlap = !!sipongiHit && sipongiHit.total > 0;

      if (isSelected || hasSipongiOverlap) {
        const halo = L.circleMarker([k.lat, k.lng], {
          radius: Math.max(baseRadius + (hasSipongiOverlap ? 10 : 8), 14),
          color: hasSipongiOverlap ? '#EA580C' : color,
          fillColor: hasSipongiOverlap ? '#F97316' : color,
          fillOpacity: hasSipongiOverlap ? 0.12 : 0.16,
          weight: hasSipongiOverlap ? 2 : 0,
          opacity: hasSipongiOverlap ? 0.85 : 0.4,
          dashArray: hasSipongiOverlap ? '4 3' : undefined,
          interactive: false,
          className: isSelected ? 'kejadian-marker-halo' : undefined,
        });
        halo.addTo(map);
        markersRef.current.push(halo);
      }

      const circle = L.circleMarker([k.lat, k.lng], {
        radius: isSelected ? Math.max(baseRadius, 7) : hasSipongiOverlap ? Math.max(baseRadius, 6) : baseRadius,
        color: isSelected
          ? '#0a1e36'
          : hasSipongiOverlap
            ? '#9A3412'
            : k.status === 'saat'
              ? '#EF4444'
              : color,
        fillColor: hasSipongiOverlap ? '#F97316' : color,
        fillOpacity: isDimmed ? 0.2 : isSelected ? 0.95 : hasSipongiOverlap ? 0.9 : 0.75,
        opacity: isDimmed ? 0.35 : 1,
        weight: isSelected ? 2.5 : hasSipongiOverlap ? 2 : 1.25,
      });
      const loc = [k.kabupaten, k.provinsi].filter(Boolean).join(', ');
      circle.bindPopup(`
        <div style="font-family:sans-serif; min-width:180px;">
          <div style="font-weight:bold; color:${hasSipongiOverlap ? '#EA580C' : color}; font-size:12px;">${k.jenis.toUpperCase()} · ${k.nama}</div>
          <div style="font-size:11px; color:#666;">${loc || 'Lokasi'}</div>
          <div style="font-size:11px; margin-top:4px;">Korban: <b>${k.korban_jiwa}</b> | Pengungsi: <b>${k.pengungsi}</b></div>
          ${
            hasSipongiOverlap && sipongiHit
              ? `<div style="margin-top:6px;padding:5px 7px;border-radius:8px;background:#FFF7ED;border:1px solid #FDBA74;font-size:10.5px;color:#9A3412;font-weight:700;">
                   Hotspot SIPONGI di kab ini: ${sipongiHit.total} titik (48 jam${sipongiHit.high ? ` · High ${sipongiHit.high}` : ''})
                 </div>`
              : ''
          }
        </div>
      `);
      circle.on('click', () => {
        onKejadianMarkerClickRef.current?.(k.id);
      });
      circle.addTo(map);
      markersRef.current.push(circle);
      if (isSelected) selectedMarker = circle;
    });

    if (selectedMarker) {
      selectedMarker.bringToFront();
      selectedMarker.openPopup();
    }
  }, [data, showBencanaData, selectedKejadianId, activeOverlays, selectedJenis, showSipongi, findSipongiForKab]);

  // Render InARISK Kerentanan markers (chunked cluster + fit bounds)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (kerentananClusterRef.current) {
      map.removeLayer(kerentananClusterRef.current);
      kerentananClusterRef.current = null;
    }

    if (!showKerentanan || !kerentananKabOk || !kerentananCode || kerentananData.length === 0) return;

    const cluster = (
      L as typeof L & { markerClusterGroup: (o?: object) => L.MarkerClusterGroup }
    ).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 16,
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 40,
    });

    const layers: L.Layer[] = [];
    const bounds = L.latLngBounds([]);

    kerentananData.forEach((item: KerentananData) => {
      if (item.latitude == null || item.longitude == null) return;
      const lat = parseFloat(String(item.latitude));
      const lng = parseFloat(String(item.longitude));
      if (isNaN(lat) || isNaN(lng)) return;

      const riskColor =
        item.nilai_index_kerentanan === 'Tinggi'
          ? '#DC2626'
          : item.nilai_index_kerentanan === 'Sedang'
            ? '#F59E0B'
            : '#10B981';

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;border-radius:9999px;background:${riskColor};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([lat, lng], { icon });
      bounds.extend([lat, lng]);

      // Demo: jangan tampilkan foto & nama mentah (PII)
      const maskedResponden = maskName(item.nama_responden);
      const rawId = String(item.no_kuesioner || '-');
      const kuesionerId =
        rawId.length > 14 ? `${rawId.slice(0, 8)}…${rawId.slice(-4)}` : rawId;

      marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:240px; max-width:280px; font-size:11px; color:#333; line-height:1.4;">
            <div style="font-weight:bold; color:#0EA5E9; font-size:12px; border-bottom:1px solid #eee; padding-bottom:3px; margin-bottom:4px;">
              Survey Kerentanan InARISK
            </div>
            <div style="font-weight:bold; font-size:11px; color:#1e293b;">${kuesionerId}</div>
            <table style="width:100%; margin-top:6px; border-collapse:collapse; font-size:10.5px;">
              <tr><td style="color:#64748b;">Responden:</td><td style="font-weight:600;">${maskedResponden} (${item.hubungan_dengan_penghuni || '-'})</td></tr>
              <tr><td style="color:#64748b;">Gender/Usia:</td><td style="font-weight:600;">${String(item.jenis_kelamin || '-').toUpperCase()} / ${item.usia || '-'} thn</td></tr>
              <tr><td style="color:#64748b;">Pendidikan:</td><td style="font-weight:600;">${item.pendidikan_terakhir || '-'}</td></tr>
              <tr><td style="color:#64748b;">Wilayah:</td><td style="font-weight:600;">Desa ${item.nama_desa || '-'} (RT ${item.rt || '-'}/RW ${item.rw || '-'})</td></tr>
              <tr><td style="color:#64748b;">Kecamatan:</td><td style="font-weight:600;">${item.kecamatan || '-'}</td></tr>
              <tr><td style="color:#64748b;">Fungsi Bangunan:</td><td style="font-weight:600;">${item.fungsi_bangunan || '-'}</td></tr>
              <tr><td style="color:#64748b;">Jumlah Penghuni:</td><td style="font-weight:600;">${item.hasil_jumlah_penghuni ?? 0} (Siang: ${item.hasil_penghuni_siang || 0}, Malam: ${item.hasil_penghuni_malam || 0})</td></tr>
              <tr><td style="color:#64748b;">Kelompok Rentan:</td><td style="font-weight:600;">Perempuan:${item.hasil_perempuan ?? 0}, Balita:${item.hasil_balita ?? 0}, Manula:${item.hasil_manula ?? 0}, Difabel:${item.hasil_difabel ?? 0}</td></tr>
              <tr><td style="color:#64748b;">Penyakit/PKH:</td><td style="font-weight:600;">${item.hasil_penderita_penyakit ?? 0} / PKH: ${item.terima_pkh || '-'}</td></tr>
              <tr><td style="color:#64748b;">Penghasilan:</td><td style="font-weight:600;">${item.penghasilan || '-'}</td></tr>
              <tr><td style="color:#64748b;">Indeks Risiko:</td><td style="font-weight:700; color:${riskColor};">${item.nilai_index_kerentanan || 'Rendah'} (${item.risk?.toFixed(3) || '0.000'})</td></tr>
              <tr><td style="color:#64748b;">Waktu Survey:</td><td style="color:#64748b;">${item.answer_date ? new Date(item.answer_date).toLocaleString('id-ID') : '-'}</td></tr>
            </table>
          </div>
        `);
      layers.push(marker);
    });

    if (layers.length === 0) return;

    cluster.addLayers(layers);
    cluster.addTo(map);
    kerentananClusterRef.current = cluster;

    // Hindari double-fly: skip fitBounds jika pusat data sudah di viewport & zoom cukup dekat
    if (bounds.isValid() && kerentananFitCodeRef.current !== kerentananCode) {
      kerentananFitCodeRef.current = kerentananCode;
      const center = bounds.getCenter();
      const mapBounds = map.getBounds();
      const alreadyFramed = mapBounds.contains(center) && map.getZoom() >= 10;
      if (!alreadyFramed) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: true });
      }
    }

    return () => {
      if (kerentananClusterRef.current) {
        map.removeLayer(kerentananClusterRef.current);
        kerentananClusterRef.current = null;
      }
    };
  }, [kerentananData, showKerentanan, kerentananKabOk, kerentananCode]);

  // Render SIPONGI hotspot aggregat (kab centroid) + korelasi kejadian kebakaran
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (sipongiLayerRef.current) {
      map.removeLayer(sipongiLayerRef.current);
      sipongiLayerRef.current = null;
    }

    if (!showSipongi || sipongiData.length === 0) return;

    const group = L.layerGroup();
    const bounds = L.latLngBounds([]);
    const aggregated: Record<
      string,
      {
        provinsi: string;
        kabupaten: string;
        total: number;
        high: number;
        sources: Record<string, number>;
      }
    > = {};

    sipongiData.forEach((h) => {
      const kab = (h.kabupaten || '').trim().toUpperCase();
      if (!kab) return;
      if (!aggregated[kab]) {
        aggregated[kab] = {
          provinsi: h.provinsi || '-',
          kabupaten: h.kabupaten,
          total: 0,
          high: 0,
          sources: {},
        };
      }
      aggregated[kab].total += h.counter || 0;
      if (String(h.confidence).toLowerCase() === 'high') {
        aggregated[kab].high += h.counter || 0;
      }
      aggregated[kab].sources[h.sumber] =
        (aggregated[kab].sources[h.sumber] || 0) + (h.counter || 0);
    });

    const items = Object.values(aggregated);
    const maxCount = Math.max(...items.map((i) => i.total), 1);

    items.forEach((item, idx) => {
      const resolved = resolveSipongiKabCoord(item.provinsi, item.kabupaten, {
        indexHint: idx,
        totalHints: items.length,
      });
      const kejadianHits = showBencanaData
        ? data.filter(
            (k) =>
              isKejadianKebakaran(k.jenis) &&
              kabNamesLooselyMatch(k.kabupaten, item.kabupaten),
          )
        : [];
      const hasKejadian = kejadianHits.length > 0;
      const ratio = item.total / maxCount;
      const radius = Math.max(8, Math.min(22, Math.round(8 + ratio * 14)));
      const mostlyHigh = item.high > 0 && item.high >= item.total * 0.4;

      const circle = L.circleMarker([resolved.lat, resolved.lng], {
        radius,
        color: hasKejadian ? '#7C2D12' : mostlyHigh ? '#C2410C' : '#D97706',
        fillColor: hasKejadian ? '#EA580C' : mostlyHigh ? '#F97316' : '#FBBF24',
        fillOpacity: hasKejadian ? 0.75 : mostlyHigh ? 0.6 : 0.45,
        weight: hasKejadian ? 2.5 : 1.5,
        opacity: 0.95,
      });

      const sourcesText = Object.entries(item.sources)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');

      circle.bindPopup(`
        <div style="font-family:sans-serif;min-width:200px;max-width:260px;font-size:11px;color:#1e293b;">
          <div style="font-weight:800;color:#C2410C;font-size:12px;margin-bottom:2px;">🔥 Hotspot SIPONGI</div>
          <div style="font-weight:700;">${item.kabupaten}</div>
          <div style="font-size:10.5px;color:#64748b;margin-bottom:6px;">${item.provinsi}</div>
          <div style="padding:6px 8px;background:#FFF7ED;border:1px solid #FDBA74;border-radius:8px;margin-bottom:6px;">
            <div style="font-size:10px;color:#9A3412;font-weight:700;">48 JAM · SEMUA CONFIDENCE</div>
            <div style="font-size:15px;font-weight:900;color:#9A3412;">${item.total} Titik</div>
            <div style="font-size:10px;color:#C2410C;margin-top:2px;">High: ${item.high} · Lainnya: ${Math.max(item.total - item.high, 0)}</div>
          </div>
          <div style="font-size:10px;color:#475569;margin-bottom:4px;">${sourcesText || 'NASA'}</div>
          <div style="font-size:10.5px;padding:5px 7px;border-radius:8px;background:${hasKejadian ? '#FEF2F2' : '#F8FAFC'};border:1px solid ${hasKejadian ? '#FECACA' : '#E2E8F0'};color:${hasKejadian ? '#991B1B' : '#64748b'};font-weight:700;">
            ${
              hasKejadian
                ? `Ada ${kejadianHits.length} laporan kejadian kebakaran BNPB di kab ini`
                : 'Belum ada laporan kejadian kebakaran BNPB (mingguan) di kab ini'
            }
          </div>
          <div style="font-size:9.5px;color:#94a3b8;margin-top:6px;">Agregat kab — bukan pixel satelit. Detail: Analisis Data → SIPONGI.</div>
        </div>
      `);

      circle.addTo(group);
      bounds.extend([resolved.lat, resolved.lng]);
    });

    group.addTo(map);
    sipongiLayerRef.current = group;

    const fitKey = `${sipongiProvinsiParam}|${sipongiKabFilterKey || ''}|${items.length}`;
    if (bounds.isValid() && sipongiFitKeyRef.current !== fitKey) {
      sipongiFitKeyRef.current = fitKey;
      const center = bounds.getCenter();
      const already =
        map.getBounds().contains(center) && map.getZoom() >= (sipongiKabFilterKey ? 9 : 7);
      if (!already) {
        map.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: sipongiKabFilterKey ? 10 : 8,
          animate: true,
        });
      }
    }

    return () => {
      if (sipongiLayerRef.current) {
        map.removeLayer(sipongiLayerRef.current);
        sipongiLayerRef.current = null;
      }
    };
  }, [
    sipongiData,
    showSipongi,
    showBencanaData,
    data,
    sipongiProvinsiParam,
    sipongiKabFilterKey,
  ]);

  // Render BMKG Nowcast: nasional = titik ringkas; filter provinsi = polygon detail
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (nowcastLayerRef.current) {
      map.removeLayer(nowcastLayerRef.current);
      nowcastLayerRef.current = null;
    }

    if (!showNowcast || nowcastVisibleAlerts.length === 0) return;

    const group = L.layerGroup();
    const bounds = L.latLngBounds([]);
    const detailMode = !!nowcastProvinsiKey;

    const centroidOfRings = (rings: number[][][]): { lat: number; lng: number } | null => {
      let latSum = 0;
      let lngSum = 0;
      let n = 0;
      rings.forEach((ring) => {
        ring.forEach(([lat, lng]) => {
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          latSum += lat;
          lngSum += lng;
          n += 1;
        });
      });
      if (!n) return null;
      return { lat: latSum / n, lng: lngSum / n };
    };

    nowcastVisibleAlerts.forEach((alert) => {
      const palette = severityColor(alert.severity);
      const kejadianHits = showBencanaData
        ? data.filter(
            (k) =>
              isKejadianCuacaTerkait(k.jenis) &&
              provinsiKeysMatch(k.provinsi, alert.provinsi),
          )
        : [];
      const hasKejadian = kejadianHits.length > 0;
      const kecSample = alert.kecamatan.slice(0, 8).join(', ');
      const moreKec =
        alert.kecamatan.length > 8 ? ` +${alert.kecamatan.length - 8}` : '';

      const effectiveLabel = alert.effective
        ? new Date(alert.effective).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '—';
      const expiresLabel = alert.expires
        ? new Date(alert.expires).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '—';

      const popupHtml = `
        <div style="font-family:sans-serif;min-width:220px;max-width:280px;font-size:11px;color:#1e293b;">
          <div style="font-weight:800;color:#1D4ED8;font-size:12px;margin-bottom:2px;">⚡ Nowcast BMKG</div>
          <div style="font-weight:700;line-height:1.35;margin-bottom:4px;">${alert.headline}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <span style="font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:999px;background:${palette.fill}22;color:${palette.stroke};border:1px solid ${palette.fill}66;">${palette.label}</span>
            <span style="font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:999px;background:#F1F5F9;color:#475569;">${alert.event}</span>
          </div>
          <div style="padding:6px 8px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;margin-bottom:6px;font-size:10.5px;line-height:1.4;">
            <div><b>Berlaku</b> ${effectiveLabel}</div>
            <div><b>Hingga</b> ${expiresLabel}</div>
            <div style="margin-top:2px;color:#64748b;">${alert.provinsi || alert.areaDesc}</div>
          </div>
          ${
            kecSample
              ? `<div style="font-size:10px;color:#475569;margin-bottom:6px;"><b>Area</b>: ${kecSample}${moreKec}</div>`
              : ''
          }
          <div style="font-size:10.5px;padding:5px 7px;border-radius:8px;background:${hasKejadian ? '#FEF2F2' : '#F8FAFC'};border:1px solid ${hasKejadian ? '#FECACA' : '#E2E8F0'};color:${hasKejadian ? '#991B1B' : '#64748b'};font-weight:700;">
            ${
              hasKejadian
                ? `${kejadianHits.length} laporan BNPB terkait cuaca/banjir/longsor di provinsi ini`
                : 'Belum ada laporan BNPB terkait di feed mingguan provinsi ini'
            }
          </div>
          ${
            alert.web
              ? `<div style="margin-top:6px;"><a href="${alert.web}" target="_blank" rel="noopener noreferrer" style="font-size:10px;color:#2563EB;font-weight:700;">Infografis BMKG →</a></div>`
              : ''
          }
          <div style="font-size:9.5px;color:#94a3b8;margin-top:6px;">
            ${detailMode ? 'Polygon wilayah terdampak CAP' : 'Tampilan nasional ringkas — pilih provinsi untuk polygon detail'} · BMKG Nowcast
          </div>
        </div>
      `;

      if (detailMode) {
        // Batasi agar tetap ringan meski CAP padat
        const rings = alert.polygons.slice(0, 24);
        rings.forEach((ring) => {
          if (ring.length < 4) return;
          const poly = L.polygon(ring as L.LatLngExpression[], {
            color: hasKejadian ? '#7F1D1D' : palette.stroke,
            weight: hasKejadian ? 2.25 : 1.5,
            opacity: 0.9,
            fillColor: palette.fill,
            fillOpacity: hasKejadian ? 0.28 : 0.18,
            className: 'bmkg-nowcast-poly',
          });
          poly.bindPopup(popupHtml);
          poly.addTo(group);
          try {
            bounds.extend(poly.getBounds());
          } catch {
            /* ignore */
          }
        });
      } else {
        const c = centroidOfRings(alert.polygons);
        if (!c) return;
        const radius =
          8 + Math.min(6, severityRank(alert.severity) * 1.5) + (hasKejadian ? 2 : 0);
        const marker = L.circleMarker([c.lat, c.lng], {
          radius,
          color: hasKejadian ? '#7F1D1D' : palette.stroke,
          weight: hasKejadian ? 2.5 : 1.5,
          fillColor: palette.fill,
          fillOpacity: hasKejadian ? 0.75 : 0.55,
          opacity: 0.95,
          className: 'bmkg-nowcast-dot',
        });
        marker.bindPopup(popupHtml);
        marker.addTo(group);
        bounds.extend([c.lat, c.lng]);
      }
    });

    group.addTo(map);
    nowcastLayerRef.current = group;

    const fitKey = `${nowcastProvinsiKey || 'all'}|${sipongiKabFilterKey || ''}|${nowcastVisibleAlerts.length}|${detailMode ? 'poly' : 'dot'}`;
    if (bounds.isValid() && nowcastFitKeyRef.current !== fitKey) {
      nowcastFitKeyRef.current = fitKey;
      const center = bounds.getCenter();
      const already =
        map.getBounds().contains(center) &&
        map.getZoom() >= (detailMode ? 7 : 5);
      if (!already) {
        map.fitBounds(bounds, {
          padding: [36, 36],
          maxZoom: detailMode ? 9 : 6,
          animate: true,
        });
      }
    }

    return () => {
      if (nowcastLayerRef.current) {
        map.removeLayer(nowcastLayerRef.current);
        nowcastLayerRef.current = null;
      }
    };
  }, [
    showNowcast,
    nowcastVisibleAlerts,
    showBencanaData,
    data,
    nowcastProvinsiKey,
    sipongiKabFilterKey,
  ]);

  // Render BMKG Earthquakes (Supports 1-Click Modes: Gempa Terkini M>=5, Gempa Dirasakan, Gempa Terbaru Autogempa)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    bmkgMarkersRef.current.forEach((m) => map.removeLayer(m));
    bmkgMarkersRef.current = [];

    if (!showBmkg) return;

    const currentList = bmkgMode === 'dirasakan' 
      ? bmkgDirasakanData 
      : bmkgMode === 'autogempa' 
      ? bmkgAutoData 
      : bmkgData;

    currentList.forEach((g) => {
      const parts = g.Coordinates.split(',');
      if (parts.length < 2) return;
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) return;

      const key = `${g.DateTime || `${g.Tanggal}|${g.Jam}`}|${g.Coordinates}`;
      const selected = selectedBmkgKey === key;
      const mag = parseFloat(g.Magnitude);
      const color = mag >= 6 ? '#DC2626' : mag >= 5 ? '#F97316' : '#FBBF24';
      const size = selected ? 38 : 30;
      const ring = selected ? 26 : 20;
      const icon = L.divIcon({
        className: 'magma-divicon',
        html: `<div class="bmkg-wrap" style="width:${size}px;height:${size}px">
          <div class="bmkg-ring" style="width:${ring}px;height:${ring}px;border-color:${color};border-width:${selected ? 3 : 2}px;"></div>
          <div class="bmkg-dot" style="width:${selected ? 12 : 10}px;height:${selected ? 12 : 10}px;background:${color};"></div>
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([lat, lng], { icon, zIndexOffset: selected ? 800 : 0 });
      marker.bindPopup(`
        <div style="font-family:sans-serif;">
          <div style="font-weight:bold; color:${color}; font-size:12px;">GEMPA M ${g.Magnitude}</div>
          <div style="font-size:11px; color:#333;">${g.Wilayah}</div>
          <div style="font-size:10px; color:#666;">Kedalaman: ${g.Kedalaman} | ${g.Tanggal} ${g.Jam}</div>
        </div>
      `);
      marker.on('click', () => onBmkgMarkerClickRef.current?.(key));
      marker.addTo(map);
      bmkgMarkersRef.current.push(marker);
    });
  }, [bmkgData, bmkgDirasakanData, bmkgAutoData, bmkgMode, showBmkg, selectedBmkgKey]);

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
        if (bm.isMapServerExport && bm.url) {
          const exportUrl = bm.url;
          const group = L.layerGroup();
          const addPreviewBase = (tok?: string) => {
            const arcLayer = createArcGISExportLayer(L, exportUrl, 1, false, true, 'show:all', tok);
            arcLayer.addTo(group);
          };
          if (bm.requiresToken) {
            fetch('/api/big-token')
              .then((r) => r.json())
              .then((res) => addPreviewBase(res?.token))
              .catch(() => addPreviewBase());
          } else {
            addPreviewBase();
          }
          previewBaseLayersRef.current[bm.id] = group;
        } else if (bm.layers) {
          const group = L.layerGroup();
          bm.layers.forEach((l) => L.tileLayer(l.url, { maxZoom: 19 }).addTo(group));
          previewBaseLayersRef.current[bm.id] = group;
        }
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
      const currentOp = draftOpacities[id] ?? 1.0;
      if (previewOverlayLayersRef.current[id]) {
        if (typeof previewOverlayLayersRef.current[id].setOpacity === 'function') {
          previewOverlayLayersRef.current[id].setOpacity(currentOp);
        }
        return;
      }
      const def = layersList.find((l) => l.id === id);
      if (!def || def.type === 'Dapodik' || def.type === 'GeoJSON' || def.url.startsWith('/')) return;
      if (def.type === 'WMS') {
        previewOverlayLayersRef.current[id] = L.tileLayer.wms(def.url, {
          layers: def.layersParam ?? '',
          format: 'image/png',
          transparent: true,
          version: '1.1.0',
          crs: L.CRS.EPSG3857,
          opacity: currentOp,
        });
        previewOverlayLayersRef.current[id].addTo(pMap);
      } else {
        const addPreviewLayer = (tok?: string) => {
          if (!previewMapRef.current || previewOverlayLayersRef.current[id]) return;
          previewOverlayLayersRef.current[id] = createArcGISExportLayer(
            L, def.url, currentOp,
            def.type === 'ImageServer',
            def.useLngLat ?? false,
            def.layersParam ?? 'show:0',
            tok
          );
          previewOverlayLayersRef.current[id].addTo(previewMapRef.current);
        };

        if (def.requiresToken) {
          fetch('/api/big-token')
            .then((r) => r.json())
            .then((res) => addPreviewLayer(res?.token))
            .catch(() => addPreviewLayer());
        } else {
          addPreviewLayer();
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftBasemap, draftOverlays, draftOpacities, showLayerModal]);

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

    // Remove layers no longer active
    Object.keys(overlayLayersRef.current).forEach((id) => {
      if (!activeOverlays.includes(id)) {
        map.removeLayer(overlayLayersRef.current[id]);
        delete overlayLayersRef.current[id];
      }
    });

    // Add or bring to front in exact array order (bottom to top)
    activeOverlays.forEach((id) => {
      const existing = overlayLayersRef.current[id];
      const targetOpacity = layerOpacities[id] ?? 1.0;

      if (existing) {
        if (typeof existing.setOpacity === 'function') {
          existing.setOpacity(targetOpacity);
        }
        if (typeof existing.bringToFront === 'function') {
          existing.bringToFront();
        } else if (typeof existing.removeFrom === 'function') {
          existing.removeFrom(map);
          existing.addTo(map);
        }
        return;
      }

      // Status gunung: jangan tergantung def di layersList (cache lama sering tanpa magma_status)
      if (id === 'magma_status' || id === 'magma_volcanoes' || id === 'magma_volcanoes_v2') {
        const group = L.layerGroup();
        overlayLayersRef.current[id] = group;
        group.addTo(map);
        return;
      }

      const def = layersList.find((l) => l.id === id);
      if (!def) return;

      if (id === 'foto_geotag_ntt') {
        if (!mapRef.current || overlayLayersRef.current[id]) return;
        const queryUrl = 'https://gis.bnpb.go.id/server/rest/services/2026_gempabumi_ntt/Foto_Geotag_Terdampak/MapServer/0/query?where=1%3D1&outFields=*&f=json';
        fetch(queryUrl)
          .then((r) => r.json())
          .then((res) => {
            if (!mapRef.current) return;
            const features = res?.features || [];
            const markers: L.Marker[] = [];

            features.forEach((feat: Record<string, unknown>) => {
              const attrs: FotoGeotagItem = (feat.attributes as FotoGeotagItem) || {};
              const geom = (feat.geometry as { x?: number; y?: number }) || {};
              const lat = attrs.y ?? geom.y;
              const lng = attrs.x ?? geom.x;
              if (lat == null || lng == null) return;

              // Camera/Photo Custom Marker Symbol
              const icon = L.divIcon({
                className: '',
                html: '<div style="background:#F59E0B; color:#FFFFFF; width:26px; height:26px; border-radius:50%; border:2px solid #FFFFFF; box-shadow:0 2px 6px rgba(0,0,0,0.4); display:flex; align-items:center; justify-center:center; font-size:13px; font-weight:bold;">📸</div>',
                iconSize: [26, 26],
                iconAnchor: [13, 13],
              });

              const dateStr = attrs.datetime ? new Date(attrs.datetime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
              const jenisDesc = attrs.jenis || 'Foto Lapangan';
              
              const objId = attrs.objectid || 1;
              const defaultAttachmentUrl = `https://gis.bnpb.go.id/server/rest/services/2026_gempabumi_ntt/Foto_Geotag_Terdampak/MapServer/0/${objId}/attachments/1`;

              const marker = L.marker([lat, lng], { icon });

              const popupHtml = `
                <div style="font-family:sans-serif; min-width:240px; max-width:280px; font-size:11px; color:#333; line-height:1.5;">
                  <div style="font-weight:bold; color:#D97706; font-size:12px; border-bottom:1px solid #E2E8F0; padding-bottom:4px; margin-bottom:6px; display:flex; align-items:center; gap:5px;">
                    <span>📸 Foto Geotag Terdampak (Gempa NTT)</span>
                  </div>

                  <div class="img-container" style="margin:8px 0; text-align:center;">
                    <button class="btn-load-img" style="background:#F59E0B; color:#FFFFFF; border:none; padding:7px 14px; border-radius:8px; font-size:11.5px; font-weight:bold; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.15); transition:all 0.2s;">
                      📷 Tampilkan Gambar
                    </button>
                  </div>

                  <table style="width:100%; border-collapse:collapse; font-size:10.5px; margin-bottom:6px;">
                    <tr><td style="color:#64748b; padding:2px 0;">Jenis Kejadian:</td><td style="font-weight:700; color:#D97706;">${jenisDesc}</td></tr>
                    <tr><td style="color:#64748b; padding:2px 0;">Waktu Pengambilan:</td><td style="font-weight:600;">${dateStr}</td></tr>
                    <tr><td style="color:#64748b; padding:2px 0;">Koordinat Lat/Lng:</td><td style="font-weight:600; font-family:monospace;">${lat.toFixed(6)}, ${lng.toFixed(6)}</td></tr>
                    <tr><td style="color:#64748b; padding:2px 0;">Ketinggian (Z):</td><td style="font-weight:600;">${attrs.z != null ? attrs.z + ' m' : '-'}</td></tr>
                  </table>

                  <div style="margin-top:6px; padding:6px 8px; background:#FEF3C7; border-radius:8px; border:1px solid #FCD34D; font-size:10px; color:#92400E; display:flex; align-items:center; justify-content:space-between; gap:4px;">
                    <span>📍 <b>Attachment:</b></span>
                    <a class="att-download-link" href="${defaultAttachmentUrl}" target="_blank" rel="noopener noreferrer" style="color:#D97706; font-weight:bold; text-decoration:underline;">
                      ⬇️ Unduh Gambar (.JPG)
                    </a>
                  </div>
                </div>
              `;

              marker.bindPopup(popupHtml, { autoClose: false, closeOnClick: false, autoPan: true });

              marker.on('popupopen', (e) => {
                const px = e.popup.getElement();
                if (!px) return;

                const btn = px.querySelector('.btn-load-img') as HTMLButtonElement;
                const container = px.querySelector('.img-container') as HTMLDivElement;
                const dlLink = px.querySelector('.att-download-link') as HTMLAnchorElement;

                if (btn && container) {
                  btn.onclick = (event) => {
                    event.stopPropagation();
                    container.innerHTML = '<div style="font-size:10px; color:#64748b; padding:8px;">⏳ Memuat Gambar Foto...</div>';
                    fetch(`https://gis.bnpb.go.id/server/rest/services/2026_gempabumi_ntt/Foto_Geotag_Terdampak/MapServer/0/queryAttachments?objectIds=${objId}&f=json`)
                      .then((r) => r.json())
                      .then((res) => {
                        const info = res?.attachmentGroups?.[0]?.attachmentInfos?.[0];
                        const attId = info?.id || info?.attachmentid || 1;
                        const dataSize = info?.data_size || info?.size || '';
                        const realImgUrl = `https://gis.bnpb.go.id/server/rest/services/2026_gempabumi_ntt/Foto_Geotag_Terdampak/MapServer/0/${objId}/attachments/${attId}${dataSize ? '?s=' + dataSize : ''}`;

                        if (dlLink) {
                          dlLink.href = realImgUrl;
                        }

                        container.innerHTML = `<img src="${realImgUrl}" style="width:100%; max-height:180px; object-fit:cover; border-radius:8px; border:1px solid #E2E8F0; display:block; margin:0 auto;" alt="Foto Geotag" />`;
                      })
                      .catch(() => {
                        container.innerHTML = `<img src="${defaultAttachmentUrl}" style="width:100%; max-height:180px; object-fit:cover; border-radius:8px; border:1px solid #E2E8F0; display:block; margin:0 auto;" alt="Foto Geotag" />`;
                      });
                  };
                }

                if (dlLink) {
                  dlLink.onclick = (event) => {
                    if (!dlLink.href.includes('?s=')) {
                      event.preventDefault();
                      dlLink.innerText = '⌛ Mengambil Link...';
                      fetch(`https://gis.bnpb.go.id/server/rest/services/2026_gempabumi_ntt/Foto_Geotag_Terdampak/MapServer/0/queryAttachments?objectIds=${objId}&f=json`)
                        .then((r) => r.json())
                        .then((res) => {
                          const info = res?.attachmentGroups?.[0]?.attachmentInfos?.[0];
                          const attId = info?.id || info?.attachmentid || 1;
                          const dataSize = info?.data_size || info?.size || '';
                          const realUrl = `https://gis.bnpb.go.id/server/rest/services/2026_gempabumi_ntt/Foto_Geotag_Terdampak/MapServer/0/${objId}/attachments/${attId}${dataSize ? '?s=' + dataSize : ''}`;
                          dlLink.href = realUrl;
                          dlLink.innerText = '⬇️ Unduh Gambar (.JPG)';
                          window.open(realUrl, '_blank', 'noopener,noreferrer');
                        })
                        .catch(() => {
                          dlLink.innerText = '⬇️ Unduh Gambar (.JPG)';
                          window.open(dlLink.href, '_blank', 'noopener,noreferrer');
                        });
                    }
                  };
                }
              });

              markers.push(marker);
            });

            const group = L.layerGroup(markers);
            overlayLayersRef.current[id] = group;
            group.addTo(mapRef.current);
          })
          .catch(() => null);
      } else if (id === 'kjs_individu') {
        if (!mapRef.current || overlayLayersRef.current[id]) return;
        
        // Fetch page_1.json through page_276.json in parallel
        const pagePromises = Array.from({ length: 5 }, (_, i) =>
          fetch(`/datakjs/page_${i + 1}.json`, { cache: 'no-store' })
            .then((r) => r.json())
            .then((json) => (Array.isArray(json) ? json : json?.data || []))
            .catch(() => [])
        );

        Promise.all(pagePromises).then((results) => {
          if (!mapRef.current) return;
          const items = results.flat();
          const markers: L.Marker[] = [];

          items.forEach((item: Record<string, unknown>) => {
            if (item.latitude == null || item.longitude == null) return;
            const lat = parseFloat(String(item.latitude));
            const lng = parseFloat(String(item.longitude));
            if (isNaN(lat) || isNaN(lng)) return;

            // Purple Diamond Symbol (#8B5CF6)
            const icon = L.divIcon({
              className: '',
              html: '<div style="background:#8B5CF6; width:14px; height:14px; transform:rotate(45deg); border:2px solid #FFFFFF; box-shadow:0 2px 5px rgba(0,0,0,0.4); border-radius:3px;"></div>',
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            });

            const jkText = Number(item.jenis_kelamin) === 1 ? 'Laki-Laki' : Number(item.jenis_kelamin) === 2 ? 'Perempuan' : '-';
            const desilText = item.desil_kab != null ? 'Desil ' + item.desil_kab : '-';
            const desilDesc = item.desil_kab === 1 ? 'Sangat Miskin / Destitute (Desil 1)' : item.desil_kab === 2 ? 'Miskin (Desil 2)' : item.desil_kab === 3 ? 'Hampir Miskin (Desil 3)' : 'Desil ' + item.desil_kab;

            const marker = L.marker([lat, lng], { icon });
            marker.bindPopup(`
              <div style="font-family:sans-serif; min-width:240px; font-size:11px; color:#333; line-height:1.5;">
                <div style="font-weight:bold; color:#8B5CF6; font-size:12px; border-bottom:1px solid #E2E8F0; padding-bottom:4px; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
                  <span>🟣 Data KJS Individu (SEPAKAT PK)</span>
                </div>
                <div style="font-size:10.5px; margin-bottom:4px;">
                  <b>No. Baris:</b> ${item.RowNum || '-'}
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:10.5px;">
                  <tr><td style="color:#64748b; padding:2px 0;">Jenis Kelamin:</td><td style="font-weight:600;">${jkText}</td></tr>
                  <tr><td style="color:#64748b; padding:2px 0;">Tingkat Desil Kab:</td><td style="font-weight:700; color:#8B5CF6;">${desilText} (${desilDesc})</td></tr>
                  <tr><td style="color:#64748b; padding:2px 0;">Lansia:</td><td style="font-weight:600;">${item.lansia === 1 ? 'Ya (1)' : 'Tidak (0)'}</td></tr>
                  <tr><td style="color:#64748b; padding:2px 0;">Balita:</td><td style="font-weight:600;">${item.balita === 1 ? 'Ya (1)' : 'Tidak (0)'}</td></tr>
                  <tr><td style="color:#64748b; padding:2px 0;">Disabilitas:</td><td style="font-weight:600;">${item.disabilitas_sedang_berat === 1 ? 'Ya (Sedang/Berat)' : 'Tidak'}</td></tr>
                  <tr><td style="color:#64748b; padding:2px 0;">Ibu Hamil:</td><td style="font-weight:600;">${item.ibu_hamil === 1 ? 'Ya' : 'Tidak / N/A'}</td></tr>
                </table>
                <div style="margin-top:6px; padding:4px 6px; background:#F1F5F9; border-radius:6px; font-size:10px; color:#475569;">
                  📊 <b>Analisis Desil Kab:</b> Rumah tangga ini tergolong ke dalam <b>${desilDesc}</b> berdasarkan pendataan sasaran percepatan penghapusan kemiskinan ekstrem SEPAKAT BAPPENAS.
                </div>
              </div>
            `);

            markers.push(marker);
          });

          const group = L.layerGroup(markers);
          overlayLayersRef.current[id] = group;
          group.addTo(mapRef.current);
        });
      } else if (id === 'satupeta_geotagging') {
        if (!mapRef.current || overlayLayersRef.current[id]) return;

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

              // Emerald Geotag Icon (#059669)
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
                    <tr><td style="color:#64748b; padding:2px 0;">Dinding / Atap / Lantai:</td><td style="font-weight:600;">${kk.jenis_dinding || '-'} / ${kk.jenis_atap || '-'} / ${kk.jenis_lantai || '-'}</td></tr>
                    <tr><td style="color:#64748b; padding:2px 0;">Air Minum / Sanitasi:</td><td style="font-weight:600;">${kk.sumber_air_minum || '-'} / ${kk.fasilitas_bab || '-'}</td></tr>
                    <tr><td style="color:#64748b; padding:2px 0;">Listrik / Bahan Bakar:</td><td style="font-weight:600;">${kk.daya_listrik || '-'} / ${kk.bahan_bakar_memasak || '-'}</td></tr>
                    <tr><td style="color:#64748b; padding:2px 0;">Pekerjaan Utama:</td><td style="font-weight:600;">${kk.status_pekerjaan_utama || '-'} (${kk.lapangan_usaha || '-'})</td></tr>
                    <tr><td style="color:#64748b; padding:2px 0;">Kesehatan / Disabilitas:</td><td style="font-weight:600;">${kk.status_kesehatan_umum || '-'} / ${kk.disabilitas_kerentanan || '-'}</td></tr>
                  </table>
                  ${anggotaList.length > 0 ? `
                    <div style="font-weight:bold; color:#1e293b; font-size:11px; margin-top:6px; margin-bottom:2px; border-top:1px solid #E2E8F0; padding-top:4px;">Anggota Keluarga (${anggotaList.length}):</div>
                    <ul style="padding-left:14px; margin:0; font-size:10px; color:#475569;">
                      ${anggotaList.map((a: Record<string, unknown>) => `<li><b>${maskName(a.nama_lengkap as string)}</b> (${maskNikOrKk(a.nik as string)}) - ${a.hubungan_keluarga || 'Anggota'} (${a.jenis_kelamin === 'L' ? 'L' : 'P'}), Pekerjaan: ${a.status_pekerjaan_utama || '-'}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `);

              markers.push(marker);
            });

            const group = L.layerGroup(markers);
            overlayLayersRef.current[id] = group;
            group.addTo(mapRef.current);
          })
          .catch((err) => {
            console.error('Gagal memuat layer Satupeta Geotagging:', err);
          });
      } else if (def.type === 'VectorTileServer') {
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
                const bentuk = p.bentuk || p.BENTUK || p.bentuk_pendidikan || p.BENTUK_PENDIDIKAN || '';
                const status = p.status || p.STATUS || p.status_sekolah || p.STATUS_SEKOLAH || '';
                const alamat = p.alamat || p.ALAMAT || '';
                const jmlGuru = p.jml_guru ?? p.JML_GURU ?? p.jmlGuru ?? p.guru ?? '0';
                const rombel = p.rombel ?? p.ROMBEL ?? p.jml_rombel ?? '0';
                const jmlTendik = p.jml_tendik ?? p.JML_TENDIK ?? p.jmlTendik ?? p.tendik ?? '0';
                const jmlLab = p.jml_lab ?? p.JML_LAB ?? p.jmlLab ?? p.lab ?? '0';
                const jmlPerpus = p.jml_perpus ?? p.JML_PERPUS ?? p.jmlPerpus ?? p.perpus ?? '0';

                layer.bindPopup(`
                  <div style="font-family:sans-serif; min-width:210px; padding:2px;">
                    <div style="font-weight:bold; color:${def.color}; font-size:12px;">🏠 ${nama}</div>
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
      } else if (def.type === 'GeoJSON' || id === 'monev_sadana_bappenas' || id === 'monev_sakata_bappenas') {
        if (!mapRef.current || overlayLayersRef.current[id]) return;
        fetch(def.url, { cache: 'no-store' })
          .then((r) => {
            if (!r.ok) return fetch('/data/monev_sadana.geojson', { cache: 'no-store' });
            return r;
          })
          .then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .then((geoJson) => {
            if (!mapRef.current) return;
            const currentOp = layerOpacities[id] ?? 1.0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const geoLayer = L.geoJSON(geoJson, {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pointToLayer: (feature: any, latlng: any) => {
                const p = feature.properties || {};
                const status = String(p.status_pelaksanaan || '').toLowerCase();
                const color = status.includes('konstruksi') || status.includes('pelaksanaan')
                  ? '#0284C7'
                  : status.includes('persiapan')
                  ? '#F59E0B'
                  : '#64748B';
                const iconEmoji = status.includes('konstruksi') || status.includes('pelaksanaan')
                  ? '🏗️'
                  : status.includes('persiapan')
                  ? '📋'
                  : '⏳';

                const icon = L.divIcon({
                  className: '',
                  html: `<div style="background:${color}; width:28px; height:28px; border-radius:50%; border:2px solid #FFFFFF; box-shadow:0 2px 8px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; color:#FFF; font-size:13px; font-weight:bold; opacity:${currentOp}; cursor:pointer;" title="${p.kegiatan || 'Monev SADANA'}">${iconEmoji}</div>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                });
                return L.marker(latlng, { icon });
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onEachFeature: (feature: any, layer: any) => {
                const p = feature.properties || {};
                const paguStr = p.pagu_anggaran != null
                  ? `Rp ${Number(p.pagu_anggaran).toLocaleString('id-ID')}`
                  : '-';
                const realisasiStr = p.realisasi_keuangan != null
                  ? `Rp ${Number(p.realisasi_keuangan).toLocaleString('id-ID')}`
                  : '-';
                const progresFisik = p.realisasi_progres_fisik != null ? `${p.realisasi_progres_fisik}%` : '-';
                const serapan = p.serapan_keuangan_pct != null ? `${p.serapan_keuangan_pct}%` : '-';

                const status = String(p.status_pelaksanaan || '-');
                const isKonstruksi = status.toLowerCase().includes('konstruksi') || status.toLowerCase().includes('pelaksanaan');
                const isPersiapan = status.toLowerCase().includes('persiapan');
                const statusColor = isKonstruksi ? '#0284c7' : isPersiapan ? '#d97706' : '#475569';
                const statusBorder = isKonstruksi ? '#bae6fd' : isPersiapan ? '#fde68a' : '#e2e8f0';

                layer.bindPopup(`
                  <div style="font-family:system-ui, -apple-system, sans-serif; min-width:300px; max-width:380px; max-height:460px; overflow-y:auto; padding-right:4px; font-size:11px; color:#1e293b; line-height:1.5;">
                    <!-- Header with Badges -->
                    <div style="border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:8px;">
                      <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:4px;">
                        <div style="font-weight:bold; color:#0284c7; font-size:12px; display:flex; align-items:center; gap:5px;">
                          <span>📊 Monev SADANA</span>
                          <span style="font-size:9px; background:#e0f2fe; color:#0369a1; padding:1px 5px; border-radius:4px; font-weight:700;">BAPPENAS</span>
                        </div>
                        <span style="font-size:9px; font-weight:700; padding:2px 6px; border-radius:9999px; background:#f1f5f9; color:#475569; border:1px solid #cbd5e1;">
                          ${p.tipe_titik ? String(p.tipe_titik).toUpperCase() : 'UTAMA'} · Titik ${p.nomor_titik || 1}/${p.total_titik_geotag || 1}
                        </span>
                      </div>
                      <div style="font-size:12px; font-weight:800; color:#0f172a; line-height:1.35;">
                        ${p.kegiatan || '-'}
                      </div>
                      ${p.program && p.program !== '-' && p.program !== p.kegiatan ? `
                        <div style="font-size:10.5px; color:#64748b; margin-top:2px;">
                          <b>Program:</b> ${p.program}
                        </div>
                      ` : ''}
                      ${p.rincian_output_ro && p.rincian_output_ro !== '-' ? `
                        <div style="font-size:10.5px; color:#475569; margin-top:2px;">
                          <b>Output (RO):</b> ${p.rincian_output_ro}
                        </div>
                      ` : ''}
                    </div>

                    <!-- Status & Progress Highlight -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
                      <div style="background:#f8fafc; border:1px solid ${statusBorder}; border-radius:8px; padding:6px 8px;">
                        <div style="font-size:9px; color:#64748b; text-transform:uppercase; font-weight:700;">Status Pelaksanaan</div>
                        <div style="font-size:11px; font-weight:800; color:${statusColor}; margin-top:2px;">${status}</div>
                      </div>
                      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px 8px;">
                        <div style="font-size:9px; color:#64748b; text-transform:uppercase; font-weight:700;">Progres Fisik</div>
                        <div style="font-size:11px; font-weight:800; color:#0284c7; margin-top:2px;">${progresFisik}</div>
                      </div>
                    </div>

                    <!-- Financial Card -->
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:6px 8px; margin-bottom:8px;">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                        <span style="font-size:9.5px; color:#166534; font-weight:700;">Pagu Anggaran:</span>
                        <span style="font-size:11px; font-weight:800; color:#15803d;">${paguStr}</span>
                      </div>
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:9.5px; color:#166534;">Realisasi Keuangan:</span>
                        <span style="font-size:10.5px; font-weight:700; color:#166534;">${realisasiStr} <span style="font-size:9.5px; font-weight:600; color:#15803d;">(${serapan})</span></span>
                      </div>
                    </div>

                    <!-- All Technical Details Table -->
                    <table style="width:100%; border-collapse:collapse; font-size:10.5px; margin-bottom:8px;">
                      <tr><td style="color:#64748b; padding:2px 0; width:115px;">K/L:</td><td style="font-weight:600; color:#1e293b;">${p.kl || '-'}</td></tr>
                      <tr><td style="color:#64748b; padding:2px 0;">Lokasi:</td><td style="font-weight:600; color:#1e293b;">${p.lokasi_kab_kota || '-'}, ${p.provinsi || '-'} ${p.singkatan_provinsi ? `(${p.singkatan_provinsi})` : ''}</td></tr>
                      <tr><td style="color:#64748b; padding:2px 0;">Sektor Pemulihan:</td><td style="font-weight:600; color:#1e293b;">${p.aspek_jitupasna_sektor_pemulihan || '-'}</td></tr>
                      <tr><td style="color:#64748b; padding:2px 0;">Satgas JITUPASNA:</td><td style="font-weight:600; color:#1e293b;">${p.aspek_jitupasna_satgas || '-'}</td></tr>
                      <tr><td style="color:#64748b; padding:2px 0;">Nomenklatur:</td><td style="font-weight:600; color:#1e293b;">${p.nomenklatur_jitupasna || '-'}</td></tr>
                      <tr><td style="color:#64748b; padding:2px 0;">Sumber Pembiayaan:</td><td style="font-weight:600; color:#1e293b;">${p.sumber_pembiayaan || '-'}</td></tr>
                      <tr><td style="color:#64748b; padding:2px 0;">PIC Monev:</td><td style="font-weight:600; color:#1e293b;">${p.pic_monev || '-'}</td></tr>
                      <tr><td style="color:#64748b; padding:2px 0;">Tanggal Monitoring:</td><td style="font-weight:600; color:#1e293b;">${p.tanggal_monitoring || '-'}</td></tr>
                      <tr><td style="color:#64748b; padding:2px 0;">ID Sandingan / Geotag:</td><td style="font-weight:600; color:#475569;">#${p.id_sandingan ?? '-'} / ${p.id_geotag ?? '-'}</td></tr>
                      ${p.deskripsi_titik && p.deskripsi_titik !== '-' ? `
                        <tr><td style="color:#64748b; padding:2px 0; vertical-align:top;">Deskripsi Titik:</td><td style="font-weight:500; color:#334155; line-height:1.35;">${p.deskripsi_titik}</td></tr>
                      ` : ''}
                    </table>

                    <!-- Hambatan & Kendala -->
                    ${p.hambatan_kendala && p.hambatan_kendala !== '-' ? `
                      <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:6px 8px; margin-bottom:6px;">
                        <div style="font-size:9.5px; font-weight:700; color:#92400e; display:flex; align-items:center; gap:4px; margin-bottom:2px;">
                          <span>⚠️ Hambatan & Kendala:</span>
                        </div>
                        <div style="font-size:10px; color:#78350f; line-height:1.4;">
                          ${p.hambatan_kendala}
                        </div>
                      </div>
                    ` : ''}

                    <!-- Rekomendasi Tindak Lanjut -->
                    ${p.rekomendasi_tindak_lanjut && p.rekomendasi_tindak_lanjut !== '-' ? `
                      <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:6px 8px; margin-bottom:6px;">
                        <div style="font-size:9.5px; font-weight:700; color:#0369a1; display:flex; align-items:center; gap:4px; margin-bottom:2px;">
                          <span>💡 Rekomendasi Tindak Lanjut:</span>
                        </div>
                        <div style="font-size:10px; color:#0c4a6e; line-height:1.4;">
                          ${p.rekomendasi_tindak_lanjut}
                        </div>
                      </div>
                    ` : ''}

                    <!-- Link Dokumen Button -->
                    ${p.link_dokumen ? `
                      <a href="${p.link_dokumen}" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; justify-content:center; gap:6px; background:#0284c7; color:#ffffff; font-weight:700; font-size:11px; padding:7px 12px; border-radius:8px; text-decoration:none; margin-top:8px; box-shadow:0 2px 4px rgba(2,132,199,0.3);">
                        <span>📄 Buka Dokumen Pendukung BAPPENAS ↗</span>
                      </a>
                    ` : ''}
                  </div>
                `);
              },
            });

            overlayLayersRef.current[id] = geoLayer;
            geoLayer.addTo(mapRef.current);

            if (def.extent && mapRef.current) {
              const [minLng, minLat, maxLng, maxLat] = def.extent;
              mapRef.current.flyToBounds([[minLat, minLng], [maxLat, maxLng]], { duration: 1.5, padding: [20, 20] });
            }
          })
          .catch((err) => {
            console.error('Gagal memuat layer Monev SADANA GeoJSON:', err);
          });
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
        const addMapServerLayer = (tok?: string) => {
          if (!mapRef.current || overlayLayersRef.current[id] || def.type === 'Dapodik' || def.url.startsWith('/') || def.url.endsWith('.json')) return;
          const currentOpacity = layerOpacities[id] ?? 1.0;
          // InaRISK bahaya letusan: fade-in ringan (bukan flicker)
          const startOpacity = id === 'gunungapi' ? 0 : currentOpacity;
          const layer = createArcGISExportLayer(
            L, def.url, startOpacity,
            def.type === 'ImageServer',
            def.useLngLat ?? false,
            def.layersParam ?? 'show:0',
            tok
          );
          overlayLayersRef.current[id] = layer;
          layer.addTo(mapRef.current);
          if (id === 'gunungapi' && typeof layer.setOpacity === 'function') {
            requestAnimationFrame(() => {
              try {
                layer.setOpacity(currentOpacity);
                const el = (layer as { getContainer?: () => HTMLElement | undefined }).getContainer?.();
                if (el) el.classList.add('inarisk-fade-layer');
              } catch {
                /* ignore */
              }
            });
          }
        };

        const needsToken = def.requiresToken || (def as unknown as { requires_token?: boolean }).requires_token || def.url.includes('geoservices.big.go.id');
        if (needsToken) {
          fetch('/api/big-token')
            .then((r) => r.json())
            .then((res) => {
              if (res?.token) {
                addMapServerLayer(res.token);
              } else {
                addMapServerLayer();
              }
            })
            .catch(() => addMapServerLayer());
        } else {
          addMapServerLayer();
        }

        if (def.extent && mapRef.current) {
          const [minLng, minLat, maxLng, maxLat] = def.extent;
          mapRef.current.flyToBounds([[minLat, minLng], [maxLat, maxLng]], { duration: 1.5, padding: [20, 20] });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOverlays, kodeKemendagri, layerOpacities]);

  // Fetch status gunung saat layer aktif (terpisah dari def layersList)
  useEffect(() => {
    const need =
      activeOverlays.includes('magma_status') ||
      activeOverlays.includes('magma_volcanoes') ||
      activeOverlays.includes('magma_volcanoes_v2');
    if (!need) return;
    let cancelled = false;
    fetch('/api/volcanoes?vona=1', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setVolcanoFeed({
          volcanoes: json.volcanoes || [],
          vona: json.vona || {},
          syncedAt: json.syncedAt || null,
        });
      })
      .catch((err) => {
        console.error('Gagal memuat Status Gunung Api:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [activeOverlays]);

  // Render volcano markers: segitiga + pulse Siaga/Awas. Zoom tidak rebuild.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !volcanoFeed) return;

    const layerId = activeOverlays.includes('magma_status')
      ? 'magma_status'
      : activeOverlays.includes('magma_volcanoes')
        ? 'magma_volcanoes'
        : activeOverlays.includes('magma_volcanoes_v2')
          ? 'magma_volcanoes_v2'
          : null;
    if (!layerId) {
      volcanoMarkersBySlugRef.current.clear();
      volcanoMarkerGroupRef.current?.clearLayers();
      return;
    }

    let group = overlayLayersRef.current[layerId] as L.LayerGroup | undefined;
    if (!group) {
      group = L.layerGroup();
      overlayLayersRef.current[layerId] = group;
      group.addTo(map);
    } else if (!map.hasLayer(group)) {
      group.addTo(map);
    }
    group.clearLayers();
    volcanoMarkerGroupRef.current = group;
    volcanoMarkersBySlugRef.current.clear();

    const LEVEL_META: Record<number, { label: string; color: string; bg: string; border: string }> = {
      4: { label: 'Level IV · Awas', color: VOLCANO_STATUS_COLOR[4], bg: '#FEF2F2', border: '#FECACA' },
      3: { label: 'Level III · Siaga', color: VOLCANO_STATUS_COLOR[3], bg: '#FFF7ED', border: '#FED7AA' },
      2: { label: 'Level II · Waspada', color: VOLCANO_STATUS_COLOR[2], bg: '#FEFCE8', border: '#FDE68A' },
      1: { label: 'Level I · Normal', color: VOLCANO_STATUS_COLOR[1], bg: '#F8FAFC', border: '#E2E8F0' },
      0: { label: 'Tanpa status', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
    };
    const VONA_COLOR: Record<string, string> = {
      RED: '#DC2626',
      ORANGE: '#EA580C',
      YELLOW: '#CA8A04',
      GREEN: '#16A34A',
    };
    const esc = (s: string) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    volcanoFeed.volcanoes.forEach((vol) => {
      if (vol.lat == null || vol.lng == null) return;
      const level = Number(vol.alertLevel) || 0;

      const statusKind = vol.statusKind || (level === 0 ? 'inarisk-only' : 'live');
      const inariskOnly = statusKind === 'inarisk-only';
      const meta = inariskOnly
        ? { label: 'Tanpa status', color: '#475569', bg: '#F8FAFC', border: '#E2E8F0' }
        : LEVEL_META[level] || LEVEL_META[0];
      const fill = inariskOnly ? '#F1F5F9' : VOLCANO_STATUS_COLOR[level] || VOLCANO_STATUS_COLOR[0];
      const vona = volcanoFeed.vona[vol.slug] || null;
      const showVona = Boolean(vona?.colour);
      const selected = selectedVolcanoSlug === vol.slug;
      const animLevel = inariskOnly ? 0 : Math.min(4, Math.max(0, level));
      const size = volcanoTriangleSize(inariskOnly ? 1 : level, selected);
      // Hit area lebih longgar agar glow + pulse tidak terpotong
      const box = size + (animLevel >= 3 ? 18 : animLevel >= 2 ? 14 : 10);
      const animClass = `anim-l${animLevel}`;
      const glowColor =
        animLevel >= 4 ? '#B91C1C' : animLevel >= 3 ? '#C2410C' : animLevel >= 2 ? '#A16207' : '';
      const glowHtml =
        animLevel >= 2
          ? `<span class="magma-tri-glow${animLevel >= 4 ? ' is-fast' : ''}" style="--magma-glow:${glowColor};width:${Math.round(size * 1.9)}px;height:${Math.round(size * 1.9)}px;"></span>
             <span class="magma-tri-glow is-delayed${animLevel >= 4 ? ' is-fast' : ''}" style="--magma-glow:${glowColor};width:${Math.round(size * 1.9)}px;height:${Math.round(size * 1.9)}px;"></span>`
          : '';

      const triSvg = inariskOnly
        ? `<polygon points="12,2.5 22,21 2,21" fill="${fill}" stroke="#0F172A" stroke-width="3.4" stroke-linejoin="round"/>
           <polygon points="12,2.5 22,21 2,21" fill="${fill}" stroke="#FFFFFF" stroke-width="1.7" stroke-linejoin="round"/>`
        : `<polygon points="12,2.5 22,21 2,21" fill="${fill}" stroke="#0F172A" stroke-width="3.2" stroke-linejoin="round" opacity="0.95"/>
           <polygon points="12,2.5 22,21 2,21" fill="${fill}" stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round"/>`;

      const icon = L.divIcon({
        className: 'magma-divicon',
        html: `<div class="magma-tri-wrap ${animClass}${selected ? ' is-selected' : ''}" style="width:${box}px;height:${box}px;">
          ${glowHtml}
          <svg class="magma-tri" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
            ${triSvg}
          </svg>
        </div>`,
        iconSize: [box, box],
        iconAnchor: [box / 2, box * 0.72],
      });

      const elev = vol.elevation != null ? `${vol.elevation} mdpl` : '—';
      const marker = L.marker([vol.lat, vol.lng], {
        icon,
        zIndexOffset: (selected ? 2000 : 0) + level * 200 + (showVona ? 50 : 0),
        opacity: 1,
      });

      marker.bindPopup(
        `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif; min-width:248px; max-width:300px; font-size:11px; color:#475569; line-height:1.45;">
          <div style="font-weight:600; color:#0f172a; font-size:13px; display:flex; justify-content:space-between; gap:8px;">
            <span>${esc(vol.name)}</span>
            <span style="font-size:10px; color:#94A3B8; font-weight:500;">${elev}</span>
          </div>
          <div style="margin:8px 0; padding:6px 8px; border-radius:8px; background:${meta.bg}; border:1px solid ${meta.border}; color:${meta.color}; font-weight:600; font-size:11px;">
            ${meta.label}
          </div>
          <div style="font-size:10.5px; color:#64748B; margin-bottom:6px;">
            ${esc(vol.regency || '—')}<span style="color:#CBD5E1"> · </span>${esc(vol.province || '—')}
            ${vol.code ? `<span style="color:#CBD5E1"> · </span>${esc(vol.code)}` : ''}
          </div>
          <div data-volcano-extras style="min-height:6px; font-size:10.5px; color:#94A3B8;"></div>
        </div>
      `,
        { maxWidth: 320, className: 'magma-popup' }
      );

      marker.on('click', () => onVolcanoMarkerClickRef.current?.(vol.slug));

      marker.on('popupopen', () => {
        const el = marker.getPopup()?.getElement()?.querySelector('[data-volcano-extras]') as HTMLElement | null;
        if (!el || !vol.slug) return;
        if (el.dataset.loaded === '1') return;
        el.dataset.loaded = '1';
        el.textContent = 'Memuat detail…';
        fetch(`/api/volcanoes/${encodeURIComponent(vol.slug)}`, { cache: 'no-store' })
          .then((r) => r.json())
          .then((detail) => {
            if (!detail?.ok) {
              el.innerHTML = '<span style="color:#94A3B8;">Detail tidak tersedia</span>';
              return;
            }
            const v = detail.vona as VolcanoVona | null;
            const notice = detail.notice as {
              localTime?: string;
              heightAboveSummitM?: number | null;
              ashColour?: string;
              magmaLink?: string;
            } | null;
            const report = detail.report as {
              date?: string;
              visualId?: string;
              magmaLink?: string;
            } | null;
            let seismic = (detail.seismic || []) as { date: string; total: number }[];
            if (seismic.length && seismic[seismic.length - 1]?.total === 0) {
              seismic = seismic.slice(0, -1);
            }
            const recent = seismic.slice(-7);
            const maxS = Math.max(1, ...recent.map((s) => s.total));
            const spark = recent
              .map((s) => {
                const h = Math.max(2, Math.round((s.total / maxS) * 16));
                return `<span title="${s.date}: ${s.total}" style="display:inline-block;width:5px;height:${h}px;background:${meta.color};border-radius:1px;margin:0 1px;vertical-align:bottom;opacity:0.8;"></span>`;
              })
              .join('');
            const ashNote =
              v?.cloudAboveSummitM != null && v.cloudAboveSummitM > 0
                ? ` · abu ~${v.cloudAboveSummitM} m di atas puncak`
                : '';
            const vonaBlock = v?.colour
              ? `<div style="margin:4px 0 6px; padding:6px 8px; border-radius:8px; border:1px solid #F1F5F9; background:#FAFAF9;">
                  <div style="font-weight:600; color:${VONA_COLOR[v.colour] || '#EA580C'};">VONA ${esc(v.colour)}${v.noticenumber ? ` · ${esc(v.noticenumber)}` : ''}</div>
                  <div style="font-size:10px; color:#78716C; margin-top:2px;">${esc(v.summary || '—')}${ashNote}</div>
                </div>`
              : '';
            const colom =
              notice?.heightAboveSummitM != null && notice.heightAboveSummitM > 0
                ? ` · kolom ${notice.heightAboveSummitM} m`
                : '';
            const noticeBlock = notice?.localTime
              ? `<div style="margin:4px 0;"><span style="background:#DC2626; color:#fff; font-size:9px; font-weight:600; padding:2px 7px; border-radius:999px;">Letusan</span> <span style="font-size:10px; color:#475569;">${esc(notice.localTime)}${colom}</span></div>`
              : '';
            const reportBlock = report?.date
              ? `<div style="margin:4px 0; padding:6px 8px; border-radius:8px; background:#F8FAFC; border:1px solid #F1F5F9;"><div style="font-weight:600; color:#0f172a; font-size:10.5px;">Laporan ${esc(report.date)}</div><div style="font-size:10px; color:#64748B;">${esc((report.visualId || '').slice(0, 140))}</div></div>`
              : '';
            const seismicBlock = spark
              ? `<div style="margin:6px 0 2px;"><div style="font-size:9px; color:#94A3B8; margin-bottom:2px;">Seismik · 7 hari</div><div style="height:18px; display:flex; align-items:flex-end;">${spark}</div></div>`
              : '';
            el.innerHTML = vonaBlock + noticeBlock + reportBlock + seismicBlock || '<span style="color:#94A3B8;">—</span>';
          })
          .catch(() => {
            el.innerHTML = '<span style="color:#94A3B8;">Gagal memuat detail</span>';
          });
      });

      volcanoMarkersBySlugRef.current.set(vol.slug, { marker, level });
      // Semua gunung di feed selalu tampil (tanpa filter zoom)
      group!.addLayer(marker);
    });

    if (!map.hasLayer(group)) group.addTo(map);
  }, [volcanoFeed, selectedVolcanoSlug, activeOverlays]);

  // Klik / pilih gunung → zoom fokus + kartu keterangan (+ label tetangga InaRISK)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let neighborGroup = volcanoNeighborGroupRef.current;
    if (!neighborGroup) {
      neighborGroup = L.layerGroup();
      volcanoNeighborGroupRef.current = neighborGroup;
    }
    neighborGroup.clearLayers();
    if (!map.hasLayer(neighborGroup)) neighborGroup.addTo(map);

    if (!selectedVolcanoSlug || !volcanoFeed) {
      volcanoFocusSlugRef.current = null;
      setVolcanoFocusCard(null);
      volcanoMarkersBySlugRef.current.forEach(({ marker }) => {
        try {
          marker.unbindTooltip();
        } catch {
          /* ignore */
        }
      });
      return;
    }

    const vol = volcanoFeed.volcanoes.find((v) => v.slug === selectedVolcanoSlug);
    if (!vol || vol.lat == null || vol.lng == null) return;

    const LEVEL_META: Record<number, { label: string; color: string }> = {
      4: { label: 'Level IV · Awas', color: '#B91C1C' },
      3: { label: 'Level III · Siaga', color: '#C2410C' },
      2: { label: 'Level II · Waspada', color: '#A16207' },
      1: { label: 'Level I · Normal', color: '#94A3B8' },
      0: { label: 'Tidak diketahui', color: '#CBD5E1' },
    };
    const level = Number(vol.alertLevel) || 0;
    const meta = LEVEL_META[level] || LEVEL_META[0];
    const vona = volcanoFeed.vona[vol.slug];
    const neighbors = INARISK_NEIGHBOR_PEAKS[vol.slug] || [];

    setVolcanoFocusCard({
      slug: vol.slug,
      name: vol.name,
      level,
      levelLabel: meta.label,
      color: meta.color,
      place: [vol.regency, vol.province].filter(Boolean).join(' · ') || '—',
      elev: vol.elevation != null ? `${vol.elevation} mdpl` : '—',
      vonaColour: vona?.colour || undefined,
      neighbors: neighbors.map((n) => ({ name: n.name, blurb: n.blurb })),
    });

    neighbors.forEach((n) => {
      const icon = L.divIcon({
        className: 'magma-neighbor-divicon',
        html: `<div class="magma-tri-wrap" style="width:22px;height:22px;opacity:0.85;">
          <svg class="magma-tri" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="12,2.5 22,21 2,21" fill="#64748B" stroke="rgba(255,255,255,0.95)" stroke-width="1.75" stroke-linejoin="round"/>
          </svg>
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 16],
      });
      const m = L.marker([n.lat, n.lng], { icon, interactive: false, zIndexOffset: 100 });
      m.bindTooltip(n.name, {
        permanent: true,
        direction: 'top',
        offset: [0, -10],
        className: 'magma-label-tooltip',
      });
      neighborGroup!.addLayer(m);
    });

    // Label nama gunung fokus (enak dibaca fullscreen)
    const focusEntry = volcanoMarkersBySlugRef.current.get(vol.slug);
    if (focusEntry?.marker) {
      focusEntry.marker
        .unbindTooltip()
        .bindTooltip(vol.name, {
          permanent: true,
          direction: 'top',
          offset: [0, -14],
          className: 'magma-label-tooltip',
        })
        .openTooltip();
    }

    // Zoom fokus — padding lebih longgar di fullscreen supaya tidak tertutup toolbar
    const sameFocus = volcanoFocusSlugRef.current === vol.slug;
    volcanoFocusSlugRef.current = vol.slug;
    if (!sameFocus) {
      const fs = typeof document !== 'undefined' && !!document.fullscreenElement;
      const padDeg = 0.11;
      map.flyToBounds(
        [
          [vol.lat - padDeg, vol.lng - padDeg],
          [vol.lat + padDeg, vol.lng + padDeg],
        ],
        {
          padding: fs ? [130, 150] : [80, 100],
          maxZoom: VOLCANO_FOCUS_ZOOM,
          duration: 1.05,
          easeLinearity: 0.22,
        }
      );
    }
  }, [selectedVolcanoSlug, volcanoFeed]);

  // Function to calculate & attach estimation popup to draw shapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachEstimationPopup = async (layer: any) => {
    const map = mapRef.current;
    if (!map) return;

    const popupCenter = layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng();
    const popup = L.popup({ maxWidth: 320 })
      .setLatLng(popupCenter)
      .setContent('<div style="font-size:11px; color:#1f8080; font-weight:bold;">⏳ Menghitung estimasi Cepat Area Terdampak</div>')
      .openOn(map);

    try {
      const [stats, kelList, sekolahList, landCoverList, hakAtasTanahList] = await Promise.all([
        queryHexbinRes9Stats(layer),
        queryDukcapilKelurahan(layer),
        queryDapodikSekolahDampak(layer, kodeKemendagri),
        queryBitungBasemapLayer18(layer),
        queryAtrBpnHakAtasTanah(layer),
      ]);

      // Group kelurahanDampak by Provinsi & Kabupaten for clean popup display
      type RegionGroup = { prov: string; kab: string; kels: string[] };
      const regionGroups: RegionGroup[] = [];

      kelList.forEach((k) => {
        const rawKel = k.namaKelurahan && k.namaKelurahan !== '-' ? k.namaKelurahan : 'Kelurahan Terdampak';
        const rawProv = k.namaProvinsi && k.namaProvinsi !== '-' ? k.namaProvinsi : '';
        const rawKab = k.namaKabupaten && k.namaKabupaten !== '-' ? k.namaKabupaten : (k.namaKecamatan && k.namaKecamatan !== '-' ? k.namaKecamatan : '');
        const prov = rawProv || 'Wilayah Terdampak';
        const kab = rawKab;

        let group = regionGroups.find((g) => g.prov === prov && g.kab === kab);
        if (!group) {
          group = { prov, kab, kels: [] };
          regionGroups.push(group);
        }
        if (rawKel && !group.kels.includes(rawKel)) {
          group.kels.push(rawKel);
        }
      });

      const validRegionGroups = regionGroups.filter((g) => g.kels.length > 0);

      const kelHtml = validRegionGroups.length > 0
        ? `<div style="margin-top:8px; padding-top:6px; border-top:1.5px solid #E2E8F0;">
             <div style="font-weight:700; color:#0a1e36; margin-bottom:4px; font-size:11px;">🏛️ Wilayah Terdampak (${kelList.length} Kel/Desa):</div>
             <div style="max-height:110px; overflow-y:auto; font-size:10px; color:#334155;">
               ${validRegionGroups.map((g) => {
                 const title = g.kab ? `📍 ${g.prov}, ${g.kab}` : `📍 ${g.prov}`;
                 return `
                   <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:4px 6px; margin-bottom:4px;">
                     <div style="font-weight:700; color:#0a1e36;">${title}</div>
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

      const landCoverHtml = landCoverList.length > 0
        ? `<div style="margin-top:8px; padding-top:6px; border-top:1.5px solid #E2E8F0;">
             <div style="font-weight:700; color:#0a1e36; margin-bottom:4px; font-size:11px;">🏗️ Penutup Lahan & Fasilitas (BIG 2024):</div>
             <div style="max-height:100px; overflow-y:auto; font-size:10px; color:#334155; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:4px 6px;">
               ${landCoverList.map((lc) => `
                 <div style="display:flex; justify-content:space-between; border-bottom:1px border-slate-100 py-0.5;">
                   <span style="font-medium; color:#475569;">• ${lc.label}:</span>
                   <b style="color:#0a1e36;">${lc.count.toLocaleString('id')}</b>
                 </div>
               `).join('')}
             </div>
           </div>`
        : '';

      const hakAtasTanahHtml = hakAtasTanahList.length > 0
        ? `<div style="margin-top:8px; padding-top:6px; border-top:1.5px solid #E2E8F0;">
             <div style="font-weight:700; color:#0a1e36; margin-bottom:4px; font-size:11px;">📜 Status Hak Atas Tanah (ATR/BPN):</div>
             <div style="max-height:100px; overflow-y:auto; font-size:10px; color:#334155; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:4px 6px;">
               ${hakAtasTanahList.map((hat) => `
                 <div style="display:flex; justify-content:space-between; border-bottom:1px border-slate-100 py-0.5;">
                   <span style="font-medium; color:#475569;">• ${hat.label}:</span>
                   <b style="color:#8B5CF6;">${hat.count.toLocaleString('id')}</b>
                 </div>
               `).join('')}
             </div>
           </div>`
        : '';

      const content = `
        <div style="font-family:sans-serif; min-width:260px; font-size:11px; color:#0F172A;">
          <div style="border-bottom:1.5px solid #E2E8F0; padding-bottom:6px; margin-bottom:8px;">
            <div style="font-weight:700; color:#0a1e36; line-height:1.3;">Area terdampak</div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>👨 Laki-laki:</span><b>${stats.totalLakiLaki.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>👩 Perempuan:</span><b>${stats.totalPerempuan.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>👴 Lansia:</span><b>${stats.totalLansia.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>🧒 Balita:</span><b>${stats.totalBalita.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px; color:#06B6D4;"><span>🧾 Disabilitas Berat (PD1):</span><b>${stats.totalPd1.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-bottom:2px; color:#8B5CF6;"><span>📊 Disabilitas Sedang (PD2):</span><b>${stats.totalPd2.toLocaleString('id')}</b></div>
          <div style="display:flex; justify-content:space-between; margin-top:4px; padding-top:4px; border-top:1px dashed #DDD;"><span>🏠 Total Keluarga:</span><b>${stats.totalKeluarga.toLocaleString('id')}</b></div>
          ${kelHtml}
          ${landCoverHtml}
          ${hakAtasTanahHtml}
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

  const filteredModalLayers = layersList.filter((l: BnpbLayer) => {
    const matchesSearch = l.label.toLowerCase().includes(layerSearch.toLowerCase()) || (l.group ? l.group.toLowerCase().includes(layerSearch.toLowerCase()) : false);
    const matchesGroup = layerGroupFilter === 'ALL' || l.group === layerGroupFilter;
    const lTypes = l.disasterTypes || l.disaster_types || [];
    const matchesDisaster =
      modalDisasterFilter === 'ALL' ||
      (Array.isArray(lTypes) && lTypes.includes(modalDisasterFilter)) ||
      ((DISASTER_DEFAULT_LAYERS[modalDisasterFilter] || []).includes(l.id));
    return matchesSearch && matchesGroup && matchesDisaster;
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerWrapperRef = useRef<HTMLDivElement>(null);

  const handleToggleFullscreen = () => {
    if (!mapContainerWrapperRef.current) return;
    const refreshMap = () => {
      // Double invalidate: layout fullscreen kadang butuh 1 frame ekstra
      requestAnimationFrame(() => {
        mapRef.current?.invalidateSize({ animate: false });
        setTimeout(() => mapRef.current?.invalidateSize({ animate: false }), 180);
      });
    };
    if (!document.fullscreenElement) {
      mapContainerWrapperRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        refreshMap();
      }).catch(() => null);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        refreshMap();
      }).catch(() => null);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      requestAnimationFrame(() => {
        mapRef.current?.invalidateSize({ animate: false });
        setTimeout(() => mapRef.current?.invalidateSize({ animate: false }), 180);
      });
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div ref={mapContainerWrapperRef} className="relative w-full h-full overflow-hidden font-sans bg-slate-900 dashboard-k5-map">
      {/* Map Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Chip Nowcast BMKG × kejadian cuaca terkait BNPB */}
      {showNowcast && nowcastFeed && nowcastFeed !== 'loading' && (
        <div
          className={`absolute z-[310] pointer-events-none ${
            isFullscreen
              ? 'left-1/2 -translate-x-1/2 bottom-8'
              : showSipongi && sipongiFeed && sipongiFeed !== 'loading'
                ? 'left-3 bottom-[7.5rem]'
                : 'left-3 bottom-3'
          }`}
        >
          <div
            className={`pointer-events-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg px-3 py-2 max-w-[280px] border ${
              nowcastUiEmpty
                ? 'border-slate-200/90 dark:border-slate-700/60'
                : 'border-sky-200/90 dark:border-sky-900/60'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${
                nowcastUiEmpty
                  ? 'text-slate-600 dark:text-slate-300'
                  : 'text-sky-700 dark:text-sky-300'
              }`}
            >
              <CloudLightning className="w-3.5 h-3.5 shrink-0" />
              <span>Nowcast × BNPB</span>
              <span
                className={`ml-auto px-1.5 py-0.5 rounded-md text-[9px] border ${
                  nowcastFeed === 'error'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : nowcastUiEmpty
                      ? 'bg-slate-50 text-slate-600 border-slate-200'
                      : nowcastFeed === 'live'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : nowcastFeed === 'cache'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : nowcastFeed === 'empty'
                            ? 'bg-slate-50 text-slate-600 border-slate-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {nowcastFeed === 'error'
                  ? 'Gagal'
                  : nowcastUiEmpty
                    ? 'Kosong'
                    : nowcastFeed === 'live'
                      ? 'Live'
                      : nowcastFeed === 'cache'
                        ? 'Cache'
                        : nowcastFeed === 'empty'
                          ? 'Kosong'
                          : 'Cadangan'}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-1 leading-snug">
              {nowcastFeed === 'error' ? (
                <>Gagal memuat nowcast BMKG. Coba lagi sebentar.</>
              ) : nowcastUiEmpty ? (
                <>
                  Tidak ada peringatan aktif di{' '}
                  <strong>
                    {sipongiKabFilterKey
                      ? wilayahNama
                      : nowcastProvinsiKey || 'nasional'}
                  </strong>
                  .
                </>
              ) : (
                <>
                  <strong>{nowcastVisibleAlerts.length}</strong> peringatan aktif
                  {nowcastProvinsiKey ? (
                    <>
                      {' '}
                      · <strong>{nowcastProvinsiKey}</strong>
                    </>
                  ) : (
                    <> · nasional</>
                  )}
                  {nowcastMaxSeverity ? (
                    <>
                      {' '}
                      · max{' '}
                      <strong className="text-sky-800 dark:text-sky-300">
                        {severityColor(nowcastMaxSeverity).label}
                      </strong>
                    </>
                  ) : null}
                  {showBencanaData ? (
                    <>
                      . Overlap laporan terkait:{' '}
                      <strong className="text-sky-800 dark:text-sky-300">
                        {nowcastKejadianOverlap.provCount} prov
                      </strong>
                      {nowcastKejadianOverlap.kejadianCount > 0
                        ? ` · ${nowcastKejadianOverlap.kejadianCount} kejadian`
                        : ' (belum cocok dengan feed mingguan)'}
                      .
                    </>
                  ) : (
                    <> · nyalakan titik kejadian untuk melihat overlap BNPB.</>
                  )}
                </>
              )}
            </p>
            {nowcastRelevantJenis && !nowcastUiEmpty && (
              <p className="text-[9.5px] text-slate-500 mt-1">
                Filter cuaca/banjir/longsor aktif — polygon lebih tegas bila ada laporan di
                provinsi yang sama.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Chip korelasi SIPONGI × kejadian kebakaran BNPB */}
      {showSipongi && sipongiFeed && sipongiFeed !== 'loading' && (
        <div
          className={`absolute z-[310] pointer-events-none ${
            isFullscreen ? 'left-1/2 -translate-x-1/2 bottom-8' : 'left-3 bottom-3'
          }`}
        >
          <div className="pointer-events-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-orange-200/90 dark:border-orange-900/60 shadow-lg px-3 py-2 max-w-[280px]">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-300">
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>SIPONGI × BNPB</span>
              <span
                className={`ml-auto px-1.5 py-0.5 rounded-md text-[9px] border ${
                  sipongiFeed === 'live'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : sipongiFeed === 'cache'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : sipongiFeed === 'empty'
                        ? 'bg-slate-50 text-slate-600 border-slate-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {sipongiFeed === 'live'
                  ? 'Live'
                  : sipongiFeed === 'cache'
                    ? 'Cache'
                    : sipongiFeed === 'empty'
                      ? 'Kosong'
                      : sipongiFeed === 'error'
                        ? 'Gagal'
                        : 'Cadangan'}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-1 leading-snug">
              {sipongiFeed === 'empty' ? (
                <>Tidak ada hotspot di{' '}
                  <strong>{sipongiKabFilterKey ? wilayahNama : sipongiProvinsiParam === 'all' ? 'nasional' : sipongiProvinsiParam}</strong>
                  {' '}(48 jam).
                </>
              ) : sipongiFeed === 'error' ? (
                <>Gagal memuat hotspot. Coba lagi atau buka Analisis → SIPONGI.</>
              ) : (
                <>
                  <strong>{sipongiData.reduce((a, h) => a + (h.counter || 0), 0).toLocaleString('id-ID')}</strong> titik hotspot
                  {' '}(48 jam)
                  {sipongiProvinsiParam !== 'all' ? (
                    <> · <strong>{sipongiProvinsiParam}</strong></>
                  ) : (
                    <> · nasional</>
                  )}
                  {showBencanaData ? (
                    <>
                      . Overlap laporan kebakaran:{' '}
                      <strong className="text-orange-700 dark:text-orange-300">
                        {sipongiKejadianOverlap.kabCount} kab
                      </strong>
                      {sipongiKejadianOverlap.kejadianCount > 0
                        ? ` · ${sipongiKejadianOverlap.kejadianCount} kejadian · ${sipongiKejadianOverlap.hotspotTitik} titik`
                        : ' (belum cocok dengan feed mingguan)'}
                      .
                    </>
                  ) : (
                    <> · nyalakan titik kejadian untuk melihat overlap BNPB.</>
                  )}
                </>
              )}
            </p>
            {selectedJenis === 'kebakaran' && (
              <p className="text-[9.5px] text-slate-500 mt-1">
                Filter jenis Kebakaran aktif — marker oranye tebal = kab yang punya hotspot + laporan.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Kartu fokus gunung — nyaman dibaca di fullscreen */}
      {volcanoFocusCard && (
        <div
          className={`absolute z-[320] pointer-events-auto ${
            isFullscreen
              ? 'left-1/2 -translate-x-1/2 bottom-8 w-[min(440px,calc(100vw-2rem))]'
              : 'left-4 bottom-4 w-[min(360px,calc(100%-2rem))]'
          }`}
        >
          <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700 shadow-xl px-4 py-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-0 h-0 shrink-0"
                    style={{
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderBottom: `11px solid ${volcanoFocusCard.color}`,
                    }}
                    aria-hidden
                  />
                  <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 truncate tracking-tight">
                    {volcanoFocusCard.name}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  {volcanoFocusCard.place}
                  <span className="text-slate-300"> · </span>
                  {volcanoFocusCard.elev}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onVolcanoMarkerClickRef.current?.('');
                  setVolcanoFocusCard(null);
                  volcanoFocusSlugRef.current = null;
                }}
                className="shrink-0 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Tutup fokus"
              >
                Tutup
              </button>
            </div>

            <div
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold"
              style={{
                color: volcanoFocusCard.color,
                background: `${volcanoFocusCard.color}14`,
                border: `1px solid ${volcanoFocusCard.color}33`,
              }}
            >
              {volcanoFocusCard.levelLabel}
              {volcanoFocusCard.vonaColour ? (
                <span className="text-[10px] font-semibold text-slate-500">
                  VONA {volcanoFocusCard.vonaColour}
                </span>
              ) : null}
            </div>

            {volcanoFocusCard.neighbors.length > 0 && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-3 py-2 space-y-1">
                {volcanoFocusCard.neighbors.map((n) => (
                  <p key={n.name} className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{n.name}</span>
                    {' — '}
                    {n.blurb}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. SOLID MATERIALIZED SEARCH FLOATING TOOLBAR */}
      <div className="absolute top-4 left-4 z-[300] max-w-md w-full space-y-2">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md transition-all duration-200 focus-within:border-teal-500">
          <input
            type="text"
            placeholder="Cari lokasi / wilayah..."
            value={glassSearchQuery}
            onChange={(e) => setGlassSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGlassSearch()}
            className="flex-1 bg-transparent border-none outline-none px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
          />
          <button
            onClick={handleGlassSearch}
            className="w-8 h-8 rounded-xl bg-[#1f8080] hover:bg-[#1f8080]/90 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer"
            title="Cari"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenLayerModal}
            className="px-3 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0a1e36] dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
            title="Kelola Layer Peta"
          >
            <Layers className="w-4 h-4 text-[#1f8080]" />
            <span className="hidden sm:inline">Layer ({activeOverlays.length})</span>
          </button>
        </div>

        {/* Search Results */}
        {glassSearchResults.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl space-y-1 max-h-48 overflow-y-auto">
            {glassSearchResults.map((res, i) => (
              <button
                key={i}
                onClick={() => {
                  if (mapRef.current) {
                    const lat = parseFloat(res.lat);
                    const lon = parseFloat(res.lon);
                    mapRef.current.flyTo([lat, lon], 12, { animate: true });
                    setGlassSearchResults([]);
                    setGlassSearchQuery(res.display_name);
                  }
                }}
                className="w-full text-left p-2 rounded-xl text-xs hover:bg-[#1f8080]/10 hover:text-[#0a1e36] dark:hover:text-teal-300 transition-colors truncate font-medium text-slate-700 dark:text-slate-300"
              >
                📍 {res.display_name}
              </button>
            ))}
          </div>
        )}

        {/* Active Disaster Thematic Layer Drawer Card */}
        {selectedJenis && selectedJenis !== 'Semua' && (() => {
          const cfg = (JENIS_CONFIG as Record<string, { label: string; icon: string; color: string }>)[selectedJenis] || {
            label: selectedJenis,
            icon: '⚠️',
            color: '#0a1e36',
          };
          const scenarioTargetLayers = getLayersForDisaster(selectedJenis, layersList);
          const activeScenarioLayers = scenarioTargetLayers.filter((id) => activeOverlays.includes(id));
          const allActive = activeScenarioLayers.length === scenarioTargetLayers.length && scenarioTargetLayers.length > 0;

          return (
            <div className="bg-[#0a1e36] border border-slate-700 rounded-2xl shadow-xl overflow-hidden text-white animate-in fade-in duration-200">
              {/* Card Header */}
              <div className="p-3 flex items-center justify-between gap-2 border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{cfg.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-white truncate">Skenario {cfg.label}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500 text-white shrink-0">
                        {activeScenarioLayers.length}/{scenarioTargetLayers.length} Layer Aktif
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 truncate">
                      Layer tematik {cfg.label} — badge kualitas di tiap chip
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsDisasterTrayOpen(!isDisasterTrayOpen)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title={isDisasterTrayOpen ? "Sembunyikan daftar layer" : "Tampilkan daftar layer"}
                  >
                    {isDisasterTrayOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleOpenLayerModal}
                    className="text-[10px] font-bold bg-[#1f8080] hover:bg-[#166565] text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
                    title="Buka Pusat Layer Lengkap"
                  >
                    Kelola
                  </button>
                </div>
              </div>

              {/* Card Body: Interactive Layer Chips */}
              {isDisasterTrayOpen && (
                <div className="p-3 space-y-2 bg-[#0d2542] max-h-56 overflow-y-auto">
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span>Klik layer untuk aktif/non-aktifkan:</span>
                    {!allActive && (
                      <button
                        onClick={() => {
                          const target = getLayersForDisaster(selectedJenis, layersList);
                          setActiveOverlays((prev) => Array.from(new Set([...prev, ...target])));
                          setDraftOverlays((prev) => Array.from(new Set([...prev, ...target])));
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Pulihkan Semua</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {scenarioTargetLayers.map((id) => {
                      const lyr = layersList.find((l) => l.id === id);
                      const isSelected = activeOverlays.includes(id);
                      const shortLabel =
                        lyr?.label?.split('(')[0]?.trim() ||
                        (id === 'magma_status'
                          ? 'Status Gunung Api'
                          : id === 'gunungapi'
                            ? 'Letusan Gunung Api'
                            : id);
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            setActiveOverlays((prev) =>
                              isSelected ? prev.filter((x) => x !== id) : [...prev, id]
                            );
                            setDraftOverlays((prev) =>
                              isSelected ? prev.filter((x) => x !== id) : [...prev, id]
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs hover:bg-emerald-700'
                              : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
                          }`}
                          title={`${lyr?.label || id} (${isSelected ? 'aktif — klik nonaktif' : 'nonaktif — klik aktifkan'})`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: lyr?.color || '#38bdf8' }}
                          />
                          <span className="truncate max-w-[140px]">{shortLabel}</span>
                          {isSelected ? (
                            <Check className="w-3 h-3 text-white shrink-0" />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-mono">+</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 2. FLOATING CONTROL BUTTONS & BMKG BAR SEPARATION */}
      {/* BMKG 1-Click Switch Bar (Independent Div Container) */}
      <div className="absolute top-4 right-16 z-[400]">
        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-md gap-1">
          <button
            onClick={() => { setShowBmkg(true); setBmkgMode("terkini"); }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              showBmkg && bmkgMode === "terkini" 
                ? "bg-[#0a1e36] text-white shadow-xs" 
                : "text-gray-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800"
            }`}
            title="Gempa Terkini M >= 5.0 (gempaterkini.json)"
          >
            <Activity className={`w-3.5 h-3.5 ${showBmkg && bmkgMode === "terkini" ? "text-emerald-400" : "text-gray-400"}`} />
            <span>Gempa Terkini</span>
          </button>

          <button
            onClick={() => { setShowBmkg(true); setBmkgMode("dirasakan"); }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              showBmkg && bmkgMode === "dirasakan" 
                ? "bg-[#0a1e36] text-white shadow-xs" 
                : "text-gray-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800"
            }`}
            title="Gempa Dirasakan MMI (gempadirasakan.json)"
          >
            <span className={`w-2 h-2 rounded-full ${showBmkg && bmkgMode === "dirasakan" ? "bg-amber-500 animate-ping" : "bg-amber-400/60"}`} />
            <span>Gempa Dirasakan</span>
          </button>

          <button
            onClick={() => { setShowBmkg(true); setBmkgMode("autogempa"); }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              showBmkg && bmkgMode === "autogempa" 
                ? "bg-[#0a1e36] text-white shadow-xs" 
                : "text-gray-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800"
            }`}
            title="Gempa Terbaru Autogempa TEWS (autogempa.json)"
          >
            <span className={`w-2 h-2 rounded-full ${showBmkg && bmkgMode === "autogempa" ? "bg-rose-500 animate-pulse" : "bg-rose-400/60"}`} />
            <span>Gempa Terbaru</span>
          </button>

          {showBmkg && (
            <button
              onClick={() => setShowBmkg(false)}
              className="px-2 py-1.5 rounded-xl text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Matikan Layer Gempa BMKG"
            >
              Matikan
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Buttons Column (Draw, Bencana, Fullscreen, Legenda) - Fixed Square Width (w-10 h-10) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2">
        {/* Toggle Draw Tools Estimator */}
        <button
          onClick={() => setShowDrawTools(!showDrawTools)}
          className={`p-2.5 rounded-2xl border shadow-md transition-all flex items-center justify-center cursor-pointer ${
            showDrawTools ? 'bg-[#1f8080] text-white border-teal-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Simulasi Estimasi Demografi Draw"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Draw Tool Panel */}
        {showDrawTools && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl space-y-1">
            <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pilih Alat Ukur</span>
              <button
                onClick={handleClearDraw}
                className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Hapus Semua Draw
              </button>
            </div>
            {DRAW_TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveDraw(activeDraw === t.id ? null : t.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeDraw === t.id ? 'bg-[#1f8080] text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Toggle BMKG Nowcast cuaca */}
        <div
          className={`flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border shadow-md ${
            showNowcast && nowcastFeed === 'error'
              ? 'border-rose-300/90'
              : showNowcast && nowcastFeed === 'fallback'
                ? 'border-amber-400/70'
                : showNowcast && nowcastUiEmpty
                  ? 'border-slate-300/90'
                  : showNowcast && nowcastRelevantJenis
                    ? 'border-sky-400/80'
                    : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setShowNowcast(!showNowcast)}
            className={`relative px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              !showNowcast
                ? 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300'
                : nowcastFeed === 'loading'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : nowcastFeed === 'error'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : nowcastUiEmpty || nowcastFeed === 'empty'
                      ? 'bg-slate-500 text-white shadow-xs'
                      : nowcastFeed === 'fallback'
                        ? 'bg-sky-800 text-white shadow-xs ring-2 ring-amber-300/80'
                        : 'bg-sky-600 text-white shadow-xs'
            }`}
            title={
              !showNowcast
                ? 'Peringatan dini cuaca BMKG (Nowcast) — ikut filter wilayah; dikorelasikan dengan banjir/cuaca/longsor BNPB'
                : nowcastFeed === 'loading'
                  ? 'Memuat nowcast BMKG…'
                  : nowcastUiEmpty || nowcastFeed === 'empty'
                    ? 'Tidak ada peringatan di wilayah/filter ini'
                    : nowcastFeed === 'error'
                      ? 'Gagal memuat nowcast BMKG'
                      : `Nowcast · ${nowcastProvinsiKey || 'Nasional'} · ${nowcastVisibleAlerts.length} aktif`
            }
          >
            <CloudLightning
              className={`w-3.5 h-3.5 ${showNowcast && nowcastFeed === 'loading' ? 'animate-pulse' : ''}`}
            />
            <span>Nowcast</span>
            {showNowcast && nowcastFeed && (
              <span
                className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                  nowcastFeed === 'error'
                    ? 'bg-rose-200'
                    : nowcastUiEmpty || nowcastFeed === 'empty'
                      ? 'bg-slate-300'
                      : nowcastFeed === 'live'
                        ? 'bg-emerald-300'
                        : nowcastFeed === 'cache'
                          ? 'bg-sky-300'
                          : nowcastFeed === 'fallback'
                            ? 'bg-amber-300'
                            : nowcastFeed === 'loading'
                              ? 'bg-sky-200 animate-pulse'
                              : 'bg-slate-300'
                }`}
                aria-hidden
              />
            )}
          </button>
        </div>

        {/* Toggle Hotspot SIPONGI (ringkas, ikut filter wilayah) */}
        <div
          className={`flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border shadow-md ${
            showSipongi && sipongiFeed === 'error'
              ? 'border-rose-300/90'
              : showSipongi && sipongiFeed === 'fallback'
                ? 'border-amber-400/70'
                : showSipongi && selectedJenis === 'kebakaran'
                  ? 'border-orange-400/80'
                  : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setShowSipongi(!showSipongi)}
            className={`relative px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              !showSipongi
                ? 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
                : sipongiFeed === 'loading'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : sipongiFeed === 'error'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : sipongiFeed === 'empty'
                      ? 'bg-slate-500 text-white shadow-xs'
                      : sipongiFeed === 'fallback'
                        ? 'bg-orange-800 text-white shadow-xs ring-2 ring-amber-300/80'
                        : 'bg-orange-600 text-white shadow-xs'
            }`}
            title={
              !showSipongi
                ? 'Hotspot karhutla SIPONGI (48 jam) — ikut filter wilayah; dikorelasikan dengan kejadian kebakaran BNPB'
                : sipongiFeed === 'loading'
                  ? 'Memuat hotspot SIPONGI…'
                  : sipongiFeed === 'empty'
                    ? 'Tidak ada hotspot di wilayah/filter ini'
                    : sipongiFeed === 'error'
                      ? 'Gagal memuat SIPONGI'
                      : `SIPONGI · ${sipongiProvinsiParam === 'all' ? 'Nasional' : sipongiProvinsiParam}`
            }
          >
            <Flame className={`w-3.5 h-3.5 ${showSipongi && sipongiFeed === 'loading' ? 'animate-pulse' : ''}`} />
            <span>SIPONGI</span>
            {showSipongi && sipongiFeed && (
              <span
                className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                  sipongiFeed === 'live'
                    ? 'bg-emerald-300'
                    : sipongiFeed === 'cache'
                      ? 'bg-sky-300'
                      : sipongiFeed === 'fallback'
                        ? 'bg-amber-300'
                        : sipongiFeed === 'loading'
                          ? 'bg-sky-200 animate-pulse'
                          : sipongiFeed === 'error'
                            ? 'bg-rose-200'
                            : 'bg-slate-300'
                }`}
                aria-hidden
              />
            )}
          </button>
        </div>

        {/* Toggle Survey Kerentanan — palette ringkas: ok / degraded / busy / attention / empty / fail */}
        <div
          className={`flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border shadow-md ${
            showKerentanan && (kerentananFeed === 'need-wilayah' || kerentananFeed === 'need-kab')
              ? 'border-amber-300/90'
              : showKerentanan && kerentananFeed === 'error'
                ? 'border-rose-300/90'
                : showKerentanan && kerentananFeed === 'fallback'
                  ? 'border-amber-400/70'
                  : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <button
            onClick={() => setShowKerentanan(!showKerentanan)}
            className={`relative px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              !showKerentanan
                ? 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                : kerentananFeed === 'loading'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : kerentananFeed === 'need-wilayah' || kerentananFeed === 'need-kab'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : kerentananFeed === 'error'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : kerentananFeed === 'empty'
                        ? 'bg-slate-500 text-white shadow-xs'
                        : kerentananFeed === 'fallback'
                          ? 'bg-teal-700 text-white shadow-xs ring-2 ring-amber-300/80'
                          : 'bg-[#10B981] text-white shadow-xs'
            }`}
            title={
              !showKerentanan
                ? 'Survey Kerentanan InARISK'
                : kerentananFeed === 'need-wilayah'
                  ? 'Pilih wilayah di filter'
                  : kerentananFeed === 'need-kab'
                    ? 'Pilih kabupaten/kota (bukan hanya provinsi)'
                    : kerentananFeed === 'loading'
                      ? 'Memuat…'
                      : kerentananFeed === 'empty'
                        ? 'Tidak ada survei di wilayah ini'
                        : kerentananFeed === 'error'
                          ? 'Gagal memuat data'
                          : kerentananFeed === 'fallback'
                            ? `Cadangan · ${kerentananCode || ''}`
                            : kerentananCode
                              ? `InARISK ${kerentananCode}`
                              : 'Kerentanan'
            }
          >
            <Home className={`w-3.5 h-3.5 ${showKerentanan && kerentananFeed === 'loading' ? 'animate-pulse' : ''}`} />
            <span>Kerentanan</span>
            {showKerentanan && kerentananFeed && (
              <span
                className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                  kerentananFeed === 'live'
                    ? 'bg-emerald-300'
                    : kerentananFeed === 'fallback'
                      ? 'bg-amber-300'
                      : kerentananFeed === 'loading'
                        ? 'bg-sky-200 animate-pulse'
                        : kerentananFeed === 'need-wilayah' || kerentananFeed === 'need-kab'
                          ? 'bg-amber-200'
                          : kerentananFeed === 'error'
                            ? 'bg-rose-200'
                            : 'bg-slate-300'
                }`}
                aria-hidden
              />
            )}
          </button>
        </div>

        {/* Toggle Bencana JSON Markers */}
        <button
          onClick={() => setShowBencanaData(!showBencanaData)}
          className={`p-2.5 rounded-2xl border shadow-md transition-all flex items-center justify-center cursor-pointer ${
            showBencanaData ? 'bg-[#0a1e36] text-white border-slate-700' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Toggle Titik Kejadian Bencana"
        >
          <MapPin className="w-4 h-4 text-sky-400" />
        </button>

        {/* Toggle Fullscreen Mode */}
        <button
          onClick={handleToggleFullscreen}
          className={`p-2.5 rounded-2xl border shadow-md transition-all flex items-center justify-center cursor-pointer ${
            isFullscreen ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400/30' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title={isFullscreen ? 'Keluar Fullscreen Peta' : 'Mode Layar Penuh (Fullscreen Peta)'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-200" /> : <Maximize2 className="w-4 h-4 text-[#0a1e36] dark:text-white" />}
        </button>

        {/* Toggle Legenda */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`p-2.5 rounded-2xl border shadow-md transition-all flex items-center justify-center cursor-pointer ${
            showLegend ? 'bg-[#0a1e36] text-white border-slate-700' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Tampilkan Legenda Khusus Layer Terpilih"
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
        </button>

        {/* Legenda Floating Box Sesuai Layers yang Dipilih */}
        {showLegend && (
          <div className="absolute top-16 right-0 z-[500] w-80 sm:w-96 max-h-[75vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Legenda */}
            <div className="bg-[#0a1e36] text-white px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-bold text-xs">Legenda Layer Terpilih</div>
                  <div className="text-[10px] text-slate-300">
                    {activeOverlays.length} Layer Peta Sedang Aktif
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowLegend(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Tutup Legenda"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Legenda Scrollable */}
            <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              {activeOverlays.length === 0 ? (
                <div className="text-center py-6 text-slate-400 space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-xs">Belum ada layer yang dipilih</p>
                  <p className="text-[11px] text-slate-400">Silakan pilih layer atau klik jenis bencana untuk melihat legenda.</p>
                </div>
              ) : (
                activeOverlays.map((lyrId) => {
                  const lyr = layersList.find((l) => l.id === lyrId);
                  const predefined = PREDEFINED_LAYER_LEGENDS[lyrId];
                  const mapserverItems = mapserverLegends[lyrId];

                  return (
                    <div
                      key={lyrId}
                      className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-sm shrink-0">{lyr?.emoji || '🗺️'}</span>
                          <span className="font-bold text-[#0a1e36] text-[11px] truncate">
                            {predefined?.label || lyr?.label || lyrId}
                          </span>
                        </div>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                          {lyr?.group || 'GIS'}
                        </span>
                      </div>

                      {/* Render Predefined Classification Items */}
                      {predefined && predefined.items.length > 0 && (
                        <div className="space-y-1.5 pt-0.5">
                          {predefined.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-md shrink-0 shadow-2xs border border-black/10"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-[11px] text-slate-700 font-medium leading-tight">
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render MapServer Image Legend if available */}
                      {mapserverItems && mapserverItems.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-200/60">
                          {mapserverItems.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <img
                                src={`data:image/png;base64,${it.imageData}`}
                                alt={it.label}
                                className="w-4 h-4 object-contain shrink-0"
                              />
                              <span className="text-[11px] text-slate-700 leading-tight">
                                {it.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* If no predefined and no mapserver, show generic layer info */}
                      {!predefined && (!mapserverItems || mapserverItems.length === 0) && (
                        <div className="text-[10px] text-slate-500 italic">
                          Layer aktif tipe {lyr?.type || 'GIS'}. Simbologi dimuat langsung dari geodatabase server.
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* BMKG Gempa Terkini Realtime Legend (If showBmkg active) */}
              {showBmkg && (
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-sm">⚡</span>
                      <span className="font-bold text-[#0a1e36] text-[11px]">
                        Monitoring Gempa Realtime (BMKG TEWS)
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-white shrink-0 shadow-xs animate-pulse" />
                      <span className="text-[11px] text-slate-700 font-medium">
                        Episenter Gempa Terkini M ≥ 5.0
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white shrink-0 shadow-xs" />
                      <span className="text-[11px] text-slate-700 font-medium">
                        Gempa Dirasakan (Intensitas MMI II - VI+)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* BMKG Nowcast legend */}
              {showNowcast && (
                <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-sky-200/60 pb-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <CloudLightning className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="font-bold text-[#0a1e36] text-[11px]">
                        Nowcast Cuaca
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-white text-sky-700 border border-sky-300">
                      BMKG
                    </span>
                  </div>
                  <div className="space-y-1 text-[10.5px] text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] border border-[#1D4ED8] shrink-0" />
                      <span>Nasional: titik per provinsi (severity)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]/70 border border-[#1D4ED8] shrink-0" />
                      <span>Filter provinsi: polygon CAP detail</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] border-2 border-[#7F1D1D] shrink-0" />
                      <span>Ada laporan BNPB terkait di provinsi sama</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Ikuti filter wilayah di header untuk melihat area terdampak.
                  </p>
                </div>
              )}

              {/* SIPONGI hotspot legend */}
              {showSipongi && (
                <div className="p-3 rounded-2xl bg-orange-50/80 border border-orange-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-orange-200/60 pb-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="font-bold text-[#0a1e36] text-[11px]">
                        Hotspot SIPONGI
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-white text-orange-700 border border-orange-300">
                      KLHK
                    </span>
                  </div>
                  <div className="space-y-1 text-[10.5px] text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] border border-[#C2410C] shrink-0" />
                      <span>Hotspot 48 jam (dominan High)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] border border-[#D97706] shrink-0" />
                      <span>Hotspot 48 jam (lebih banyak Medium/Low)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] border-2 border-[#7C2D12] shrink-0" />
                      <span>Kab yang juga punya laporan kebakaran BNPB</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Ikuti filter wilayah di header. Detail tren/luas: Analisis Data → SIPONGI.
                  </p>
                </div>
              )}

              {/* Titik Kejadian Bencana DIBI Legend (If showBencanaData active) */}
              {showBencanaData && (
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-sm">📍</span>
                      <span className="font-bold text-[#0a1e36] text-[11px]">
                        Titik Kejadian Bencana (BNPB)
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-white text-sky-700 border border-sky-300">
                      BNPB
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {LEGEND_ITEMS.filter((item) => {
                      const hideErupsi =
                        selectedJenis === 'erupsi' ||
                        activeOverlays.includes('magma_status') ||
                        activeOverlays.includes('magma_volcanoes') ||
                        activeOverlays.includes('magma_volcanoes_v2');
                      return !(hideErupsi && item.label === 'Erupsi');
                    }).map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="text-[10.5px] text-slate-700 truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  {(selectedJenis === 'erupsi' ||
                    activeOverlays.includes('magma_status') ||
                    activeOverlays.includes('magma_volcanoes') ||
                    activeOverlays.includes('magma_volcanoes_v2')) && (
                    <p className="text-[10px] text-slate-500 leading-snug pt-0.5">
                      Titik kejadian erupsi disembunyikan agar tidak dobel dengan status gunung.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. FULL MODAL/POPUP LAYER SELECTION (EXPANDED TO MAP CANVAS AREA) */}
      {showLayerModal && (
        <div className="absolute inset-4 z-[600] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="bg-[#0a1e36] text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#1f8080] text-white shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm tracking-tight text-white">Pusat Layer Geospasial & Tematik Bencana</h2>
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
                <label className="text-xs font-bold text-[#0a1e36] uppercase tracking-wider block">1. Cari & Filter Layer</label>
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

              {/* Filter Selects: Skenario Bencana & Instansi/Sumber Data (Searchable Combobox) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Skenario Bencana Select */}
                <div className="relative" ref={disasterDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#0a1e36] uppercase tracking-wider block truncate">
                      Skenario Bencana
                    </label>
                    {modalDisasterFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalDisasterFilter('ALL');
                        }}
                        className="text-[10px] text-[#1f8080] hover:underline font-semibold cursor-pointer"
                        title="Reset ke Semua Skenario"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDisasterDropdownOpen(!isDisasterDropdownOpen);
                      setIsAgencyDropdownOpen(false);
                    }}
                    className={`w-full h-8.5 px-2.5 rounded-xl border bg-white text-xs font-semibold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                      isDisasterDropdownOpen
                        ? 'border-[#1f8080] ring-2 ring-[#1f8080]/15'
                        : modalDisasterFilter !== 'ALL'
                        ? 'border-[#1f8080]/70 bg-teal-50/50 text-teal-950 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate min-w-0">
                      {modalDisasterFilter === 'ALL' ? (
                        <>
                          <span className="text-xs shrink-0">🌐</span>
                          <span className="truncate">Semua Skenario</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs shrink-0">{selectedDisasterCategory?.emoji || '⚠️'}</span>
                          <span className="truncate">{selectedDisasterCategory?.label || modalDisasterFilter}</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isDisasterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Skenario Dropdown Menu */}
                  {isDisasterDropdownOpen && (
                    <div className="absolute left-0 top-[calc(100%+4px)] z-[70] w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Cari skenario bencana..."
                          value={disasterFilterSearch}
                          onChange={(e) => setDisasterFilterSearch(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:border-[#1f8080]"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
                        {matchesSemuaDisaster && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalDisasterFilter('ALL');
                              setIsDisasterDropdownOpen(false);
                              setDisasterFilterSearch('');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              modalDisasterFilter === 'ALL'
                                ? 'bg-[#1f8080]/15 text-[#1f8080] font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span>🌐</span>
                              <span>Semua Skenario</span>
                            </span>
                            {modalDisasterFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-[#1f8080] shrink-0" />}
                          </button>
                        )}
                        {filteredDisasterCategories.map((cat) => {
                          const isSelected = modalDisasterFilter === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setModalDisasterFilter(cat.id);
                                setIsDisasterDropdownOpen(false);
                                setDisasterFilterSearch('');
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1f8080]/15 text-[#1f8080] font-bold'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <span>{cat.emoji}</span>
                                <span className="truncate">{cat.label}</span>
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#1f8080] shrink-0" />}
                            </button>
                          );
                        })}
                        {!matchesSemuaDisaster && filteredDisasterCategories.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400">Skenario tidak ditemukan</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Instansi / Sumber Data Select */}
                <div className="relative" ref={agencyDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#0a1e36] uppercase tracking-wider block truncate">
                      Instansi / Sumber
                    </label>
                    {layerGroupFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLayerGroupFilter('ALL');
                        }}
                        className="text-[10px] text-[#1f8080] hover:underline font-semibold cursor-pointer"
                        title="Reset ke Semua Instansi"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAgencyDropdownOpen(!isAgencyDropdownOpen);
                      setIsDisasterDropdownOpen(false);
                    }}
                    className={`w-full h-8.5 px-2.5 rounded-xl border bg-white text-xs font-semibold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                      isAgencyDropdownOpen
                        ? 'border-[#1f8080] ring-2 ring-[#1f8080]/15'
                        : layerGroupFilter !== 'ALL'
                        ? 'border-[#1f8080]/70 bg-teal-50/50 text-teal-950 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate min-w-0">
                      <span className="truncate">
                        {layerGroupFilter === 'ALL' ? 'Semua Instansi' : layerGroupFilter}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isAgencyDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Instansi Dropdown Menu */}
                  {isAgencyDropdownOpen && (
                    <div className="absolute right-0 top-[calc(100%+4px)] z-[70] w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Cari instansi / sumber..."
                          value={agencyFilterSearch}
                          onChange={(e) => setAgencyFilterSearch(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:border-[#1f8080]"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
                        {matchesSemuaAgency && (
                          <button
                            type="button"
                            onClick={() => {
                              setLayerGroupFilter('ALL');
                              setIsAgencyDropdownOpen(false);
                              setAgencyFilterSearch('');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              layerGroupFilter === 'ALL'
                                ? 'bg-[#1f8080]/15 text-[#1f8080] font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span>Semua Instansi</span>
                            {layerGroupFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-[#1f8080] shrink-0" />}
                          </button>
                        )}
                        {filteredAgencies.map((grp) => {
                          const isSelected = layerGroupFilter === grp;
                          return (
                            <button
                              key={grp}
                              type="button"
                              onClick={() => {
                                setLayerGroupFilter(grp);
                                setIsAgencyDropdownOpen(false);
                                setAgencyFilterSearch('');
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1f8080]/15 text-[#1f8080] font-bold'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span className="truncate">{grp}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#1f8080] shrink-0" />}
                            </button>
                          );
                        })}
                        {!matchesSemuaAgency && filteredAgencies.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400">Instansi tidak ditemukan</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Action: Pilih Semua Layer Skenario jika skenario tertentu dipilih */}
              {modalDisasterFilter !== 'ALL' && (
                <div className="flex items-center justify-between bg-teal-50/90 border border-teal-200/80 rounded-xl px-2.5 py-1.5 shadow-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#1f8080] shrink-0" />
                    <span className="text-[10.5px] font-semibold text-teal-900 truncate">
                      Skenario: {selectedDisasterCategory?.label || modalDisasterFilter}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const target = getLayersForDisaster(modalDisasterFilter, layersList);
                      setDraftOverlays((prev) => Array.from(new Set([...prev, ...target])));
                    }}
                    className="text-[10px] font-bold text-[#1f8080] hover:text-[#135959] hover:underline cursor-pointer shrink-0 ml-1.5"
                  >
                    + Pilih Semua Layer
                  </button>
                </div>
              )}

              {/* Available Layers List */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Layer Tersedia ({filteredModalLayers.length})
                  </label>
                  {filteredModalLayers.length > 0 && (
                    <span className="text-[10px] text-slate-400 shrink-0">
                      Klik untuk pilih / lepas
                    </span>
                  )}
                </div>
                {filteredModalLayers.map((layer: BnpbLayer) => {
                  const isSelected = draftOverlays.includes(layer.id);
                  const isScenarioDefault = selectedJenis && selectedJenis !== 'Semua' && (DISASTER_DEFAULT_LAYERS[selectedJenis] || []).includes(layer.id);
                  const layerDisasters = layer.disasterTypes || layer.disaster_types || [];

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
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                          isSelected ? 'bg-[#1f8080] border-[#1f8080] text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{layer.label}</span>
                            {isScenarioDefault && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                                ★ Skenario Aktif
                              </span>
                            )}
                            {layer.requiresFilter && !kodeKemendagri && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold border border-amber-300 shrink-0">
                                ⚠️ Butuh Filter Provinsi
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-slate-500 font-semibold">{layer.group} · {layer.type}</span>
                            {layerDisasters.map((dtype: string) => {
                              const cat = DISASTER_CATEGORIES.find((c) => c.id === dtype);
                              if (!cat) return null;
                              return (
                                <span
                                  key={dtype}
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${cat.solidBg} ${cat.solidText} ${cat.solidBorder}`}
                                >
                                  {cat.emoji} {cat.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600 shrink-0">
                        {layer.type || 'GIS'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SIDE GRID 2 & GRID 3 (70% WIDTH) */}
            <div className="lg:col-span-8 flex flex-col h-full bg-white overflow-hidden">
              {/* GRID 2 (TOP): interactive preview map canvas (fixed height) */}
              <div className="h-56 p-4 border-b border-slate-200 flex flex-col relative shrink-0">
                <div className="flex items-center justify-between mb-2 z-10">
                  <span className="text-xs font-bold text-[#0a1e36] uppercase tracking-wider flex items-center gap-2 bg-white/90 px-3 py-1 rounded-xl shadow-xs border border-slate-200">
                    <Eye className="w-4 h-4 text-[#1f8080]" />
                    <span>2. Pratinjau Skema Basemap & Layer Aktif</span>
                  </span>
                  <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-xl shadow-xs border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Pilih Basemap:</span>
                    <select
                      value={draftBasemap}
                      onChange={(e) => setDraftBasemap(e.target.value)}
                      className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-0.5 text-xs font-bold text-[#0a1e36] outline-none cursor-pointer"
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
                  <div className="absolute bottom-3 left-3 z-[400] bg-[#0a1e36] text-white px-3 py-1 rounded-xl text-[11px] font-bold border border-slate-700 shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1f8080] animate-pulse" />
                    <span>Live Pratinjau: {BASEMAPS.find((b) => b.id === draftBasemap)?.label} ({draftOverlays.length} Layer)</span>
                  </div>
                </div>
              </div>

              {/* GRID 3 (BOTTOM): SELECTED LAYERS MANAGEMENT WITH DRAG AND DROP REORDERING */}
              <div className="flex-1 min-h-0 flex flex-col justify-between bg-slate-50/40 overflow-hidden">
                <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#0a1e36] uppercase tracking-wider block">3. Layer Yang Dipilih ({draftOverlays.length})</span>
                      <span className="text-[10px] text-slate-400">Geser (Drag & Drop) urutan item untuk mengatur tumpukan z-index layer</span>
                    </div>
                    {draftOverlays.length > 0 && (
                      <button onClick={() => setDraftOverlays([])} className="text-xs font-semibold text-rose-500 hover:underline">
                        Reset Pilihan
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 pr-1">
                    {draftOverlays.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-4 text-center">Belum ada layer terpilih. Silakan pilih dari panel sebelah kiri.</div>
                    ) : (
                      draftOverlays.map((id, index) => {
                        const lyr = layersList.find((l) => l.id === id);
                        if (!lyr) return null;
                        const currentOp = draftOpacities[id] ?? 1.0;
                        return (
                          <div
                            key={id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(index)}
                            className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl bg-white border border-[#1f8080]/30 text-xs font-bold text-[#0a1e36] shadow-2xs cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-all"
                            title="Drag untuk mengubah urutan layer stack"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-slate-400 text-xs shrink-0">⋮⋮</span>
                              <span className="truncate">{lyr.label}</span>
                            </div>

                            {/* Opacity Slider Control */}
                            <div className="flex items-center gap-2 shrink-0 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                              <span className="text-[10px] text-slate-500 font-semibold">Opasitas:</span>
                              <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.05"
                                value={currentOp}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setDraftOpacities((prev) => ({ ...prev, [id]: val }));
                                }}
                                className="w-16 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1f8080]"
                              />
                              <span className="text-[10px] font-mono font-bold text-[#1f8080] min-w-[28px] text-right">
                                {Math.round(currentOp * 100)}%
                              </span>

                              <button
                                onClick={() => setDraftOverlays((prev) => prev.filter((x) => x !== id))}
                                className="text-slate-400 hover:text-rose-500 ml-1"
                                title="Hapus Layer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Sticky Footer Apply Button Bar */}
                <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-lg">
                  <span className="text-[11px] text-slate-500 font-medium">Klik &quot;Terapkan Layer&quot; untuk merender data pada peta utama.</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowLayerModal(false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleApplyLayers}
                      className="px-5 py-2 rounded-xl bg-[#1f8080] hover:bg-[#1f8080]/90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 hover:scale-105"
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
