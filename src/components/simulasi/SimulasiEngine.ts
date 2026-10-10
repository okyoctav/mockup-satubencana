import { SimulationParams, SimulationResults, InspectionPoint, RegionPreset } from './SimulasiTypes';

export interface GridCell {
  lat: number;
  lng: number;
  elevation: number;       // DEM (m)
  waterDepth: number;      // Kedalaman air (m)
  waterElevation: number;  // Elevasi muka air (m)
  velocity: number;        // m/s
  hazardLevel: 'Aman' | 'Rendah' | 'Sedang' | 'Tinggi' | 'Ekstrem';
  polygonCoords: [number, number][]; // GeoJSON format [lng, lat]
  isRiverChannel?: boolean;
}

export interface GirianModelCell {
  lat: number;
  lng: number;
  elev: number;
  dist: number;
  rElev: number;
  segIdx: number;
  das: boolean;
  poly: [number, number][];
}

export interface GirianModelData {
  case_id: string;
  name: string;
  province: string;
  bbox: [number, number, number, number];
  rows: number;
  cols: number;
  dLng: number;
  dLat: number;
  cellCount: number;
  riverPointsCount: number;
  riverElevation: {
    upstream: number;
    midstream: number;
    downstream: number;
  };
  cells: GirianModelCell[];
}

export interface SimulationOutput {
  grid: GridCell[];
  results: SimulationResults;
  geoJson: GeoJSON.FeatureCollection;
}

let cachedGirianData: GirianModelData | null = null;

export async function fetchGirianModelData(): Promise<GirianModelData | null> {
  if (cachedGirianData) return cachedGirianData;
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/modeling/girian_bitung_model_data.json');
    if (!res.ok) return null;
    cachedGirianData = await res.json();
    return cachedGirianData;
  } catch (err) {
    console.warn('Failed to load girian_bitung_model_data.json:', err);
    return null;
  }
}

/**
 * FastFlood Hydrodynamic River Spreading Engine
 * Menggunakan prinsip hidrodinamika 2D:
 * - Jika region adalah 'girian_bitung' dan data riil tersedia, menggunakan data riil
 *   Batas DAS Girian, alur Sungai Girian 130 titik, dan DEM SRTM 30m.
 * - Untuk preset lain, menggunakan model hidrodinamika FastFlood semi-analitis.
 */
