'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  REGION_PRESETS,
  RegionPreset,
  SimulationParams,
  SimulationResults,
  InspectionPoint,
} from './SimulasiTypes';
import {
  runFastFloodSimulation,
  findNearestInspectionPoint,
  querySepakatStatsForFloodAOI,
  GridCell,
  SimulationOutput,
} from './SimulasiEngine';
import SimulasiControlPanel from './SimulasiControlPanel';
import {
  ArrowLeft,
  Search,
  Maximize2,
  Minimize2,
  Waves,
  SlidersHorizontal,
  Building,
  Users,
  FileText,
} from 'lucide-react';

// Dynamically import Leaflet Map to avoid SSR window errors
const SimulasiLeafletMap = dynamic(() => import('./SimulasiLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white gap-3">
      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold tracking-wider text-slate-600 dark:text-slate-300">
        Memuat Engine Spasial FastFlood...
      </span>
    </div>
  ),
});

const DEFAULT_PARAMS: SimulationParams = {
  rainfallIntensity: 50, // 50 mm/h (Hujan Lebat)
  durationHours: 6,      // 6 Jam
  returnPeriod: 10,      // Kala ulang 10 tahun
  landCoverType: 'urban',
  runoffCoefficient: 0.85,
  infiltrationRate: 4,   // 4 mm/h
  manningsN: 0.035,
  riverInflow: 350,      // 350 m3/s
  tidalSurge: 0.0,
  leveeStatus: 'intact',
  pumpCapacity: 10,      // 10 m3/s
  gridResolution: 'high', // Resolusi halus (~35m-50m per sel grid)
};

interface SimulasiModelingViewProps {
  embedded?: boolean;
}

