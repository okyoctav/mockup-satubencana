export interface RiverPathConfig {
  orientation: 'north-south' | 'east-west';
  meanderAmplitude: number; // amplitudo kelokan sungai dalam derajat
  meanderWavelength: number;// panjang gelombang kelokan
  baseWidthMeters: number;  // lebar dasar palung sungai (meter)
  phaseOffset?: number;     // pergeseran fase kurva
}

export interface RegionPreset {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  zoom: number;
  description: string;
  defaultDemBase: number; // Base elevation in meters
  riskType: 'Sungai' | 'Rob / Pesisir' | 'Banjir Bandang' | 'Drainase Perkotaan';
  riverConfig?: RiverPathConfig;
  riverGeoJsonUrl?: string;
  dasGeoJsonUrl?: string;
  modelDataUrl?: string;
}

export interface SimulationParams {
  // 1. Presipitasi & Hujan
  rainfallIntensity: number; // mm/jam (10 - 200)
  durationHours: number;     // jam (1 - 24)
  returnPeriod: number;      // Kala ulang (2, 5, 10, 25, 50, 100 tahun)
  
  // 2. Tutupan Lahan & Infiltrasi
  landCoverType: 'urban' | 'suburban' | 'agriculture' | 'forest';
  runoffCoefficient: number; // C (0.15 - 0.90)
  infiltrationRate: number;  // mm/jam (0 - 30)
  manningsN: number;         // Kekasaran permukaan (0.015 - 0.060)

  // 3. Kondisi Batas & Hidraulika
  riverInflow: number;       // Debit hulu (m3/s) (50 - 1500)
  tidalSurge: number;        // Pasang air laut / rob (m) (0 - 2.5)
  leveeStatus: 'intact' | 'breached' | 'overtopped'; // Tanggul: Normal, Jebol, Meluap
  pumpCapacity: number;      // Kapasitas pompa drainase (m3/s) (0 - 50)

  // 4. Resolusi & Domain
  gridResolution: 'low' | 'medium' | 'high'; // 30m, 15m, 5m
}

export interface InspectionPoint {
  lat: number;
  lng: number;
  elevation: number;       // m dpl
  waterDepth: number;      // m
  waterElevation: number;  // m dpl
  velocity: number;        // m/s
  hazardLevel: 'Aman' | 'Rendah' | 'Sedang' | 'Tinggi' | 'Ekstrem';
}

export interface SimulationResults {
  maxDepth: number;          // m
  avgDepth: number;          // m
  floodedAreaHa: number;     // Hektar
  floodedAreaKm2: number;    // km2
  waterVolumeM3: number;     // Juta m3
  
  // Dampak Sosial & Infrastruktur
  affectedPopulation: number;// Jiwa
  affectedBuildings: number; // Unit
  affectedSchools: number;   // Unit
  affectedHospitals: number; // Unit
  inundatedRoadKm: number;   // km
  economicLossBillion: number; // Miliar Rupiah
  
  // Kategori Keparahan
  hazardCategory: 'Rendah' | 'Sedang' | 'Tinggi' | 'Ekstrem';
  
  // Timeline data (untuk playback slider)
  timelineSteps: {
    hour: number;
    label: string;
    totalAreaHa: number;
    avgDepth: number;
    waterVolumePct: number;
  }[];

  // Integrasi Data Demografi SEPAKAT Bappenas
  sepakatStats?: {
    isLive: boolean;
    source: string;
    totalLakiLaki: number;
    totalPerempuan: number;
    totalLansia: number;
    totalBalita: number;
    totalPd1: number; // Disabilitas berat
    totalPd2: number; // Disabilitas sedang
    totalKeluarga: number;
  };
}

export const REGION_PRESETS: RegionPreset[] = [
  {
    id: 'girian_bitung',
    name: 'DAS Girian - Kota Bitung (Data Riil)',
    province: 'Sulawesi Utara (Kota Bitung)',
    lat: 1.4820,
    lng: 125.0910,
    zoom: 13,
    description: 'Pemodelan hidrodinamika 2D riil: Alur Sungai Girian (BAKOSURTANAL 130 titik), Batas DAS Girian (10.910 Ha), dan topografi DEM SRTM 30m.',
    defaultDemBase: 42.0,
    riskType: 'Sungai',
    riverGeoJsonUrl: '/modeling/sungai_girian_kota_bitung_Fe1.json',
    dasGeoJsonUrl: '/modeling/das_girian_bitung_wgs84.json',
    modelDataUrl: '/modeling/girian_bitung_model_data.json',
  },
];
