'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Users, Home, Building2, School, HeartPulse, 
  Filter, RotateCcw, Activity, Calendar, MapPin, Table as TableIcon,
  ShieldAlert, Layers, Search, Sparkles
} from 'lucide-react';

interface BencanaData {
  Tahun: number;
  Bulan: number;
  Minggu?: number;
  Provinsi: string;
  'Kode Provinsi'?: number | string;
  Kabupaten: string;
  'Kode Kabupaten'?: string;
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

// Material Design Color Palette
const MATERIAL_COLORS: Record<string, { main: string; light: string; text: string; icon: string }> = {
  'Semua': { main: '#00897b', light: 'rgba(0,137,123,0.12)', text: '#00897b', icon: '🌐' },
  'Banjir': { main: '#1e88e5', light: 'rgba(30,136,229,0.12)', text: '#1e88e5', icon: '💧' },
  'Longsor': { main: '#6d4c41', light: 'rgba(109,76,65,0.12)', text: '#6d4c41', icon: '⛰️' },
  'Cuaca ekstrem': { main: '#3949ab', light: 'rgba(57,73,171,0.12)', text: '#3949ab', icon: '🌪️' },
  'Kekeringan': { main: '#fbc02d', light: 'rgba(251,192,45,0.12)', text: '#fbc02d', icon: '☀️' },
  'Kebakaran hutan dan lahan': { main: '#e53935', light: 'rgba(229,57,53,0.12)', text: '#e53935', icon: '🔥' },
  'Gempabumi': { main: '#8e24aa', light: 'rgba(142,36,170,0.12)', text: '#8e24aa', icon: '🏚️' },
  'Gelombang pasang / Abrasi': { main: '#00acc1', light: 'rgba(0,172,193,0.12)', text: '#00acc1', icon: '🌊' },
  'Erupsi gunung api': { main: '#f4511e', light: 'rgba(244,81,30,0.12)', text: '#f4511e', icon: '🌋' },
  'Tsunami': { main: '#0288d1', light: 'rgba(2,136,209,0.12)', text: '#0288d1', icon: '🌊' }
};

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function AnalysisDashboard() {
  const [data, setData] = useState<BencanaData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedJenis, setSelectedJenis] = useState<string>('Semua');
  const [selectedProvinsi, setSelectedProvinsi] = useState<string>('Semua');
  const [selectedKabupaten, setSelectedKabupaten] = useState<string>('Semua');
  const [startTahun, setStartTahun] = useState<string>('2011');
  const [endTahun, setEndTahun] = useState<string>('2026');
  const [selectedBulan, setSelectedBulan] = useState<string>('Semua');

  // View & Interactive States
  const [activeTab, setActiveTab] = useState<'tren' | 'korban' | 'kerusakan' | 'tabel'>('tren');
  const [trendMetric, setTrendMetric] = useState<'kejadian' | 'meninggal' | 'pengungsi' | 'rumah'>('kejadian');
  const [searchTable, setSearchTable] = useState<string>('');

  useEffect(() => {
    fetch('/20260505_072732.json')
      .then(res => res.json())
      .then((json) => {
        const rows: BencanaData[] = json.Sheet1 ?? json;
        setData(rows);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data', err);
        setLoading(false);
      });
  }, []);

