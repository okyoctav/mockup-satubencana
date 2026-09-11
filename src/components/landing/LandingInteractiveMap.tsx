"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import disasterData from '../../../public/data/scbencana-code-1788147361819.json';

interface DisasterItem {
  ID?: number;
  Tanggal?: string;
  Tahun?: number;
  Nama_Bencana?: string;
  Jenis_Bencana?: string;
  Provinsi?: string;
  Lokasi_Utama?: string;
  Latitude?: number | null;
  Longitude?: number | null;
  Tipe_Koordinat?: string | null;
  Parameter_Utama?: string | null;
  VEI?: number | null;
  Magnitude?: number | null;
  Meninggal?: number | null;
  Hilang?: number | null;
  Luka?: number | null;
  Terdampak_Mengungsi?: number | null;
  Rumah_Rusak?: number | null;
  Kerugian_Rp?: string | number | null;
  Deskripsi?: string | null;
  Confidence?: string | null;
  Sumber?: string | null;
  URL_Sumber?: string | null;
}

interface LandingInteractiveMapProps {
  onSelectDisaster?: (disaster: DisasterItem | null) => void;
  rightExtraControls?: React.ReactNode;
}

export default function LandingInteractiveMap({ onSelectDisaster, rightExtraControls }: LandingInteractiveMapProps) {
  const { theme } = useTheme();
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['Semua']);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const markersRef = useRef<{ marker: L.Marker; item: DisasterItem }[]>([]);
  const isInitialMount = useRef(true);

  const filterCategories = [
    { id: 'Semua', label: 'Semua', icon: '🌐' },
    { id: 'Erupsi Gunung Api', label: 'Erupsi', icon: '🌋' },
    { id: 'Gempa Bumi', label: 'Gempa', icon: '🏚️' },
    { id: 'Tsunami', label: 'Tsunami', icon: '🌊' },
    { id: 'Banjir / Bandang', label: 'Banjir', icon: '🌊' },
    { id: 'Tanah Longsor', label: 'Longsor', icon: '⛰️' },
    { id: 'Kebakaran / Karhutla', label: 'Kebakaran', icon: '🔥' },
    { id: 'Cuaca Ekstrem / Puting Beliung', label: 'Cuaca Ekstrem', icon: '🌪️' },
  ];

  const toggleFilter = (id: string) => {
    if (id === 'Semua') {
      setSelectedFilters(['Semua']);
      return;
    }
    let updated = selectedFilters.filter(f => f !== 'Semua');
    if (updated.includes(id)) {
      updated = updated.filter(f => f !== id);
    } else {
      updated.push(id);
    }
    if (updated.length === 0) {
      setSelectedFilters(['Semua']);
    } else {
      setSelectedFilters(updated);
    }
  };

  // Dynamically update TileLayer based on Light / Dark theme (Using 100% Free OpenStreetMap & Esri Dark Basemaps)
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const tileUrl = theme === 'dark'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = theme === 'dark'
      ? '&copy; Esri, HERE, Garmin, FAO, NOAA, USGS'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const newTileLayer = L.tileLayer(tileUrl, {
      attribution,
      subdomains: 'abc',
      maxZoom: 19,
    });

    newTileLayer.addTo(mapRef.current);
    tileLayerRef.current = newTileLayer;
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    if (!mapRef.current) {
      // Initialize map centered at Indonesia with Zoom control at bottomright & scrollWheelZoom enabled
      const map = L.map(containerRef.current, {
        center: [-2.5, 118.0],
        zoom: 5,
        zoomControl: false,
        scrollWheelZoom: true,
      });

      // Position Zoom Control at bottomright
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;

      // Add default tile layer immediately on map creation according to current theme
      const initialTileUrl = theme === 'dark'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const initialLayer = L.tileLayer(initialTileUrl, {
        attribution: '&copy; OpenStreetMap',
        subdomains: 'abc',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = initialLayer;

      // Fix tile loading glitches when container mounts dynamically
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });
    markersRef.current = [];

    const items = disasterData as unknown as DisasterItem[];
    const isAllSelected = selectedFilters.includes('Semua');

    const filtered = isAllSelected
      ? items
      : items.filter(d => {
          const jenis = d.Jenis_Bencana?.toLowerCase() || '';
          const nama = d.Nama_Bencana?.toLowerCase() || '';
          return selectedFilters.some(filterId => {
            if (filterId === 'Erupsi Gunung Api') return jenis.includes('erupsi') || jenis.includes('gunung');
            if (filterId === 'Gempa Bumi') return jenis.includes('gempa');
            if (filterId === 'Tsunami') return jenis.includes('tsunami');
            if (filterId === 'Banjir / Bandang') return jenis.includes('banjir');
            if (filterId === 'Tanah Longsor') return jenis.includes('longsor');
            if (filterId === 'Kebakaran / Karhutla') return jenis.includes('kebakaran') || jenis.includes('karhutla') || jenis.includes('api');
            if (filterId === 'Cuaca Ekstrem / Puting Beliung') return jenis.includes('cuaca') || jenis.includes('puting');
            return jenis.includes(filterId.toLowerCase()) || nama.includes(filterId.toLowerCase());
          });
        });

    filtered.forEach((d, index) => {
      if (d.Latitude == null || d.Longitude == null) return;

      // Color coding based on disaster type
      let color = '#3B82F6';
      let iconEmoji = '⚠️';
      const jenis = d.Jenis_Bencana?.toLowerCase() || '';

      if (jenis.includes('erupsi') || jenis.includes('gunung')) {
        color = '#EF4444'; iconEmoji = '🌋';
      } else if (jenis.includes('gempa')) {
        color = '#F59E0B'; iconEmoji = '🏚️';
      } else if (jenis.includes('tsunami')) {
        color = '#06B6D4'; iconEmoji = '🌊';
      } else if (jenis.includes('banjir')) {
        color = '#3B82F6'; iconEmoji = '🌊';
      } else if (jenis.includes('longsor')) {
        color = '#8B5CF6'; iconEmoji = '⛰️';
      } else if (jenis.includes('kebakaran') || jenis.includes('karhutla') || jenis.includes('api')) {
        color = '#F97316'; iconEmoji = '🔥';
      } else if (jenis.includes('cuaca') || jenis.includes('puting')) {
        color = '#10B981'; iconEmoji = '🌪️';
      }

      // Animated Pulsing Marker Icon
      const customIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative; width:30px; height:30px;">
            <div style="position:absolute; inset:-4px; background:${color}; opacity:0.4; border-radius:50%; animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position:relative; background:${color}; color:#fff; width:30px; height:30px; border-radius:50%; border:2px solid #fff; box-shadow:0 3px 10px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; cursor:pointer;">${iconEmoji}</div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const popupContent = `
        <div style="font-family:sans-serif; min-width:260px; max-width:300px; font-size:11px; color:#1e293b; line-height:1.5; padding:10px; background:#ffffff; border-radius:12px;">
          <div style="background:linear-gradient(135deg, ${color}, #1e293b); color:#ffffff; padding:8px 12px; border-radius:8px; margin:-10px -10px 8px -10px; position:relative;">
            <div style="font-size:9px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; opacity:0.9;">${d.Jenis_Bencana || 'Bencana Spasial'}</div>
            <div style="font-size:13px; font-weight:bold; margin-top:2px; padding-right:15px;">${d.Nama_Bencana || 'Peristiwa Spasial'} (${d.Tahun || '-'})</div>
          </div>

          <table style="width:100%; border-collapse:collapse; font-size:10.5px; margin-bottom:6px;">
            <tr><td style="color:#64748b; padding:2px 0;">Waktu:</td><td style="font-weight:600;">${d.Tanggal || '-'}</td></tr>
            <tr><td style="color:#64748b; padding:2px 0;">Lokasi:</td><td style="font-weight:600;">${d.Lokasi_Utama || '-'}, ${d.Provinsi || '-'}</td></tr>
            ${d.Magnitude ? `<tr><td style="color:#64748b; padding:2px 0;">Magnitudo:</td><td style="font-weight:700; color:#EF4444;">${d.Magnitude} SR</td></tr>` : ''}
            ${d.VEI ? `<tr><td style="color:#64748b; padding:2px 0;">Skala VEI:</td><td style="font-weight:700; color:#EF4444;">VEI ${d.VEI}</td></tr>` : ''}
            ${d.Meninggal ? `<tr><td style="color:#64748b; padding:2px 0;">Meninggal:</td><td style="font-weight:700; color:#EF4444;">${d.Meninggal.toLocaleString('id')} Jiwa</td></tr>` : ''}
            ${d.Terdampak_Mengungsi ? `<tr><td style="color:#64748b; padding:2px 0;">Terdampak:</td><td style="font-weight:600;">${d.Terdampak_Mengungsi.toLocaleString('id')} Jiwa</td></tr>` : ''}
            ${d.Rumah_Rusak ? `<tr><td style="color:#64748b; padding:2px 0;">Kerusakan:</td><td style="font-weight:600;">${d.Rumah_Rusak.toLocaleString('id')} Unit</td></tr>` : ''}
          </table>

          ${d.Deskripsi ? `
            <div style="padding:6px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; font-size:10px; color:#475569; margin-bottom:6px; max-height:80px; overflow-y:auto;">
              ${d.Deskripsi}
            </div>
          ` : ''}

          <div style="font-size:9.5px; color:#94a3b8; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; pt:4px;">
            <span>Sumber: <b>${d.Sumber || 'BNPB / BMKG'}</b></span>
            ${d.URL_Sumber ? `<a href="${d.URL_Sumber}" target="_blank" rel="noopener noreferrer" style="color:#0EA5E9; font-weight:bold; text-decoration:underline;">Detail URL ↗</a>` : ''}
          </div>
        </div>
      `;

      const marker = L.marker([d.Latitude, d.Longitude], { icon: customIcon });
      marker.bindPopup(popupContent, { autoPan: true });

      marker.on('click', () => {
        setIsPaused(true);
        setActiveHighlightIndex(index);
        if (onSelectDisaster) {
          onSelectDisaster(d);
        }
      });

      marker.addTo(map);
      markersRef.current.push({ marker, item: d });
    });

    setActiveHighlightIndex(0);
  }, [selectedFilters]);

  // Auto-play Ticker effect to focus & highlight disaster points sequentially
  useEffect(() => {
    if (markersRef.current.length === 0 || isPaused) return;
    const interval = setInterval(() => {
      setActiveHighlightIndex((prev) => (prev + 1) % markersRef.current.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [selectedFilters, isPaused]);

  // Smooth FlyTo Zoom & Pan to active disaster location and open popup preview
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Keep map centered on Indonesia on initial load!
    }

    const target = markersRef.current[activeHighlightIndex];
    if (target && mapRef.current && target.item.Latitude != null && target.item.Longitude != null) {
      mapRef.current.flyTo([target.item.Latitude, target.item.Longitude], 7, {
        animate: true,
        duration: 1.8,
      });

      setTimeout(() => {
        target.marker.openPopup();
      }, 900);
    }
  }, [activeHighlightIndex]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 overflow-hidden">
      {/* Top Left Overlay: Kotak Sejarah Kebencanaan Title & Filter Bencana Buttons */}
      <div className="absolute top-4 left-4 z-[400] max-w-3xl pointer-events-none flex flex-col gap-2">
        {/* 1. Kotak Sejarah Kebencanaan Title Card */}
        <div className="bg-slate-900/40 dark:bg-slate-900/40 bg-white/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl px-4 py-2.5 shadow-2xl ring-1 ring-black/5 pointer-events-auto self-start">
          <h2 className="text-sm md:text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 drop-shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9] animate-pulse" />
            Sejarah Kebencanaan
          </h2>
          <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">
            Peta lokasi spasial kejadian bencana di Indonesia
          </p>
        </div>

        {/* 2. Filter Bencana Buttons (Vertical List ke bawah, tanpa scroll) */}
        <div className="flex flex-col gap-1.5 self-start pointer-events-auto mt-1">
          <span className="text-[11px] font-extrabold text-slate-900 dark:text-white drop-shadow-md px-1">
            Filter Bencana:
          </span>
          <div className="flex flex-col gap-1.5">
            {filterCategories.map((cat) => {
              const isSelected = selectedFilters.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleFilter(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 border text-left shadow-sm ${
                    isSelected
                      ? 'text-white shadow-md scale-[1.02]'
                      : 'bg-slate-900/80 dark:bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800'
                  }`}
                  style={isSelected ? { backgroundColor: 'rgb(25, 79, 112)', borderColor: 'rgb(25, 79, 112)' } : {}}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Right Controls Overlay: Arsip & Artikel Button */}
      {rightExtraControls && (
        <div className="absolute top-4 right-4 z-[400] pointer-events-auto">
          {rightExtraControls}
        </div>
      )}

      {/* Bottom News Ticker (Kotak Detail Disaster History) */}
      {markersRef.current[activeHighlightIndex] && (
        <div className="absolute bottom-4 left-4 right-16 z-[400] bg-slate-900/40 dark:bg-slate-900/40 bg-white/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-3 text-slate-900 dark:text-white shadow-2xl flex items-center justify-between flex-wrap gap-2 ring-1 ring-black/5 pointer-events-auto">
          <div className="flex items-center gap-3">
            {/* Tag Badge: "HISTORY" */}
            <span className="px-2.5 py-1 rounded-lg bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 text-[#0EA5E9] text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-[#0EA5E9] animate-ping'}`} />
              <span>HISTORY</span>
            </span>

            <div>
              <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 drop-shadow-xs">
                <span>{markersRef.current[activeHighlightIndex].item.Nama_Bencana} ({markersRef.current[activeHighlightIndex].item.Tahun})</span>
                <span className="text-[10px] text-slate-700 dark:text-slate-300 font-normal">• {markersRef.current[activeHighlightIndex].item.Lokasi_Utama}, {markersRef.current[activeHighlightIndex].item.Provinsi}</span>
              </h5>
              <p className="text-[11px] text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5 font-medium">
                {markersRef.current[activeHighlightIndex].item.Deskripsi || `Kejadian bencana ${markersRef.current[activeHighlightIndex].item.Jenis_Bencana} pada tanggal ${markersRef.current[activeHighlightIndex].item.Tanggal}`}
              </p>
            </div>
          </div>

          {/* Controls: Prev, Play/Pause Icon Button, Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPaused(true);
                setActiveHighlightIndex((prev) => (prev - 1 + markersRef.current.length) % markersRef.current.length);
              }}
              className="p-1.5 rounded-xl bg-slate-900/50 dark:bg-slate-900/60 hover:bg-slate-900/80 text-white transition-all backdrop-blur-md border border-white/10 flex items-center justify-center"
              title="Ke Bencana Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>

            {/* Integrated Play/Pause Icon Button */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-xl bg-[#0EA5E9]/90 hover:bg-[#0EA5E9] text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-1 backdrop-blur-md border border-white/20"
              title={isPaused ? 'Lanjutkan Tur Animasi' : 'Jeda Tur Animasi'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-white fill-current" /> : <Pause className="w-3.5 h-3.5 text-white fill-current" />}
            </button>

            <button
              onClick={() => {
                setIsPaused(true);
                setActiveHighlightIndex((prev) => (prev + 1) % markersRef.current.length);
              }}
              className="p-1.5 rounded-xl bg-slate-900/50 dark:bg-slate-900/60 hover:bg-slate-900/80 text-white transition-all backdrop-blur-md border border-white/10 flex items-center justify-center"
              title="Ke Bencana Berikutnya"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>

            <span className="text-[10px] font-mono text-slate-800 dark:text-slate-200 font-bold pl-1">
              {activeHighlightIndex + 1}/{markersRef.current.length}
            </span>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div ref={containerRef} className="w-full h-full flex-1 z-0" />
    </div>
  );
}