export function runFastFloodSimulation(
  region: RegionPreset,
  params: SimulationParams,
  currentHourIndex = 4, // default to peak (index 4 = hour 8)
  realData?: GirianModelData | null
): SimulationOutput {
  // 0. Cabang Khusus: DAS Girian - Kota Bitung (Berdasarkan File Geospasial Riil)
  const girianData = realData || cachedGirianData;
  if (region.id === 'girian_bitung' && girianData && girianData.cells && girianData.cells.length > 0) {
    const totalRainfallMm = params.rainfallIntensity * params.durationHours;
    const totalInfiltrationMm = Math.min(params.infiltrationRate * params.durationHours, totalRainfallMm * 0.55);
    const netRainfallMm = Math.max(0, totalRainfallMm - totalInfiltrationMm);
    const effectiveRainfallM = (netRainfallMm / 1000) * params.runoffCoefficient;

    const inflowFactor = ((params.riverInflow - 50) / 600) * 1.5;
    const tideFactor = params.tidalSurge * 0.95;
    const leveeMultiplier = params.leveeStatus === 'breached' ? 1.75 : params.leveeStatus === 'overtopped' ? 1.3 : 1.0;
    const pumpReduction = Math.min(0.4, (params.pumpCapacity / 50) * 0.35);

    const timelineMultipliers = [0.0, 0.25, 0.58, 0.85, 1.0, 0.85, 0.45, 0.15];
    const activeFloodMul = timelineMultipliers[currentHourIndex] ?? 1.0;

    const peakStageRise = ((effectiveRainfallM * 4.8) + inflowFactor + (tideFactor * 0.3)) * leveeMultiplier;
    const currentStageRise = Math.max(0, (peakStageRise * activeFloodMul) - (pumpReduction * activeFloodMul));

    const rainIntensityRatio = Math.pow(Math.max(10, params.rainfallIntensity) / 50, 1.15);
    const halfRiverWidth = 25; // lebar palung sungai ~50m
    const maxSpreadDistance = halfRiverWidth + 30 + (Math.pow(Math.max(0, currentStageRise - 0.7), 1.25) * 420 * rainIntensityRatio);

    const cells: GridCell[] = [];
    const features: GeoJSON.Feature[] = [];

    let totalFloodedAreaM2 = 0;
    let totalVolumeM3 = 0;
    let maxDepth = 0;
    let sumDepth = 0;
    let floodedCellCount = 0;

    const cellAreaM2 = (girianData.dLat * 111320) * (girianData.dLng * 111320 * Math.cos(1.48 * Math.PI / 180));

    for (const c of girianData.cells) {
      const isRiverChannel = c.dist <= 35;
      let depth = 0;
      let velocity = 0;

      const riverWaterSurface = c.rElev + (isRiverChannel ? 1.1 + currentStageRise : currentStageRise);
      const bankHeight = params.leveeStatus === 'breached' ? 0.3 : 1.2;
      const bankElevation = c.rElev + bankHeight;
      const overflowHead = Math.max(0, riverWaterSurface - bankElevation);

      if (isRiverChannel) {
        depth = Math.max(0.8, 1.1 + currentStageRise);
        const slope = Math.max(0.005, (c.rElev + 5) / 14000);
        velocity = Math.min(5.2, Math.max(1.5, Math.sqrt(2 * 9.81 * slope * depth)));
      } else if (overflowHead > 0 && c.dist <= maxSpreadDistance) {
        const headAtCell = (c.rElev + currentStageRise) - c.elev;
        if (headAtCell > 0) {
          const lateralFactor = Math.max(0, 1 - Math.pow(c.dist / maxSpreadDistance, 1.4));
          depth = headAtCell * (0.35 + lateralFactor * 0.65);
          velocity = Math.min(2.5, Math.max(0.2, (depth * 0.6) * lateralFactor));
        }
      }

      if (params.tidalSurge > 0 && c.elev <= 3.5 && c.segIdx >= 110) {
        const coastalTideDepth = Math.max(0, (params.tidalSurge * activeFloodMul) - (c.elev * 0.4));
        if (coastalTideDepth > depth) {
          depth = coastalTideDepth;
          velocity = Math.max(velocity, 0.3);
        }
      }

      depth = Math.round(depth * 100) / 100;
      velocity = Math.round(velocity * 100) / 100;

      if (depth > 0.05) {
        floodedCellCount++;
        totalFloodedAreaM2 += cellAreaM2;
        totalVolumeM3 += depth * cellAreaM2;
        sumDepth += depth;
        if (depth > maxDepth) maxDepth = depth;
      }

      let hazardLevel: 'Aman' | 'Rendah' | 'Sedang' | 'Tinggi' | 'Ekstrem' = 'Aman';
      if (depth <= 0.05) {
        hazardLevel = 'Aman';
      } else if (depth <= 0.75 && velocity < 0.6) {
        hazardLevel = 'Rendah';
      } else if (depth <= 1.5 || (depth <= 0.75 && velocity >= 0.6)) {
        hazardLevel = 'Sedang';
      } else if (depth <= 2.5) {
        hazardLevel = 'Tinggi';
      } else {
        hazardLevel = 'Ekstrem';
      }

      let fillColor = '#0ea5e9';
      let fillOpacity = 0.55;

      if (isRiverChannel) {
        fillColor = '#0284c7';
        fillOpacity = 0.85;
      } else if (hazardLevel === 'Rendah') {
        fillColor = '#38bdf8';
        fillOpacity = 0.6;
      } else if (hazardLevel === 'Sedang') {
        fillColor = '#eab308';
        fillOpacity = 0.7;
      } else if (hazardLevel === 'Tinggi') {
        fillColor = '#f97316';
        fillOpacity = 0.75;
      } else if (hazardLevel === 'Ekstrem') {
        fillColor = '#ef4444';
        fillOpacity = 0.85;
      }

      const gridCell: GridCell = {
        lat: c.lat,
        lng: c.lng,
        elevation: c.elev,
        waterDepth: depth,
        waterElevation: Math.round((c.elev + depth) * 100) / 100,
        velocity,
        hazardLevel,
        polygonCoords: c.poly,
        isRiverChannel,
      };

      cells.push(gridCell);

      if (depth > 0.05 || isRiverChannel) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [c.poly],
          },
          properties: {
            depth,
            elevation: c.elev,
            waterElevation: Math.round((c.elev + depth) * 100) / 100,
            velocity,
            hazardLevel,
            fillColor,
            fillOpacity,
            isRiverChannel,
            distToRiver: c.dist,
            isInsideDAS: c.das,
          },
        });
      }
    }

    const floodedAreaHa = Math.round(totalFloodedAreaM2 / 10000);
    const floodedAreaKm2 = Math.round((totalFloodedAreaM2 / 1000000) * 100) / 100;
    const avgDepth = floodedCellCount > 0 ? Math.round((sumDepth / floodedCellCount) * 100) / 100 : 0;
    const waterVolumeM3 = Math.round((totalVolumeM3 / 1000000) * 100) / 100;

    const affectedPopulation = Math.round(floodedAreaHa * 28);
    const affectedBuildings = Math.round(affectedPopulation / 4.1);
    const affectedSchools = Math.min(18, Math.round(floodedAreaKm2 * 1.8));
    const affectedHospitals = Math.min(4, Math.round(floodedAreaKm2 * 0.4));
    const inundatedRoadKm = Math.round(floodedAreaKm2 * 3.4 * 10) / 10;
    const economicLossBillion = Math.round(floodedAreaKm2 * 18.5 * 10) / 10;

    let overallHazard: 'Rendah' | 'Sedang' | 'Tinggi' | 'Ekstrem' = 'Rendah';
    if (maxDepth >= 2.5 || floodedAreaHa > 600) overallHazard = 'Ekstrem';
    else if (maxDepth >= 1.5 || floodedAreaHa > 300) overallHazard = 'Tinggi';
    else if (maxDepth >= 0.75 || floodedAreaHa > 100) overallHazard = 'Sedang';

    const timelineSteps = [
      { hour: 0, label: '00:00 - Baseline Aliran Sungai Girian', totalAreaHa: Math.round(floodedAreaHa * 0.08), avgDepth: 0.9, waterVolumePct: 8 },
      { hour: 2, label: '02:00 - Hujan Mulai Mengisi Hulu DAS', totalAreaHa: Math.round(floodedAreaHa * 0.28), avgDepth: Math.round(avgDepth * 0.35 * 100) / 100, waterVolumePct: 25 },
      { hour: 4, label: '04:00 - Debit Hulu Girian Meningkat', totalAreaHa: Math.round(floodedAreaHa * 0.62), avgDepth: Math.round(avgDepth * 0.65 * 100) / 100, waterVolumePct: 58 },
      { hour: 6, label: '06:00 - Aliran Mendekati Tanggul Kritis', totalAreaHa: Math.round(floodedAreaHa * 0.88), avgDepth: Math.round(avgDepth * 0.88 * 100) / 100, waterVolumePct: 85 },
      { hour: 8, label: '08:00 - Puncak Luapan DAS Girian & Genangan', totalAreaHa: floodedAreaHa, avgDepth, waterVolumePct: 100 },
      { hour: 10, label: '10:00 - Hujan Mereda, Genangan Meluas', totalAreaHa: Math.round(floodedAreaHa * 0.92), avgDepth: Math.round(avgDepth * 0.9 * 100) / 100, waterVolumePct: 88 },
      { hour: 12, label: '12:00 - Aliran Mulai Surut ke Muara', totalAreaHa: Math.round(floodedAreaHa * 0.58), avgDepth: Math.round(avgDepth * 0.55 * 100) / 100, waterVolumePct: 48 },
      { hour: 14, label: '14:00 - Pasca Banjir / Aliran Normal', totalAreaHa: Math.round(floodedAreaHa * 0.2), avgDepth: Math.round(avgDepth * 0.25 * 100) / 100, waterVolumePct: 18 },
    ];

    const results: SimulationResults = {
      maxDepth,
      avgDepth,
      floodedAreaHa,
      floodedAreaKm2,
      waterVolumeM3,
      affectedPopulation,
      affectedBuildings,
      affectedSchools,
      affectedHospitals,
      inundatedRoadKm,
      economicLossBillion,
      hazardCategory: overallHazard,
      timelineSteps,
    };

    return {
      grid: cells,
      results,
      geoJson: {
        type: 'FeatureCollection',
        features,
      },
    };
  }

  // Grid resolution default: Finer resolution (~35m - 50m per cell)
  const gridSize = params.gridResolution === 'high' ? 56 : params.gridResolution === 'medium' ? 44 : 34;
  const stepDegree = params.gridResolution === 'high' ? 0.00035 : params.gridResolution === 'medium' ? 0.00045 : 0.00062;
  const half = Math.floor(gridSize / 2);

  // 1. Parameter Hidrologi & Curah Hujan Efektif
  const totalRainfallMm = params.rainfallIntensity * params.durationHours;
  const totalInfiltrationMm = Math.min(params.infiltrationRate * params.durationHours, totalRainfallMm * 0.6);
  const netRainfallMm = Math.max(0, totalRainfallMm - totalInfiltrationMm);
  const effectiveRainfallM = (netRainfallMm / 1000) * params.runoffCoefficient;

  // Efek debit hulu (Inflow m3/s)
  const inflowFactor = ((params.riverInflow - 50) / 750) * 1.35;

  // Efek pasang surut / rob (m)
  const tideFactor = params.tidalSurge * (region.riskType === 'Rob / Pesisir' ? 0.95 : 0.25);

  // Efek tanggul (intact / breached / overtopped)
  const leveeMultiplier = params.leveeStatus === 'breached' ? 1.75 : params.leveeStatus === 'overtopped' ? 1.32 : 1.0;

  // Efek kapasitas pompa drainase (mengurangi tinggi genangan)
  const pumpReduction = Math.min(0.45, (params.pumpCapacity / 50) * 0.4);

  // 2. Timeline steps: 8 tahapan jam dari awal hujan hingga surut
  const timelineMultipliers = [0.0, 0.22, 0.55, 0.82, 1.0, 0.88, 0.50, 0.20];
  const activeFloodMul = timelineMultipliers[currentHourIndex] ?? 1.0;

  // Total kenaikan muka air sungai (Stage Rise) saat puncak banjir (Jam 08:00)
  const peakStageRise = ((effectiveRainfallM * 4.6) + inflowFactor + tideFactor) * leveeMultiplier;

  // Kenaikan muka air sungai pada jam yang sedang aktif
  const currentStageRise = Math.max(0, (peakStageRise * activeFloodMul) - (pumpReduction * activeFloodMul));

  // Konfigurasi Alur Sungai (River Geometry)
  const riverCfg = region.riverConfig || {
    orientation: 'north-south',
    meanderAmplitude: 0.0032,
    meanderWavelength: 2.6,
    baseWidthMeters: 45,
    phaseOffset: 0.25,
  };

  const centerLat = region.lat;
  const centerLng = region.lng;
  const baseDem = region.defaultDemBase;
  const halfRiverW = riverCfg.baseWidthMeters / 2;
  const latRad = (centerLat * Math.PI) / 180;
  const metersPerLngDegree = 111320 * Math.cos(latRad);
  const metersPerLatDegree = 111320;

  // Muka air sungai baseline (saat kering / normal)
  const baselineRiverWSE = baseDem - 1.2;
  const riverWSE = baselineRiverWSE + currentStageRise;

  // Tinggi bibir tanggul/tebing sungai
  const bankCrestElevation = params.leveeStatus === 'breached' ? baseDem - 0.2 : baseDem + 0.5;
  const overflowHead = Math.max(0, riverWSE - bankCrestElevation);

  // Jangkauan pelebaran lateral sungai (m):
  // Meningkat tajam saat intensitas hujan tinggi & muka air meluap
  const rainIntensityRatio = Math.pow(Math.max(10, params.rainfallIntensity) / 50, 1.15);
  const maxSpreadDistance = halfRiverW + 30 + (Math.pow(overflowHead, 1.35) * 380 * rainIntensityRatio);

  const cells: GridCell[] = [];
  const features: GeoJSON.Feature[] = [];

  let totalFloodedAreaM2 = 0;
  let totalVolumeM3 = 0;
  let maxDepth = 0;
  let sumDepth = 0;
  let floodedCellCount = 0;

  // Luas area per sel grid dalam m2
  const cellAreaM2 = (stepDegree * metersPerLatDegree) * (stepDegree * metersPerLngDegree);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const latOffset = (i - half) * stepDegree;
      const lngOffset = (j - half) * stepDegree;
      const cellLat = centerLat + latOffset;
      const cellLng = centerLng + lngOffset;

      // 3. Hitung jarak tegak lurus ke garis tengah alur sungai (Centerline Distance)
      let distMeters = 0;

      if (riverCfg.orientation === 'north-south') {
        const u = latOffset / (half * stepDegree); // -1.0 s/d +1.0
        const riverLng =
          centerLng +
          Math.sin(u * Math.PI * (riverCfg.meanderWavelength / 2) + (riverCfg.phaseOffset || 0)) * riverCfg.meanderAmplitude +
          Math.sin(u * Math.PI * riverCfg.meanderWavelength * 1.6) * (riverCfg.meanderAmplitude * 0.28);
        distMeters = Math.abs(cellLng - riverLng) * metersPerLngDegree;
      } else {
        const v = lngOffset / (half * stepDegree); // -1.0 s/d +1.0
        const riverLat =
          centerLat +
          Math.sin(v * Math.PI * (riverCfg.meanderWavelength / 2) + (riverCfg.phaseOffset || 0)) * riverCfg.meanderAmplitude +
          Math.sin(v * Math.PI * riverCfg.meanderWavelength * 1.6) * (riverCfg.meanderAmplitude * 0.28);
        distMeters = Math.abs(cellLat - riverLat) * metersPerLatDegree;
      }

      const isRiverChannel = distMeters <= halfRiverW;

      // 4. Hitung Elevasi Tanah / DEM berdasarkan profil penampang sungai
      let cellElevation: number;

      if (isRiverChannel) {
        // Di palung sungai: palung melengkung ke bawah
        const bedProfile = 1 - Math.pow(distMeters / halfRiverW, 2);
        cellElevation = baseDem - 2.6 * bedProfile;
      } else if (distMeters <= halfRiverW + 30) {
        // Bantaran & tanggul pelindung
        const bankRatio = (distMeters - halfRiverW) / 30;
        cellElevation = baseDem - 0.4 + bankRatio * 0.9;
      } else {
        // Dataran banjir, jalan, dan pemukiman
        const distFromBankM = distMeters - halfRiverW - 30;
        const slopeRise = Math.min(2.8, (distFromBankM / 550) * 1.0);
        const microUndulation = Math.sin(i * 0.75) * 0.22 + Math.cos(j * 0.65) * 0.18;
        cellElevation = baseDem + 0.5 + slopeRise + microUndulation;
      }

      // Jika wilayah pesisir / rob: sisi utara lebih rendah mendekati laut
      if (region.riskType === 'Rob / Pesisir') {
        cellElevation += ((cellLat - centerLat) / (half * stepDegree)) * 0.5;
      }

      // 5. Hitung Kedalaman Air (Water Depth)
      let depth = 0;

      if (isRiverChannel) {
        // Di alur sungai: SELALU ada air mengalir (kondisi normal sungai baseline)
        const baseNormalDepth = (baseDem - 1.2) - cellElevation;
        depth = Math.max(0.9, baseNormalDepth + currentStageRise);
      } else {
        // Di luar sungai: air hanya ada jika sungai meluap melebihi tanggul
        if (overflowHead > 0 && distMeters < maxSpreadDistance) {
          const lateralFactor = Math.max(0, 1 - Math.pow(distMeters / maxSpreadDistance, 1.7));
          const headAtDistance = riverWSE - cellElevation;
          if (headAtDistance > 0) {
            depth = headAtDistance * (0.35 + lateralFactor * 0.65);
          }
        }

        // Genangan pluvial (hujan lokal di cekungan tertutup)
        const depressionFactor = Math.max(0, (baseDem + 0.8) - cellElevation);
        if (depressionFactor > 0 && effectiveRainfallM > 0.02) {
          const pluvialDepth = effectiveRainfallM * 0.85 * activeFloodMul * Math.min(1.4, depressionFactor);
          depth = Math.max(depth, pluvialDepth);
        }
      }

      // Cutoff: kedalaman di bawah 8 cm di daratan dianggap kering/basah
      if (!isRiverChannel && depth < 0.08) {
        depth = 0;
      }

      // 6. Kecepatan Arus (Velocity m/s)
      let velocity = 0;
      if (isRiverChannel) {
        velocity = Math.min(3.5, Math.round((1.4 + currentStageRise * 0.5) * 100) / 100);
      } else if (depth > 0) {
        const distRatio = Math.max(0, 1 - distMeters / maxSpreadDistance);
        velocity = Math.min(1.6, Math.round((0.15 + depth * 0.35 * distRatio) * 100) / 100);
      }

      // 7. Status Bahaya
      let hazardLevel: GridCell['hazardLevel'] = 'Aman';
      if (depth > 1.5) hazardLevel = 'Ekstrem';
      else if (depth > 0.8) hazardLevel = 'Tinggi';
      else if (depth > 0.3) hazardLevel = 'Sedang';
      else if (depth > 0.08) hazardLevel = 'Rendah';

      // Cell polygon bounds
      const halfStep = stepDegree / 2;
      const polyCoords: [number, number][] = [
        [cellLng - halfStep, cellLat - halfStep],
        [cellLng + halfStep, cellLat - halfStep],
        [cellLng + halfStep, cellLat + halfStep],
        [cellLng - halfStep, cellLat + halfStep],
        [cellLng - halfStep, cellLat - halfStep],
      ];

      const cell: GridCell = {
        lat: cellLat,
        lng: cellLng,
        elevation: Math.round(cellElevation * 10) / 10,
        waterDepth: Math.round(depth * 100) / 100,
        waterElevation: Math.round((cellElevation + depth) * 100) / 100,
        velocity,
        hazardLevel,
        polygonCoords: polyCoords,
        isRiverChannel,
      };

      cells.push(cell);

      if (depth > 0) {
        floodedCellCount++;
        totalFloodedAreaM2 += cellAreaM2;
        totalVolumeM3 += depth * cellAreaM2;
        sumDepth += depth;
        if (depth > maxDepth) maxDepth = depth;

        // Color coding FastFlood SFFS 2D (Sesuai Legenda BNPB & Standar Risiko)
        const fillColor =
          isRiverChannel
            ? '#0284c7' // Palung alur sungai (biru tua)
            : depth > 2.5
            ? '#ef4444' // Genangan ekstrem > 2.5m (merah)
            : depth > 1.5
            ? '#f97316' // Genangan tinggi 1.5 - 2.5m (orange)
            : depth > 0.75
            ? '#eab308' // Genangan sedang 0.75 - 1.5m (kuning)
            : '#38bdf8'; // Genangan rendah < 0.75m (biru muda)

        const fillOpacity = isRiverChannel ? 0.85 : Math.min(0.85, 0.55 + (depth / 3.0) * 0.3);

        features.push({
          type: 'Feature',
          properties: {
            elevation: cell.elevation,
            waterDepth: cell.waterDepth,
            waterElevation: cell.waterElevation,
            velocity: cell.velocity,
            hazardLevel: cell.hazardLevel,
            isRiverChannel,
            fillColor,
            fillOpacity,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [polyCoords],
          },
        });
      }
    }
  }

  const floodedAreaHa = Math.round(totalFloodedAreaM2 / 10000);
  const floodedAreaKm2 = Math.round((totalFloodedAreaM2 / 1000000) * 100) / 100;
  const avgDepth = floodedCellCount > 0 ? Math.round((sumDepth / floodedCellCount) * 100) / 100 : 0;
  const waterVolumeMillionM3 = Math.round((totalVolumeM3 / 1000000) * 100) / 100;

  // Estimasi dampak sosial & infrastruktur berdasarkan kepadatan populasi
  const densityMultiplier = params.landCoverType === 'urban' ? 180 : params.landCoverType === 'suburban' ? 95 : 30;
  const affectedPopulation = Math.round(floodedAreaHa * densityMultiplier * (avgDepth > 0.5 ? 1.0 : 0.4));
  const affectedBuildings = Math.round(affectedPopulation / 4.2);
  const affectedSchools = Math.max(1, Math.round(floodedAreaHa / 120));
  const affectedHospitals = Math.max(1, Math.round(floodedAreaHa / 280));
  const inundatedRoadKm = Math.round((floodedAreaKm2 * 4.2) * 10) / 10;
  const economicLossBillion = Math.round((affectedBuildings * 0.045 + inundatedRoadKm * 0.85 + affectedPopulation * 0.005) * 10) / 10;

  let overallHazard: SimulationResults['hazardCategory'] = 'Rendah';
  if (maxDepth > 1.8 || affectedPopulation > 20000) overallHazard = 'Ekstrem';
  else if (maxDepth > 1.0 || affectedPopulation > 8000) overallHazard = 'Tinggi';
  else if (maxDepth > 0.4) overallHazard = 'Sedang';

  // 8 Tahapan Timeline Interaktif (0h -> 2h -> 4h -> 6h -> 8h [Peak] -> 12h -> 18h -> 24h)
  const timelineSteps = [
    {
      hour: 0,
      label: '00:00 (Aliran Normal)',
      totalAreaHa: Math.round(floodedAreaHa * 0.08),
      avgDepth: Math.max(0.2, Math.round(avgDepth * 0.25 * 100) / 100),
      waterVolumePct: 8,
    },
    {
      hour: 2,
      label: '02:00 (Hujan Menggenang)',
      totalAreaHa: Math.round(floodedAreaHa * 0.25),
      avgDepth: Math.round(avgDepth * 0.45 * 100) / 100,
      waterVolumePct: 25,
    },
    {
      hour: 4,
      label: '04:00 (Mendekati Tanggul)',
      totalAreaHa: Math.round(floodedAreaHa * 0.55),
      avgDepth: Math.round(avgDepth * 0.7 * 100) / 100,
      waterVolumePct: 55,
    },
    {
      hour: 6,
      label: '06:00 (Luapan Awal)',
      totalAreaHa: Math.round(floodedAreaHa * 0.82),
      avgDepth: Math.round(avgDepth * 0.88 * 100) / 100,
      waterVolumePct: 82,
    },
    {
      hour: 8,
      label: '08:00 (Puncak Hujan & Melebar)',
      totalAreaHa: floodedAreaHa,
      avgDepth: avgDepth,
      waterVolumePct: 100,
    },
    {
      hour: 12,
      label: '12:00 (Genangan Maksimal)',
      totalAreaHa: Math.round(floodedAreaHa * 0.88),
      avgDepth: Math.round(avgDepth * 0.9 * 100) / 100,
      waterVolumePct: 88,
    },
    {
      hour: 18,
      label: '18:00 (Hujan Reda & Surut)',
      totalAreaHa: Math.round(floodedAreaHa * 0.5),
      avgDepth: Math.round(avgDepth * 0.55 * 100) / 100,
      waterVolumePct: 50,
    },
    {
      hour: 24,
      label: '24:00 (Surut ke Alur Sungai)',
      totalAreaHa: Math.round(floodedAreaHa * 0.2),
      avgDepth: Math.round(avgDepth * 0.3 * 100) / 100,
      waterVolumePct: 20,
    },
  ];

  // SEPAKAT Bappenas demografi AOI
  const lk = Math.round(affectedPopulation * 0.504);
  const pr = affectedPopulation - lk;
  const lansia = Math.round(affectedPopulation * 0.118);
  const balita = Math.round(affectedPopulation * 0.085);
  const pd1 = Math.max(1, Math.round(affectedPopulation * 0.012));
  const pd2 = Math.max(2, Math.round(affectedPopulation * 0.028));
  const klg = Math.round(affectedPopulation / 3.8);

  const sepakatStats: SimulationResults['sepakatStats'] = {
    isLive: false,
    source: 'SEPAKAT Bappenas (Model Demografi Terkalibrasi AOI)',
    totalLakiLaki: lk,
    totalPerempuan: pr,
    totalLansia: lansia,
    totalBalita: balita,
    totalPd1: pd1,
    totalPd2: pd2,
    totalKeluarga: klg,
  };

  const results: SimulationResults = {
    maxDepth: Math.round(maxDepth * 100) / 100,
    avgDepth,
    floodedAreaHa,
    floodedAreaKm2,
    waterVolumeM3: waterVolumeMillionM3,
    affectedPopulation,
    affectedBuildings,
    affectedSchools,
    affectedHospitals,
    inundatedRoadKm,
    economicLossBillion,
    hazardCategory: overallHazard,
    timelineSteps,
    sepakatStats,
  };

  return {
    grid: cells,
    results,
    geoJson: {
      type: 'FeatureCollection',
      features,
    },
  };
}

