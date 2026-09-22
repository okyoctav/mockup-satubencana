'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  X, MapPin, BarChart3, Table as TableIcon, Users, Home, 
  Building2, ShieldAlert, Download, Search, 
  ArrowUpDown, ChevronRight, Compass, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { KabupatenItem, DISASTER_THEMES, DISASTER_COLORS } from './disasterConstants';

// Dynamic import of Leaflet Map to avoid SSR errors
const ProvinceKabupatenMap = dynamic(() => import('./ProvinceKabupatenMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-2xl bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-300">
      <div className="w-10 h-10 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
      <div className="text-xs font-bold tracking-wide">Menghubungkan ke GeoServer BAPPENAS...</div>
      <div className="text-[10px] text-slate-400">Memuat Batas Wilayah Administrasi Kab/Kota 50K 2023</div>
    </div>
  )
});

interface BencanaData {
  Tahun: number;
  Bulan: number;
  Minggu?: number;
  Provinsi: string;
  Kabupaten: string;
  'Jenis Bencana': string;
  'Jumlah Kejadian': number;
  Meninggal: number;
  Hilang: number;
  'Luka / Sakit': number;
  menderita_mengungsi: number;
  'Rumah Rusak Berat': number;
  'Rumah Rusak Sedang': number;
  'Rumah Rusak Ringan': number;
  'Rumah Terendam': number;
  'Satuan Pendidikan Rusak': number;
  'Rumah Ibadat Rusak': number;
  'Fasilitas Pelayanan Kesehatan Rusak': number;
  'Kantor Rusak': number;
  'Jembatan Rusak': number;
}

interface ProvinceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  provinsi: string;
  allData: BencanaData[];
  activeFilterJenis?: string;
  startTahun?: string;
  endTahun?: string;
}

