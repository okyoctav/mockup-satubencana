'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RotateCcw, Flame } from 'lucide-react';
import { getKabupatenCoord } from '@/data/provinceCoordinates';

export interface HotspotItem {
  provinsi: string;
  kabupaten: string;
  sumber: string;
  confidence: string;
  counter: number;
}

interface SipongiHotspotMapProps {
  hotspots: HotspotItem[];
  selectedKabupaten?: string | null;
  onSelectKabupaten?: (kab: string) => void;
  timeframe: '24' | '48';
}

export default function SipongiHotspotMap({
  hotspots,
  selectedKabupaten,
  onSelectKabupaten,
  timeframe,
}: SipongiHotspotMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const [basemapType, setBasemapType] = useState<'dark' | 'streets' | 'satellite'>('dark');

  // Aggregated hotspots by kabupaten
  const aggregatedByKab = useMemo(() => {
    const map: Record<string, {
      provinsi: string;
      kabupaten: string;
      totalHotspots: number;
      sources: Record<string, number>;
      confidences: Record<string, number>;
    }> = {};

    hotspots.forEach((h) => {
      const kab = (h.kabupaten || '').trim().toUpperCase();
      if (!kab) return;
      if (!map[kab]) {
        map[kab] = {
          provinsi: h.provinsi || '-',
          kabupaten: h.kabupaten,
          totalHotspots: 0,
          sources: {},
          confidences: {},
        };
      }
      map[kab].totalHotspots += (h.counter || 0);
      map[kab].sources[h.sumber] = (map[kab].sources[h.sumber] || 0) + (h.counter || 0);
      map[kab].confidences[h.confidence] = (map[kab].confidences[h.confidence] || 0) + (h.counter || 0);
    });

    return Object.values(map).sort((a, b) => b.totalHotspots - a.totalHotspots);
  }, [hotspots]);

  const maxCount = useMemo(() => {
    return Math.max(...aggregatedByKab.map((k) => k.totalHotspots), 1);
  }, [aggregatedByKab]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-2.5, 118.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    baseTileRef.current = tile;
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Basemap
  useEffect(() => {
    if (!mapRef.current || !baseTileRef.current) return;
    mapRef.current.removeLayer(baseTileRef.current);

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    if (basemapType === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (basemapType === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    baseTileRef.current = L.tileLayer(url, { maxZoom: 19, subdomains: 'abcd' }).addTo(mapRef.current);
  }, [basemapType]);

  // Render Hotspot Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerGroupRef.current) return;
    markersLayerGroupRef.current.clearLayers();

    aggregatedByKab.forEach((item, idx) => {
      // Find coordinates
      const coord = getKabupatenCoord(item.provinsi, item.kabupaten, idx, aggregatedByKab.length);

      if (!coord) return;

      const isSelected = selectedKabupaten && selectedKabupaten.toLowerCase() === item.kabupaten.toLowerCase();

      // Radius between 6 and 24 based on count
      const ratio = item.totalHotspots / maxCount;
      const radius = isSelected ? 22 : Math.max(7, Math.min(24, Math.round(7 + ratio * 17)));

      // Color based on intensity
      let fillColor = '#f57f17'; // Yellow-Orange
      let strokeColor = '#ffb300';
      if (item.totalHotspots >= 50) {
        fillColor = '#b71c1c'; // Deep Red
        strokeColor = '#ff1744';
      } else if (item.totalHotspots >= 15) {
        fillColor = '#e65100'; // Dark Orange
        strokeColor = '#ff6d00';
      }

      const circle = L.circleMarker([coord.lat, coord.lng], {
        radius,
        fillColor,
        color: isSelected ? '#ffffff' : strokeColor,
        weight: isSelected ? 3 : 1.5,
        opacity: 0.95,
        fillOpacity: isSelected ? 0.9 : 0.75,
      });

      // Tooltip
      circle.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; padding: 2px 4px;">
          <div style="font-weight: 800; color: #ff5722;">🔥 ${item.kabupaten}</div>
          <div style="font-size: 10px; color: #94a3b8;">${item.provinsi}</div>
          <div style="font-size: 11px; font-weight: 700; margin-top: 2px;">
            <span style="color: #ef4444;">${item.totalHotspots}</span> Titik Panas
          </div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -radius],
        className: 'custom-leaflet-tooltip'
      });

      // Popup
      const sourcesText = Object.entries(item.sources)
        .map(([k, v]) => `<span style="background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 4px; font-size: 9.5px;">${k}: ${v}</span>`)
        .join(' ');

      circle.bindPopup(`
        <div style="font-family: inherit; min-width: 180px; padding: 4px; font-size: 11px; color: #1e293b;">
          <div style="font-weight: 900; font-size: 13px; color: #c62828; display: flex; align-items: center; gap: 4px;">
            <span>🔥 ${item.kabupaten}</span>
          </div>
          <div style="font-size: 10.5px; color: #64748b; margin-bottom: 6px;">${item.provinsi}</div>
          <div style="padding: 6px 8px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; margin-bottom: 6px;">
            <div style="font-size: 10px; color: #e11d48; font-weight: 700;">TOTAL TITIK PANAS (${timeframe} JAM)</div>
            <div style="font-size: 16px; font-weight: 900; color: #9f1239;">${item.totalHotspots} Titik</div>
          </div>
          <div style="font-size: 10px; color: #475569; margin-bottom: 4px;"><strong>Sensor Satelit:</strong></div>
          <div style="display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 6px;">
            ${sourcesText}
          </div>
        </div>
      `);

      circle.on('click', () => {
        if (onSelectKabupaten) {
          onSelectKabupaten(item.kabupaten);
        }
      });

      circle.addTo(markersLayerGroupRef.current!);
    });
  }, [aggregatedByKab, maxCount, selectedKabupaten, onSelectKabupaten, timeframe]);

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([-2.5, 118.0], 5);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden shadow-inner border border-slate-700/40">
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />

      {/* Floating Controls Top Left */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 text-white shadow-xl">
        <div className="flex items-center gap-1.5 text-[10.5px] font-black text-amber-400 uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          <span>Sebaran Hotspot {timeframe} Jam</span>
        </div>
        <div className="text-[10px] text-slate-300">
          Total: <strong className="text-white">{aggregatedByKab.reduce((a, b) => a + b.totalHotspots, 0)}</strong> titik di <strong className="text-white">{aggregatedByKab.length}</strong> kab/kota
        </div>
      </div>

      {/* Floating Controls Top Right: Basemap Selector */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl">
        <button
          onClick={() => setBasemapType('dark')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            basemapType === 'dark' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          Gelap
        </button>
        <button
          onClick={() => setBasemapType('satellite')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            basemapType === 'satellite' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          Satelit
        </button>
        <button
          onClick={() => setBasemapType('streets')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            basemapType === 'streets' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          Terang
        </button>
        <button
          onClick={handleResetView}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset Sudut Pandang Nasional"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend Bottom Left */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 text-white text-[10px] space-y-1 shadow-lg">
        <div className="font-bold text-[9.5px] uppercase tracking-wider text-slate-400">Intensitas Titik Panas</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f57f17]" />
            <span>&lt; 15</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e65100]" />
            <span>15 - 49</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b71c1c]" />
            <span>≥ 50</span>
          </div>
        </div>
      </div>
    </div>
  );
}
