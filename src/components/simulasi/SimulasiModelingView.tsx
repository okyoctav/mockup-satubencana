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
} from 'lucide-react';

// Dynamically import Leaflet Map to avoid SSR window errors
const SimulasiLeafletMap = dynamic(() => import('./SimulasiLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white gap-3">
      <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold tracking-wider text-slate-300">
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
  gridResolution: 'medium',
};

export default function SimulasiModelingView() {
  const [selectedRegion, setSelectedRegion] = useState<RegionPreset>(REGION_PRESETS[0]);
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState(3); // default peak (step 3 = hour 8)
  const [isSimulating, setIsSimulating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

      // Small async delay for realistic computation feel & UI responsiveness
      setTimeout(() => {
        const output: SimulationOutput = runFastFloodSimulation(regionToUse, paramsToUse, stepIndex);
        setGridCells(output.grid);
        setGeoJsonData(output.geoJson);
        setResults(output.results);
        setIsSimulating(false);
      }, 350);
    },
    [selectedRegion, params, currentTimelineIndex]
  );

  // Run simulation on initial mount or when region changes
  useEffect(() => {
    executeSimulation(selectedRegion, params, currentTimelineIndex);
  }, [selectedRegion]);

  // When timeline step changes, update the grid without full re-computation
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

    // Check if matches preset first
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

    // Otherwise geocode via OSM Nominatim
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
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 font-sans text-slate-100">
      {/* 1. TOP HEADER BAR */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 flex items-center justify-between gap-4 shrink-0 z-30">
        {/* Left: Back Link & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard_k5"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700/60"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                  Simulasi Modeling Banjir
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  FastFlood Engine
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Pemodelan Genangan Spasial & Estimasi Kerusakan Berbasis SFFS 2D
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Location Search & Preset Quick Chips */}
        <div className="flex-1 max-w-md hidden md:flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari kota, kabupaten, atau sungai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 pl-8 text-xs text-slate-200 placeholder:text-slate-500 font-medium outline-none focus:border-sky-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Right: Quick Tools */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isSidebarOpen
                ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Sembunyikan / Tampilkan Panel Kontrol"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{isSidebarOpen ? 'Tutup Panel' : 'Buka Panel'}</span>
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

      {/* 2. MAIN WORKSPACE: MAP CANVAS + COLLAPSIBLE CONTROL PANEL */}
      <div className="flex-1 relative w-full h-[calc(100vh-56px)] overflow-hidden flex">
        {/* Left Side: Simulation Control Panel */}
        <aside
          className={`h-full transition-all duration-300 z-20 shrink-0 ${
            isSidebarOpen ? 'w-80 sm:w-96' : 'w-0'
          } overflow-hidden`}
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
            />
          </div>
        </aside>

        {/* Right Side / Background: Leaflet Map */}
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
      </div>
    </div>
  );
}
