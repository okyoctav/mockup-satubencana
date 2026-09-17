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

const BENCANA_COLORS: Record<string, string> = {
  'Semua': '#0284c7',
  'Banjir': '#3B82F6',
  'Longsor': '#854D0E',
  'Cuaca ekstrem': '#6366F1',
  'Kekeringan': '#D97706',
  'Kebakaran hutan dan lahan': '#EF4444',
  'Gempabumi': '#8B5CF6',
  'Gelombang pasang / Abrasi': '#06B6D4',
  'Erupsi gunung api': '#F97316',
  'Tsunami': '#0EA5E9'
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
      nama: BULAN_NAMES[i].slice(0, 3),
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
      { name: 'Sekolah', total: kpis.sekolah, fill: '#3B82F6' },
      { name: 'Fasilitas Ibadah', total: kpis.ibadah, fill: '#10B981' },
      { name: 'Faskes / RS', total: kpis.faskes, fill: '#EF4444' },
      { name: 'Kantor', total: kpis.kantor, fill: '#8B5CF6' },
      { name: 'Jembatan', total: kpis.jembatan, fill: '#F59E0B' }
    ];
  }, [kpis]);

  // 6. Kerusakan Rumah Breakdown
  const kerusakanRumahData = useMemo(() => {
    return [
      { name: 'Rusak Ringan', jumlah: kpis.rusakRingan, fill: '#60A5FA' },
      { name: 'Rusak Sedang', jumlah: kpis.rusakSedang, fill: '#F59E0B' },
      { name: 'Rusak Berat', jumlah: kpis.rusakBerat, fill: '#EF4444' },
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'rgb(25, 79, 112)' }}></div>
        <p className="text-xs font-semibold animate-pulse" style={{ color: 'var(--text-secondary)' }}>
          Memuat dan mengagregasi 50.000 data historis bencana nasional...
        </p>
      </div>
    );
  }

  const customTooltipStyle = {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    fontSize: '11px',
    padding: '8px 12px'
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-xs" style={{ color: 'var(--text-primary)' }}>
      
      {/* ============================================================
          TOP COMMAND & FILTER BAR
          ============================================================ */}
      <div 
        className="flex-none p-3 border-b space-y-2.5 backdrop-blur-md"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          borderColor: 'var(--border-faint)' 
        }}
      >
        {/* Row 1: Flow Pertama: Jenis Bencana Chips */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-[rgb(25,79,112)]">
              Alur 1 · Pilih Jenis Bencana:
            </span>
          </div>

          {/* Chips Scrollable */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {Object.entries(BENCANA_COLORS).map(([jenis, color]) => {
              const isSelected = selectedJenis === jenis;
              return (
                <button
                  key={jenis}
                  onClick={() => setSelectedJenis(jenis)}
                  className="px-2.5 py-1 rounded-lg font-bold text-[10px] whitespace-nowrap transition-all flex items-center gap-1 border shrink-0"
                  style={{
                    backgroundColor: isSelected ? color : 'transparent',
                    borderColor: isSelected ? color : 'var(--border-faint)',
                    color: isSelected ? '#ffffff' : color,
                    boxShadow: isSelected ? `0 2px 8px ${color}40` : 'none'
                  }}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0" 
                    style={{ backgroundColor: isSelected ? '#ffffff' : color }}
                  />
                  <span>{jenis}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors shrink-0 text-slate-500 hover:text-slate-900"
            style={{ borderColor: 'var(--border-faint)' }}
            title="Reset semua filter ke kondisi awal"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Row 2: Secondary Dropdown Filters (Provinsi, Kabupaten, Tahun, Bulan) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--border-faint)' }}>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Filter className="w-3 h-3 text-[rgb(25,79,112)]" />
            <span>Filter Wilayah & Waktu:</span>
          </div>

          {/* Dropdown Provinsi */}
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <select
              value={selectedProvinsi}
              onChange={(e) => setSelectedProvinsi(e.target.value)}
              className="p-1 px-2 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer"
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

          {/* Dropdown Kabupaten (Terikat dengan Provinsi terpilih) */}
          <div className="flex items-center gap-1">
            <select
              value={selectedKabupaten}
              onChange={(e) => setSelectedKabupaten(e.target.value)}
              disabled={availableKabupaten.length === 0}
              className="p-1 px-2 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer"
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
              className="p-1 px-2 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer"
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
            <span className="text-slate-400">s/d</span>
            <select
              value={endTahun}
              onChange={(e) => setEndTahun(e.target.value)}
              className="p-1 px-2 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer"
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

          {/* Filter Bulan / Musiman */}
          <div className="flex items-center gap-1">
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="p-1 px-2 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="Semua">Semua Bulan (Sepanjang Tahun)</option>
              {BULAN_NAMES.map((bName, idx) => (
                <option key={bName} value={idx + 1}>Bulan: {bName}</option>
              ))}
            </select>
          </div>

          {/* Filter Summary Status Indicator */}
          <div className="ml-auto text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-[rgb(25,79,112)]/10 text-[rgb(25,79,112)]">
            <span>{filteredData.length.toLocaleString()} Catatan Terfilter</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          EXECUTIVE 6 KPI RIBBON
          ============================================================ */}
      <div className="flex-none px-4 pt-3 pb-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* KPI 1: Total Kejadian */}
        <div 
          className="p-2.5 rounded-xl border flex flex-col justify-between shadow-2xs"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold">Total Kejadian</span>
            <Activity className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-sky-600">
            {kpis.kejadian.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">Bencana terverifikasi</div>
        </div>

        {/* KPI 2: Korban Meninggal & Hilang */}
        <div 
          className="p-2.5 rounded-xl border flex flex-col justify-between shadow-2xs"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold">Korban Meninggal/Hilang</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-600">
            {kpis.korbanJiwa.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">{kpis.meninggal.toLocaleString()} tewas · {kpis.hilang} hilang</div>
        </div>

        {/* KPI 3: Pengungsi & Menderita */}
        <div 
          className="p-2.5 rounded-xl border flex flex-col justify-between shadow-2xs"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold">Menderita & Mengungsi</span>
            <Users className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600">
            {kpis.pengungsi >= 1000000 
              ? `${(kpis.pengungsi / 1000000).toFixed(1)} Juta` 
              : kpis.pengungsi.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">Warga butuh pertolongan</div>
        </div>

        {/* KPI 4: Rumah Rusak */}
        <div 
          className="p-2.5 rounded-xl border flex flex-col justify-between shadow-2xs"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold">Rumah Rusak</span>
            <Home className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-orange-600">
            {kpis.totalRumahRusak.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">{kpis.rusakBerat.toLocaleString()} rusak berat</div>
        </div>

        {/* KPI 5: Rumah Terendam */}
        <div 
          className="p-2.5 rounded-xl border flex flex-col justify-between shadow-2xs"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold">Rumah Terendam</span>
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-600">
            {kpis.terendam >= 1000000 
              ? `${(kpis.terendam / 1000000).toFixed(1)} Juta` 
              : kpis.terendam.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">Dampak genangan & banjir</div>
        </div>

        {/* KPI 6: Fasilitas Publik Rusak */}
        <div 
          className="p-2.5 rounded-xl border flex flex-col justify-between shadow-2xs"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold">Fasilitas Publik Rusak</span>
            <Building2 className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-600">
            {kpis.totalFasilitas.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">Sekolah, faskes, jembatan</div>
        </div>
      </div>

      {/* ============================================================
          TAB NAVIGATION PERSPECTIVE
          ============================================================ */}
      <div className="flex-none px-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-faint)' }}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('tren')}
            className={`px-3 py-1.5 font-extrabold text-[11px] border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'tren' 
                ? 'border-[rgb(25,79,112)] text-[rgb(25,79,112)]' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>1. Tren Waktu & Pola Musiman</span>
          </button>

          <button
            onClick={() => setActiveTab('korban')}
            className={`px-3 py-1.5 font-extrabold text-[11px] border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'korban' 
                ? 'border-[rgb(25,79,112)] text-[rgb(25,79,112)]' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Dampak Jiwa & Pengungsian</span>
          </button>

          <button
            onClick={() => setActiveTab('kerusakan')}
            className={`px-3 py-1.5 font-extrabold text-[11px] border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'kerusakan' 
                ? 'border-[rgb(25,79,112)] text-[rgb(25,79,112)]' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>3. Kerusakan Fisik & Fasilitas</span>
          </button>

          <button
            onClick={() => setActiveTab('tabel')}
            className={`px-3 py-1.5 font-extrabold text-[11px] border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'tabel' 
                ? 'border-[rgb(25,79,112)] text-[rgb(25,79,112)]' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>4. Eksplorasi Wilayah (Data Table)</span>
          </button>
        </div>

        {activeTab === 'tren' && (
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-slate-500">
            <span>Metrik Garis Tren:</span>
            {(['kejadian', 'meninggal', 'pengungsi', 'rumah'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setTrendMetric(metric)}
                className={`px-2 py-0.5 rounded capitalize ${
                  trendMetric === metric 
                    ? 'bg-[rgb(25,79,112)] text-white font-bold' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {metric}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================
          MAIN BODY CONTENT (TAB PANELS)
          ============================================================ */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        
        {/* ------------------------------------------------------------
            TAB 1: TREN WAKTU & POLA MUSIMAN
            ------------------------------------------------------------ */}
        {activeTab === 'tren' && (
          <div className="space-y-4">
            {/* Top Row: Line Chart Tren Tahunan & Bar Top 10 Provinsi */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Line Chart Tren Tahunan (8 Cols) */}
              <div 
                className="lg:col-span-8 p-3.5 rounded-2xl border flex flex-col h-72 sm:h-80 shadow-2xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
                      <span>Tren Kronologis Per Tahun ({startTahun} - {endTahun})</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Pergerakan data historis berdasarkan metrik terpilih</p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-50 text-sky-700 uppercase">
                    Metrik: {trendMetric}
                  </span>
                </div>

                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yearlyTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                      <XAxis dataKey="year" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Area 
                        type="monotone" 
                        dataKey={trendMetric === 'pengungsi' ? 'pengungsiK' : trendMetric} 
                        stroke="#0284C7" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#trendGradient)" 
                        name={trendMetric === 'pengungsi' ? 'Pengungsi (Ribuan)' : trendMetric}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart Top 10 Provinsi (4 Cols) */}
              <div 
                className="lg:col-span-4 p-3.5 rounded-2xl border flex flex-col h-72 sm:h-80 shadow-2xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
              >
                <div className="mb-2">
                  <h3 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Top 10 Provinsi Paling Sering Terjadi</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Akumulasi kejadian berdasarkan filter</p>
                </div>

                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={topProvinceData} margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 9 }} />
                      <YAxis type="category" dataKey="provinsi" stroke="var(--text-secondary)" tick={{ fontSize: 9 }} width={80} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="kejadian" fill="#10B981" radius={[0, 4, 4, 0]} name="Kejadian" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Row: Pola Musiman Per Bulan & Donut Distribusi Bencana */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Bar Chart Musiman Per Bulan (7 Cols) */}
              <div 
                className="lg:col-span-7 p-3.5 rounded-2xl border flex flex-col h-64 shadow-2xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
              >
                <div className="mb-2">
                  <h3 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Pola Kerentanan Musiman (Akumulasi Per Bulan: Jan - Des)</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Memperlihatkan lonjakan bencana hidrometeorologi di awal/akhir tahun</p>
                </div>

                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySeasonData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                      <XAxis dataKey="nama" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="kejadian" fill="#6366F1" radius={[4, 4, 0, 0]} name="Kejadian" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Distribusi Jenis Bencana (5 Cols) */}
              <div 
                className="lg:col-span-5 p-3.5 rounded-2xl border flex flex-col h-64 shadow-2xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
              >
                <div className="mb-1">
                  <h3 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Proporsi Jenis Bencana Terdata</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Komparasi antar jenis kejadian</p>
                </div>

                <div className="flex-1 min-h-0 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={disasterTypeData} 
                        dataKey="kejadian" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={45} 
                        outerRadius={75}
                        paddingAngle={2}
                      >
                        {disasterTypeData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={BENCANA_COLORS[entry.name] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle" 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '9px', lineHeight: '14px' }}
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
              {/* Stacked Bar Korban Jiwa Per Jenis Bencana (7 Cols) */}
              <div 
                className="lg:col-span-7 p-3.5 rounded-2xl border flex flex-col h-80 shadow-2xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
              >
                <div className="mb-2">
                  <h3 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>Fatalitas & Korban Per Jenis Bencana</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Memperlihatkan jenis bencana paling mematikan (gempabumi & tsunami vs hidrometeorologi)</p>
                </div>

                <div className="flex-1 min-h-0">
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
                      <Legend verticalAlign="top" wrapperStyle={{ fontSize: '10px', paddingBottom: '8px' }} />
                      <Bar dataKey="meninggal" fill="#EF4444" name="Meninggal Dunia" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 10 Pengungsi per Provinsi (5 Cols) */}
              <div 
                className="lg:col-span-5 p-3.5 rounded-2xl border flex flex-col h-80 shadow-2xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
              >
                <div className="mb-2">
                  <h3 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                    <span>Top Wilayah Terdampak Pengungsian Terbanyak</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Populasi menderita & mengungsi yang membutuhkan dukungan logistik</p>
                </div>

                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={topProvinceData} margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 9 }} />
                      <YAxis type="category" dataKey="provinsi" stroke="var(--text-secondary)" tick={{ fontSize: 9 }} width={80} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="pengungsi" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Pengungsi / Menderita" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quick Stat Highlight Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border flex items-center gap-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}>
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tingkat Fatalitas</div>
                  <div className="text-base font-extrabold">
                    {kpis.kejadian > 0 ? (kpis.korbanJiwa / kpis.kejadian).toFixed(2) : 0} Jiwa / Kejadian
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border flex items-center gap-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Rasio Pengungsi</div>
                  <div className="text-base font-extrabold">
                    {kpis.kejadian > 0 ? Math.round(kpis.pengungsi / kpis.kejadian).toLocaleString() : 0} Warga / Kejadian
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border flex items-center gap-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}>
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Populasi Terdampak Luas</div>
                  <div className="text-base font-extrabold">
                    {(kpis.pengungsi + kpis.luka).toLocaleString()} Jiwa
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------
            TAB 3: KERUSAKAN FISIK & FASILITAS PUBLIK
            ------------------------------------------------------------ */}
        {activeTab === 'kerusakan' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Kerusakan Fasilitas Vital (Sekolah, Faskes, Ibadah, Jembatan) */}
              <div 
                className="lg:col-span-6 p-3.5 rounded-2xl border flex flex-col h-72 shadow-2xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
              >
                <div className="mb-2">
                  <h3 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <School className="w-3.5 h-3.5 text-blue-500" />
                    <span>Fasilitas Publik & Vital Rusak</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Kerusakan sarana pendidikan, kesehatan, peribadatan, dan konektivitas</p>
                </div>

                <div className="flex-1 min-h-0">
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

              {/* Komposisi Tingkat Kerusakan Rumah */}
              <div 
                className="lg:col-span-6 p-3.5 rounded-2xl border flex flex-col h-72 shadow-2xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
              >
                <div className="mb-2">
                  <h3 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Home className="w-3.5 h-3.5 text-orange-500" />
                    <span>Gradasi Kerusakan Pemukiman (Berat vs Sedang vs Ringan)</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Bahan pertimbangan estimasi dana stimulan perbaikan hunian</p>
                </div>

                <div className="flex-1 min-h-0">
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

            {/* Top 10 Provinsi Kerusakan Rumah Terparah */}
            <div 
              className="p-3.5 rounded-2xl border flex flex-col h-64 shadow-2xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
            >
              <div className="mb-2">
                <h3 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Building2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Top 10 Provinsi dengan Kerusakan Rumah Terbesar</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Total akumulasi rumah rusak berat, sedang, dan ringan</p>
              </div>

              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProvinceData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" vertical={false} />
                    <XAxis dataKey="provinsi" stroke="var(--text-secondary)" tick={{ fontSize: 9 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="rumah" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Total Rumah Rusak" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------
            TAB 4: EKSPLORASI WILAYAH & DATA TABLE LENGKAP
            ------------------------------------------------------------ */}
        {activeTab === 'tabel' && (
          <div 
            className="p-4 rounded-2xl border flex flex-col shadow-2xs space-y-3"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-faint)' }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <TableIcon className="w-3.5 h-3.5 text-[rgb(25,79,112)]" />
                  <span>Matriks Sebaran Bencana Berdasarkan Kabupaten / Kota</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Daftar agregat per wilayah kabupaten/kota yang dapat dicari dan diurutkan</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kabupaten atau provinsi..."
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none font-medium"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto border rounded-xl" style={{ borderColor: 'var(--border-faint)' }}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr 
                    className="border-b font-extrabold text-[10px] uppercase text-slate-500"
                    style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-faint)' }}
                  >
                    <th className="p-2.5 pl-3">No</th>
                    <th className="p-2.5">Kabupaten / Kota</th>
                    <th className="p-2.5">Provinsi</th>
                    <th className="p-2.5 text-right">Kejadian</th>
                    <th className="p-2.5 text-right">Meninggal</th>
                    <th className="p-2.5 text-right">Pengungsi</th>
                    <th className="p-2.5 text-right">Rumah Rusak</th>
                    <th className="p-2.5 text-right">Fasilitas Rusak</th>
                    <th className="p-2.5 pr-3 text-center">Bencana Dominan</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-faint)' }}>
                  {regencyTableData.slice(0, 100).map((row, idx) => (
                    <tr 
                      key={`${row.provinsi}-${row.kabupaten}`} 
                      className="hover:bg-slate-50/50 transition-colors font-medium text-[11px]"
                    >
                      <td className="p-2.5 pl-3 text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-bold" style={{ color: 'var(--text-primary)' }}>{row.kabupaten}</td>
                      <td className="p-2.5 text-slate-500">{row.provinsi}</td>
                      <td className="p-2.5 text-right font-black text-sky-600">{row.kejadian.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-bold text-rose-600">{row.meninggal.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-amber-600 font-semibold">{row.pengungsi.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-orange-600">{row.rumahRusak.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-purple-600">{row.fasilitasRusak.toLocaleString()}</td>
                      <td className="p-2.5 pr-3 text-center">
                        <span 
                          className="px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white"
                          style={{ backgroundColor: BENCANA_COLORS[row.bencanaDominan] || '#64748b' }}
                        >
                          {row.bencanaDominan}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {regencyTableData.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 font-semibold">
                        Tidak ada kabupaten yang cocok dengan filter atau pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Menampilkan {Math.min(100, regencyTableData.length)} dari {regencyTableData.length} kabupaten/kota terdata</span>
              <span>Diurutkan berdasarkan kejadian terbanyak</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
