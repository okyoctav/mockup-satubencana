/** Konfigurasi statis peta Dashboard (basemap, legend, draw tools, volcano). */

export type DashboardBasemapLayer = { url: string; attr: string };

export type DashboardBasemap = {
  id: string;
  label: string;
  emoji: string;
  layers?: DashboardBasemapLayer[];
  isMapServerExport?: boolean;
  url?: string;
  requiresToken?: boolean;
};

export type DashboardLegendItem = { label: string; color: string };

export type DashboardLayerLegend = {
  label: string;
  items: { color: string; text: string; icon?: string }[];
};

export type DashboardDrawTool = {
  id: string;
  label: string;
  icon: string;
};

export type InariskNeighborPeak = {
  name: string;
  lat: number;
  lng: number;
  blurb: string;
};

export const DASHBOARD_BASEMAPS: DashboardBasemap[] = [
  {
    id: 'esri_imagery',
    label: 'Citra Satelit',
    emoji: '🛰️',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr: '© Esri, Maxar',
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
      { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap' },
    ],
  },
  {
    id: 'big_rbi',
    label: 'RBI Indonesia (BIG)',
    emoji: '🏛️',
    layers: [
      {
        url: 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/tile/{z}/{y}/{x}',
        attr: '© BIG',
      },
    ],
  },
  {
    id: 'big_rbi5k_sulawesi_2024_base',
    label: 'RBI 5K Sulawesi 2024 (BIG)',
    emoji: '🏔️',
    isMapServerExport: true,
    url: 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/RBI5K_SULAWESI_2024/MapServer',
    requiresToken: true,
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
];

export const HEXBIN_RES9_URL =
  'https://geospasial.bappenas.go.id/server/rest/services/Produksi/hexbin_agg9/MapServer/0';
export const DUKCAPIL_KEL_URL =
  'https://gis.dukcapil.kemendagri.go.id/arcgis/rest/services/AGR_VISUAL_KEL_FIX/MapServer/0';
export const BIG_DESAKEL_URL =
  'https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/BATAS_DESAKEL_AR/MapServer/0';

export const DASHBOARD_JENIS_COLOR: Record<string, string> = {
  banjir: '#0EA5E9',
  gempa: '#EF4444',
  longsor: '#F97316',
  kebakaran: '#F59E0B',
  erupsi: '#8B5CF6',
  tsunami: '#EC4899',
  puting_beliung: '#06B6D4',
};

export const DASHBOARD_LEGEND_ITEMS: DashboardLegendItem[] = [
  { label: 'Banjir', color: '#0EA5E9' },
  { label: 'Gempa', color: '#EF4444' },
  { label: 'Longsor', color: '#F97316' },
  { label: 'Kebakaran', color: '#F59E0B' },
  { label: 'Erupsi', color: '#8B5CF6' },
  { label: 'Tsunami', color: '#EC4899' },
  { label: 'Puting Beliung', color: '#06B6D4' },
];

export const DASHBOARD_PREDEFINED_LAYER_LEGENDS: Record<string, DashboardLayerLegend> = {
  monev_sadana_bappenas: {
    label: 'Monev SADANA Geotagging (BAPPENAS)',
    items: [
      { color: '#0284C7', text: 'Konstruksi / Pelaksanaan' },
      { color: '#F59E0B', text: 'Persiapan' },
      { color: '#64748B', text: 'Belum Mulai' },
    ],
  },
  monev_sakata_bappenas: {
    label: 'Monev SADANA Geotagging (BAPPENAS)',
    items: [
      { color: '#0284C7', text: 'Konstruksi / Pelaksanaan' },
      { color: '#F59E0B', text: 'Persiapan' },
      { color: '#64748B', text: 'Belum Mulai' },
    ],
  },
  banjir: {
    label: 'Indeks Bahaya Banjir (InARISK)',
    items: [
      { color: '#DC2626', text: 'Bahaya Tinggi' },
      { color: '#F59E0B', text: 'Bahaya Sedang' },
      { color: '#10B981', text: 'Bahaya Rendah' },
    ],
  },
  banjir_bandang: {
    label: 'Indeks Bahaya Banjir Bandang (InARISK)',
    items: [
      { color: '#991B1B', text: 'Bahaya Sangat Tinggi' },
      { color: '#EA580C', text: 'Bahaya Tinggi' },
      { color: '#FBBF24', text: 'Bahaya Sedang' },
    ],
  },
  banjir_wms: {
    label: 'Bahaya Banjir WMS (InARISK)',
    items: [
      { color: '#0284C7', text: 'Zona Rendaman Banjir' },
      { color: '#38BDF8', text: 'Potensi Genangan' },
    ],
  },
  gempa: {
    label: 'Bahaya Gempa Bumi 30 (InARISK)',
    items: [
      { color: '#DC2626', text: 'Percepatan Tanah Tinggi (PGA > 0.4g)' },
      { color: '#F97316', text: 'Percepatan Tanah Sedang (PGA 0.2 - 0.4g)' },
      { color: '#FBBF24', text: 'Percepatan Tanah Rendah (PGA < 0.2g)' },
    ],
  },
  sesar_wms: {
    label: 'Peta Sesar & Patahan Aktif (Faults Indonesia)',
    items: [
      { color: '#EF4444', text: 'Jalur Patahan Sesar Aktif Utama' },
      { color: '#8B5CF6', text: 'Zona Deformasi Struktur' },
    ],
  },
  Faults_new: {
    label: 'Jalur Sesar Aktif (BNPB InARISK)',
    items: [{ color: '#DC2626', text: 'Garis Patahan Aktif' }],
  },
  bmkg_seismisitas_dangkal: {
    label: 'Seismisitas Gempa Dangkal (BMKG)',
    items: [{ color: '#DC2626', text: 'Kedalaman < 60 km (Dangkal)' }],
  },
  bmkg_seismisitas_menengah: {
    label: 'Seismisitas Gempa Menengah (BMKG)',
    items: [{ color: '#F59E0B', text: 'Kedalaman 60 - 300 km' }],
  },
  bmkg_seismisitas_dalam: {
    label: 'Seismisitas Gempa Dalam (BMKG)',
    items: [{ color: '#8B5CF6', text: 'Kedalaman > 300 km' }],
  },
  longsor: {
    label: 'Bahaya Tanah Longsor 30 (InARISK)',
    items: [
      { color: '#B45309', text: 'Kerentanan Gerakan Tanah Tinggi' },
      { color: '#F59E0B', text: 'Kerentanan Gerakan Tanah Menengah' },
      { color: '#84CC16', text: 'Kerentanan Gerakan Tanah Rendah' },
    ],
  },
  longsor_wms: {
    label: 'Bahaya Longsor WMS (InARISK)',
    items: [{ color: '#D97706', text: 'Kelerengan Curam & Zona Longsor' }],
  },
  karhutla: {
    label: 'Bahaya Kebakaran Hutan & Lahan 30 (InARISK)',
    items: [
      { color: '#DC2626', text: 'Tingkat Kerawanan Tinggi' },
      { color: '#F97316', text: 'Tingkat Kerawanan Sedang' },
      { color: '#FBBF24', text: 'Tingkat Kerawanan Rendah' },
    ],
  },
  nasa_firms_active_fires: {
    label: 'Titik Panas / Hotspots Realtime (NASA FIRMS NOAA-20)',
    items: [
      { color: '#EF4444', text: 'Hotspot Tingkat Kepercayaan Tinggi (>80%)' },
      { color: '#F59E0B', text: 'Hotspot Tingkat Kepercayaan Nominal' },
    ],
  },
  nasa_gibs_fire_viirs: {
    label: 'Titik Panas NASA VIIRS (375m)',
    items: [{ color: '#DC2626', text: 'Anomali Termal Kebakaran Aktif' }],
  },
  gunungapi: {
    label: 'Bahaya Letusan Gunung Api (InARISK)',
    items: [
      { color: '#7C2D12', text: 'KRB III (Kawasan Rawan Bencana Sangat Tinggi)' },
      { color: '#EA580C', text: 'KRB II (Zona Lontaran Piroklastik)' },
      { color: '#FBBF24', text: 'KRB I (Zona Aliran Lahar Hujan)' },
    ],
  },
  magma_status: {
    label: 'Status Gunung Api',
    items: [
      { color: '#B91C1C', text: '▲ Awas' },
      { color: '#C2410C', text: '▲ Siaga' },
      { color: '#A16207', text: '▲ Waspada' },
      { color: '#E2E8F0', text: '▲ Normal' },
      { color: '#CBD5E1', text: '△ Tanpa status' },
    ],
  },
  magma_volcanoes: {
    label: 'Tingkat Aktivitas Gunung Api',
    items: [
      { color: '#DC2626', text: 'Level IV (Awas)' },
      { color: '#EA580C', text: 'Level III (Siaga)' },
      { color: '#FBBF24', text: 'Level II (Waspada)' },
      { color: '#94A3B8', text: 'Level I (Normal)' },
    ],
  },
  tsunami: {
    label: 'Bahaya Tsunami 30 (InARISK)',
    items: [
      { color: '#0369A1', text: 'Ketinggian Hempasan > 3 meter' },
      { color: '#0284C7', text: 'Ketinggian Hempasan 1 - 3 meter' },
      { color: '#38BDF8', text: 'Ketinggian Hempasan < 1 meter' },
    ],
  },
  kekeringan: {
    label: 'Bahaya Kekeringan 30 (InARISK)',
    items: [
      { color: '#B45309', text: 'Indeks Kekeringan Ekstrem' },
      { color: '#D97706', text: 'Indeks Kekeringan Parah' },
      { color: '#FBBF24', text: 'Indeks Kekeringan Sedang' },
    ],
  },
  cuaca_ekstrim_img: {
    label: 'Bahaya Cuaca Ekstrem (InARISK)',
    items: [
      { color: '#0891B2', text: 'Potensi Angin Kencang / Badai Tinggi' },
      { color: '#06B6D4', text: 'Potensi Angin Kencang Sedang' },
      { color: '#67E8F9', text: 'Potensi Angin Kencang Rendah' },
    ],
  },
  cuaca_ekstrim: {
    label: 'Bahaya Cuaca Ekstrem (MS BNPB)',
    items: [{ color: '#0E7490', text: 'Zona Bahaya Cuaca Ekstrem' }],
  },
  bmkg_curah_hujan_bulanan: {
    label: 'Prakiraan Curah Hujan Bulanan (BMKG)',
    items: [
      { color: '#1E3A8A', text: 'Sangat Tinggi (> 500 mm)' },
      { color: '#1D4ED8', text: 'Tinggi (300 - 500 mm)' },
      { color: '#0284C7', text: 'Menengah (100 - 300 mm)' },
      { color: '#FCD34D', text: 'Rendah (< 100 mm)' },
    ],
  },
  bmkg_sifat_hujan_bulanan: {
    label: 'Prakiraan Sifat Hujan (BMKG)',
    items: [
      { color: '#1D4ED8', text: 'Atas Normal (AN)' },
      { color: '#10B981', text: 'Normal (N)' },
      { color: '#F59E0B', text: 'Bawah Normal (BN)' },
    ],
  },
  Peta_Curah_Hujan_dan_Hari_Hujan: {
    label: 'Curah Hujan & Hari Hujan (BMKG)',
    items: [
      { color: '#0284C7', text: 'Curah Hujan Tinggi' },
      { color: '#60A5FA', text: 'Curah Hujan Sedang / Ringan' },
    ],
  },
  hexbin_res9: {
    label: 'Kepadatan Penduduk DTSEN (BAPPENAS)',
    items: [
      { color: '#0284C7', text: 'Kepadatan Penduduk Tinggi' },
      { color: '#38BDF8', text: 'Kepadatan Penduduk Sedang' },
      { color: '#BAE6FD', text: 'Kepadatan Penduduk Rendah' },
    ],
  },
  dukcapil_kel_fix: {
    label: 'Kependudukan Kelurahan (Dukcapil)',
    items: [{ color: '#3B82F6', text: 'Batas Kependudukan Desa/Kelurahan' }],
  },
  atr_bpn_aht_sulawesi: {
    label: 'Hak Atas Tanah (ATR/BPN)',
    items: [{ color: '#8B5CF6', text: 'Hak Milik / HGB / HGU' }],
  },
  bappenas_batas_desakel: {
    label: 'Batas Kelurahan/Desa (BAPPENAS)',
    items: [{ color: '#0284C7', text: 'Batas Administrasi Desa/Kelurahan 10K' }],
  },
  gempa_ntt_2026_v2: {
    label: 'Dampak Gempa NTT 2026 (Layer 29 BNPB)',
    items: [
      { color: '#DC2626', text: 'Zona Terdampak Kerusakan Berat' },
      { color: '#F59E0B', text: 'Zona Terdampak Kerusakan Sedang' },
    ],
  },
  foto_geotag_ntt: {
    label: 'Foto Geotag Lapangan (Gempa NTT)',
    items: [
      { color: '#F59E0B', text: 'Titik Dokumentasi Foto Kerusakan Lapangan', icon: '📸' },
    ],
  },
};

export const DASHBOARD_DRAW_TOOLS: DashboardDrawTool[] = [
  { id: 'polyline', label: 'Garis', icon: '📏' },
  { id: 'polygon', label: 'Poligon', icon: '🔷' },
  { id: 'rectangle', label: 'Persegi', icon: '⬜' },
  { id: 'circle', label: 'Lingkaran', icon: '⭕' },
  { id: 'marker', label: 'Plot', icon: '📍' },
];

/**
 * Palet status untuk basemap satelit: kontras jelas, tidak neon/nyaru.
 * Stroke gelap + highlight putih dipasang di SVG marker.
 */
export const VOLCANO_STATUS_COLOR: Record<number, string> = {
  4: '#B91C1C', // Awas — merah tua
  3: '#C2410C', // Siaga — oranye terakota
  2: '#A16207', // Waspada — amber gelap (baca di hijau & kota)
  1: '#E2E8F0', // Normal — abu terang (kontras di satelit)
  0: '#CBD5E1',
};

/**
 * Puncak tetangga yang punya zona InaRISK sendiri, tapi sering tidak ada di feed status.
 * Contoh klasik: Merapi (selatan) + Merbabu (utara) terlihat seperti “dua dampak”.
 */
export const INARISK_NEIGHBOR_PEAKS: Record<string, InariskNeighborPeak[]> = {
  merapi: [
    {
      name: 'Merbabu',
      lat: -7.455,
      lng: 110.44,
      blurb:
        'Gunung terpisah di utara. Zona merah–kuning–hijau yang overlap berasal dari Merbabu, bukan “dampak ganda” Merapi.',
    },
  ],
};

export const VOLCANO_FOCUS_ZOOM = 11.25;
