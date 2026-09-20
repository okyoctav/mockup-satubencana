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
}

export interface SimulationOutput {
  grid: GridCell[];
  results: SimulationResults;
  geoJson: GeoJSON.FeatureCollection;
}

/**
 * FastFlood-inspired Hydrodynamic Flood Spreading Engine
 * Menggunakan prinsip Super Fast Flood Simulation (SFFS) dengan:
 * - Depresi elevasi topografi (DEM)
 * - Persamaan kontinuitas volume hujan akumulatif
 * - Koefisien limpasan (Runoff C) & laju infiltrasi tanah
 * - Kenaikan pasang surut (Tidal surge) & debit hulu
 */
export function runFastFloodSimulation(
  region: RegionPreset,
  params: SimulationParams,
  currentHourIndex = 3 // default to peak (step 3 = hour 8)
): SimulationOutput {
  const gridSize = params.gridResolution === 'high' ? 32 : params.gridResolution === 'medium' ? 24 : 18;
  const stepDegree = 0.0018; // ~200m per grid cell
  const half = Math.floor(gridSize / 2);

  // 1. Hitung total curah hujan efektif (Effective Rainfall Depth in meters)
  // Runoff (P_eff) = (Rainfall - Infiltration) * RunoffCoefficient
  const totalRainfallMm = params.rainfallIntensity * params.durationHours;
  const totalInfiltrationMm = Math.min(params.infiltrationRate * params.durationHours, totalRainfallMm * 0.7);
  const netRainfallMm = Math.max(0, totalRainfallMm - totalInfiltrationMm);
  const effectiveRainfallM = (netRainfallMm / 1000) * params.runoffCoefficient;

  // Efek debit hulu (Inflow factor)
  const inflowDepthBoost = (params.riverInflow / 1000) * 0.4;

  // Efek tanggul jebol / overtopping
  const leveeFactor = params.leveeStatus === 'breached' ? 1.6 : params.leveeStatus === 'overtopped' ? 1.25 : 1.0;

  // Efek kapasitas pompa (mengurangi genangan)
  const pumpReduction = Math.min(0.35, (params.pumpCapacity / 50) * 0.3);

  // Timeline multipliers (0h -> 2h -> 4h -> 8h [Peak] -> 16h -> 24h)
  const timelineMultipliers = [0.05, 0.35, 0.72, 1.0, 0.65, 0.3];
  const activeTimelineMul = timelineMultipliers[currentHourIndex] ?? 1.0;

  const cells: GridCell[] = [];
  const features: GeoJSON.Feature[] = [];

  let totalFloodedAreaM2 = 0;
  let totalVolumeM3 = 0;
  let maxDepth = 0;
  let sumDepth = 0;
  let floodedCellCount = 0;

  const centerLat = region.lat;
  const centerLng = region.lng;
  const baseDem = region.defaultDemBase;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const latOffset = (i - half) * stepDegree;
      const lngOffset = (j - half) * stepDegree;
      const cellLat = centerLat + latOffset;
      const cellLng = centerLng + lngOffset;

      // Bentuk topografi sintetis realistis:
      // Palung sungai berada di tengah (j = half), lereng naik ke pinggir
      const distFromRiver = Math.abs(j - half) / half;

      // Variasi elevasi alami (DEM)
      let cellElevation = baseDem + distFromRiver * 4.5 + Math.sin(i * 0.6) * 0.8 + Math.cos(j * 0.5) * 0.6;
      
      // Jika tipe risiko rob/pesisir: sisi utara lebih rendah mendekati laut
      if (region.riskType === 'Rob / Pesisir') {
        cellElevation += (i - half) * 0.3; // Makin ke utara makin rendah
      }

      // Base flood level di lembah sungai
      const riverWaterLevel = baseDem + 1.2 + (inflowDepthBoost * leveeFactor) + (params.tidalSurge * (1 - distFromRiver));

      // Hitung akumulasi kedalaman air (water depth)
      let depth = 0;
      if (riverWaterLevel > cellElevation) {
        // Air sungai meluap ke daratan
        depth += (riverWaterLevel - cellElevation);
      }

      // Tambahkan genangan dari curah hujan langsung (pluvial flood) di daerah cekungan
      const depressionFactor = Math.max(0, 1 - distFromRiver * 0.8);
      depth += effectiveRainfallM * (1.2 + depressionFactor * 1.5) * leveeFactor;

      // Kurangi dari pompa
      depth = Math.max(0, depth - pumpReduction);

      // Skalakan dengan timeline aktif
      depth = depth * activeTimelineMul;

      // Jika kedalaman di bawah 0.08m, anggap kering/hanya basah
      if (depth < 0.08) depth = 0;

      // Kecepatan aliran (m/s) berdasarkan kemiringan dan kedalaman (Manning's formula approximation)
      const slope = Math.max(0.001, Math.abs(distFromRiver * 0.015));
      const velocity = depth > 0 ? Math.min(2.8, Math.round(((1 / params.manningsN) * Math.pow(depth, 0.66) * Math.sqrt(slope)) * 100) / 100) : 0;

      let hazardLevel: GridCell['hazardLevel'] = 'Aman';
      if (depth > 1.5) hazardLevel = 'Ekstrem';
      else if (depth > 0.8) hazardLevel = 'Tinggi';
      else if (depth > 0.3) hazardLevel = 'Sedang';
      else if (depth > 0) hazardLevel = 'Rendah';

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
      };

      cells.push(cell);

      if (depth > 0) {
        floodedCellCount++;
        const cellAreaM2 = 200 * 200; // ~40,000 m2 (4 Ha)
        totalFloodedAreaM2 += cellAreaM2;
        totalVolumeM3 += depth * cellAreaM2;
        sumDepth += depth;
        if (depth > maxDepth) maxDepth = depth;

        // GeoJSON Feature for visualization (FastFlood color ramp)
        const fillColor =
          depth > 1.5 ? '#1e40af' : // deep royal blue (> 1.5m)
          depth > 0.8 ? '#2563eb' : // strong blue (0.8 - 1.5m)
          depth > 0.3 ? '#0284c7' : // sky blue (0.3 - 0.8m)
          '#38bdf8';               // light cyan (0.08 - 0.3m)

        const fillOpacity = Math.min(0.65, 0.35 + (depth / 2.0) * 0.3);

        features.push({
          type: 'Feature',
          properties: {
            elevation: cell.elevation,
            waterDepth: cell.waterDepth,
            waterElevation: cell.waterElevation,
            velocity: cell.velocity,
            hazardLevel: cell.hazardLevel,
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

  // Estimasi dampak sosial & infrastruktur berdasarkan kepadatan populasi (rasio per Ha)
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

  // Timeline progression steps
  const timelineSteps = [
    { hour: 0, label: '00:00 (Awal Hujan)', totalAreaHa: Math.round(floodedAreaHa * 0.05), avgDepth: Math.round(avgDepth * 0.05 * 100) / 100, waterVolumePct: 5 },
    { hour: 2, label: '02:00 (Hujan Menggenang)', totalAreaHa: Math.round(floodedAreaHa * 0.35), avgDepth: Math.round(avgDepth * 0.35 * 100) / 100, waterVolumePct: 35 },
    { hour: 4, label: '04:00 (Limpasan Meluas)', totalAreaHa: Math.round(floodedAreaHa * 0.72), avgDepth: Math.round(avgDepth * 0.72 * 100) / 100, waterVolumePct: 72 },
    { hour: 8, label: '08:00 (Puncak Banjir)', totalAreaHa: floodedAreaHa, avgDepth: avgDepth, waterVolumePct: 100 },
    { hour: 16, label: '16:00 (Hujan Reda & Aliran)', totalAreaHa: Math.round(floodedAreaHa * 0.65), avgDepth: Math.round(avgDepth * 0.65 * 100) / 100, waterVolumePct: 65 },
    { hour: 24, label: '24:00 (Resapan & Surut)', totalAreaHa: Math.round(floodedAreaHa * 0.3), avgDepth: Math.round(avgDepth * 0.3 * 100) / 100, waterVolumePct: 30 },
  ];

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
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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