export default function ProvinceDetailModal({
  isOpen,
  onClose,
  provinsi,
  allData,
  activeFilterJenis = 'Semua',
  startTahun = '2011',
  endTahun = '2026'
}: ProvinceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'peta' | 'grafik' | 'tabel'>('peta');
  const [searchKab, setSearchKab] = useState<string>('');
  const [selectedKabupaten, setSelectedKabupaten] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof KabupatenItem>('kejadian');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedJenis, setSelectedJenis] = useState<string>(activeFilterJenis || 'Semua');

  // Synchronize when activeFilterJenis or isOpen changes
  useEffect(() => {
    setSelectedJenis(activeFilterJenis || 'Semua');
  }, [activeFilterJenis, isOpen]);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Reset selected kab when province changes
  useEffect(() => {
    setSelectedKabupaten(null);
    setSearchKab('');
  }, [provinsi]);

  // 1. Raw rows for this province (all disasters, filtered by year)
  const allProvinceRows = useMemo(() => {
    if (!provinsi || !allData.length) return [];
    const provTarget = provinsi.trim().toLowerCase();

    return allData.filter(d => {
      if (!d.Provinsi) return false;
      const matchProv = d.Provinsi.trim().toLowerCase() === provTarget;
      if (!matchProv) return false;

      // Filter Tahun
      if (d.Tahun) {
        if (startTahun && d.Tahun < parseInt(startTahun)) return false;
        if (endTahun && d.Tahun > parseInt(endTahun)) return false;
      }

      return true;
    });
  }, [allData, provinsi, startTahun, endTahun]);

  // Total Kejadian across all disasters in province
  const allProvinceTotalKejadian = useMemo(() => {
    return allProvinceRows.reduce((sum, r) => sum + (r['Jumlah Kejadian'] || 0), 0);
  }, [allProvinceRows]);

  // Complete Disaster Type Distribution in this Province (used for pie chart & selection)
  const allDisasterTypeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allProvinceRows.forEach(r => {
      const jb = r['Jenis Bencana'] || 'Lainnya';
      map[jb] = (map[jb] || 0) + (r['Jumlah Kejadian'] || 0);
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        color: DISASTER_THEMES[name]?.main || DISASTER_COLORS[name] || '#00897b'
      }))
      .sort((a, b) => b.value - a.value);
  }, [allProvinceRows]);

  // 2. Filtered rows for this province (filtered by selectedJenis)
  const provinceRows = useMemo(() => {
    if (!selectedJenis || selectedJenis === 'Semua') {
      return allProvinceRows;
    }
    const targetJenis = selectedJenis.trim().toLowerCase();
    return allProvinceRows.filter(d => {
      return d['Jenis Bencana'] && d['Jenis Bencana'].trim().toLowerCase() === targetJenis;
    });
  }, [allProvinceRows, selectedJenis]);

  const currentTheme = DISASTER_THEMES[selectedJenis] || DISASTER_THEMES['Semua'];

  // Aggregate Kabupaten/Kota Stats
  const kabupatenStats: KabupatenItem[] = useMemo(() => {
    const map: Record<string, KabupatenItem> = {};

    provinceRows.forEach(row => {
      const kabRaw = (row.Kabupaten || 'Tidak Teridentifikasi').trim();
      if (!map[kabRaw]) {
        map[kabRaw] = {
          nama: kabRaw,
          kejadian: 0,
          meninggal: 0,
          hilang: 0,
          luka: 0,
          pengungsi: 0,
          rusakBerat: 0,
          rusakSedang: 0,
          rusakRingan: 0,
          totalRumahRusak: 0,
          terendam: 0,
          fasilitas: 0,
          jenisBreakdown: {}
        };
      }

      const item = map[kabRaw];
      item.kejadian += (row['Jumlah Kejadian'] || 0);
      item.meninggal += (row.Meninggal || 0);
      item.hilang += (row.Hilang || 0);
      item.luka += (row['Luka / Sakit'] || 0);
      item.pengungsi += (row.menderita_mengungsi || 0);

      const rb = row['Rumah Rusak Berat'] || 0;
      const rs = row['Rumah Rusak Sedang'] || 0;
      const rr = row['Rumah Rusak Ringan'] || 0;
      item.rusakBerat += rb;
      item.rusakSedang += rs;
      item.rusakRingan += rr;
      item.totalRumahRusak += (rb + rs + rr);
      item.terendam += (row['Rumah Terendam'] || 0);

      const fas = (row['Satuan Pendidikan Rusak'] || 0) +
                  (row['Rumah Ibadat Rusak'] || 0) +
                  (row['Fasilitas Pelayanan Kesehatan Rusak'] || 0) +
                  (row['Kantor Rusak'] || 0) +
                  (row['Jembatan Rusak'] || 0);
      item.fasilitas += fas;

      // Track jenis bencana
      const jb = row['Jenis Bencana'] || 'Lainnya';
      if (!item.jenisBreakdown![jb]) item.jenisBreakdown![jb] = 0;
      item.jenisBreakdown![jb] += (row['Jumlah Kejadian'] || 0);
    });

    return Object.values(map).map(k => ({
      ...k,
      kejadian: Math.round(k.kejadian),
      meninggal: Math.round(k.meninggal),
      hilang: Math.round(k.hilang),
      luka: Math.round(k.luka),
      pengungsi: Math.round(k.pengungsi),
      rusakBerat: Math.round(k.rusakBerat),
      rusakSedang: Math.round(k.rusakSedang),
      rusakRingan: Math.round(k.rusakRingan),
      totalRumahRusak: Math.round(k.totalRumahRusak),
      terendam: Math.round(k.terendam),
      fasilitas: Math.round(k.fasilitas)
    }))
    .filter(k => k.kejadian > 0)
    .sort((a, b) => b.kejadian - a.kejadian);
  }, [provinceRows]);

  // Overall Province KPIs
  const provinceKpi = useMemo(() => {
    let kejadian = 0;
    let meninggal = 0;
    let hilang = 0;
    let luka = 0;
    let pengungsi = 0;
    let rumahRusak = 0;
    let terendam = 0;
    let fasilitas = 0;

    kabupatenStats.forEach(k => {
      kejadian += k.kejadian;
      meninggal += k.meninggal;
      hilang += k.hilang;
      luka += k.luka;
      pengungsi += k.pengungsi;
      rumahRusak += k.totalRumahRusak;
      terendam += k.terendam;
      fasilitas += k.fasilitas;
    });

    return {
      kejadian: Math.round(kejadian),
      meninggal: Math.round(meninggal),
      hilang: Math.round(hilang),
      luka: Math.round(luka),
      pengungsi: Math.round(pengungsi),
      rumahRusak: Math.round(rumahRusak),
      terendam: Math.round(terendam),
      fasilitas: Math.round(fasilitas),
      totalKabupaten: kabupatenStats.length
    };
  }, [kabupatenStats]);

  // Tren Tahunan
  const yearlyTrend = useMemo(() => {
    const map: Record<number, { tahun: number; kejadian: number; meninggal: number; pengungsi: number }> = {};
    provinceRows.forEach(r => {
      const t = r.Tahun;
      if (!t) return;
      if (!map[t]) {
        map[t] = { tahun: t, kejadian: 0, meninggal: 0, pengungsi: 0 };
      }
      map[t].kejadian += (r['Jumlah Kejadian'] || 0);
      map[t].meninggal += (r.Meninggal || 0);
      map[t].pengungsi += (r.menderita_mengungsi || 0);
    });

    return Object.values(map)
      .map(y => ({
        ...y,
        kejadian: Math.round(y.kejadian),
        meninggal: Math.round(y.meninggal),
        pengungsi: Math.round(y.pengungsi)
      }))
      .sort((a, b) => a.tahun - b.tahun);
  }, [provinceRows]);

  // Sorted & Filtered Kabupaten List for Table
  const filteredKabupatenList = useMemo(() => {
    let list = [...kabupatenStats];

    if (searchKab.trim()) {
      const q = searchKab.toLowerCase().trim();
      list = list.filter(k => k.nama.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });

    return list;
  }, [kabupatenStats, searchKab, sortField, sortAsc]);

  // Export Table Data to CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Provinsi',
      'Kabupaten/Kota',
      'Jumlah Kejadian',
      'Meninggal',
      'Hilang',
      'Luka/Sakit',
      'Menderita & Mengungsi',
      'Rumah Rusak Berat',
      'Rumah Rusak Sedang',
      'Rumah Rusak Ringan',
      'Total Rumah Rusak',
      'Rumah Terendam',
      'Fasilitas Publik Rusak'
    ];

    const rows = kabupatenStats.map((k, i) => [
      i + 1,
      `"${provinsi}"`,
      `"${k.nama}"`,
      k.kejadian,
      k.meninggal,
      k.hilang,
      k.luka,
      k.pengungsi,
      k.rusakBerat,
      k.rusakSedang,
      k.rusakRingan,
      k.totalRumahRusak,
      k.terendam,
      k.fasilitas
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const jenisFilename = selectedJenis !== 'Semua' ? `_${selectedJenis.toLowerCase().replace(/\s+/g, '_')}` : '';
    link.setAttribute('download', `analisis_bencana_${provinsi.toLowerCase().replace(/\s+/g, '_')}${jenisFilename}_${startTahun}_${endTahun}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: keyof KabupatenItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Dialog Container */}
      <div 
        className="w-full max-w-7xl h-[94vh] max-h-[950px] flex flex-col rounded-3xl overflow-hidden shadow-2xl border transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-faint)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* ============================================================
            1. MODAL HEADER (TEAL / BLUE GRADIENT)
            ============================================================ */}
        <div 
          className="text-white px-5 py-4 border-b border-[#00695c] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-md"
          style={{
            background: 'linear-gradient(135deg, rgb(25, 79, 112), rgb(15, 55, 80))'
          }}
        >
          {/* Title and Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
              <MapPin className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Provinsi {provinsi}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-800/90 text-teal-100 border border-teal-600 font-bold">
                  {provinceKpi.totalKabupaten} Kabupaten/Kota Terdampak
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold">
                  Tahun {startTahun} - {endTahun}
                </span>
                {selectedJenis !== 'Semua' && (
                  <span 
                    className="text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-xs border animate-in fade-in"
                    style={{ 
                      backgroundColor: currentTheme.light, 
                      color: '#ffffff', 
                      borderColor: currentTheme.border 
                    }}
                  >
                    <span>{currentTheme.icon}</span>
                    <span>Filter: {selectedJenis}</span>
                    <button
                      onClick={() => setSelectedJenis('Semua')}
                      className="ml-1 hover:text-rose-300 font-black cursor-pointer text-xs"
                      title="Hapus filter jenis bencana"
                    >
                      &times;
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-teal-100/80 font-medium">
                Peta Spasial Batas Wilayah BAPPENAS 50K &middot; Analisis Level Kabupaten/Kota
              </p>
            </div>
          </div>

          {/* Action Tabs & Close */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* View Tabs */}
            <div className="bg-black/25 p-1 rounded-xl flex items-center gap-1 border border-white/10 text-xs font-bold">
              <button
                onClick={() => setActiveTab('peta')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'peta' ? 'bg-[#00695c] text-white shadow-xs' : 'text-teal-100 hover:bg-white/10'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Peta &amp; Spasial</span>
              </button>

              <button
                onClick={() => setActiveTab('grafik')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'grafik' ? 'bg-[#00695c] text-white shadow-xs' : 'text-teal-100 hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Grafik Lengkap</span>
              </button>

              <button
                onClick={() => setActiveTab('tabel')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'tabel' ? 'bg-[#00695c] text-white shadow-xs' : 'text-teal-100 hover:bg-white/10'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabel Data ({kabupatenStats.length})</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-600/80 text-white flex items-center justify-center transition-colors border border-white/20 ml-2 cursor-pointer"
              title="Tutup (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================
            2. TOP KPI SUMMARY STRIP (MATERIAL CHIPS)
            ============================================================ */}
        <div 
          className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0 text-xs shadow-inner"
          style={{ background: '#477997' }}
        >
          {/* Total Kejadian */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#194f70] flex items-center justify-center text-white font-bold shadow-xs">
              <ShieldAlert className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-medium">TOTAL KEJADIAN</div>
              <div className="text-xs font-black text-slate-900 dark:text-white">
                {provinceKpi.kejadian.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Korban Meninggal */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Users className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-medium">MENINGGAL DUNIA</div>
              <div className="text-xs font-black text-rose-600">
                {provinceKpi.meninggal.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Mengungsi */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Users className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-medium">MENGUNGSI / TERDAMPAK</div>
              <div className="text-xs font-black text-amber-600">
                {provinceKpi.pengungsi.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Rumah Rusak */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Home className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-medium">RUMAH RUSAK</div>
              <div className="text-xs font-black text-emerald-600">
                {provinceKpi.rumahRusak.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Rumah Terendam */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Home className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-medium">RUMAH TERENDAM</div>
              <div className="text-xs font-black text-blue-600">
                {provinceKpi.terendam.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Fasilitas Publik */}
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Building2 className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-medium">FASILITAS PUBLIK</div>
              <div className="text-xs font-black text-purple-600">
                {provinceKpi.fasilitas.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            DISASTER FILTER QUICK CHIPS BAR
            ============================================================ */}
        <div 
          className="px-5 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 shadow-2xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-faint)'
          }}
        >
          <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Filter Bencana:</span>
          </div>

          {/* Button Semua */}
          <button
            onClick={() => setSelectedJenis('Semua')}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
              selectedJenis === 'Semua'
                ? 'bg-[#00695c] text-white border-[#00695c] shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>🌐</span>
            <span>Semua Bencana ({Math.round(allProvinceTotalKejadian).toLocaleString('id-ID')})</span>
          </button>

          {/* Disaster Options present in this province */}
          {allDisasterTypeDistribution.map(d => {
            const isSelected = selectedJenis === d.name;
            const theme = DISASTER_THEMES[d.name] || { main: d.color, icon: '⚠️', light: `${d.color}20`, border: d.color };
            return (
              <button
                key={d.name}
                onClick={() => setSelectedJenis(isSelected ? 'Semua' : d.name)}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                style={isSelected ? { backgroundColor: theme.main, borderColor: theme.border } : {}}
              >
                <span>{theme.icon}</span>
                <span>{d.name}</span>
                <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {d.value.toLocaleString('id-ID')}
                </span>
              </button>
            );
          })}
        </div>

        {/* ============================================================
            3. TAB CONTENT AREA
            ============================================================ */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          
          {/* ---------------- TAB 1: PETA & SPASIAL (SPLIT VIEW) ---------------- */}
          {activeTab === 'peta' && (
            <div className="h-full flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[480px]">
                
                {/* Left Side (7 Cols): Interactive Leaflet Map with Bappenas WMS */}
                <div className="lg:col-span-7 flex flex-col gap-2 h-full min-h-[450px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                        {selectedJenis !== 'Semua' ? (
                          <>
                            <span>Peta Sebaran:</span>
                            <span style={{ color: currentTheme.main }} className="font-black flex items-center gap-1">
                              <span>{currentTheme.icon}</span>
                              <span>{selectedJenis}</span>
                            </span>
                            <span className="text-slate-400">&middot;</span>
                            <span>Provinsi {provinsi}</span>
                          </>
                        ) : (
                          <>Peta Wilayah Administrasi Kab/Kota &middot; Provinsi {provinsi}</>
                        )}
                      </span>
                    </div>

                    {selectedJenis !== 'Semua' && (
                      <button
                        onClick={() => setSelectedJenis('Semua')}
                        className="text-[10px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <span>Tampilkan Semua Bencana</span>
                      </button>
                    )}
                  </div>

                  <div className="flex-1 w-full h-full min-h-[420px] relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <ProvinceKabupatenMap
                      provinsi={provinsi}
                      kabupatenStats={kabupatenStats}
                      selectedKabupaten={selectedKabupaten}
                      onSelectKabupaten={(kab) => setSelectedKabupaten(kab)}
                      activeFilterJenis={selectedJenis}
                      onResetFilterJenis={() => setSelectedJenis('Semua')}
                    />
                  </div>
                </div>

                {/* Right Side (5 Cols): Grafik & Ringkasan Kabupaten */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  
                  {/* Card: Bar Chart Kejadian per Kab/Kota */}
                  <div 
                    className="p-4 rounded-2xl border flex flex-col justify-between"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-faint)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      height: '270px'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h4 className="font-black text-xs uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Kejadian {selectedJenis !== 'Semua' ? selectedJenis : 'Bencana'} Per Kab/Kota</span>
                        </h4>
                        <p className="text-[10px] text-slate-400">Total akumulasi peristiwa</p>
                      </div>
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                        {kabupatenStats.length} Wilayah
                      </span>
                    </div>

                    <div className="w-full h-[200px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={kabupatenStats.slice(0, 8)}
                          margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                          onClick={(e) => {
                            const evt = e as { activePayload?: Array<{ payload?: { nama?: string } }> } | null;
                            if (evt?.activePayload?.[0]?.payload?.nama) {
                              setSelectedKabupaten(evt.activePayload[0].payload.nama);
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" horizontal={true} vertical={false} />
                          <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 9 }} />
                          <YAxis 
                            type="category" 
                            dataKey="nama" 
                            stroke="var(--text-secondary)" 
                            tick={{ fontSize: 9, cursor: 'pointer' }} 
                            width={110} 
                          />
                          <Tooltip 
                            formatter={(value) => [`${Number(value || 0).toLocaleString()} Kejadian`, selectedJenis !== 'Semua' ? selectedJenis : 'Total']}
                            contentStyle={{
                              backgroundColor: 'var(--bg-card)',
                              borderColor: 'var(--border-faint)',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}
                          />
                          <Bar 
                            dataKey="kejadian" 
                            fill={selectedJenis !== 'Semua' ? currentTheme.main : '#00695c'} 
                            radius={[0, 4, 4, 0]} 
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Card: Proporsi Jenis Bencana di Provinsi Ini (Interactive) */}
                  <div 
                    className="p-4 rounded-2xl border flex flex-col justify-between"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-faint)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      height: '240px'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h4 className="font-black text-xs uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Komposisi Jenis Bencana di {provinsi}</span>
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {selectedJenis !== 'Semua' ? (
                            <span className="text-teal-600 dark:text-teal-400 font-bold">
                              Aktif: {selectedJenis} &middot; Klik untuk reset
                            </span>
                          ) : (
                            'Klik diagram untuk memfilter peta spasial'
                          )}
                        </p>
                      </div>
                      {selectedJenis !== 'Semua' ? (
                        <button
                          onClick={() => setSelectedJenis('Semua')}
                          className="text-[10px] font-extrabold text-rose-500 hover:underline bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900 cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      ) : (
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                          {allDisasterTypeDistribution.length} Tipe
                        </span>
                      )}
                    </div>

                    <div className="w-full h-[180px] flex items-center">
                      <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={allDisasterTypeDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={36}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="value"
                              cursor="pointer"
                              onClick={(entry) => {
                                if (entry && entry.name) {
                                  setSelectedJenis(selectedJenis === entry.name ? 'Semua' : entry.name);
                                }
                              }}
                            >
                              {allDisasterTypeDistribution.map((entry, index) => {
                                const isSelected = selectedJenis === entry.name;
                                return (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color} 
                                    stroke={isSelected ? '#ffffff' : 'transparent'}
                                    strokeWidth={isSelected ? 3 : 1}
                                    opacity={selectedJenis === 'Semua' || isSelected ? 1 : 0.4}
                                  />
                                );
                              })}
                            </Pie>
                            <Tooltip 
                              formatter={(val, name) => [
                                `${Number(val || 0).toLocaleString()} Kejadian (Klik untuk filter peta)`,
                                String(name)
                              ]}
                              contentStyle={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-faint)',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend List (Interactive) */}
                      <div className="w-1/2 flex flex-col gap-1.5 overflow-y-auto max-h-[160px] pr-1">
                        {allDisasterTypeDistribution.map((d) => {
                          const isSelected = selectedJenis === d.name;
                          return (
                            <button
                              key={d.name}
                              onClick={() => setSelectedJenis(isSelected ? 'Semua' : d.name)}
                              className={`flex items-center justify-between text-[10px] p-1 rounded-lg transition-all text-left cursor-pointer border ${
                                isSelected
                                  ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 shadow-2xs font-extrabold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                <span className="truncate">{d.name}</span>
                              </span>
                              <span className={`ml-2 shrink-0 ${isSelected ? 'text-teal-700 dark:text-teal-300 font-black' : 'font-extrabold text-slate-900 dark:text-white'}`}>
                                {d.value.toLocaleString('id-ID')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Quick Table Bar: Switch to Full Table */}
              <div 
                className="p-3.5 rounded-2xl border border-[#00695c] flex items-center justify-between gap-3 shadow-md text-white"
                style={{ background: 'linear-gradient(135deg, rgb(25, 79, 112), rgb(15, 55, 80))' }}
              >
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-teal-200" />
                  <span className="text-xs font-bold text-white">
                    Tersedia {kabupatenStats.length} Kabupaten/Kota dengan data lengkap korban &amp; infrastruktur.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('tabel')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Buka Tabel Seluruh Kab/Kota</span>
                  <ChevronRight className="w-3.5 h-3.5 text-teal-200" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- TAB 2: GRAFIK KOMPREHENSIF ---------------- */}
          {activeTab === 'grafik' && (
            <div className="space-y-5">
              {/* Row 1: Full Bar Chart of All Kabupaten */}
              <div 
                className="p-5 rounded-2xl border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white">
                      Perbandingan Seluruh Kabupaten / Kota di Provinsi {provinsi}
                    </h3>
                    <p className="text-xs text-slate-400">Total Kejadian vs Korban Meninggal vs Rumah Rusak</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tabel')}
                    className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline"
                  >
                    Buka dalam Format Tabel &rarr;
                  </button>
                </div>

                <div className="w-full h-[320px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kabupatenStats} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                      <XAxis 
                        dataKey="nama" 
                        stroke="var(--text-secondary)" 
                        tick={{ fontSize: 9 }} 
                        angle={-35} 
                        textAnchor="end" 
                        interval={0}
                      />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-faint)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="kejadian" name="Kejadian Bencana" fill="#00695c" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalRumahRusak" name="Rumah Rusak" fill="#15803d" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="meninggal" name="Korban Meninggal" fill="#b91c1c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 2: Tren Tahunan Area Chart */}
              <div 
                className="p-5 rounded-2xl border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white">
                      Tren Tahunan Kejadian Bencana di Provinsi {provinsi}
                    </h3>
                    <p className="text-xs text-slate-400">Fluktuasi bencana dari tahun ke tahun</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                    Tahun {startTahun} - {endTahun}
                  </span>
                </div>

                <div className="w-full h-[260px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yearlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProvKejadian" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00695c" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00695c" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                      <XAxis dataKey="tahun" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-faint)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="kejadian" 
                        name="Jumlah Kejadian" 
                        stroke="#00695c" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorProvKejadian)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- TAB 3: TABEL LENGKAP SELURUH KABUPATEN/KOTA ---------------- */}
          {activeTab === 'tabel' && (
            <div className="flex flex-col gap-3">
              {/* Search & Export Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama kabupaten / kota..."
                    value={searchKab}
                    onChange={(e) => setSearchKab(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                  {searchKab && (
                    <button
                      onClick={() => setSearchKab('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-xs text-slate-500 font-semibold">
                    Menampilkan <b className="text-slate-800 dark:text-slate-200">{filteredKabupatenList.length}</b> dari {kabupatenStats.length} Kab/Kota
                  </span>

                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-800 dark:text-teal-300 font-bold text-xs hover:bg-teal-50 dark:hover:bg-teal-950 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Download format CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor CSV</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[520px]">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead 
                      className="text-white uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-xs"
                      style={{ backgroundColor: 'rgb(18, 65, 93)', color: '#fff' }}
                    >
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center font-bold">No</th>
                        <th 
                          onClick={() => handleSort('nama')}
                          className="py-2.5 px-3 cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          <span className="flex items-center gap-1">
                            Kabupaten / Kota
                            <ArrowUpDown className="w-3 h-3 opacity-75" />
                          </span>
                        </th>
                        <th 
                          onClick={() => handleSort('kejadian')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          <span className="flex items-center justify-end gap-1">
                            Kejadian
                            <ArrowUpDown className="w-3 h-3 opacity-75" />
                          </span>
                        </th>
                        <th 
                          onClick={() => handleSort('meninggal')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          <span className="flex items-center justify-end gap-1">
                            Meninggal
                            <ArrowUpDown className="w-3 h-3 opacity-75" />
                          </span>
                        </th>
                        <th 
                          onClick={() => handleSort('hilang')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          Hilang
                        </th>
                        <th 
                          onClick={() => handleSort('luka')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          Luka
                        </th>
                        <th 
                          onClick={() => handleSort('pengungsi')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          <span className="flex items-center justify-end gap-1">
                            Mengungsi
                            <ArrowUpDown className="w-3 h-3 opacity-75" />
                          </span>
                        </th>
                        <th 
                          onClick={() => handleSort('rusakBerat')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          Rusak Berat
                        </th>
                        <th 
                          onClick={() => handleSort('rusakSedang')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          Rusak Sedang
                        </th>
                        <th 
                          onClick={() => handleSort('rusakRingan')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          Rusak Ringan
                        </th>
                        <th 
                          onClick={() => handleSort('totalRumahRusak')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          <span className="flex items-center justify-end gap-1">
                            Total Rusak
                            <ArrowUpDown className="w-3 h-3 opacity-75" />
                          </span>
                        </th>
                        <th 
                          onClick={() => handleSort('terendam')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          Terendam
                        </th>
                        <th 
                          onClick={() => handleSort('fasilitas')}
                          className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/10 transition-colors font-bold"
                        >
                          Fasilitas
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold">Aksi</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100">
                      {filteredKabupatenList.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="text-center py-8 text-slate-400 font-semibold">
                            Tidak ada data kabupaten yang cocok dengan pencarian &quot;{searchKab}&quot;.
                          </td>
                        </tr>
                      ) : (
                        filteredKabupatenList.map((kab, idx) => (
                          <tr 
                            key={kab.nama}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="py-2 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                              {kab.nama}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                              {kab.kejadian.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900 dark:text-white">
                              {kab.meninggal.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900 dark:text-white">
                              {kab.hilang.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900 dark:text-white">
                              {kab.luka.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900 dark:text-white">
                              {kab.pengungsi.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900 dark:text-white">
                              {kab.rusakBerat.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900 dark:text-white">
                              {kab.rusakSedang.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900 dark:text-white">
                              {kab.rusakRingan.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                              {kab.totalRumahRusak.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900 dark:text-white">
                              {kab.terendam.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-900 dark:text-white">
                              {kab.fasilitas.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedKabupaten(kab.nama);
                                  setActiveTab('peta');
                                }}
                                className="hover:underline font-bold text-xs inline-flex items-center gap-1 p-0 bg-transparent border-0 cursor-pointer"
                                style={{ color: 'rgb(18, 65, 93)' }}
                                title={`Fokus ke peta ${kab.nama}`}
                              >
                                <span>Peta</span>
                                <span aria-hidden="true">&rarr;</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {/* Footer Summary Row */}
                    <tfoot className="bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider text-[11px] font-black">
                          TOTAL PROVINSI {provinsi}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black">
                          {provinceKpi.kejadian.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {provinceKpi.meninggal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {provinceKpi.hilang.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {provinceKpi.luka.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {provinceKpi.pengungsi.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {kabupatenStats.reduce((s, k) => s + k.rusakBerat, 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {kabupatenStats.reduce((s, k) => s + k.rusakSedang, 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {kabupatenStats.reduce((s, k) => s + k.rusakRingan, 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black">
                          {provinceKpi.rumahRusak.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {provinceKpi.terendam.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {provinceKpi.fasilitas.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
