/** Konfigurasi statis peta Simulasi Dampak (basemap, layer, draw tools). */

export type AdminBnpbLayer = {
  id: string;
  label: string;
  color: string;
  emoji: string;
  url: string;
  type?: 'MapServer' | 'ImageServer' | 'VectorTileServer';
  group?: string;
  useLngLat?: boolean;
  layersParam?: string;
  requiresToken?: boolean;
  extent?: [number, number, number, number];
};

export type AdminBasemap = {
  id: string;
  label: string;
  emoji: string;
  layers: { url: string; attr: string }[];
};

export const ADMIN_BASEMAPS: AdminBasemap[] = [
  {
    id: 'esri_imagery',
    label: 'Citra Satelit',
    emoji: '🛰️',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr: '© Esri, Maxar, Earthstar Geographics',
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        attr: '© Esri',
      },
    ],
  },
  {
    id: 'openstreetmap',
    label: 'OpenStreetMap',
    emoji: '🗺️',
    layers: [
      {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ],
  },
  {
    id: 'big_rbi',
    label: 'RBI Indonesia (BIG)',
    emoji: '🏛️',
    layers: [
      {
        url: 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/tile/{z}/{y}/{x}',
        attr: '© Badan Informasi Geospasial (BIG)',
      },
    ],
  },
  {
    id: 'esri_topo',
    label: 'Topografi',
    emoji: '🏔️',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attr: '© Esri',
      },
    ],
  },
  {
    id: 'carto_dark',
    label: 'Dark',
    emoji: '🌑',
    layers: [
      {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attr: '© OpenStreetMap © CARTO',
      },
    ],
  },
  {
    id: 'carto_light',
    label: 'Light',
    emoji: '🌕',
    layers: [
      {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attr: '© OpenStreetMap © CARTO',
      },
    ],
  },
];

const BNPB_BASE = 'https://gis.bnpb.go.id/server/rest/services/inarisk';