/**
 * Cari sel terdekat saat pengguna mengklik peta
 */
export function findNearestInspectionPoint(
  lat: number,
  lng: number,
  grid: GridCell[]
): InspectionPoint {
  let nearest: GridCell = grid[0];
  let minDistance = Infinity;

  for (const cell of grid) {
    const dist = Math.pow(cell.lat - lat, 2) + Math.pow(cell.lng - lng, 2);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = cell;
    }
  }

  return {
    lat: nearest.lat,
    lng: nearest.lng,
    elevation: nearest.elevation,
    waterDepth: nearest.waterDepth,
    waterElevation: nearest.waterElevation,
    velocity: nearest.velocity,
    hazardLevel: nearest.hazardLevel,
  };
}

/**
 * Query data demografi riil dari SEPAKAT Bappenas (Hexbin H3 Res-9)
 * berdasarkan poligon / bounding box area genangan banjir (AOI).
 */
export async function querySepakatStatsForFloodAOI(
  cells: GridCell[]
): Promise<SimulationResults['sepakatStats'] | null> {
  const flooded = cells.filter((c) => c.waterDepth > 0);
  if (flooded.length === 0) return null;

  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  for (const c of flooded) {
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lng < minLng) minLng = c.lng;
    if (c.lng > maxLng) maxLng = c.lng;
  }

  // Padding ring spasial
  const pad = 0.002;
  const ring = [
    [minLng - pad, minLat - pad],
    [maxLng + pad, minLat - pad],
    [maxLng + pad, maxLat + pad],
    [minLng - pad, maxLat + pad],
    [minLng - pad, minLat - pad],
  ];

  const queryUrl = 'https://geospasial.bappenas.go.id/server/rest/services/Produksi/hexbin_agg9/MapServer/0/query';
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
    geometry: JSON.stringify({ rings: [ring], spatialReference: { wkid: 4326 } }),
    geometryType: 'esriGeometryPolygon',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    outSR: '4326',
    returnGeometry: 'false',
    outStatistics,
    where: '1=1',
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const json = await response.json();
    const attrs = json.features?.[0]?.attributes;
    if (!attrs) return null;

    const parseNum = (v: unknown) => {
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return isNaN(n) ? 0 : Math.round(n);
    };

    const lk = parseNum(attrs.sum_jml_lakila);
    const pr = parseNum(attrs.sum_jml_peremp);
    const klg = parseNum(attrs.sum_jml_klg);

    if (lk + pr === 0 && klg === 0) return null;

    return {
      isLive: true,
      source: 'SEPAKAT Bappenas (Hexbin H3 Res-9)',
      totalLakiLaki: lk,
      totalPerempuan: pr,
      totalLansia: parseNum(attrs.sum_jml_lansia),
      totalBalita: parseNum(attrs.sum_jml_balita),
      totalPd1: parseNum(attrs.sum_jml_pd1),
      totalPd2: parseNum(attrs.sum_jml_pd2),
      totalKeluarga: klg,
    };
  } catch {
    return null;
  }
}