  // Available Years
  const availableTahun = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Tahun))).filter(Boolean).sort((a, b) => a - b);
  }, [data]);

  // Available Provinces
  const availableProvinsi = useMemo(() => {
    const list = data
      .filter(d => selectedJenis === 'Semua' || d['Jenis Bencana'] === selectedJenis)
      .map(d => d.Provinsi);
    return Array.from(new Set(list)).filter(Boolean).sort();
  }, [data, selectedJenis]);

  // Available Regencies (filtered by selected province)
  const availableKabupaten = useMemo(() => {
    const list = data
      .filter(d => {
        if (selectedJenis !== 'Semua' && d['Jenis Bencana'] !== selectedJenis) return false;
        if (selectedProvinsi !== 'Semua' && d.Provinsi !== selectedProvinsi) return false;
        return true;
      })
      .map(d => d.Kabupaten);
    return Array.from(new Set(list)).filter(Boolean).sort();
  }, [data, selectedJenis, selectedProvinsi]);

  // Reset regency if province changes and current regency is not in province
  useEffect(() => {
    if (selectedProvinsi === 'Semua') {
      setSelectedKabupaten('Semua');
    } else if (!availableKabupaten.includes(selectedKabupaten)) {
      setSelectedKabupaten('Semua');
    }
  }, [selectedProvinsi, availableKabupaten, selectedKabupaten]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (selectedJenis !== 'Semua' && d['Jenis Bencana'] !== selectedJenis) return false;
      if (selectedProvinsi !== 'Semua' && d.Provinsi !== selectedProvinsi) return false;
      if (selectedKabupaten !== 'Semua' && d.Kabupaten !== selectedKabupaten) return false;
      if (startTahun && d.Tahun < parseInt(startTahun)) return false;
      if (endTahun && d.Tahun > parseInt(endTahun)) return false;
      if (selectedBulan !== 'Semua' && d.Bulan !== parseInt(selectedBulan)) return false;
      return true;
    });
  }, [data, selectedJenis, selectedProvinsi, selectedKabupaten, startTahun, endTahun, selectedBulan]);

  // Reset Filters Function
  const handleResetFilters = () => {
    setSelectedJenis('Semua');
    setSelectedProvinsi('Semua');
    setSelectedKabupaten('Semua');
    setStartTahun('2011');
    setEndTahun('2026');
    setSelectedBulan('Semua');
    setSearchTable('');
  };

  // -------------------------------------------------------------
  // AGGREGATIONS & METRICS
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    let kejadian = 0;
    let meninggal = 0;
    let hilang = 0;
    let luka = 0;
    let pengungsi = 0;
    let rusakBerat = 0;
    let rusakSedang = 0;
    let rusakRingan = 0;
    let terendam = 0;
    let sekolah = 0;
    let faskes = 0;
    let ibadah = 0;
    let kantor = 0;
    let jembatan = 0;

    for (let i = 0; i < filteredData.length; i++) {
      const d = filteredData[i];
      kejadian += (d['Jumlah Kejadian'] || 0);
      meninggal += (d.Meninggal || 0);
      hilang += (d.Hilang || 0);
      luka += (d['Luka / Sakit'] || 0);
      pengungsi += (d.menderita_mengungsi || 0);
      rusakBerat += (d['Rumah Rusak Berat'] || 0);
      rusakSedang += (d['Rumah Rusak Sedang'] || 0);
      rusakRingan += (d['Rumah Rusak Ringan'] || 0);
      terendam += (d['Rumah Terendam'] || 0);
      sekolah += (d['Satuan Pendidikan Rusak'] || 0);
      faskes += (d['Fasilitas Pelayanan Kesehatan Rusak'] || 0);
      ibadah += (d['Rumah Ibadat Rusak'] || 0);
      kantor += (d['Kantor Rusak'] || 0);
      jembatan += (d['Jembatan Rusak'] || 0);
    }

    const totalRumahRusak = rusakBerat + rusakSedang + rusakRingan;
    const totalFasilitas = sekolah + faskes + ibadah + kantor + jembatan;

    return {
      kejadian: Math.round(kejadian),
      meninggal,
      hilang,
      korbanJiwa: meninggal + hilang,
      luka,
      pengungsi,
      rusakBerat,
      rusakSedang,
      rusakRingan,
      totalRumahRusak,
      terendam,
      sekolah,
      faskes,
      ibadah,
      kantor,
      jembatan,
      totalFasilitas
    };
  }, [filteredData]);

  // 1. Time Series: Per Tahun
  const yearlyTrendData = useMemo(() => {
    const map: Record<number, { 
      year: number; 
      kejadian: number; 
      meninggal: number; 
      pengungsi: number; 
      rumah: number;
    }> = {};

    filteredData.forEach(d => {
      const y = d.Tahun;
      if (!y) return;
      if (!map[y]) {
        map[y] = { year: y, kejadian: 0, meninggal: 0, pengungsi: 0, rumah: 0 };
      }
      map[y].kejadian += (d['Jumlah Kejadian'] || 0);
      map[y].meninggal += (d.Meninggal || 0) + (d.Hilang || 0);
      map[y].pengungsi += (d.menderita_mengungsi || 0);
      map[y].rumah += (d['Rumah Rusak Berat'] || 0) + (d['Rumah Rusak Sedang'] || 0) + (d['Rumah Rusak Ringan'] || 0);
    });

    return Object.values(map)
      .map(item => ({
        ...item,
        kejadian: Math.round(item.kejadian),
        pengungsiK: Math.round(item.pengungsi / 1000)
      }))
      .sort((a, b) => a.year - b.year);
  }, [filteredData]);

  // 2. Seasonal: Per Bulan (Jan - Des)
  const monthlySeasonData = useMemo(() => {
    const monthCounts = Array(12).fill(0).map((_, i) => ({
      bulanNum: i + 1,
      nama: BULAN_NAMES[i].slice(0, 3).toUpperCase(),
      namaLengkap: BULAN_NAMES[i],
      kejadian: 0,
      meninggal: 0,
      terendam: 0
    }));

    filteredData.forEach(d => {
      if (d.Bulan && d.Bulan >= 1 && d.Bulan <= 12) {
        monthCounts[d.Bulan - 1].kejadian += (d['Jumlah Kejadian'] || 0);
        monthCounts[d.Bulan - 1].meninggal += (d.Meninggal || 0);
        monthCounts[d.Bulan - 1].terendam += (d['Rumah Terendam'] || 0);
      }
    });

    return monthCounts.map(m => ({
      ...m,
      kejadian: Math.round(m.kejadian)
    }));
  }, [filteredData]);

  // 3. Distribusi: Per Jenis Bencana
  const disasterTypeData = useMemo(() => {
    const map: Record<string, { 
      name: string; 
      kejadian: number; 
      meninggal: number; 
      pengungsi: number;
      rumah: number;
    }> = {};

    filteredData.forEach(d => {
      const type = d['Jenis Bencana'];
      if (!type) return;
      if (!map[type]) {
        map[type] = { name: type, kejadian: 0, meninggal: 0, pengungsi: 0, rumah: 0 };
      }
      map[type].kejadian += (d['Jumlah Kejadian'] || 0);
      map[type].meninggal += (d.Meninggal || 0);
      map[type].pengungsi += (d.menderita_mengungsi || 0);
      map[type].rumah += (d['Rumah Rusak Berat'] || 0) + (d['Rumah Rusak Sedang'] || 0) + (d['Rumah Rusak Ringan'] || 0);
    });

    return Object.values(map)
      .map(item => ({ ...item, kejadian: Math.round(item.kejadian) }))
      .sort((a, b) => b.kejadian - a.kejadian);
  }, [filteredData]);

  // 4. Spatial: Top 10 Provinsi
  const topProvinceData = useMemo(() => {
    const map: Record<string, { 
      provinsi: string; 
      kejadian: number; 
      meninggal: number; 
      pengungsi: number; 
      rumah: number;
    }> = {};

    filteredData.forEach(d => {
      const p = d.Provinsi;
      if (!p) return;
      if (!map[p]) {
        map[p] = { provinsi: p, kejadian: 0, meninggal: 0, pengungsi: 0, rumah: 0 };
      }
      map[p].kejadian += (d['Jumlah Kejadian'] || 0);
      map[p].meninggal += (d.Meninggal || 0);
      map[p].pengungsi += (d.menderita_mengungsi || 0);
      map[p].rumah += (d['Rumah Rusak Berat'] || 0) + (d['Rumah Rusak Sedang'] || 0) + (d['Rumah Rusak Ringan'] || 0);
    });

    return Object.values(map)
      .map(item => ({ ...item, kejadian: Math.round(item.kejadian) }))
      .sort((a, b) => b.kejadian - a.kejadian)
      .slice(0, 10);
  }, [filteredData]);

  // 5. Fasilitas Publik Breakdown
  const fasilitasData = useMemo(() => {
    return [
      { name: 'Sekolah', total: kpis.sekolah, fill: '#1e88e5' },
      { name: 'Rumah Ibadah', total: kpis.ibadah, fill: '#00897b' },
      { name: 'Faskes / RS', total: kpis.faskes, fill: '#e53935' },
      { name: 'Kantor Pemda', total: kpis.kantor, fill: '#8e24aa' },
      { name: 'Jembatan', total: kpis.jembatan, fill: '#fb8c00' }
    ];
  }, [kpis]);

  // 6. Kerusakan Rumah Breakdown
  const kerusakanRumahData = useMemo(() => {
    return [
      { name: 'Rusak Ringan', jumlah: kpis.rusakRingan, fill: '#42a5f5' },
      { name: 'Rusak Sedang', jumlah: kpis.rusakSedang, fill: '#ffa726' },
      { name: 'Rusak Berat', jumlah: kpis.rusakBerat, fill: '#e53935' },
    ];
  }, [kpis]);

  // 7. Tabel Data per Kabupaten/Kota
  const regencyTableData = useMemo(() => {
    const map: Record<string, {
      kabupaten: string;
      provinsi: string;
      kejadian: number;
      meninggal: number;
      luka: number;
      pengungsi: number;
      rumahRusak: number;
      fasilitasRusak: number;
      utama: Record<string, number>;
    }> = {};

    filteredData.forEach(d => {
      const kab = d.Kabupaten;
      if (!kab) return;
      const key = `${d.Provinsi || ''}-${kab}`;
      if (!map[key]) {
        map[key] = {
          kabupaten: kab,
          provinsi: d.Provinsi || '-',
          kejadian: 0,
          meninggal: 0,
          luka: 0,
          pengungsi: 0,
          rumahRusak: 0,
          fasilitasRusak: 0,
          utama: {}
        };
      }
      map[key].kejadian += (d['Jumlah Kejadian'] || 0);
      map[key].meninggal += (d.Meninggal || 0);
      map[key].luka += (d['Luka / Sakit'] || 0);
      map[key].pengungsi += (d.menderita_mengungsi || 0);
      map[key].rumahRusak += (d['Rumah Rusak Berat'] || 0) + (d['Rumah Rusak Sedang'] || 0) + (d['Rumah Rusak Ringan'] || 0);
      map[key].fasilitasRusak += (d['Satuan Pendidikan Rusak'] || 0) + (d['Rumah Ibadat Rusak'] || 0) + (d['Fasilitas Pelayanan Kesehatan Rusak'] || 0) + (d['Kantor Rusak'] || 0) + (d['Jembatan Rusak'] || 0);
      
      const type = d['Jenis Bencana'];
      if (type) {
        map[key].utama[type] = (map[key].utama[type] || 0) + (d['Jumlah Kejadian'] || 0);
      }
    });

    return Object.values(map)
      .map(item => {
        let maxCount = -1;
        let topBencana = '-';
        Object.entries(item.utama).forEach(([k, v]) => {
          if (v > maxCount) {
            maxCount = v;
            topBencana = k;
          }
        });
        return {
          ...item,
          kejadian: Math.round(item.kejadian),
          bencanaDominan: topBencana
        };
      })
      .filter(item => {
        if (!searchTable) return true;
        const q = searchTable.toLowerCase();
        return item.kabupaten.toLowerCase().includes(q) || item.provinsi.toLowerCase().includes(q);
      })
      .sort((a, b) => b.kejadian - a.kejadian);
  }, [filteredData, searchTable]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-primary)' }}>
        <div className="w-10 h-10 rounded-full border-3 border-teal-600 border-t-transparent animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-teal-700 animate-pulse">
          Memuat Data Agregasi Bencana Nasional...
        </p>
      </div>
    );
  }

  // Material Design Custom Tooltip
  const customTooltipStyle = {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)',
    fontSize: '11px',
    padding: '10px 14px'
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-xs font-sans select-none" style={{ color: 'var(--text-primary)' }}>
      
      {/* ============================================================
          1. MATERIAL APP BAR & COMMAND FILTER TOOLBAR (z-depth-1)
          ============================================================ */}
      <div 
        className="flex-none p-3.5 space-y-3 transition-all duration-300"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          boxShadow: '0 2px 4px -1px rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.05)',
          borderBottom: '1px solid var(--border-faint)'
        }}
      >
        {/* Row 1: Flow 1 - Material Chips Filter (Jenis Bencana) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
            <span className="font-black text-[11px] uppercase tracking-wider text-teal-700 dark:text-teal-300">
              Alur 1 · Jenis Bencana:
            </span>
          </div>

          {/* Chips Horizontal Scrollable (Materialize Chip Style) */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {Object.entries(MATERIAL_COLORS).map(([jenis, cfg]) => {
              const isSelected = selectedJenis === jenis;
              return (
                <button
                  key={jenis}
                  onClick={() => setSelectedJenis(jenis)}
                  className="px-3 py-1 rounded-full font-bold text-[10.5px] whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: isSelected ? cfg.main : 'var(--bg-page)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: isSelected 
                      ? '0 3px 6px -1px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.12)' 
                      : 'none',
                    border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                    transform: isSelected ? 'translateY(-1px)' : 'none'
                  }}
                >
                  <span className="text-xs">{cfg.icon}</span>
                  <span>{jenis}</span>
                </button>
              );
            })}
          </div>

          {/* Reset Button (Material Flat Raised) */}
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'rgba(229,57,53,0.1)',
              color: '#e53935',
              border: '1px solid rgba(229,57,53,0.25)'
            }}
            title="Reset semua filter"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Row 2: Secondary Dropdown Filters (Material Select Field) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-faint)' }}>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>Dimensi Wilayah & Waktu:</span>
          </div>

          {/* Dropdown Provinsi */}
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-teal-600" />
            <select
              value={selectedProvinsi}
              onChange={(e) => setSelectedProvinsi(e.target.value)}
              className="p-1.5 px-2.5 rounded-lg text-[11px] font-bold border outline-none cursor-pointer shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="Semua">Semua Provinsi ({availableProvinsi.length})</option>
              {availableProvinsi.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* Dropdown Kabupaten */}
          <div className="flex items-center gap-1">
            <select
              value={selectedKabupaten}
              onChange={(e) => setSelectedKabupaten(e.target.value)}
              disabled={availableKabupaten.length === 0}
              className="p-1.5 px-2.5 rounded-lg text-[11px] font-bold border outline-none cursor-pointer shadow-2xs disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="Semua">Semua Kab/Kota ({availableKabupaten.length})</option>
              {availableKabupaten.map(kab => (
                <option key={kab} value={kab}>{kab}</option>
              ))}
            </select>
          </div>

          {/* Rentang Tahun */}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-sky-600" />
            <select
              value={startTahun}
              onChange={(e) => setStartTahun(e.target.value)}
              className="p-1.5 px-2 rounded-lg text-[11px] font-bold border outline-none cursor-pointer shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              {availableTahun.map(y => (
                <option key={`start-${y}`} value={y}>{y}</option>
              ))}
            </select>
            <span className="text-slate-400 font-bold">-</span>
            <select
              value={endTahun}
              onChange={(e) => setEndTahun(e.target.value)}
              className="p-1.5 px-2 rounded-lg text-[11px] font-bold border outline-none cursor-pointer shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              {availableTahun.map(y => (
                <option key={`end-${y}`} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Filter Bulan */}
          <div className="flex items-center gap-1">
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="p-1.5 px-2.5 rounded-lg text-[11px] font-bold border outline-none cursor-pointer shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="Semua">Sepanjang Tahun (12 Bulan)</option>
              {BULAN_NAMES.map((bName, idx) => (
                <option key={bName} value={idx + 1}>Bulan: {bName}</option>
              ))}
            </select>
          </div>

          {/* Filter Count Badge Material */}
          <div 
            className="ml-auto text-[10.5px] font-black uppercase tracking-wider px-3 py-1 rounded-full text-white shadow-xs bg-teal-700 dark:bg-teal-600"
          >
            <span>{filteredData.length.toLocaleString()} Data Terfilter</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. MATERIAL 6 KPI CARD PANELS (z-depth-1, hoverable)
          ============================================================ */}
      <div className="flex-none px-4 pt-3 pb-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* KPI 1: Total Kejadian */}
        <div 
          className="p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-faint)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Kejadian</span>
            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#1e88e5]">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1e88e5] mt-1">
            {kpis.kejadian.toLocaleString()}
          </div>
          <div className="text-[9.5px] text-slate-400 font-medium">Bencana terverifikasi</div>
        </div>

        {/* KPI 2: Korban Jiwa */}
        <div 
          className="p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-faint)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Meninggal/Hilang</span>
            <div className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-[#e53935]">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#e53935] mt-1">
            {kpis.korbanJiwa.toLocaleString()}
          </div>
          <div className="text-[9.5px] text-slate-400 font-medium">{kpis.meninggal.toLocaleString()} tewas · {kpis.hilang} hilang</div>
        </div>

        {/* KPI 3: Pengungsi & Menderita */}
        <div 
          className="p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-faint)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Pengungsi</span>
            <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-[#fb8c00]">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#fb8c00] mt-1">
            {kpis.pengungsi >= 1000000 
              ? `${(kpis.pengungsi / 1000000).toFixed(1)} Juta` 
              : kpis.pengungsi.toLocaleString()}
          </div>
          <div className="text-[9.5px] text-slate-400 font-medium">Jiwa butuh bantuan</div>
        </div>

        {/* KPI 4: Rumah Rusak */}
        <div 
          className="p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-faint)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Rumah Rusak</span>
            <div className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-[#f4511e]">
              <Home className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#f4511e] mt-1">
            {kpis.totalRumahRusak.toLocaleString()}
          </div>
          <div className="text-[9.5px] text-slate-400 font-medium">{kpis.rusakBerat.toLocaleString()} rusak berat</div>
        </div>

        {/* KPI 5: Rumah Terendam */}
        <div 
          className="p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-faint)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Terendam</span>
            <div className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-[#00acc1]">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#00acc1] mt-1">
            {kpis.terendam >= 1000000 
              ? `${(kpis.terendam / 1000000).toFixed(1)} Juta` 
              : kpis.terendam.toLocaleString()}
          </div>
          <div className="text-[9.5px] text-slate-400 font-medium">Banjir & rob pemukiman</div>
        </div>

        {/* KPI 6: Fasilitas Publik Rusak */}
        <div 
          className="p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-faint)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Fasilitas Publik</span>
            <div className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-[#8e24aa]">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#8e24aa] mt-1">
            {kpis.totalFasilitas.toLocaleString()}
          </div>
          <div className="text-[9.5px] text-slate-400 font-medium">Sekolah, faskes, jembatan</div>
        </div>
      </div>

      {/* ============================================================
          3. MATERIAL TABS NAVIGATION (tabs with active indicator)
          ============================================================ */}
      <div 
        className="flex-none px-4 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--border-faint)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('tren')}
            className={`px-4 py-2.5 font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'tren' 
                ? 'border-teal-700 text-teal-800 dark:text-teal-300 dark:border-teal-400' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>1. Tren Waktu & Musim</span>
          </button>

          <button
            onClick={() => setActiveTab('korban')}
            className={`px-4 py-2.5 font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'korban' 
                ? 'border-teal-700 text-teal-800 dark:text-teal-300 dark:border-teal-400' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Dampak Jiwa & Pengungsi</span>
          </button>

          <button
            onClick={() => setActiveTab('kerusakan')}
            className={`px-4 py-2.5 font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'kerusakan' 
                ? 'border-teal-700 text-teal-800 dark:text-teal-300 dark:border-teal-400' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>3. Kerusakan Fisik & Fasilitas</span>
          </button>

          <button
            onClick={() => setActiveTab('tabel')}
            className={`px-4 py-2.5 font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'tabel' 
                ? 'border-teal-700 text-teal-800 dark:text-teal-300 dark:border-teal-400' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>4. Eksplorasi Wilayah (Tabel)</span>
          </button>
        </div>

        {/* Metric Switcher on Trend Tab (Material Button Group) */}
        {activeTab === 'tren' && (
          <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl my-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 px-1.5">Metrik:</span>
            {(['kejadian', 'meninggal', 'pengungsi', 'rumah'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setTrendMetric(metric)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  trendMetric === metric 
                    ? 'bg-teal-700 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {metric}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================
          4. MAIN CONTENT CARDS (Tab Panels with Material Cards)
          ============================================================ */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        
        {/* ------------------------------------------------------------
            TAB 1: TREN WAKTU & POLA MUSIMAN
            ------------------------------------------------------------ */}
        {activeTab === 'tren' && (
          <div className="space-y-4">
            {/* Top Row: Tren Tahunan Area Chart (8 Cols) & Top 10 Provinsi (4 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Card 1: Kronologis Per Tahun */}
              <div 
                className="lg:col-span-8 p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '350px'
                }}
              >
                {/* Material Card Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                        Tren Kronologis Per Tahun ({startTahun} - {endTahun})
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">Pergerakan historis berdasarkan metrik: {trendMetric}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    Area View
                  </span>
                </div>

                <div className="w-full h-[270px] min-h-[270px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yearlyTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="materialAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00897b" stopOpacity={0.45}/>
                          <stop offset="95%" stopColor="#00897b" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                      <XAxis dataKey="year" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Area 
                        type="monotone" 
                        dataKey={trendMetric === 'pengungsi' ? 'pengungsiK' : trendMetric} 
                        stroke="#00897b" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#materialAreaGrad)" 
                        name={trendMetric === 'pengungsi' ? 'Pengungsi (Ribuan)' : trendMetric}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Top 10 Provinsi Bar Chart */}
              <div 
                className="lg:col-span-4 p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '350px'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#1e88e5]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                      Top 10 Provinsi Terdampak
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Akumulasi kejadian bencana</p>
                  </div>
                </div>

                <div className="w-full h-[270px] min-h-[270px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={topProvinceData} margin={{ top: 0, right: 10, left: 15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 9 }} />
                      <YAxis type="category" dataKey="provinsi" stroke="var(--text-secondary)" tick={{ fontSize: 9 }} width={80} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="kejadian" fill="#1e88e5" radius={[0, 4, 4, 0]} name="Kejadian" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Row: Pola Musiman Per Bulan (7 Cols) & Proporsi Jenis Bencana Donut (5 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Card 3: Pola Musiman Bulanan */}
              <div 
                className="lg:col-span-7 p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '330px'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[#3949ab]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                      Pola Kerentanan Musiman (Per Bulan: Jan - Des)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Lonjakan siklus hidrometeorologi basah & kering tahunan</p>
                  </div>
                </div>

                <div className="w-full h-[250px] min-h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySeasonData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                      <XAxis dataKey="nama" stroke="var(--text-secondary)" tick={{ fontSize: 9.5 }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="kejadian" fill="#3949ab" radius={[4, 4, 0, 0]} name="Kejadian" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 4: Donut Proporsi Bencana */}
              <div 
                className="lg:col-span-5 p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '330px'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-[#fb8c00]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                      Distribusi Jenis Kejadian
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Komposisi multisektoral</p>
                  </div>
                </div>

                <div className="w-full h-[250px] min-h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={disasterTypeData} 
                        dataKey="kejadian" 
                        nameKey="name" 
                        cx="42%" 
                        cy="50%" 
                        innerRadius={45} 
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {disasterTypeData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={MATERIAL_COLORS[entry.name]?.main || '#00897b'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle" 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '9.5px', lineHeight: '15px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------
            TAB 2: DAMPAK KEMANUSIAAN & PENGUNGSIAN
            ------------------------------------------------------------ */}
        {activeTab === 'korban' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Card 1: Fatalitas Per Bencana (7 Cols) */}
              <div 
                className="lg:col-span-7 p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '350px'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-[#e53935]">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                      Tingkat Fatalitas Jiwa Per Jenis Bencana
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Bencana dengan rasio korban mematikan tertinggi</p>
                  </div>
                </div>

                <div className="w-full h-[270px] min-h-[270px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={disasterTypeData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="var(--text-secondary)" 
                        tick={{ fontSize: 9 }} 
                        angle={-20} 
                        textAnchor="end"
                      />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="meninggal" fill="#e53935" name="Meninggal Dunia" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Pengungsi Per Provinsi (5 Cols) */}
              <div 
                className="lg:col-span-5 p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '350px'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-[#fb8c00]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                      Top Wilayah Beban Pengungsian
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Populasi menderita dan mengungsi</p>
                  </div>
                </div>

                <div className="w-full h-[270px] min-h-[270px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={topProvinceData} margin={{ top: 0, right: 10, left: 15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 9 }} />
                      <YAxis type="category" dataKey="provinsi" stroke="var(--text-secondary)" tick={{ fontSize: 9 }} width={80} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="pengungsi" fill="#fb8c00" radius={[0, 4, 4, 0]} name="Pengungsi / Menderita" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Material Quick Stat Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border flex items-center gap-3.5 shadow-2xs" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}>
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Tingkat Fatalitas</div>
                  <div className="text-base font-black">
                    {kpis.kejadian > 0 ? (kpis.korbanJiwa / kpis.kejadian).toFixed(2) : 0} Jiwa / Kejadian
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border flex items-center gap-3.5 shadow-2xs" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}>
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Rasio Pengungsi</div>
                  <div className="text-base font-black">
                    {kpis.kejadian > 0 ? Math.round(kpis.pengungsi / kpis.kejadian).toLocaleString() : 0} Warga / Kejadian
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border flex items-center gap-3.5 shadow-2xs" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}>
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider">Total Terdampak Luas</div>
                  <div className="text-base font-black">
                    {(kpis.pengungsi + kpis.luka).toLocaleString()} Jiwa
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------
            TAB 3: KERUSAKAN PEMUKIMAN & FASILITAS
            ------------------------------------------------------------ */}
        {activeTab === 'kerusakan' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Card 1: Fasilitas Publik Vital Rusak (6 Cols) */}
              <div 
                className="lg:col-span-6 p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '350px'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#1e88e5]">
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                      Fasilitas Pelayanan Publik Rusak
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Sekolah, faskes, peribadatan, kantor, jembatan</p>
                  </div>
                </div>

                <div className="w-full h-[270px] min-h-[270px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fasilitasData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Unit Rusak">
                        {fasilitasData.map((entry, index) => (
                          <Cell key={`cell-fasilitas-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Gradasi Kerusakan Rumah (6 Cols) */}
              <div 
                className="lg:col-span-6 p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '350px'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-[#f4511e]">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                      Gradasi Kerusakan Rumah (Berat vs Sedang vs Ringan)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Acuan estimasi kebutuhan rehabilitasi hunian warga</p>
                  </div>
                </div>

                <div className="w-full h-[270px] min-h-[270px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kerusakanRumahData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} name="Unit Rumah">
                        {kerusakanRumahData.map((entry, index) => (
                          <Cell key={`cell-rumah-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Card 3: Top 10 Provinsi Kerusakan Rumah */}
            <div 
              className="p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300"
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderColor: 'var(--border-faint)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                height: '330px'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-[#8e24aa]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                    Top 10 Provinsi dengan Kerusakan Pemukiman Terbanyak
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Akumulasi rumah rusak berat, sedang, dan ringan</p>
                </div>
              </div>

              <div className="w-full h-[250px] min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProvinceData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                    <XAxis dataKey="provinsi" stroke="var(--text-secondary)" tick={{ fontSize: 9.5 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="rumah" fill="#8e24aa" radius={[4, 4, 0, 0]} name="Total Rumah Rusak" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------
            TAB 4: EKSPLORASI WILAYAH & DATA TABLE MATERIALIZE
            ------------------------------------------------------------ */}
        {activeTab === 'tabel' && (
          <div 
            className="p-4 rounded-2xl border flex flex-col shadow-xs space-y-3"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
          >
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                  <TableIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    Matriks Rekapitulasi Bencana Kabupaten / Kota
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">Daftar agregasi komparatif per wilayah otonom</p>
                </div>
              </div>

              {/* Material Search Input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kabupaten atau provinsi..."
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none font-bold shadow-2xs transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Material Responsive Table */}
            <div className="overflow-x-auto border rounded-xl" style={{ borderColor: 'var(--border-faint)' }}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr 
                    className="border-b font-black text-[10px] uppercase tracking-wider text-slate-500"
                    style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-faint)' }}
                  >
                    <th className="p-3 pl-4">No</th>
                    <th className="p-3">Kabupaten / Kota</th>
                    <th className="p-3">Provinsi</th>
                    <th className="p-3 text-right">Kejadian</th>
                    <th className="p-3 text-right">Meninggal</th>
                    <th className="p-3 text-right">Pengungsi</th>
                    <th className="p-3 text-right">Rumah Rusak</th>
                    <th className="p-3 text-right">Fasilitas</th>
                    <th className="p-3 pr-4 text-center">Bencana Dominan</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-faint)' }}>
                  {regencyTableData.slice(0, 100).map((row, idx) => {
                    const dominanCol = MATERIAL_COLORS[row.bencanaDominan]?.main || '#00897b';
                    return (
                      <tr 
                        key={`${row.provinsi}-${row.kabupaten}`} 
                        className="hover:bg-teal-500/5 transition-colors font-medium text-[11px]"
                      >
                        <td className="p-3 pl-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-bold" style={{ color: 'var(--text-primary)' }}>{row.kabupaten}</td>
                        <td className="p-3 text-slate-500">{row.provinsi}</td>
                        <td className="p-3 text-right font-black text-[#1e88e5]">{row.kejadian.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-[#e53935]">{row.meninggal.toLocaleString()}</td>
                        <td className="p-3 text-right text-[#fb8c00] font-bold">{row.pengungsi.toLocaleString()}</td>
                        <td className="p-3 text-right text-[#f4511e] font-semibold">{row.rumahRusak.toLocaleString()}</td>
                        <td className="p-3 text-right text-[#8e24aa] font-semibold">{row.fasilitasRusak.toLocaleString()}</td>
                        <td className="p-3 pr-4 text-center">
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-white shadow-xs"
                            style={{ backgroundColor: dominanCol }}
                          >
                            {row.bencanaDominan}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {regencyTableData.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                        Tidak ada kabupaten/kota yang sesuai dengan filter atau pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-medium pt-1 px-1">
              <span>Menampilkan {Math.min(100, regencyTableData.length)} dari {regencyTableData.length} entitas wilayah</span>
              <span className="font-extrabold text-teal-700 dark:text-teal-300">Urutan Prioritas Kejadian Tertinggi</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
