"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Compass, Layers, Calendar
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import disasterData from '../../../public/data/scbencana-code-1788147361819.json';

export interface DisasterItem {
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

const MATERIAL_COLORS: Record<string, { main: string; light: string; text: string; icon: string }> = {
  'Semua': { main: '#00897b', light: 'rgba(0,137,123,0.15)', text: '#00897b', icon: '🌐' },
  'Erupsi Gunung Api': { main: '#e53935', light: 'rgba(229,57,53,0.15)', text: '#e53935', icon: '🌋' },
  'Gempa Bumi': { main: '#fb8c00', light: 'rgba(251,140,0,0.15)', text: '#fb8c00', icon: '🏚️' },
  'Tsunami': { main: '#00acc1', light: 'rgba(0,172,193,0.15)', text: '#00acc1', icon: '🌊' },
  'Banjir / Bandang': { main: '#1e88e5', light: 'rgba(30,136,229,0.15)', text: '#1e88e5', icon: '💧' },
  'Tanah Longsor': { main: '#6d4c41', light: 'rgba(109,76,65,0.15)', text: '#6d4c41', icon: '⛰️' },
  'Kebakaran / Karhutla': { main: '#f4511e', light: 'rgba(244,81,30,0.15)', text: '#f4511e', icon: '🔥' },
  'Cuaca Ekstrem / Puting Beliung': { main: '#43a047', light: 'rgba(67,160,71,0.15)', text: '#43a047', icon: '🌪️' },
};

export default function LandingInteractiveMap({ onSelectDisaster, rightExtraControls }: LandingInteractiveMapProps) {
  const { theme } = useTheme();
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedFilters, setSelectedFilters] = useState<string[]>(['Semua']);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [basemapMode, setBasemapMode] = useState<'default' | 'satellite'>('default');
  const [tourProgress, setTourProgress] = useState<number>(0);

  const markersRef = useRef<{ marker: L.Marker; item: DisasterItem }[]>([]);
  const isInitialMount = useRef(true);

  const filterCategories = [
    { id: 'Semua', label: 'Semua', icon: '🌐' },
    { id: 'Erupsi Gunung Api', label: 'Erupsi', icon: '🌋' },
    { id: 'Gempa Bumi', label: 'Gempa', icon: '🏚️' },
    { id: 'Tsunami', label: 'Tsunami', icon: '🌊' },
    { id: 'Banjir / Bandang', label: 'Banjir', icon: '💧' },
    { id: 'Tanah Longsor', label: 'Longsor', icon: '⛰️' },
    { id: 'Kebakaran / Karhutla', label: 'Karhutla', icon: '🔥' },
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

  // Switch basemap (Light, Dark, or Satellite)
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    let tileUrl = '';
    let attribution = '';

    if (basemapMode === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, Maxar, Earthstar Geographics';
    } else if (theme === 'dark') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, HERE, Garmin, OpenStreetMap';
    } else {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    }

    const newLayer = L.tileLayer(tileUrl, {
      attribution,
      subdomains: 'abc',
      maxZoom: 19,
    }).addTo(mapRef.current);

