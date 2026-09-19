'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { InspectionPoint, RegionPreset, SimulationResults } from './SimulasiTypes';
import { Play, Pause, RotateCcw, Layers, Gauge, MapPin } from 'lucide-react';

interface Props {
  region: RegionPreset;
  geoJsonData: GeoJSON.FeatureCollection | null;
  results: SimulationResults | null;
  currentTimelineIndex: number;
  onTimelineChange: (index: number) => void;
  inspectionPoint: InspectionPoint | null;
  onMapClick: (lat: number, lng: number) => void;
  basemapId: string;
  onBasemapChange: (id: string) => void;
}

const BASEMAP_TILES: Record<string, { url: string; attr: string; name: string }> = {
  satellite: {
    name: 'Citra Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri, Maxar',
  },
  topo: {
    name: 'Topografi',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri, USGS',
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '© OpenStreetMap contributors',
  },
  dark: {
    name: 'Dark Canvas',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '© CARTO, OpenStreetMap',
  },
};

export default function SimulasiLeafletMap({
  region,
  geoJsonData,
  results,
  currentTimelineIndex,
  onTimelineChange,
  inspectionPoint,
  onMapClick,
  basemapId,
  onBasemapChange,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const floodLayerRef = useRef<L.GeoJSON | null>(null);
  const inspectMarkerRef = useRef<L.Marker | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [region.lat, region.lng],
      zoom: region.zoom,
      zoomControl: false,
    });

    // Custom Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const baseCfg = BASEMAP_TILES[basemapId] || BASEMAP_TILES.satellite;
    const tileLayer = L.tileLayer(baseCfg.url, {
      attribution: baseCfg.attr,
      maxZoom: 19,
    }).addTo(map);
    baseTileLayerRef.current = tileLayer;

    // Click handler for inspecting elevation & water depth
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Fly to region when preset changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([region.lat, region.lng], region.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [region]);

  // 3. Update Basemap
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const baseCfg = BASEMAP_TILES[basemapId] || BASEMAP_TILES.satellite;
    if (baseTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
    }
    const newLayer = L.tileLayer(baseCfg.url, {
      attribution: baseCfg.attr,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
    baseTileLayerRef.current = newLayer;

    // Bring flood layer to front if exists
    if (floodLayerRef.current) {
      floodLayerRef.current.bringToFront();
    }
  }, [basemapId]);

  // 4. Render Flood Inundation Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (floodLayerRef.current) {
      mapInstanceRef.current.removeLayer(floodLayerRef.current);
      floodLayerRef.current = null;
    }

    if (geoJsonData && geoJsonData.features.length > 0) {
      const geoLayer = L.geoJSON(geoJsonData, {
        style: (feature) => {
          const p = feature?.properties || {};
          return {
            fillColor: p.fillColor || '#0284c7',
            fillOpacity: p.fillOpacity || 0.65,
            color: p.fillColor || '#0284c7',
            weight: 0.5,
            opacity: 0.8,
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          layer.bindTooltip(
            `Kedalaman: <b>${p.waterDepth} m</b><br>Elevasi: ${p.elevation} m dpl<br>Status: <b>${p.hazardLevel}</b>`,
            { sticky: true, className: 'simulasi-tooltip' }
          );
        },
      });

      geoLayer.addTo(mapInstanceRef.current);
      floodLayerRef.current = geoLayer;
    }
  }, [geoJsonData]);

  // 5. Render Inspection Pin
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (inspectMarkerRef.current) {
      mapInstanceRef.current.removeLayer(inspectMarkerRef.current);
      inspectMarkerRef.current = null;
    }

    if (inspectionPoint) {
      const customIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="background:#0a1e36; color:#fff; padding:2px 6px; border-radius:6px; font-size:10px; font-weight:800; white-space:nowrap; border:1px solid #38bdf8; box-shadow:0 2px 6px rgba(0,0,0,0.5); transform:translateY(-4px);">
              🌊 ${inspectionPoint.waterDepth} m
            </div>
            <div style="width:14px; height:14px; border-radius:50%; background:#ef4444; border:3px solid #ffffff; box-shadow:0 0 10px rgba(239,68,68,0.8);" class="animate-ping"></div>
          </div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 30],
      });

      const marker = L.marker([inspectionPoint.lat, inspectionPoint.lng], { icon: customIcon }).addTo(
        mapInstanceRef.current
      );
      inspectMarkerRef.current = marker;
    }
  }, [inspectionPoint]);

  // 6. Timeline Playback loop
  useEffect(() => {
    if (!isPlaying || !results) return;

    const interval = setInterval(() => {
      onTimelineChange((currentTimelineIndex + 1) % results.timelineSteps.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying, currentTimelineIndex, results, onTimelineChange]);

  const currentStep = results?.timelineSteps[currentTimelineIndex];

  return (
    <div className="relative w-full h-full overflow-hidden font-sans">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-950" />

      {/* FLOATING TOP-RIGHT: Basemap & Inspection Stats Bar */}
      <div className="absolute top-4 right-14 z-[400] flex items-center gap-2">
        {/* Basemap Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowBasemapMenu(!showBasemapMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-lg hover:scale-105 transition-all cursor-pointer"
            title="Pilih Peta Dasar"
          >
            <Layers className="w-4 h-4 text-sky-500" />
            <span className="hidden sm:inline">{BASEMAP_TILES[basemapId]?.name || 'Basemap'}</span>
          </button>

          {showBasemapMenu && (
            <div className="absolute top-11 right-0 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50">
              {Object.entries(BASEMAP_TILES).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => {
                    onBasemapChange(key);
                    setShowBasemapMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    basemapId === key
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{item.name}</span>
                  {basemapId === key && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING BOTTOM-LEFT: FastFlood Depth Color Legend */}
      <div className="absolute bottom-24 left-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xl max-w-xs text-xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
          <span className="font-extrabold text-[#0a1e36] dark:text-white flex items-center gap-1.5 text-[11px]">
            <span>🌊</span>
            <span>Kedalaman Genangan (FastFlood)</span>
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
            SFFS 2D
          </span>
        </div>
        <div className="space-y-1.5 text-[10.5px]">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#38bdf8] shrink-0 border border-black/10" />
            <span className="text-slate-700 dark:text-slate-300">0.08 - 0.30 m · Genangan Rendah</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#0284c7] shrink-0 border border-black/10" />
            <span className="text-slate-700 dark:text-slate-300">0.30 - 0.80 m · Genangan Sedang (Mogok)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#1d4ed8] shrink-0 border border-black/10" />
            <span className="text-slate-700 dark:text-slate-300">0.80 - 1.50 m · Bahaya Tinggi (Lantai 1)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#1e1b4b] shrink-0 border border-black/10" />
            <span className="text-slate-700 dark:text-slate-300">&gt; 1.50 m · Bahaya Ekstrem (Evakuasi)</span>
          </div>
        </div>
      </div>

      {/* FLOATING INSPECTION CARD (When user clicks anywhere on map) */}
      {inspectionPoint && (
        <div className="absolute top-4 left-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xl max-w-xs w-72 text-xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <span className="font-extrabold text-[#0a1e36] dark:text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Titik Inspeksi Spasial</span>
            </span>
            <span
              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                inspectionPoint.hazardLevel === 'Ekstrem'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : inspectionPoint.hazardLevel === 'Tinggi'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : inspectionPoint.hazardLevel === 'Sedang'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {inspectionPoint.hazardLevel}
            </span>
          </div>

          <table className="w-full text-[11px] space-y-1">
            <tbody>
              <tr>
                <td className="text-slate-500 py-0.5">Kedalaman Air:</td>
                <td className="font-extrabold text-sky-600 dark:text-sky-400 text-right">
                  {inspectionPoint.waterDepth} m
                </td>
              </tr>
              <tr>
                <td className="text-slate-500 py-0.5">Elevasi Tanah (DEM):</td>
                <td className="font-bold text-slate-800 dark:text-slate-200 text-right">
                  {inspectionPoint.elevation} m dpl
                </td>
              </tr>
              <tr>
                <td className="text-slate-500 py-0.5">Muka Air Total (WSE):</td>
                <td className="font-bold text-slate-800 dark:text-slate-200 text-right">
                  {inspectionPoint.waterElevation} m dpl
                </td>
              </tr>
              <tr>
                <td className="text-slate-500 py-0.5">Kecepatan Arus:</td>
                <td className="font-bold text-slate-800 dark:text-slate-200 text-right">
                  {inspectionPoint.velocity} m/s
                </td>
              </tr>
              <tr>
                <td className="text-slate-500 py-0.5">Koordinat:</td>
                <td className="font-mono text-[10px] text-slate-600 dark:text-slate-400 text-right">
                  {inspectionPoint.lat.toFixed(4)}, {inspectionPoint.lng.toFixed(4)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-[9.5px] text-slate-400 italic text-center pt-1 border-t border-slate-100 dark:border-slate-800">
            Klik lokasi lain di peta untuk memeriksa elevasi dan kedalaman air.
          </p>
        </div>
      )}

      {/* FLOATING BOTTOM: Interactive FastFlood Timeline Scrubber Bar */}
      {results && results.timelineSteps.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] w-[94%] max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                  isPlaying
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-[#1f8080] hover:bg-[#1f8080]/90 text-white shadow-md hover:scale-105'
                }`}
                title={isPlaying ? 'Jeda Simulasi' : 'Putar Animasi Genangan'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  onTimelineChange(0);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                title="Reset ke Jam 0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl">
                <Gauge className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-xs font-extrabold text-[#0a1e36] dark:text-white">
                  {currentStep?.label || '00:00'}
                </span>
              </div>
            </div>

            {/* Quick KPI in timeline */}
            <div className="flex items-center gap-3 text-[11px]">
              <div>
                <span className="text-slate-400">Luas: </span>
                <span className="font-extrabold text-sky-600 dark:text-sky-400">
                  {currentStep?.totalAreaHa.toLocaleString('id-ID')} Ha
                </span>
              </div>
              <div className="hidden sm:inline">
                <span className="text-slate-400">Rerata: </span>
                <span className="font-extrabold text-sky-600 dark:text-sky-400">
                  {currentStep?.avgDepth} m
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Step Buttons / Slider */}
          <div className="flex items-center gap-1.5 w-full">
            {results.timelineSteps.map((step, idx) => {
              const isActive = currentTimelineIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setIsPlaying(false);
                    onTimelineChange(idx);
                  }}
                  className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-extrabold transition-all border text-center ${
                    isActive
                      ? 'bg-sky-500 text-white border-sky-400 shadow-sm scale-102'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {step.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
