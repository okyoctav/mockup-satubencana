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

    const items = disasterData as unknown as DisasterItem[];
    const filtered = selectedFilter === 'Semua' 
      ? items 
      : items.filter(d => d.Jenis_Bencana?.toLowerCase().includes(selectedFilter.toLowerCase()) || d.Nama_Bencana?.toLowerCase().includes(selectedFilter.toLowerCase()));


    filtered.forEach((d) => {
      if (d.Latitude == null || d.Longitude == null) return;

      // Color coding based on disaster type
      let color = '#3B82F6';
      let iconEmoji = '⚠️';
      const jenis = d.Jenis_Bencana?.toLowerCase() || '';

      if (jenis.includes('erupsi') || jenis.includes('gunung')) {
        color = '#EF4444'; iconEmoji = '🌋';
      } else if (jenis.includes('gempa')) {
        color = '#F59E0B'; iconEmoji = '🫨';
      } else if (jenis.includes('tsunami')) {
        color = '#06B6D4'; iconEmoji = '🌊';
      } else if (jenis.includes('banjir')) {
        color = '#3B82F6'; iconEmoji = '🌊';
      } else if (jenis.includes('longsor')) {
        color = '#8B5CF6'; iconEmoji = '⛰️';
      } else if (jenis.includes('cuaca') || jenis.includes('puting')) {
        color = '#10B981'; iconEmoji = '🌪️';
      }

      // Marker Icon
      const customIcon = L.divIcon({
        className: '',
        html: `<div style="background:${color}; color:#fff; width:28px; height:28px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:bold; cursor:pointer;">${iconEmoji}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
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
      marker.addTo(map);
    });

  }, [selectedFilter]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 min-h-[460px] md:min-h-[520px] flex flex-col">
      {/* Map Header Toolbar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex items-center justify-end flex-wrap gap-2 pointer-events-none">


        {/* Filter Pills */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 pointer-events-auto flex items-center gap-1 overflow-x-auto max-w-full shadow-lg">
          {disasterTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
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

      {/* Leaflet Map Canvas */}
      <div ref={containerRef} className="w-full flex-1 min-h-[440px] z-0" />
    </div>
  );
}