    tileLayerRef.current = newLayer;
  }, [theme, basemapMode]);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [-2.5, 118.0],
        zoom: 5,
        zoomControl: false,
        scrollWheelZoom: true,
      });

      // Material Floating Zoom Control on bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;

      // Base tile
      const initialTileUrl = theme === 'dark'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const initialLayer = L.tileLayer(initialTileUrl, {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = initialLayer;

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

    const sorted = [...filtered].sort((a, b) => (a.Tahun || 0) - (b.Tahun || 0));

    sorted.forEach((d, index) => {
      if (d.Latitude == null || d.Longitude == null) return;

      let color = '#00897b';
      let iconEmoji = '⚠️';
      const jenis = d.Jenis_Bencana?.toLowerCase() || '';

      if (jenis.includes('erupsi') || jenis.includes('gunung')) {
        color = '#e53935'; iconEmoji = '🌋';
      } else if (jenis.includes('gempa')) {
        color = '#fb8c00'; iconEmoji = '🏚️';
      } else if (jenis.includes('tsunami')) {
        color = '#00acc1'; iconEmoji = '🌊';
      } else if (jenis.includes('banjir')) {
        color = '#1e88e5'; iconEmoji = '💧';
      } else if (jenis.includes('longsor')) {
        color = '#6d4c41'; iconEmoji = '⛰️';
      } else if (jenis.includes('kebakaran') || jenis.includes('karhutla') || jenis.includes('api')) {
        color = '#f4511e'; iconEmoji = '🔥';
      } else if (jenis.includes('cuaca') || jenis.includes('puting')) {
        color = '#43a047'; iconEmoji = '🌪️';
      }

      // Material Design Floating Action Pin Marker (Elevated Pill)
      const customIcon = L.divIcon({
        className: 'material-pin-container',
        html: `
          <div style="position:relative; width:34px; height:34px; transform:translate(-50%, -50%); cursor:pointer;">
            <div style="position:absolute; inset:-4px; background:${color}; opacity:0.35; border-radius:50%; animation:ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="
              position:relative;
              width:34px;
              height:34px;
              border-radius:50%;
              background:${color};
              color:#ffffff;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2);
              border: 2.5px solid #ffffff;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:15px;
              font-weight:bold;
              transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            ">
              ${iconEmoji}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      // Material Card Pop-up
      const popupContent = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-width: 270px;
          max-width: 310px;
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(0,0,0,0.18), 0 1.5px 4px rgba(0,0,0,0.12);
        ">
          <!-- Material Card Header -->
          <div style="
            background: ${color};
            color: #ffffff;
            padding: 12px 14px;
            position: relative;
          ">
            <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.9;">
              ${d.Jenis_Bencana || 'Peristiwa Kebencanaan'}
            </div>
            <div style="font-size: 14px; font-weight: 800; margin-top: 2px; line-height: 1.25;">
              ${d.Nama_Bencana || 'Peristiwa Spasial'}
            </div>
            <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">
              Tahun ${d.Tahun || '-'} · ${d.Lokasi_Utama || '-'}
            </div>
          </div>

          <!-- Material Card Content -->
          <div style="padding: 12px 14px; color: #334155; font-size: 11.5px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
              <div style="background: #f8fafc; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Korban Jiwa</div>
                <div style="font-size: 12px; font-weight: 800; color: #e53935;">
                  ${d.Meninggal ? `${d.Meninggal.toLocaleString('id')} Jiwa` : 'N/A'}
                </div>
              </div>
              <div style="background: #f8fafc; padding: 6px 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Pengungsi</div>
                <div style="font-size: 12px; font-weight: 800; color: #fb8c00;">
                  ${d.Terdampak_Mengungsi ? `${d.Terdampak_Mengungsi.toLocaleString('id')} Jiwa` : 'N/A'}
                </div>
              </div>
            </div>

            ${d.Parameter_Utama || d.Magnitude || d.VEI ? `
              <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px; color: #0f172a;">
                Parameter: <span style="color: ${color};">${d.Parameter_Utama || (d.Magnitude ? `${d.Magnitude} SR` : `VEI ${d.VEI}`)}</span>
              </div>
            ` : ''}

            ${d.Deskripsi ? `
              <div style="
                background: #f1f5f9;
                padding: 8px 10px;
                border-radius: 8px;
                font-size: 10.5px;
                line-height: 1.45;
                color: #475569;
                margin-bottom: 10px;
                max-height: 90px;
                overflow-y: auto;
              ">
                ${d.Deskripsi}
              </div>
            ` : ''}

            <!-- Material Card Actions -->
            <div style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-top: 8px;
              border-top: 1px solid #e2e8f0;
              font-size: 10px;
            ">
              <span style="color: #94a3b8;">Sumber: <b>${d.Sumber || 'BNPB / BMKG'}</b></span>
              ${d.URL_Sumber ? `
                <a 
                  href="${d.URL_Sumber}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style="
                    color: ${color};
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    text-decoration: none;
                  "
                >
                  Detail ↗
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([d.Latitude, d.Longitude], { icon: customIcon });
      marker.bindPopup(popupContent, { 
        autoPan: true,
        className: 'material-custom-popup',
        closeButton: false,
        offset: [0, -10]
      });

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

  // Auto-tour ticker & progress bar
  useEffect(() => {
    if (markersRef.current.length === 0 || isPaused) {
      setTourProgress(0);
      return;
    }

    const duration = 6000;
    const intervalMs = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += intervalMs;
      setTourProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        elapsed = 0;
        setActiveHighlightIndex((prev) => (prev + 1) % markersRef.current.length);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, activeHighlightIndex, selectedFilters]);

  // FlyTo Zoom & Pan when active item changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const target = markersRef.current[activeHighlightIndex];
    if (target && mapRef.current && target.item.Latitude != null && target.item.Longitude != null) {
      mapRef.current.flyTo([target.item.Latitude, target.item.Longitude], 7, {
        animate: true,
        duration: 1.6,
      });

      setTimeout(() => {
        target.marker.openPopup();
      }, 800);
    }
  }, [activeHighlightIndex]);

  // Reset Center to Indonesia
  const handleResetCenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([-2.5, 118.0], 5, { animate: true, duration: 1.5 });
    }
  };

  const activeDisaster = markersRef.current[activeHighlightIndex]?.item;
  const activeColor = activeDisaster?.Jenis_Bencana 
    ? MATERIAL_COLORS[activeDisaster.Jenis_Bencana]?.main || '#00897b'
    : '#00897b';

  const totalMarkers = markersRef.current.length;
  const firstYear = markersRef.current[0]?.item?.Tahun ?? '-';
  const lastYear = markersRef.current[totalMarkers - 1]?.item?.Tahun ?? '-';
  const sliderPercent = totalMarkers > 1 ? (activeHighlightIndex / (totalMarkers - 1)) * 100 : 0;

  // Selected landmark milestone years for quick jumps
  const milestoneYears = (() => {
    if (totalMarkers <= 1) return [];
    const stepCount = Math.min(5, totalMarkers);
    const indices = [0];
    for (let i = 1; i < stepCount - 1; i++) {
      indices.push(Math.round((i / (stepCount - 1)) * (totalMarkers - 1)));
    }
    indices.push(totalMarkers - 1);
    const unique = Array.from(new Set(indices));
    return unique
      .map((idx) => ({
        index: idx,
        year: markersRef.current[idx]?.item?.Tahun,
        name: markersRef.current[idx]?.item?.Nama_Bencana,
      }))
      .filter((m) => m.year != null);
  })();

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden font-sans select-none landing-map-container">
      
      {/* ============================================================
          TOP FLOATING MATERIAL APP BAR (Title + Material Chips Filter)
          ============================================================ */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-[400] max-w-4xl pointer-events-none flex flex-col gap-2">
        {/* Material Card Topbar */}
        <div 
          className="pointer-events-auto rounded-2xl p-3 sm:px-4 sm:py-3 transition-all duration-300"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.08), 0 0 0 1px var(--border-faint)'
          }}
        >
          {/* Header Title & Subtitle */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              {/* Circular Material Avatar */}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                style={{ backgroundColor: '#0f766e' }}
              >
                <Compass className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Sejarah Kebencanaan Indonesia
                </h2>
                <p className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Peta spasial kronologis peristiwa alam nusantara
                </p>
              </div>
            </div>

            {/* Total Points Badge */}
            <div 
              className="px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 shrink-0 bg-teal-700 text-white shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>{markersRef.current.length} Lokasi Peristiwa</span>
            </div>
          </div>

          {/* Material Chips Filter (Horizontal Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {filterCategories.map((cat) => {
              const isSelected = selectedFilters.includes(cat.id);
              const col = MATERIAL_COLORS[cat.id] || MATERIAL_COLORS['Semua'];
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleFilter(cat.id)}
                  className="px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 flex items-center gap-1.5 shrink-0 border cursor-pointer"
                  style={{
                    backgroundColor: isSelected ? col.main : 'var(--bg-page)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    borderColor: isSelected ? col.main : 'var(--border-subtle)',
                    boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                    transform: isSelected ? 'translateY(-1px)' : 'none'
                  }}
                >
                  <span className="text-xs">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================
          TOP RIGHT EXTRA CONTROLS (Floating Action Buttons Group)
          ============================================================ */}
      <div className="absolute top-3 right-3 z-[400] pointer-events-auto flex items-center gap-2">
        {rightExtraControls}

        {/* FAB: Toggle Basemap Satellite / Canvas */}
        <button
          onClick={() => setBasemapMode(prev => prev === 'default' ? 'satellite' : 'default')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.18)'
          }}
          title={basemapMode === 'default' ? 'Ganti ke Citra Satelit' : 'Ganti ke Peta Standar'}
        >
          <Layers className="w-4 h-4 text-teal-700 dark:text-teal-400" />
        </button>

        {/* FAB: Reset Zoom to Indonesia */}
        <button
          onClick={handleResetCenter}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.18)'
          }}
          title="Fokus Seluruh Indonesia"
        >
          <Compass className="w-4 h-4 text-emerald-600" />
        </button>
      </div>

      {/* ============================================================
          BOTTOM MATERIAL CARD (Persistent Chronology Player & Detail)
          ============================================================ */}
      {activeDisaster && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-xl z-[400] pointer-events-auto">
          <div 
            className="rounded-2xl border overflow-hidden transition-all duration-300"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-faint)',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.15)'
            }}
          >
            {/* Linear Progress Bar of Tour */}
            <div className="w-full h-1 bg-slate-200/50 overflow-hidden">
              <div 
                className="h-full transition-all duration-100 ease-linear"
                style={{ 
                  width: `${tourProgress}%`,
                  backgroundColor: activeColor
                }}
              />
            </div>

            <div className="p-3.5 sm:p-4 space-y-2.5">
              {/* Top Row: Year, Category Badge & Title */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-white shadow-xs"
                      style={{ backgroundColor: activeColor }}
                    >
                      {activeDisaster.Jenis_Bencana || 'Bencana'}
                    </span>
                    <span className="text-xs font-black" style={{ color: activeColor }}>
                      Tahun {activeDisaster.Tahun || '-'}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      • {activeDisaster.Lokasi_Utama}, {activeDisaster.Provinsi}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {activeDisaster.Nama_Bencana}
                  </h3>
                </div>

                {/* Counter index pill */}
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                  {activeHighlightIndex + 1} / {markersRef.current.length}
                </span>
              </div>

              {/* Data Strip: Korban, Pengungsi, Parameter */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t" style={{ borderColor: 'var(--border-faint)' }}>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Meninggal</div>
                  <div className="text-xs sm:text-sm font-black text-rose-600">
                    {activeDisaster.Meninggal ? `${activeDisaster.Meninggal.toLocaleString('id')} Jiwa` : '-'}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Terdampak</div>
                  <div className="text-xs sm:text-sm font-black text-amber-600">
                    {activeDisaster.Terdampak_Mengungsi ? `${activeDisaster.Terdampak_Mengungsi.toLocaleString('id')} Jiwa` : '-'}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Parameter</div>
                  <div className="text-xs sm:text-sm font-black text-sky-600 truncate">
                    {activeDisaster.Parameter_Utama || (activeDisaster.Magnitude ? `${activeDisaster.Magnitude} SR` : activeDisaster.VEI ? `VEI ${activeDisaster.VEI}` : '-')}
                  </div>
                </div>
              </div>

              {/* Description preview */}
              {activeDisaster.Deskripsi && (
                <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {activeDisaster.Deskripsi}
                </p>
              )}

              {/* Bottom Action Bar: Prev, Play/Pause FAB, Next, and Detail */}
              <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border-faint)' }}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsPaused(true);
                      setActiveHighlightIndex((prev) => (prev - 1 + markersRef.current.length) % markersRef.current.length);
                    }}
                    className="p-1.5 rounded-xl border text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    style={{ borderColor: 'var(--border-subtle)' }}
                    title="Peristiwa Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Material Play/Pause FAB */}
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: activeColor }}
                    title={isPaused ? 'Mulai Tur Kronologis Otomatis' : 'Jeda Tur'}
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span className="uppercase text-[10px] tracking-wider">Mulai Tur</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span className="uppercase text-[10px] tracking-wider">Jeda</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsPaused(true);
                      setActiveHighlightIndex((prev) => (prev + 1) % markersRef.current.length);
                    }}
                    className="p-1.5 rounded-xl border text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    style={{ borderColor: 'var(--border-subtle)' }}
                    title="Peristiwa Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Right Action: Click to open full details */}
                <button
                  onClick={() => {
                    if (onSelectDisaster) {
                      onSelectDisaster(activeDisaster);
                    }
                  }}
                  className="text-[11px] font-extrabold uppercase tracking-wider transition-colors hover:underline"
                  style={{ color: activeColor }}
                >
                  Arsip Terkait ➔
                </button>
              </div>

              {/* Year Timeline Slider (Linimasa Berdasarkan Tahun) */}
              <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--border-faint)' }}>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar className="w-3.5 h-3.5" style={{ color: activeColor }} />
                    <span className="text-[10px] sm:text-[10.5px]">Linimasa Tahun:</span>
                    <span 
                      className="px-2 py-0.5 rounded-full font-black text-white text-[11px] shadow-xs"
                      style={{ backgroundColor: activeColor }}
                    >
                      {activeDisaster.Tahun || '-'}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {firstYear} ➔ {lastYear}
                  </div>
                </div>

                <div className="relative flex items-center pt-0.5">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, totalMarkers - 1)}
                    step={1}
                    value={activeHighlightIndex}
                    onChange={(e) => {
                      setIsPaused(true);
                      setActiveHighlightIndex(Number(e.target.value));
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-all"
                    style={{
                      accentColor: activeColor,
                      background: `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${sliderPercent}%, var(--border-subtle) ${sliderPercent}%, var(--border-subtle) 100%)`,
                    }}
                    title={`Geser peristiwa tahun (${activeDisaster.Tahun || ''})`}
                  />
                </div>

                {/* Milestone Year Quick Buttons */}
                {milestoneYears.length > 0 && (
                  <div className="flex items-center justify-between text-[9px] font-mono px-0.5 pt-0.5">
                    {milestoneYears.map((m) => {
                      const isCurrent = m.index === activeHighlightIndex;
                      return (
                        <button
                          key={m.index}
                          onClick={() => {
                            setIsPaused(true);
                            setActiveHighlightIndex(m.index);
                          }}
                          className={`transition-all cursor-pointer ${
                            isCurrent
                              ? 'font-black underline scale-110'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                          style={{
                            color: isCurrent ? activeColor : undefined,
                          }}
                          title={`Lompat ke tahun ${m.year} (${m.name})`}
                        >
                          {m.year}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div ref={containerRef} className="w-full h-full flex-1 z-0" />
    </div>
  );
}
