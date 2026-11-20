'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RotateCcw, Flame, MapPinned } from 'lucide-react';
import {
  getProvinceView,
  resolveSipongiKabCoord,
  type CoordMatchQuality,
} from '@/lib/sipongiGeo';

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
  onSelectKabupaten?: (kab: string | null) => void;
  timeframe: '24' | '48';
  /** Provinsi aktif dari filter UI (`all` = nasional). */
  focusProvinsi?: string;
  /** Peta nama SIPONGI → id_mendagri untuk matching kode. */
  namaToKode?: Map<string, string>;
}

export default function SipongiHotspotMap({
  hotspots,
  selectedKabupaten,
  onSelectKabupaten,
  timeframe,
  focusProvinsi = 'all',
  namaToKode,
}: SipongiHotspotMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const markerMapRef = useRef<
    Record<string, { marker: L.CircleMarker; lat: number; lng: number }>
  >({});
  const lastFrameKeyRef = useRef<string>('');
  const [basemapType, setBasemapType] = useState<'dark' | 'streets' | 'satellite'>('dark');
  const [approxCount, setApproxCount] = useState(0);

  const aggregatedByKab = useMemo(() => {
    const map: Record<
      string,
      {
        provinsi: string;
        kabupaten: string;
        totalHotspots: number;
        sources: Record<string, number>;
        confidences: Record<string, number>;
      }
    > = {};

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
      map[kab].totalHotspots += h.counter || 0;
      map[kab].sources[h.sumber] = (map[kab].sources[h.sumber] || 0) + (h.counter || 0);
      map[kab].confidences[h.confidence] =
        (map[kab].confidences[h.confidence] || 0) + (h.counter || 0);
    });

    return Object.values(map).sort((a, b) => b.totalHotspots - a.totalHotspots);
  }, [hotspots]);

  const maxCount = useMemo(() => {
    return Math.max(...aggregatedByKab.map((k) => k.totalHotspots), 1);
  }, [aggregatedByKab]);

  const totalTitik = useMemo(
    () => aggregatedByKab.reduce((a, b) => a + b.totalHotspots, 0),
    [aggregatedByKab],
  );

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

    const tile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18 },
    ).addTo(map);

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

    let url =
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    let maxZoom = 18;
    if (basemapType === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
    } else if (basemapType === 'satellite') {
      url =
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
    }

    baseTileRef.current = L.tileLayer(url, { maxZoom, subdomains: 'abc' }).addTo(mapRef.current);
  }, [basemapType]);

  const qualityHint = (q: CoordMatchQuality) => {
    if (q === 'fallback') return 'Lokasi perkiraan (nama belum cocok master wilayah)';
    if (q === 'legacy') return 'Lokasi dari kamus koordinat lokal';
    if (q === 'kode') return 'Lokasi dari kode Kemendagri';
    return 'Lokasi dari master nama wilayah';
  };

  // Render Hotspot Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerGroupRef.current) return;
    markersLayerGroupRef.current.clearLayers();
    markerMapRef.current = {};

    let fallbacks = 0;

    aggregatedByKab.forEach((item, idx) => {
      const resolved = resolveSipongiKabCoord(item.provinsi, item.kabupaten, {
        indexHint: idx,
        totalHints: aggregatedByKab.length,
        namaToKode,
      });
      if (resolved.quality === 'fallback') fallbacks += 1;

      const isSelected =
        selectedKabupaten &&
        selectedKabupaten.toLowerCase() === item.kabupaten.toLowerCase();

      const ratio = item.totalHotspots / maxCount;
      const radius = isSelected ? 22 : Math.max(7, Math.min(24, Math.round(7 + ratio * 17)));

      let fillColor = '#f57f17';
      let strokeColor = '#ffb300';
      if (item.totalHotspots >= 50) {
        fillColor = '#b71c1c';
        strokeColor = '#ff1744';
      } else if (item.totalHotspots >= 15) {
        fillColor = '#e65100';
        strokeColor = '#ff6d00';
      }

      const circle = L.circleMarker([resolved.lat, resolved.lng], {
        radius,
        fillColor,
        color: isSelected ? '#ffffff' : strokeColor,
        weight: isSelected ? 3 : resolved.quality === 'fallback' ? 1 : 1.5,
        opacity: 0.95,
        fillOpacity: isSelected ? 0.9 : resolved.quality === 'fallback' ? 0.55 : 0.75,
        dashArray: resolved.quality === 'fallback' ? '4 3' : undefined,
      });

      circle.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px; padding: 2px 4px;">
          <div style="font-weight: 800; color: #ff5722;">🔥 ${item.kabupaten}</div>
          <div style="font-size: 10px; color: #94a3b8;">${item.provinsi}${resolved.kode ? ` · ${resolved.kode}` : ''}</div>
          <div style="font-size: 11px; font-weight: 700; margin-top: 2px;">
            <span style="color: #ef4444;">${item.totalHotspots}</span> Titik Panas
          </div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${qualityHint(resolved.quality)}</div>
        </div>
      `,
        {
          direction: 'top',
          offset: [0, -radius],
          className: 'custom-leaflet-tooltip',
        },
      );

      const sourcesText = Object.entries(item.sources)
        .map(
          ([k, v]) =>
            `<span style="background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 4px; font-size: 9.5px;">${k}: ${v}</span>`,
        )
        .join(' ');

      circle.bindPopup(`
        <div style="font-family: inherit; min-width: 180px; padding: 4px; font-size: 11px; color: #1e293b;">
          <div style="font-weight: 900; font-size: 13px; color: #c62828; display: flex; align-items: center; gap: 4px;">
            <span>🔥 ${item.kabupaten}</span>
          </div>
          <div style="font-size: 10.5px; color: #64748b; margin-bottom: 6px;">
            ${item.provinsi}${resolved.kode ? ` · kode ${resolved.kode}` : ''}
          </div>
          <div style="padding: 6px 8px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; margin-bottom: 6px;">
            <div style="font-size: 10px; color: #e11d48; font-weight: 700;">TOTAL TITIK PANAS (${timeframe} JAM)</div>
            <div style="font-size: 16px; font-weight: 900; color: #9f1239;">${item.totalHotspots} Titik</div>
          </div>
          <div style="font-size: 10px; color: #475569; margin-bottom: 4px;"><strong>Sensor Satelit:</strong></div>
          <div style="display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 6px;">
            ${sourcesText}
          </div>
          <div style="font-size: 9.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            ${qualityHint(resolved.quality)}
          </div>
        </div>
      `);

      circle.on('click', () => {
        onSelectKabupaten?.(item.kabupaten);
      });

      circle.addTo(markersLayerGroupRef.current!);
      markerMapRef.current[item.kabupaten.toUpperCase().trim()] = {
        marker: circle,
        lat: resolved.lat,
        lng: resolved.lng,
      };
    });

    setApproxCount(fallbacks);
  }, [aggregatedByKab, maxCount, selectedKabupaten, onSelectKabupaten, timeframe, namaToKode]);

  // Auto-zoom: kab terpilih > filter provinsi (fitBounds) > nasional
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedKabupaten) {
      const targetKey = selectedKabupaten.toUpperCase().trim();
      const entry = markerMapRef.current[targetKey];
      const frameKey = `kab:${targetKey}`;
      if (entry && lastFrameKeyRef.current !== frameKey) {
        lastFrameKeyRef.current = frameKey;
        map.flyTo([entry.lat, entry.lng], 9, { duration: 0.9 });
        window.setTimeout(() => {
          if (mapRef.current) entry.marker.openPopup();
        }, 650);
      }
      return;
    }

    const frameKey = `prov:${focusProvinsi}|n:${aggregatedByKab.length}|t:${totalTitik}`;
    if (lastFrameKeyRef.current === frameKey) return;
    lastFrameKeyRef.current = frameKey;

    if (focusProvinsi && focusProvinsi !== 'all' && aggregatedByKab.length > 0) {
      const bounds = L.latLngBounds([]);
      Object.values(markerMapRef.current).forEach((e) => bounds.extend([e.lat, e.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9, animate: true });
        return;
      }
    }

    if (focusProvinsi && focusProvinsi !== 'all') {
      const view = getProvinceView(focusProvinsi);
      map.flyTo([view.lat, view.lng], view.zoom, { duration: 0.9 });
      return;
    }

    map.flyTo([-2.5, 118.0], 5, { duration: 0.9 });
    map.closePopup();
  }, [selectedKabupaten, focusProvinsi, aggregatedByKab, totalTitik]);

  const handleResetView = () => {
    onSelectKabupaten?.(null);
    lastFrameKeyRef.current = '';
    const map = mapRef.current;
    if (!map) return;
    map.closePopup();
    if (focusProvinsi && focusProvinsi !== 'all') {
      if (aggregatedByKab.length > 0) {
        const bounds = L.latLngBounds([]);
        Object.values(markerMapRef.current).forEach((e) => bounds.extend([e.lat, e.lng]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9, animate: true });
          return;
        }
      }
      const view = getProvinceView(focusProvinsi);
      map.flyTo([view.lat, view.lng], view.zoom, { duration: 0.9 });
      return;
    }
    map.flyTo([-2.5, 118.0], 5, { duration: 0.9 });
  };

  const scopeLabel =
    focusProvinsi && focusProvinsi !== 'all' ? focusProvinsi : 'Nasional';

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden shadow-inner border border-slate-700/40">
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />

      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700 text-white shadow-xl max-w-[240px]">
        <div className="flex items-center gap-1.5 text-[10.5px] font-black text-amber-400 uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          <span>Hotspot {timeframe} Jam</span>
        </div>
        <div className="text-[10px] text-slate-300 leading-snug">
          <strong className="text-white">{totalTitik.toLocaleString('id-ID')}</strong> titik ·{' '}
          <strong className="text-white">{aggregatedByKab.length}</strong> kab/kota
        </div>
        <div className="inline-flex items-center gap-1 text-[9.5px] font-bold text-sky-300">
          <MapPinned className="w-3 h-3 shrink-0" />
          <span className="truncate">{scopeLabel}</span>
        </div>
        {approxCount > 0 && (
          <div className="text-[9px] text-amber-200/90 leading-snug border-t border-slate-700 pt-1">
            {approxCount} marker perkiraan (nama belum cocok master)
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl">
        <button
          type="button"
          onClick={() => setBasemapType('dark')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            basemapType === 'dark' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          Gelap
        </button>
        <button
          type="button"
          onClick={() => setBasemapType('satellite')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            basemapType === 'satellite'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Satelit
        </button>
        <button
          type="button"
          onClick={() => setBasemapType('streets')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
            basemapType === 'streets'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Terang
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={
            focusProvinsi && focusProvinsi !== 'all'
              ? 'Reset ke sudut pandang provinsi'
              : 'Reset sudut pandang nasional'
          }
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 text-white text-[10px] space-y-1 shadow-lg">
        <div className="font-bold text-[9.5px] uppercase tracking-wider text-slate-400">
          Intensitas Titik Panas
        </div>
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
