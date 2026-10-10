'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InspectionPoint, RegionPreset, SimulationResults } from './SimulasiTypes';
import { Play, Pause, RotateCcw, Layers, Gauge, MapPin, AlertTriangle, Info, X, ShieldAlert, ArrowRight } from 'lucide-react';

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

const BASEMAP_TILES: Record<string, { url: string; attr: string; name: string; maxNativeZoom?: number }> = {
  satellite: {
    name: 'Citra Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri, Maxar',
    maxNativeZoom: 18,
  },
  topo: {
    name: 'Topografi',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri, USGS',
    maxNativeZoom: 18,
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '© OpenStreetMap contributors',
    maxNativeZoom: 19,
  },
  dark: {
    name: 'Dark Canvas',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '© CARTO, OpenStreetMap',
    maxNativeZoom: 19,
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
  const currentBasemapIdRef = useRef<string>(basemapId);
  const floodLayerRef = useRef<L.GeoJSON | null>(null);
  const dasLayerRef = useRef<L.GeoJSON | null>(null);
  const riverLayerRef = useRef<L.GeoJSON | null>(null);
  const riverMarkersRef = useRef<L.LayerGroup | null>(null);
  const inspectMarkerRef = useRef<L.Marker | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [showDasBoundary, setShowDasBoundary] = useState(true);
  const [showRiverLine, setShowRiverLine] = useState(true);
  const [showInundationGrid, setShowInundationGrid] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

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
      maxNativeZoom: baseCfg.maxNativeZoom ?? 18,
      keepBuffer: 6,
      updateWhenIdle: false,
      updateWhenZooming: false,
    }).addTo(map);
    baseTileLayerRef.current = tileLayer;
    currentBasemapIdRef.current = basemapId;

    // Click handler for inspecting elevation & water depth
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    // Handle container resize (e.g. sidebar toggle, panel toggle, window resize)
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ debounceMoveend: true });
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Delayed invalidations to ensure proper rendering after layout shifts
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    const t3 = setTimeout(() => map.invalidateSize(), 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      resizeObserver.disconnect();
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
    if (currentBasemapIdRef.current === basemapId && baseTileLayerRef.current) return;
    currentBasemapIdRef.current = basemapId;

    const baseCfg = BASEMAP_TILES[basemapId] || BASEMAP_TILES.satellite;
    if (baseTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
    }
    const newLayer = L.tileLayer(baseCfg.url, {
      attribution: baseCfg.attr,
      maxZoom: 19,
      maxNativeZoom: baseCfg.maxNativeZoom ?? 18,
      keepBuffer: 6,
      updateWhenIdle: false,
      updateWhenZooming: false,
    }).addTo(mapInstanceRef.current);
    baseTileLayerRef.current = newLayer;

    // Bring flood layer to front if exists
    if (floodLayerRef.current) {
      floodLayerRef.current.bringToFront();
    }
  }, [basemapId]);

  // 3a. Render Batas DAS Girian Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (dasLayerRef.current) {
      mapInstanceRef.current.removeLayer(dasLayerRef.current);
      dasLayerRef.current = null;
    }

    if (!showDasBoundary) return;

    const dasUrl = region.dasGeoJsonUrl || (region.id === 'girian_bitung' ? '/modeling/das_girian_bitung_wgs84.json' : null);
    if (dasUrl) {
      fetch(dasUrl)
        .then((res) => res.json())
        .then((dasData) => {
          if (!mapInstanceRef.current) return;
          const dasLayer = L.geoJSON(dasData, {
            style: {
              color: '#059669',
              weight: 2,
              dashArray: '6, 6',
              fillColor: '#10b981',
              fillOpacity: 0.05,
            },
            onEachFeature: (_, layer) => {
              layer.bindTooltip(
                '<div style="font-size:11px;"><b>Batas DAS Girian</b><br>Wilayah: Kota Bitung<br>Luas: ~10.910 Ha (BPDAS Tondano)</div>',
                { sticky: true, className: 'simulasi-tooltip' }
              );
            },
          }).addTo(mapInstanceRef.current);
          dasLayerRef.current = dasLayer;
        })
        .catch((err) => console.warn('Could not load DAS GeoJSON:', err));
    }
  }, [region.id, region.dasGeoJsonUrl, showDasBoundary]);

  // 3b. Render Alur Sungai Girian & Titik Hulu/Muara
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (riverLayerRef.current) {
      mapInstanceRef.current.removeLayer(riverLayerRef.current);
      riverLayerRef.current = null;
    }
    if (riverMarkersRef.current) {
      mapInstanceRef.current.removeLayer(riverMarkersRef.current);
      riverMarkersRef.current = null;
    }

    if (!showRiverLine) return;

    const riverUrl = region.riverGeoJsonUrl || (region.id === 'girian_bitung' ? '/modeling/sungai_girian_kota_bitung_Fe1.json' : null);
    if (riverUrl) {
      fetch(riverUrl)
        .then((res) => res.json())
        .then((riverData) => {
          if (!mapInstanceRef.current) return;
          const riverLayer = L.geoJSON(riverData, {
            style: {
              color: '#0284c7',
              weight: 3.5,
              opacity: 0.95,
            },
            onEachFeature: (_, layer) => {
              layer.bindTooltip(
                '<div style="font-size:11px;"><b>Alur Sungai Girian</b><br>Panjang: ~14.7 km<br>Sumber: BAKOSURTANAL<br>Hulu: 480m dpl → Muara: 0m dpl</div>',
                { sticky: true, className: 'simulasi-tooltip' }
              );
            },
          }).addTo(mapInstanceRef.current);
          riverLayerRef.current = riverLayer;

          const markerGroup = L.layerGroup();

          // Hulu Marker
          const huluIcon = L.divIcon({
            className: '',
            html: `
              <div style="background:#0f172a; color:#38bdf8; padding:3px 7px; border-radius:8px; font-size:10px; font-weight:800; border:1px solid #38bdf8; box-shadow:0 2px 8px rgba(0,0,0,0.5); white-space:nowrap; display:flex; align-items:center; gap:4px;">
                <span>⛰️</span>
                <span>Hulu S. Girian (480m)</span>
              </div>
            `,
            iconAnchor: [65, 14],
          });
          L.marker([1.527608, 125.048347], { icon: huluIcon })
            .bindPopup('<b>Hulu Sungai Girian</b><br>Elevasi: 480 m dpl<br>Puncak DAS Pegunungan Bitung')
            .addTo(markerGroup);

          // Muara Marker
          const muaraIcon = L.divIcon({
            className: '',
            html: `
              <div style="background:#0f172a; color:#34d399; padding:3px 7px; border-radius:8px; font-size:10px; font-weight:800; border:1px solid #34d399; box-shadow:0 2px 8px rgba(0,0,0,0.5); white-space:nowrap; display:flex; align-items:center; gap:4px;">
                <span>🌊</span>
                <span>Muara Girian (0m)</span>
              </div>
            `,
            iconAnchor: [55, 14],
          });
          L.marker([1.429887, 125.129408], { icon: muaraIcon })
            .bindPopup('<b>Muara Sungai Girian</b><br>Elevasi: 0 m dpl<br>Outlet ke Selat Lembeh / Teluk Bitung')
            .addTo(markerGroup);

          markerGroup.addTo(mapInstanceRef.current);
          riverMarkersRef.current = markerGroup;
        })
        .catch((err) => console.warn('Could not load River GeoJSON:', err));
    }
  }, [region.id, region.riverGeoJsonUrl, showRiverLine]);

  // 4. Render Flood Inundation Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (floodLayerRef.current) {
      mapInstanceRef.current.removeLayer(floodLayerRef.current);
      floodLayerRef.current = null;
    }

    if (showInundationGrid && geoJsonData && geoJsonData.features.length > 0) {
      const canvasRenderer = L.canvas({ padding: 0.5 });
      const geoLayer = L.geoJSON(geoJsonData, {
        style: (feature) => {
          const p = feature?.properties || {};
          return {
            renderer: canvasRenderer,
            fillColor: p.fillColor || '#0284c7',
            fillOpacity: p.fillOpacity || 0.65,
            color: p.fillColor || '#0284c7',
            weight: p.isRiverChannel ? 0.8 : 0.3,
            opacity: 0.85,
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const channelBadge = p.isRiverChannel
            ? '<span style="color:#38bdf8; font-weight:800;">🌊 Alur Sungai Utama</span>'
            : '<span style="color:#fbbf24; font-weight:800;">💧 Bantaran Meluap</span>';
          layer.bindTooltip(
            `${channelBadge}<br>Kedalaman: <b>${p.waterDepth} m</b><br>Elevasi: ${p.elevation} m dpl<br>Arus: ${p.velocity} m/s<br>Bahaya: <b>${p.hazardLevel}</b>`,
            { sticky: true, className: 'simulasi-tooltip' }
          );
        },
      });

      geoLayer.addTo(mapInstanceRef.current);
      floodLayerRef.current = geoLayer;
    }
  }, [geoJsonData, showInundationGrid]);

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
    }, 1600);

    return () => clearInterval(interval);
  }, [isPlaying, currentTimelineIndex, results, onTimelineChange]);

  const currentStep = results?.timelineSteps[currentTimelineIndex];

  return (
    <div className="relative w-full h-full overflow-hidden font-sans">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-100 dark:bg-slate-800" />

      {/* FLOATING TOP-RIGHT: Basemap, Kesimpulan Button & Controls */}
      <div className="absolute top-4 right-14 z-[400] flex items-center gap-2">
        {/* Tombol Kesimpulan Simulasi (Untuk Orang Awam) */}
        <button
          onClick={() => setShowSummaryModal(true)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold shadow-md transition-all cursor-pointer ${
            results?.hazardCategory === 'Ekstrem'
              ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400 animate-pulse'
              : results?.hazardCategory === 'Tinggi'
              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400'
              : 'bg-[#1f8080] hover:bg-[#155a5a] text-white border-teal-600'
          }`}
          title="Buka Kesimpulan Hasil Simulasi untuk Orang Awam"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>📋 Kesimpulan Simulasi</span>
          {results && (
            <span className="hidden md:inline text-[10px] px-1.5 py-0.2 rounded-md bg-[#0a1e36] text-white font-mono">
              Status {results.hazardCategory}
            </span>
          )}
        </button>

        {/* Basemap Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowBasemapMenu(!showBasemapMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
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

      {/* FLOATING BOTTOM-LEFT: FastFlood Depth Color Legend (Sinkron dengan Warna Grid) */}
      <div className="absolute bottom-24 left-4 z-[400] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-lg max-w-[280px] text-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
          <span className="font-extrabold text-[#0a1e36] dark:text-white flex items-center gap-1.5 text-[11px]">
            <span>🌊</span>
            <span>Legenda Warna Genangan</span>
          </span>
          <button
            onClick={() => setShowSummaryModal(true)}
            className="text-[9.5px] font-bold px-2 py-0.5 rounded-lg bg-sky-100 hover:bg-sky-200 dark:bg-sky-900 dark:hover:bg-sky-800 text-sky-800 dark:text-sky-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="Buka Kesimpulan & Panduan Awam"
          >
            <Info className="w-3 h-3" />
            <span>Info Awam</span>
          </button>
        </div>

        {/* 5 Swatches Warna Sesuai Realita Grid Peta */}
        <div className="space-y-1.5 text-[10.5px]">
          {/* Merah - Ekstrem */}
          <div className="flex items-start gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#ef4444] shrink-0 mt-0.5 border border-red-700 shadow-2xs" />
            <div className="leading-tight">
              <span className="font-bold text-red-600 dark:text-red-400">&gt; 2.50 m · Ekstrem</span>
              <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Rumah tenggelam total, arus deras</span>
            </div>
          </div>

          {/* Orange - Tinggi */}
          <div className="flex items-start gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#f97316] shrink-0 mt-0.5 border border-orange-700 shadow-2xs" />
            <div className="leading-tight">
              <span className="font-bold text-orange-600 dark:text-orange-400">1.50 - 2.50 m · Tinggi</span>
              <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Seleher dewasa, mobil hanyut</span>
            </div>
          </div>

          {/* Kuning - Sedang */}
          <div className="flex items-start gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#eab308] shrink-0 mt-0.5 border border-amber-700 shadow-2xs" />
            <div className="leading-tight">
              <span className="font-bold text-amber-600 dark:text-amber-400">0.75 - 1.50 m · Sedang</span>
              <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Sepinggang dewasa, air masuk rumah</span>
            </div>
          </div>

          {/* Biru Muda - Rendah */}
          <div className="flex items-start gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#38bdf8] shrink-0 mt-0.5 border border-sky-700 shadow-2xs" />
            <div className="leading-tight">
              <span className="font-bold text-sky-600 dark:text-sky-400">&lt; 0.75 m · Rendah</span>
              <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Selutut / semata kaki, jalan tergenang</span>
            </div>
          </div>

          {/* Biru Tua - Alur Sungai */}
          <div className="flex items-start gap-2 border-t border-slate-100 dark:border-slate-800 pt-1">
            <span className="w-3.5 h-3.5 rounded bg-[#0284c7] shrink-0 mt-0.5 border border-sky-800 shadow-2xs" />
            <div className="leading-tight">
              <span className="font-bold text-sky-800 dark:text-sky-300">Alur Palung Sungai Girian</span>
              <span className="text-slate-500 dark:text-slate-400 block text-[9.5px]">Palung air normal mengalir ke laut</span>
            </div>
          </div>
        </div>

        {/* Tombol Buka Kesimpulan Lengkap */}
        <button
          onClick={() => setShowSummaryModal(true)}
          className="w-full mt-1 py-1.5 px-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-xl text-[10.5px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>📋 Kesimpulan Informasi Simulasi</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* FLOATING TOP-LEFT: GIS Layer Visibility Toggles (DAS, Sungai, Genangan) & Inspection Point */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 max-w-xs">
        {/* Layer Visibility Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-md text-xs space-y-2">
          <div className="font-extrabold text-[#0a1e36] dark:text-white text-[11px] flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <span>🗺️</span>
              <span>Layer Geospasial Modeling</span>
            </span>
            {region.id === 'girian_bitung' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Data Riil
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 text-[11px]">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900">
              <input
                type="checkbox"
                checked={showDasBoundary}
                onChange={(e) => setShowDasBoundary(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm border border-emerald-500 bg-emerald-500" />
                <span>Batas DAS Girian (10.910 Ha)</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900">
              <input
                type="checkbox"
                checked={showRiverLine}
                onChange={(e) => setShowRiverLine(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-sky-600 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#0284c7]" />
                <span>Alur Sungai Girian (130 Titik)</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900">
              <input
                type="checkbox"
                checked={showInundationGrid}
                onChange={(e) => setShowInundationGrid(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500" />
                <span>Genangan 2D FastFlood (DEM 30m)</span>
              </span>
            </label>
          </div>
        </div>

        {/* FLOATING INSPECTION CARD (When user clicks anywhere on map) */}
        {inspectionPoint && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-md w-full text-xs space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
      </div>

      {/* FLOATING BOTTOM: Interactive FastFlood Timeline Scrubber Bar */}
      {results && results.timelineSteps.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] w-[94%] max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-md flex flex-col gap-2">
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

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
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
      {/* MODAL / POPUP: Kesimpulan Informasi Hasil Simulasi untuk Orang Awam (Background Putih Tulisan Hitam) */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white border border-slate-300 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
            {/* Header Modal (Putih Tulisan Hitam) */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black leading-tight text-slate-900">
                    Kesimpulan Hasil Pemodelan Simulasi Banjir
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Studi Kasus Data Riil: DAS Girian – Kota Bitung, Sulawesi Utara
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content (Latar Abu-abu Sangat Muda agar Card Putih Berdiri Jelas) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs bg-slate-50">
              {/* 1. Status Utama Bencana Banner (Card Putih Tulisan Hitam) */}
              <div className="p-4 rounded-2xl bg-white border-2 border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-300">
                      Status Keseluruhan
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      Tingkat Bahaya: {results?.hazardCategory || 'Sedang'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-800 font-medium">
                    Banjir luapan Sungai Girian mencapai puncak genangan terluas pada{' '}
                    <b className="font-black text-slate-900">Pukul 08:00 WITA</b> dengan ketinggian air maksimal{' '}
                    <b className="font-black text-slate-900">{results?.maxDepth || 2.1} meter</b> di titik bantaran sungai terendah.
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-200 pt-2 sm:pt-0 shrink-0">
                  <span className="text-[10px] text-slate-600 font-bold">Luas Tergenang:</span>
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    {results?.floodedAreaHa.toLocaleString('id-ID') || 0} Hektar
                  </span>
                </div>
              </div>

              {/* 2. Cara Membaca Warna Grid Peta (Panduan Orang Awam - Card Putih Tulisan Hitam) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>🎨</span>
                    <span>Arti Warna Grid Bagi Keselamatan Warga (Cara Membaca Peta)</span>
                  </h3>
                  <span className="text-[10px] font-extrabold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Ketinggian Air &amp; Bahaya
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Swatch Merah (Card Putih Tulisan Hitam) */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-1.5 text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-[#ef4444] shrink-0 border border-red-700 shadow-2xs" />
                      <b className="text-slate-900 text-xs sm:text-[13px] font-black">
                        Merah: &gt; 2,5 Meter (Bahaya Ekstrem)
                      </b>
                    </div>
                    <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                      <b>Kondisi:</b> Air menenggelamkan rumah 1 lantai sampai ke plafon/atap. Arus air sangat kuat dan deras.<br />
                      <b>Tindakan:</b> <span className="font-black underline text-red-700">WAJIB EVAKUASI SEGERA!</span> Jangan bertahan di dalam rumah, segera menuju tempat tinggi sebelum jam 08:00.
                    </p>
                  </div>

                  {/* Swatch Orange (Card Putih Tulisan Hitam) */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-1.5 text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-[#f97316] shrink-0 border border-orange-700 shadow-2xs" />
                      <b className="text-slate-900 text-xs sm:text-[13px] font-black">
                        Orange: 1,5 - 2,5 Meter (Bahaya Tinggi)
                      </b>
                    </div>
                    <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                      <b>Kondisi:</b> Air setinggi dada hingga seleher orang dewasa. Kendaraan motor dan mobil terseret arus.<br />
                      <b>Tindakan:</b> Segera putus aliran listrik PLN, amankan anak-anak dan lansia ke titik kumpul evakuasi.
                    </p>
                  </div>

                  {/* Swatch Kuning (Card Putih Tulisan Hitam) */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-1.5 text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-[#eab308] shrink-0 border border-amber-700 shadow-2xs" />
                      <b className="text-slate-900 text-xs sm:text-[13px] font-black">
                        Kuning: 0,75 - 1,5 Meter (Bahaya Sedang)
                      </b>
                    </div>
                    <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                      <b>Kondisi:</b> Air setinggi pinggang. Air mulai masuk merendam seluruh ruangan rumah dan perabotan.<br />
                      <b>Tindakan:</b> Pindahkan barang berharga dan dokumen penting ke lantai atas atau meja tinggi.
                    </p>
                  </div>

                  {/* Swatch Biru Muda (Card Putih Tulisan Hitam) */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-1.5 text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-[#38bdf8] shrink-0 border border-sky-600 shadow-2xs" />
                      <b className="text-slate-900 text-xs sm:text-[13px] font-black">
                        Biru Muda: &lt; 0,75 Meter (Bahaya Rendah)
                      </b>
                    </div>
                    <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                      <b>Kondisi:</b> Genangan setinggi mata kaki hingga lutut. Halaman rumah dan jalan gang tergenang.<br />
                      <b>Tindakan:</b> Tetap waspada kenaikan air susulan, hindari melintasi jembatan sempit atau saluran air got.
                    </p>
                  </div>
                </div>

                {/* Swatch Alur Sungai (Card Putih Tulisan Hitam) */}
                <div className="p-3 rounded-xl bg-white border border-slate-300 flex items-center gap-2.5 text-[11px] shadow-xs text-slate-900">
                  <span className="w-4 h-4 rounded bg-[#0284c7] shrink-0 border border-sky-800 shadow-2xs" />
                  <span className="text-slate-800 font-medium">
                    <b className="text-slate-900">Garis Biru Tua:</b> Alur Palung Sungai Girian (130 titik koordinat) tempat air alami mengalir menuju muara laut Selat Lembeh.
                  </span>
                </div>
              </div>

              {/* 3. Wilayah Paling Rawan & Titik Aman Evakuasi (Card Putih Tulisan Hitam) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Wilayah Terdampak */}
                <div className="p-4 rounded-2xl bg-white border border-slate-300 space-y-2 shadow-xs text-slate-900">
                  <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                    <span>📍</span>
                    <span>Wilayah &amp; Pemukiman Paling Rawan</span>
                  </div>
                  <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                    Berdasarkan elevasi DEM SRTM 30m, kawasan paling rawan banjir luapan berada di dataran rendah bantaran sungai:
                  </p>
                  <ul className="list-disc pl-4 text-[11px] text-slate-800 space-y-1 font-medium">
                    <li><b className="text-slate-900">Kelurahan Girian Bawah:</b> Daerah hilir terendah (0–5 m dpl) dekat muara.</li>
                    <li><b className="text-slate-900">Kelurahan Wangurer Barat:</b> Bantaran sempit dengan risiko luapan cepat.</li>
                    <li><b className="text-slate-900">Kelurahan Girian Atas &amp; Girian Indah:</b> Pemukiman padat di dataran aluvial.</li>
                  </ul>
                </div>

                {/* Titik Evakuasi Aman */}
                <div className="p-4 rounded-2xl bg-white border border-slate-300 space-y-2 shadow-xs text-slate-900">
                  <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                    <span>🏃</span>
                    <span>Rekomendasi Jalur &amp; Titik Aman Evakuasi</span>
                  </div>
                  <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                    Berdasarkan kontur topografi DEM 30m, area aman bebas genangan banjir adalah:
                  </p>
                  <ul className="list-disc pl-4 text-[11px] text-slate-800 space-y-1 font-medium">
                    <li><b className="text-slate-900">Zona Perbukitan Sisi Barat Laut DAS Girian:</b> Daerah berketinggian tanah <b className="text-slate-900">&gt; 35 meter dpl</b>.</li>
                    <li><b className="text-slate-900">Gedung Bertingkat / Posko Sekolah:</b> Bangunan permanen di luar radius genangan kuning/merah.</li>
                    <li><b className="text-slate-900">Jalur Akses:</b> Hindari jalan poros Girian Bawah yang diproyeksikan tergenang air lebih dari 1 meter.</li>
                  </ul>
                </div>
              </div>

              {/* 4. Rekapitulasi Jiwa & Dampak Sosial (Card Putih Tulisan Hitam) */}
              {results && (
                <div className="p-4 rounded-2xl bg-white border border-slate-300 space-y-3 shadow-xs text-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <span>👥</span>
                      <span>Estimasi Jiwa &amp; Kelompok Rentan yang Wajib Didahulukan</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                      Basis Data SEPAKAT Bappenas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                      <span className="text-[10px] text-slate-600 block font-bold">Total Warga Terdampak</span>
                      <b className="text-sm sm:text-base font-black text-slate-900">
                        {results.affectedPopulation.toLocaleString('id-ID')}
                      </b>
                      <span className="text-[9px] text-slate-600 block font-semibold">Jiwa</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                      <span className="text-[10px] text-slate-600 block font-bold">Warga Lansia</span>
                      <b className="text-sm sm:text-base font-black text-slate-900">
                        {results.sepakatStats?.totalLansia.toLocaleString('id-ID') || Math.round(results.affectedPopulation * 0.11)}
                      </b>
                      <span className="text-[9px] text-slate-600 block font-semibold">Orang Tua (&gt; 60 thn)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                      <span className="text-[10px] text-slate-600 block font-bold">Balita &amp; Anak-Anak</span>
                      <b className="text-sm sm:text-base font-black text-slate-900">
                        {results.sepakatStats?.totalBalita.toLocaleString('id-ID') || Math.round(results.affectedPopulation * 0.08)}
                      </b>
                      <span className="text-[9px] text-slate-600 block font-semibold">Balita (&lt; 5 thn)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-300">
                      <span className="text-[10px] text-slate-600 block font-bold">Rumah Terendam</span>
                      <b className="text-sm sm:text-base font-black text-slate-900">
                        {results.affectedBuildings.toLocaleString('id-ID')}
                      </b>
                      <span className="text-[9px] text-slate-600 block font-semibold">Unit Rumah</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal (Putih Tulisan Hitam) */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 text-slate-900">
              <span className="text-[11px] text-slate-600 font-medium hidden sm:inline">
                Data modeling terintegrasi: DEM SRTM 30m, Alur Sungai Girian, &amp; Batas DAS Bitung.
              </span>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1f8080] hover:bg-[#155a5a] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Tutup &amp; Kembali ke Peta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
