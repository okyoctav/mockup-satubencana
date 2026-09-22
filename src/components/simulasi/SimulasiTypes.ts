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
    id: 'ciliwung_jkt',
    name: 'DAS Ciliwung - Manggarai',
    province: 'DKI Jakarta',
    lat: -6.2115,
    lng: 106.8488,
    zoom: 14,
    description: 'Kawasan rawan banjir luapan sungai Ciliwung dan pertemuan drainase perkotaan padat Jakarta.',
    defaultDemBase: 8.5,
    riskType: 'Sungai',
    riverConfig: {
      orientation: 'north-south',
      meanderAmplitude: 0.0035,
      meanderWavelength: 2.8,
      baseWidthMeters: 45,
      phaseOffset: 0.35,
    },
  },
  {
    id: 'kaligawe_smg',
    name: 'Pesisir Kaligawe & Genuk',
    province: 'Jawa Tengah (Semarang - Demak)',
    lat: -6.9532,
    lng: 110.4578,
    zoom: 14,
    description: 'Dataran rendah pantai utara dengan ancaman kombinasi banjir pasang air laut (rob) dan genangan drainase.',
    defaultDemBase: 1.2,
    riskType: 'Rob / Pesisir',
    riverConfig: {
      orientation: 'north-south',
      meanderAmplitude: 0.0022,
      meanderWavelength: 2.0,
      baseWidthMeters: 38,
      phaseOffset: 0.1,
    },
  },
  {
    id: 'citarum_bdg',
    name: 'DAS Citarum - Baleendah & Dayeuhkolot',
    province: 'Jawa Barat (Bandung)',
    lat: -6.9942,
    lng: 107.6256,
    zoom: 14,
    description: 'Cekungan Bandung dengan kemiringan lereng landai yang menampung aliran sungai Citarum hulu.',
    defaultDemBase: 652.0,
    riskType: 'Sungai',
    riverConfig: {
      orientation: 'east-west',
      meanderAmplitude: 0.0042,
      meanderWavelength: 3.2,
      baseWidthMeters: 55,
      phaseOffset: 0.6,
    },
  },
  {
    id: 'bengawan_solo',
    name: 'DAS Bengawan Solo - Pasar Kliwon',
    province: 'Jawa Tengah (Surakarta)',
    lat: -7.5755,
    lng: 110.8415,
    zoom: 14,
    description: 'Lembah sungai Bengawan Solo dengan risiko luapan air kiriman saat curah hujan ekstrem di hulu.',
    defaultDemBase: 92.0,
    riskType: 'Sungai',
    riverConfig: {
      orientation: 'north-south',
      meanderAmplitude: 0.0034,
      meanderWavelength: 2.4,
      baseWidthMeters: 65,
      phaseOffset: 0.2,
    },
  },
  {
    id: 'batangkuranji_pdg',
    name: 'DAS Batang Kuranji',
    province: 'Sumatera Barat (Padang)',
    lat: -0.9258,
    lng: 100.3842,
    zoom: 14,
    description: 'DAS curam dari Bukit Barisan menuju pesisir barat yang rentan banjir bandang lahar hujan & debit kilat.',
    defaultDemBase: 18.0,
    riskType: 'Banjir Bandang',
    riverConfig: {
      orientation: 'east-west',
      meanderAmplitude: 0.003,
      meanderWavelength: 2.5,
      baseWidthMeters: 42,
      phaseOffset: 0.4,
    },
  },
  {
    id: 'porong_sda',
    name: 'Delta Sungai Porong & Brantas',
    province: 'Jawa Timur (Sidoarjo)',
    lat: -7.5385,
    lng: 112.7056,
    zoom: 14,
    description: 'Jalur pembuangan air sungai Brantas menuju Selat Madura dengan tantangan tanggul dan sedimentasi.',
    defaultDemBase: 4.8,
    riskType: 'Sungai',
    riverConfig: {
      orientation: 'east-west',
      meanderAmplitude: 0.002,
      meanderWavelength: 1.8,
      baseWidthMeters: 70,
      phaseOffset: 0.0,
    },
  },
];
