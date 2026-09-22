'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { PROVINCE_COORDINATES, getKabupatenCoord } from '@/data/provinceCoordinates';

import { KabupatenItem, DISASTER_THEMES } from './disasterConstants';
export type { KabupatenItem };
export { DISASTER_THEMES };

interface ProvinceKabupatenMapProps {
  provinsi: string;
  kabupatenStats: KabupatenItem[];
  selectedKabupaten?: string | null;
  onSelectKabupaten?: (kab: string) => void;
  activeFilterJenis?: string;
  onResetFilterJenis?: () => void;
}

export default function ProvinceKabupatenMap({
  provinsi,
  kabupatenStats,
  selectedKabupaten,
  onSelectKabupaten,
  activeFilterJenis = 'Semua',
  onResetFilterJenis
}: ProvinceKabupatenMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const wmsLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);

  const [showWms, setShowWms] = useState<boolean>(true);
  const [wmsOpacity, setWmsOpacity] = useState<number>(0.85);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);

  const isFiltered = Boolean(activeFilterJenis && activeFilterJenis !== 'Semua');
  const currentTheme = useMemo(() => {
    return DISASTER_THEMES[activeFilterJenis] || {
      main: '#00897b',
      light: 'rgba(0,137,123,0.15)',
      border: '#00897b',
      icon: '⚠️'
    };
  }, [activeFilterJenis]);

  const maxKejadian = useMemo(() => {
    return Math.max(...kabupatenStats.map(k => k.kejadian), 1);
  }, [kabupatenStats]);

  const minKejadian = useMemo(() => {
    return kabupatenStats.length > 0 ? Math.min(...kabupatenStats.map(k => k.kejadian)) : 0;
  }, [kabupatenStats]);

  // Normalize province name for lookup and coordinates
  const provUpper = (provinsi || '').toUpperCase().trim();
  const provCoord = PROVINCE_COORDINATES[provUpper] || { lat: -2.5, lng: 118.0, zoom: 5.5 };

  // 1. Initialize Map with Satellite Basemap
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Bersihkan instance map lama jika ada
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [provCoord.lat, provCoord.lng],
      zoom: provCoord.zoom,
      zoomControl: false,
      attributionControl: false
    });

    // Basemap: Satelit (ArcGIS World Imagery)
    baseTileRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18
      }
    ).addTo(map);

    // Attribution
    L.control.attribution({ position: 'bottomright' })
      .addAttribution('&copy; Esri &middot; &copy; <a href="https://bappenas.go.id">BAPPENAS</a>')
      .addTo(map);

    // Layer Group untuk Markers Kabupaten
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Invalidate size setelah modal rendering selesai
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const timer2 = setTimeout(() => {
      map.invalidateSize();
      map.setView([provCoord.lat, provCoord.lng], provCoord.zoom);
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [provinsi, provCoord.lat, provCoord.lng, provCoord.zoom]);

  // 2. Update BAPPENAS GeoServer WMS Layer (Batas Kab/Kota Auto On)
  useEffect(() => {
    if (!mapRef.current) return;

    if (wmsLayerRef.current) {
      mapRef.current.removeLayer(wmsLayerRef.current);
      wmsLayerRef.current = null;
    }

    if (!showWms) return;

    // WMS Parameters sesuai URL GetMap Bappenas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wmsOptions: any = {
      layers: 'BATAS_WILAYAH:ADMINISTRASI_AR_KABKOTA_50K_2023',
      format: 'image/png',
      transparent: true,
      version: '1.1.0',
      opacity: wmsOpacity,
      zIndex: 10
    };

    const wms = L.tileLayer.wms(
      'https://mandata.bappenas.go.id/geoserver/BATAS_WILAYAH/wms',
      wmsOptions
    );

    wms.addTo(mapRef.current);
    wmsLayerRef.current = wms;

    // Ensure markers stay on top
    if (markersLayerGroupRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      markersLayerGroupRef.current.eachLayer((layer: any) => {
        if (typeof layer.bringToFront === 'function') {
          layer.bringToFront();
        }
      });
    }

    return () => {
      if (mapRef.current && wms) {
        mapRef.current.removeLayer(wms);
      }
    };
  }, [showWms, wmsOpacity]);

  // 4. Render Markers Kabupaten/Kota dengan data bencana
  useEffect(() => {
    if (!mapRef.current || !markersLayerGroupRef.current) return;

    markersLayerGroupRef.current.clearLayers();
    if (!showMarkers) return;

    const totalKabs = kabupatenStats.length;

    kabupatenStats.forEach((kab, idx) => {
      const coord = getKabupatenCoord(provinsi, kab.nama, idx, totalKabs);
      const isSelected = selectedKabupaten && selectedKabupaten.toLowerCase() === kab.nama.toLowerCase();

      // Radius proporsional dengan skala kejadian (8px - 28px)
      const ratio = kab.kejadian / maxKejadian;
      const radius = 8 + Math.round(ratio * 18);

      // Warna tegas berdasarkan status volume atau tema jenis bencana terpilih
      let fillColor = currentTheme.main;
      if (!isFiltered) {
        if (ratio > 0.6) fillColor = '#e53935'; // merah
        else if (ratio > 0.3) fillColor = '#fb8c00'; // oranye
        else if (ratio > 0.1) fillColor = '#1e88e5'; // biru
        else fillColor = '#00897b'; // hijau teal
      }

      const marker = L.circleMarker([coord.lat, coord.lng], {
        radius: isSelected ? radius + 5 : radius,
        fillColor: fillColor,
        color: isSelected ? '#ffffff' : (isFiltered ? currentTheme.border : '#ffffff'),
        weight: isSelected ? 3.5 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 0.95 : (isFiltered ? 0.78 + Math.min(ratio * 0.2, 0.2) : 0.82)
      });

      // Tooltip ringan saat hover
      const disasterLabel = isFiltered ? `Kejadian ${activeFilterJenis}` : 'Kejadian';
      marker.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; font-weight: 700; color: #0f172a; padding: 2px 4px;">
          <div>📍 ${kab.nama}</div>
          <div style="color: ${fillColor}; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 4px; margin-top: 1px;">
            <span>${currentTheme.icon}</span>
            <span>${kab.kejadian.toLocaleString('id-ID')} ${disasterLabel}</span>
          </div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -radius],
        permanent: false
      });

      // Popup detail saat diklik
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; padding: 4px 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid ${fillColor}; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <div style="font-size: 13px; font-weight: 900; color: #0f172a;">${kab.nama}</div>
              <div style="font-size: 10px; color: #64748b; font-weight: 600;">Provinsi ${provinsi}</div>
            </div>
            <span style="background: ${fillColor}; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
              <span>${currentTheme.icon}</span>
              <span>${kab.kejadian.toLocaleString('id-ID')} Kejadian</span>
            </span>
          </div>

          ${isFiltered ? `
            <div style="font-size: 10.5px; font-weight: 800; color: ${fillColor}; background: ${currentTheme.light}; border: 1px solid ${currentTheme.border}40; padding: 4px 8px; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
              <span style="color: #64748b; font-size: 10px; font-weight: 600;">Filter Spasial:</span>
              <span style="display: flex; align-items: center; gap: 4px;">
                <span>${currentTheme.icon}</span>
                <span>${activeFilterJenis}</span>
              </span>
            </div>
          ` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 10px;">
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 6px;">
              <div style="color: #991b1b; font-size: 9px; font-weight: 700;">KORBAN JIWA</div>
              <div style="font-size: 12px; font-weight: 800; color: #b91c1c;">${(kab.meninggal + kab.hilang + kab.luka).toLocaleString('id-ID')}</div>
              <div style="font-size: 9px; color: #7f1d1d;">(${kab.meninggal} Meninggal)</div>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 6px;">
              <div style="color: #92400e; font-size: 9px; font-weight: 700;">MENGUNGSI</div>
              <div style="font-size: 12px; font-weight: 800; color: #d97706;">${kab.pengungsi.toLocaleString('id-ID')}</div>
              <div style="font-size: 9px; color: #b45309;">Jiwa Terdampak</div>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 6px;">
              <div style="color: #166534; font-size: 9px; font-weight: 700;">RUMAH RUSAK</div>
              <div style="font-size: 12px; font-weight: 800; color: #15803d;">${kab.totalRumahRusak.toLocaleString('id-ID')}</div>
              <div style="font-size: 9px; color: #166534;">Unit Teridentifikasi</div>
            </div>

            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 6px;">
              <div style="color: #075985; font-size: 9px; font-weight: 700;">FASILITAS PUBLIK</div>
              <div style="font-size: 12px; font-weight: 800; color: #0284c7;">${kab.fasilitas.toLocaleString('id-ID')}</div>
              <div style="font-size: 9px; color: #0369a1;">Sarana Prasarana</div>
            </div>
          </div>

          ${kab.terendam > 0 ? `
            <div style="font-size: 10px; color: #0284c7; background: #e0f2fe; padding: 4px 8px; border-radius: 6px; margin-bottom: 8px; font-weight: 600;">
              💧 Rumah Terendam: <b>${kab.terendam.toLocaleString('id-ID')}</b> unit
            </div>
          ` : ''}

          <div style="text-align: center;">
            <button 
              id="btn-select-kab-${idx}" 
              style="width: 100%; background: #00695c; color: #ffffff; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer;"
            >
              Lihat di Tabel &amp; Grafik &rarr;
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 280,
        className: 'kabupaten-map-popup'
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-kab-${idx}`);
        if (btn && onSelectKabupaten) {
          btn.onclick = () => {
            onSelectKabupaten(kab.nama);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        if (onSelectKabupaten) {
          onSelectKabupaten(kab.nama);
        }
      });

      marker.addTo(markersLayerGroupRef.current!);
    });
  }, [kabupatenStats, selectedKabupaten, showMarkers, provinsi, onSelectKabupaten, activeFilterJenis, isFiltered, currentTheme, maxKejadian]);

  // Handler Zoom / Focus
  const handleResetZoom = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([provCoord.lat, provCoord.lng], provCoord.zoom, {
        duration: 1.2
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-950">
      {/* Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Header Info Badge with Disaster Filter Indicator */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 max-w-[280px] sm:max-w-xs">
        <div 
          className="bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2.5 text-xs text-white"
          style={{ color: '#fff' }}
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 shadow-xs"
            style={{ 
              backgroundColor: isFiltered ? currentTheme.light : 'rgba(0,137,123,0.2)', 
              border: `1px solid ${isFiltered ? currentTheme.border : '#00695c'}` 
            }}
          >
            <span>{currentTheme.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>{isFiltered ? 'Filter Spasial Aktif' : 'Seluruh Wilayah'}</span>
              {isFiltered && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
              <span className="truncate">{isFiltered ? activeFilterJenis : 'Semua Bencana'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-white/10 text-teal-300 shrink-0">
                {kabupatenStats.length} Kab/Kota
              </span>
            </div>
          </div>
          {isFiltered && onResetFilterJenis && (
            <button
              onClick={onResetFilterJenis}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-extrabold text-slate-200 transition-colors cursor-pointer shrink-0"
              title="Tampilkan semua jenis bencana"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Floating Map Controls Toolbar */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2 items-end">
        {/* Bappenas WMS Layer Controls */}
        <div 
          className="bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 shadow-md flex flex-col gap-2 w-48 text-[11px] text-white"
          style={{ color: '#fff' }}
        >
          <div className="flex items-center justify-between font-bold text-white" style={{ color: '#fff' }}>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              Batas Kab/Kota
            </span>
            <button
              onClick={() => setShowWms(!showWms)}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                showWms ? 'text-teal-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-800'
              }`}
              title={showWms ? 'Sembunyikan Batas Wilayah' : 'Tampilkan Batas Wilayah'}
            >
              {showWms ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showWms && (
            <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800">
              {/* Opacity Slider */}
              <div className="flex items-center justify-between text-[10px] text-slate-300">
                <span>Opasitas Batas</span>
                <span className="font-semibold text-teal-400">{Math.round(wmsOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={wmsOpacity}
                onChange={(e) => setWmsOpacity(parseFloat(e.target.value))}
                className="w-full accent-[#00695c] h-1 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Markers Toggle */}
          <label className="flex items-center justify-between text-[10px] text-slate-200 cursor-pointer pt-1 border-t border-slate-800">
            <span>Titik Kabupaten</span>
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={(e) => setShowMarkers(e.target.checked)}
              className="rounded text-teal-500 focus:ring-teal-400 w-3.5 h-3.5 accent-teal-600"
            />
          </label>
        </div>

        {/* Reset Zoom Button */}
        <button
          onClick={handleResetZoom}
          className="p-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-white hover:bg-slate-800 shadow-md transition-all flex items-center justify-center cursor-pointer"
          title={`Fokus kembali ke ${provinsi}`}
        >
          <RotateCcw className="w-4 h-4 text-teal-400" />
        </button>
      </div>

      {/* Floating Bottom Legend */}
      <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
        <div 
          className="pointer-events-auto bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-md flex items-center gap-2.5 text-[10px] font-semibold text-slate-200"
          style={{ color: '#fff' }}
        >
          <span className="font-bold text-white flex items-center gap-1" style={{ color: '#fff' }}>
            <span>{currentTheme.icon}</span>
            <span>{isFiltered ? `Sebaran ${activeFilterJenis}:` : 'Skala Kejadian:'}</span>
          </span>
          {isFiltered ? (
            <>
              <span className="flex items-center gap-1 text-white">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentTheme.main }} /> 
                Maks ({maxKejadian.toLocaleString('id-ID')})
              </span>
              <span className="flex items-center gap-1 text-white opacity-80">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTheme.main }} /> 
                Min ({minKejadian.toLocaleString('id-ID')})
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e53935]" /> Tinggi
              </span>
              <span className="flex items-center gap-1 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fb8c00]" /> Sedang
              </span>
              <span className="flex items-center gap-1 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00897b]" /> Rendah
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