export const ADMIN_BNPB_LAYERS: AdminBnpbLayer[] = [
  {
    id: 'big_rbi_sulawesi_lot1',
    label: 'RBI Sulawesi 2024 Lot 1',
    color: '#A855F7',
    emoji: '🗺️',
    url: 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI_5K_Sulawesi_2024_Lot_1_Jul/VectorTileServer',
    type: 'VectorTileServer',
    group: 'BIG',
  },
  {
    id: 'big_penutup_lahan_sulawesi',
    label: 'Penutup Lahan Sulawesi 2024',
    color: '#22C55E',
    emoji: '🌿',
    url: 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI5K_PENUTUP_LAHAN_SULAWESI_2024/VectorTileServer',
    type: 'VectorTileServer',
    group: 'BIG',
  },
  {
    id: 'big_bangunan_fasum_sulawesi',
    label: 'Bangunan Fasum Sulawesi 2024',
    color: '#F59E0B',
    emoji: '🏛️',
    url: 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI5K_BANGUNAN_FASUM_SULAWESI_2024/VectorTileServer',
    type: 'VectorTileServer',
    group: 'BIG',
  },
  {
    id: 'petadasar_bitung',
    label: 'Peta Dasar Bitung 2024 (Token BIG Required)',
    color: '#F472B6',
    emoji: '🏢',
    url: 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/PETADASAR_SULAWESI_BITUNG_2024_5K/MapServer/18',
    type: 'MapServer',
    group: 'BIG',
    useLngLat: true,
    layersParam: 'show:18',
    requiresToken: true,
    extent: [125.088, 1.375, 125.229, 1.476],
  },
  {
    id: 'cuaca_ekstrim_img',
    label: 'Cuaca Ekstrim',
    color: '#06B6D4',
    emoji: '🌪️',
    url: 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_cuaca_ekstrim/ImageServer',
    type: 'ImageServer',
    group: 'BNPB',
  },
  {
    id: 'banjir',
    label: 'Bahaya Banjir',
    color: '#0EA5E9',
    emoji: '🌊',
    url: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIR/ImageServer',
    type: 'ImageServer',
    group: 'BNPB',
  },
  {
    id: 'banjir_bandang',
    label: 'Banjir Bandang',
    color: '#0369A1',
    emoji: '💧',
    url: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIRBANDANG/ImageServer',
    type: 'ImageServer',
    group: 'BNPB',
  },
  {
    id: 'longsor',
    label: 'Tanah Longsor',
    color: '#F97316',
    emoji: '⛰️',
    url: `${BNPB_BASE}/layer_bahaya_tanah_longsor_30/MapServer`,
    group: 'BNPB',
  },
  {
    id: 'gempa',
    label: 'Gempa Bumi',
    color: '#EF4444',
    emoji: '📳',
    url: `${BNPB_BASE}/layer_bahaya_gempabumi_30/MapServer`,
    group: 'BNPB',
  },
  {
    id: 'tsunami',
    label: 'Tsunami',
    color: '#EC4899',
    emoji: '🌊',
    url: `${BNPB_BASE}/layer_bahaya_tsunami_30/MapServer`,
    group: 'BNPB',
  },
  {
    id: 'gunungapi',
    label: 'Letusan Gunung Api',
    color: '#8B5CF6',
    emoji: '🌋',
    url: `${BNPB_BASE}/layer_bahaya_letusan_gunungapi/MapServer`,
    group: 'BNPB',
  },
  {
    id: 'karhutla',
    label: 'Kebakaran Hutan',
    color: '#F59E0B',
    emoji: '🔥',
    url: `${BNPB_BASE}/layer_bahaya_kebakaran_hutan_dan_lahan_30/MapServer`,
    group: 'BNPB',
  },
  {
    id: 'kekeringan',
    label: 'Kekeringan',
    color: '#D97706',
    emoji: '☀️',
    url: `${BNPB_BASE}/layer_bahaya_kekeringan_30/MapServer`,
    group: 'BNPB',
  },
  {
    id: 'cuaca_ekstrim',
    label: 'Cuaca Ekstrim (MS)',
    color: '#0891B2',
    emoji: '⛅',
    url: `${BNPB_BASE}/layer_bahaya_cuaca_ekstrim_30/MapServer`,
    group: 'BNPB',
  },
  {
    id: 'dukcapil_kel_fix',
    label: 'Kependudukan Kelurahan',
    color: '#3B82F6',
    emoji: '👥',
    url: 'https://gis.dukcapil.kemendagri.go.id/arcgis/rest/services/AGR_VISUAL_KEL_FIX/MapServer/0',
    type: 'MapServer',
    group: 'KEMENDAGRI',
  },
];

export const ADMIN_JENIS_COLOR: Record<string, string> = {
  banjir: '#0EA5E9',
  gempa: '#EF4444',
  longsor: '#F97316',
  kebakaran: '#F59E0B',
  erupsi: '#8B5CF6',
  tsunami: '#EC4899',
  puting_beliung: '#06B6D4',
};

export const ADMIN_LEGEND_ITEMS = [
  { label: 'Banjir', color: '#0EA5E9' },
  { label: 'Gempa', color: '#EF4444' },
  { label: 'Longsor', color: '#F97316' },
  { label: 'Kebakaran', color: '#F59E0B' },
  { label: 'Erupsi', color: '#8B5CF6' },
  { label: 'Tsunami', color: '#EC4899' },
  { label: 'Puting Beliung', color: '#06B6D4' },
];

export const ADMIN_DRAW_TOOLS = [
  { id: 'polyline', label: 'Garis', icon: '📏' },
  { id: 'polygon', label: 'Poligon', icon: '🔷' },
  { id: 'rectangle', label: 'Persegi', icon: '⬜' },
  { id: 'circle', label: 'Lingkaran', icon: '⭕' },
  { id: 'marker', label: 'Plot', icon: '📍' },
  { id: 'circlemarker', label: 'Plot Bulat', icon: '🔵' },
] as const;
