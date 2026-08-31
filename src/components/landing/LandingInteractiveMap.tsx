"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

export default function LandingInteractiveMap() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('Semua');
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const markersRef = useRef<{ marker: L.Marker; item: DisasterItem }[]>([]);

  const disasterTypes = [
    'Semua',
    'Erupsi Gunung Api',
    'Gempa Bumi',
    'Tsunami',
    'Banjir / Bandang',
    'Tanah Longsor',
    'Cuaca Ekstrem / Puting Beliung'
  ];

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    if (!mapRef.current) {
      // Initialize map centered at Indonesia
      const map = L.map(containerRef.current, {
        center: [-2.5, 118.0],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      // OpenStreetMap Base Tile Layer (Fully Open & Free, No API Key Required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abc',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
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
    const filtered = selectedFilter === 'Semua' 
      ? items 
      : items.filter(d => d.Jenis_Bencana?.toLowerCase().includes(selectedFilter.toLowerCase()) || d.Nama_Bencana?.toLowerCase().includes(selectedFilter.toLowerCase()));

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
        <div style="font-family:sans-serif; min-width:260px; max-width:300px; font-size:11px; color:#1e293b; line-height:1.5;">
          <div style="background:linear-gradient(135deg, ${color}, #1e293b); color:#ffffff; padding:8px 10px; border-radius:8px 8px 0 0; margin:-10px -10px 8px -10px;">
            <div style="font-size:9px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; opacity:0.9;">${d.Jenis_Bencana || 'Bencana Spasial'}</div>
            <div style="font-size:13px; font-weight:bold; margin-top:2px;">${d.Nama_Bencana || 'Peristiwa Spasial'} (${d.Tahun || '-'})</div>
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

      // Pause auto-rotation when user clicks any marker manually
      marker.on('click', () => {
        setIsPaused(true);
        setActiveHighlightIndex(index);
      });

      marker.addTo(map);
      markersRef.current.push({ marker, item: d });
    });

    setActiveHighlightIndex(0);
  }, [selectedFilter]);

  // Auto-play Ticker effect to focus & highlight disaster points sequentially
  useEffect(() => {
    if (markersRef.current.length === 0 || isPaused) return;
    const interval = setInterval(() => {
      setActiveHighlightIndex((prev) => (prev + 1) % markersRef.current.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [selectedFilter, isPaused]);

  // Smooth FlyTo Zoom & Pan to active disaster location and open popup preview
  useEffect(() => {
    const target = markersRef.current[activeHighlightIndex];
    if (target && mapRef.current && target.item.Latitude != null && target.item.Longitude != null) {
      // Smooth flyTo with zoom level 7 to clearly show location
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
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 min-h-[460px] md:min-h-[520px] flex flex-col">
      {/* Map Header Toolbar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex items-center justify-between flex-wrap gap-2 pointer-events-none">
        {/* Play / Pause Tour Control Button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-1.5 text-white shadow-lg pointer-events-auto flex items-center gap-2 text-xs font-bold hover:bg-slate-800 transition-all"
        >
          <span>{isPaused ? '▶️ Lanjutkan Tur Animasi' : '⏸️ Jeda Tur Animasi'}</span>
        </button>

        {/* Filter Pills */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 pointer-events-auto flex items-center gap-1 overflow-x-auto max-w-full shadow-lg">
          {disasterTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedFilter(type);
                setIsPaused(false);
              }}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                selectedFilter === type
                  ? 'bg-[#0EA5E9] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Play News Ticker Banner (Displays Info Without Clicking) */}
      {markersRef.current[activeHighlightIndex] && (
        <div className="absolute bottom-4 left-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 text-white shadow-2xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 text-[#0EA5E9] text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-[#0EA5E9] animate-ping'}`} />
              <span>{isPaused ? 'JEDA PETA' : 'TUR SPASIAL HISTORIS'}</span>
            </span>

            <div>
              <h5 className="font-bold text-xs text-white flex items-center gap-2">
                <span>{markersRef.current[activeHighlightIndex].item.Nama_Bencana} ({markersRef.current[activeHighlightIndex].item.Tahun})</span>
                <span className="text-[10px] text-slate-400 font-normal">• {markersRef.current[activeHighlightIndex].item.Lokasi_Utama}, {markersRef.current[activeHighlightIndex].item.Provinsi}</span>
              </h5>
              <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                {markersRef.current[activeHighlightIndex].item.Deskripsi || `Kejadian bencana ${markersRef.current[activeHighlightIndex].item.Jenis_Bencana} pada tanggal ${markersRef.current[activeHighlightIndex].item.Tanggal}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPaused(true);
                setActiveHighlightIndex((prev) => (prev - 1 + markersRef.current.length) % markersRef.current.length);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all text-slate-200"
            >
              ◀ Prev
            </button>
            <span className="text-[10px] font-mono text-slate-400">
              {activeHighlightIndex + 1}/{markersRef.current.length}
            </span>
            <button
              onClick={() => {
                setIsPaused(true);
                setActiveHighlightIndex((prev) => (prev + 1) % markersRef.current.length);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all text-slate-200"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div ref={containerRef} className="w-full flex-1 min-h-[440px] z-0" />
    </div>
  );
}
