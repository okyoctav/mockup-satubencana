'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { PROVINCE_COORDINATES, getKabupatenCoord } from '@/data/provinceCoordinates';

export interface KabupatenItem {
  nama: string;
  kejadian: number;
  meninggal: number;
  hilang: number;
  luka: number;
  pengungsi: number;
  rusakBerat: number;
  rusakSedang: number;
  rusakRingan: number;
  totalRumahRusak: number;
  terendam: number;
  fasilitas: number;
  topBencana?: string;
  jenisBreakdown?: Record<string, number>;
}

interface ProvinceKabupatenMapProps {
  provinsi: string;
  kabupatenStats: KabupatenItem[];
  selectedKabupaten?: string | null;
  onSelectKabupaten?: (kab: string) => void;
}

export default function ProvinceKabupatenMap({
  provinsi,
  kabupatenStats,
  selectedKabupaten,
  onSelectKabupaten
}: ProvinceKabupatenMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const wmsLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);

  const [showWms, setShowWms] = useState<boolean>(true);
  const [wmsOpacity, setWmsOpacity] = useState<number>(0.85);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);

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
    const maxKejadian = Math.max(...kabupatenStats.map(k => k.kejadian), 1);

    kabupatenStats.forEach((kab, idx) => {
      const coord = getKabupatenCoord(provinsi, kab.nama, idx, totalKabs);
      const isSelected = selectedKabupaten && selectedKabupaten.toLowerCase() === kab.nama.toLowerCase();

      // Radius proporsional dengan skala kejadian (8px - 28px)
      const ratio = kab.kejadian / maxKejadian;
      const radius = 8 + Math.round(ratio * 18);

      // Warna tegas berdasarkan status volume
      let fillColor = '#00897b'; // hijau teal
      if (ratio > 0.6) fillColor = '#e53935'; // merah
      else if (ratio > 0.3) fillColor = '#fb8c00'; // oranye
      else if (ratio > 0.1) fillColor = '#1e88e5'; // biru

      const marker = L.circleMarker([coord.lat, coord.lng], {
        radius: isSelected ? radius + 4 : radius,
        fillColor: fillColor,
        color: isSelected ? '#ffffff' : '#ffffff',
        weight: isSelected ? 3.5 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 0.95 : 0.82
      });

      // Tooltip ringan saat hover
      marker.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; font-weight: 700; color: #0f172a; padding: 2px 4px;">
          <div>📍 ${kab.nama}</div>
          <div style="color: #00695c; font-size: 10px; font-weight: 800;">${kab.kejadian.toLocaleString('id-ID')} Kejadian</div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -radius],
        permanent: false
      });

      // Popup detail saat diklik
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; padding: 4px 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid ${fillColor}; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <div style="font-size: 13px; font-weight: 900; color: #0f172a;">${kab.nama}</div>
              <div style="font-size: 10px; color: #64748b; font-weight: 600;">Provinsi ${provinsi}</div>
            </div>
            <span style="background: ${fillColor}; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 9999px;">
              ${kab.kejadian.toLocaleString('id-ID')} Kejadian
            </span>
          </div>

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
  }, [kabupatenStats, selectedKabupaten, showMarkers, provinsi, onSelectKabupaten]);

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

      {/* Floating Header Info Badge (removed redundant inner card) */}
      <div className="absolute top-3 left-3 z-[400] pointer-events-none" />

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
          className="pointer-events-auto bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-md flex items-center gap-3 text-[10px] font-semibold text-slate-200"
          style={{ color: '#fff' }}
        >
          <span className="font-bold text-white" style={{ color: '#fff' }}>Skala Bencana:</span>
          <span className="flex items-center gap-1 text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e53935]" /> Tinggi
          </span>
          <span className="flex items-center gap-1 text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fb8c00]" /> Sedang
          </span>
          <span className="flex items-center gap-1 text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00897b]" /> Rendah
          </span>
        </div>
      </div>
    </div>
  );
}