export default function SimulasiModelingView({ embedded = false }: SimulasiModelingViewProps) {
  const [selectedRegion, setSelectedRegion] = useState<RegionPreset>(REGION_PRESETS[0]);
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState(4); // default peak (step 4 = hour 8: Puncak Hujan & Melebar)
  const [isSimulating, setIsSimulating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Default is HIDE as requested by the user
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [basemapId, setBasemapId] = useState('satellite');

  // Simulation output state
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [inspectionPoint, setInspectionPoint] = useState<InspectionPoint | null>(null);

  // Execute simulation computation
  const executeSimulation = useCallback(
    (regionToUse = selectedRegion, paramsToUse = params, stepIndex = currentTimelineIndex) => {
      setIsSimulating(true);

      setTimeout(async () => {
        const output: SimulationOutput = runFastFloodSimulation(regionToUse, paramsToUse, stepIndex);
        setGridCells(output.grid);
        setGeoJsonData(output.geoJson);
        setResults(output.results);
        setIsSimulating(false);

        // Async query SEPAKAT Bappenas data for the flooded AOI
        try {
          const sepakat = await querySepakatStatsForFloodAOI(output.grid);
          if (sepakat && sepakat.isLive) {
            setResults((prev) => {
              if (!prev) return prev;
              const pop = sepakat.totalLakiLaki + sepakat.totalPerempuan;
              return {
                ...prev,
                affectedPopulation: pop > 0 ? pop : prev.affectedPopulation,
                affectedBuildings: sepakat.totalKeluarga > 0 ? sepakat.totalKeluarga : prev.affectedBuildings,
                sepakatStats: sepakat,
              };
            });
          }
        } catch {
          // ignore SEPAKAT query error
        }
      }, 350);
    },
    [selectedRegion, params, currentTimelineIndex]
  );

  // Run simulation on initial mount or when region changes
  useEffect(() => {
    executeSimulation(selectedRegion, params, currentTimelineIndex);
  }, [selectedRegion]);

  // When timeline step changes, update the grid
  const handleTimelineChange = (newIndex: number) => {
    setCurrentTimelineIndex(newIndex);
    executeSimulation(selectedRegion, params, newIndex);
  };

  // Map Click Inspection
  const handleMapClick = (lat: number, lng: number) => {
    if (gridCells.length === 0) return;
    const pt = findNearestInspectionPoint(lat, lng, gridCells);
    setInspectionPoint(pt);
  };

  // Search Location
  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;

    const matchedPreset = REGION_PRESETS.find(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.province.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (matchedPreset) {
      setSelectedRegion(matchedPreset);
      setSearchQuery('');
      return;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery + ', Indonesia'
      )}&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'SatuBencana-FastFlood/1.0' } });
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newRegion: RegionPreset = {
          id: `custom_${Date.now()}`,
          name: item.display_name.split(',')[0],
          province: item.display_name.split(',').slice(1, 3).join(',').trim(),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          zoom: 14,
          description: `Kawasan kustom: ${item.display_name}`,
          defaultDemBase: 12.0,
          riskType: 'Drainase Perkotaan',
        };
        setSelectedRegion(newRegion);
        setSearchQuery('');
      }
    } catch {
      // ignore geocoding error
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => null);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => null);
    }
  };

  // Export GeoJSON file
  const handleExportGeoJson = () => {
    if (!geoJsonData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJsonData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `simulasi_banjir_${selectedRegion.id}_${Date.now()}.geojson`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export Summary Report
  const handleExportReport = () => {
    if (!results) return;
    const reportData = {
      region: selectedRegion,
      params,
      results,
      generatedAt: new Date().toISOString(),
      engine: 'FastFlood SFFS 2D (Super Fast Flood Simulation)',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `laporan_simulasi_${selectedRegion.id}_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      className={`relative overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 ${
        embedded ? 'w-full h-full' : 'w-screen h-screen'
      }`}
    >
      {/* 1. TOP TOOLBAR BAR (Solid clean styling, no glass/blur) */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between gap-3 shrink-0 z-30">
        {/* Left: Title / Region Selector */}
        <div className="flex items-center gap-3 shrink-0">
          {!embedded && (
            <Link
              href="/dashboard_k5"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                  FastFlood 2D Engine
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-sky-950 text-sky-400 border border-sky-800">
                  SFFS Hydrodynamic
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                {selectedRegion.name} · {selectedRegion.province}
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Quick Metrics & Region Search */}
        <div className="flex-1 max-w-xl hidden md:flex items-center justify-center gap-3">
          {/* Quick Metrics Chips */}
          {results && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                <span className="text-slate-400 text-[10px]">Luas:</span>
                <span className="font-bold text-sky-400">{results.floodedAreaHa.toLocaleString('id-ID')} Ha</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                <Users className="w-3 h-3 text-rose-400" />
                <span className="font-bold text-rose-400">{results.affectedPopulation.toLocaleString('id-ID')}</span>
                <span className="text-slate-400 text-[10px]">jiwa</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                <Building className="w-3 h-3 text-amber-400" />
                <span className="font-bold text-amber-400">{results.affectedBuildings.toLocaleString('id-ID')}</span>
                <span className="text-slate-400 text-[10px]">unit</span>
              </div>
            </div>
          )}

          {/* Search Box */}
          <div className="relative w-48 lg:w-56">
            <input
              type="text"
              placeholder="Cari lokasi/sungai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 pl-8 text-xs text-slate-200 placeholder:text-slate-500 font-medium outline-none focus:border-sky-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Right: Toggle Control Panel (Docked on Right) & Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/api/download-metodologi-docx"
            download="DOKUMEN_METODOLOGI_SIMULASI_PEMODELAN_BENCANA.docx"
            className="px-3 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-teal-100 hover:text-white border border-teal-600 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Unduh Dokumen Metodologi & Spesifikasi Model (.docx)"
          >
            <FileText className="w-3.5 h-3.5 text-teal-300" />
            <span className="hidden sm:inline font-semibold">Metodologi (.docx)</span>
          </a>

          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isPanelOpen
                ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title="Tampilkan / Sembunyikan Panel Parameter & Dampak"
          >
            <SlidersHorizontal className="w-4 h-4 text-sky-400" />
            <span className="font-semibold">
              {isPanelOpen ? 'Tutup Parameter' : 'Parameter & Dampak'}
            </span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title={isFullscreen ? 'Keluar Fullscreen' : 'Mode Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE: MAP (LEFT / FULL) + CONTROL PANEL (RIGHT, COLLAPSIBLE) */}
      <div className="flex-1 relative w-full h-[calc(100%-56px)] overflow-hidden flex">
        {/* Left: Leaflet Hydrodynamic Map Canvas */}
        <main className="flex-1 h-full relative overflow-hidden">
          <SimulasiLeafletMap
            region={selectedRegion}
            geoJsonData={geoJsonData}
            results={results}
            currentTimelineIndex={currentTimelineIndex}
            onTimelineChange={handleTimelineChange}
            inspectionPoint={inspectionPoint}
            onMapClick={handleMapClick}
            basemapId={basemapId}
            onBasemapChange={setBasemapId}
          />
        </main>

        {/* Right Side: Simulation Control Panel (Default Hidden, slides in when open) */}
        <aside
          className={`h-full transition-all duration-300 z-20 shrink-0 ${
            isPanelOpen ? 'w-80 sm:w-96' : 'w-0'
          } overflow-hidden bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800`}
        >
          <div className="w-80 sm:w-96 h-full">
            <SimulasiControlPanel
              selectedRegion={selectedRegion}
              onSelectRegion={(r) => {
                setSelectedRegion(r);
                setInspectionPoint(null);
              }}
              params={params}
              onParamsChange={setParams}
              results={results}
              onRunSimulation={() => executeSimulation()}
              isSimulating={isSimulating}
              onResetParams={() => {
                setParams(DEFAULT_PARAMS);
                executeSimulation(selectedRegion, DEFAULT_PARAMS, currentTimelineIndex);
              }}
              onExportGeoJson={handleExportGeoJson}
              onExportReport={handleExportReport}
              onClose={() => setIsPanelOpen(false)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
