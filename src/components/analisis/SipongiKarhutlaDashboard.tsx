'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Flame, Radio, TrendingUp, MapPin, ArrowLeft,
  Search, BarChart3, Layers, Info, ExternalLink, ChevronRight,
  ChevronLeft, Award
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

// Dynamically import Leaflet Hotspot Map
const SipongiHotspotMap = dynamic(() => import('./SipongiHotspotMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[360px] rounded-2xl bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-300">
      <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <div className="text-xs font-bold text-orange-400">Memuat Peta Spasial Hotspot SIPONGI...</div>
      <div className="text-[10px] text-slate-400">Sinkronisasi Data Satelit NASA TERRA / AQUA / SNPP</div>
    </div>
  )
});

interface HotspotItem {
  provinsi: string;
  kabupaten: string;
  sumber: string;
  confidence: string;
  counter: number;
}

interface LuasPerTahun {
  tahun: string | number;
  luas?: string;
  total?: string;
}

interface ProvinsiLuasItem {
  id_mendagri: string;
  nama_provinsi: string;
  data_luas: LuasPerTahun[];
}

interface KabupatenLuasItem {
  id_mendagri: string;
  nama: string;
  data_luas: LuasPerTahun[];
}

interface SipongiKarhutlaDashboardProps {
  onBackToGeneral: () => void;
}

const BULAN_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

export default function SipongiKarhutlaDashboard({ onBackToGeneral }: SipongiKarhutlaDashboardProps) {
  // Main subtab
  const [activeTab, setActiveTab] = useState<'hotspot' | 'grafik' | 'luas_provinsi' | 'luas_kabupaten'>('hotspot');

  // Hotspot states
  const [timeframe, setTimeframe] = useState<'24' | '48'>('48');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('all');
  const [selectedSatelit, setSelectedSatelit] = useState<string>('all-nasa');
  const [hotspotData, setHotspotData] = useState<HotspotItem[]>([]);
  const [loadingHotspot, setLoadingHotspot] = useState<boolean>(true);
  const [selectedMapKabupaten, setSelectedMapKabupaten] = useState<string | null>(null);

  // Grafik hotspot states
  const [selectedGrafikTahun, setSelectedGrafikTahun] = useState<string>('2026');
  const [grafikHotspotData, setGrafikHotspotData] = useState<number[]>([]);
  const [loadingGrafik, setLoadingGrafik] = useState<boolean>(false);

  // Luas Provinsi states
  const [provinsiList, setProvinsiList] = useState<ProvinsiLuasItem[]>([]);
  const [totalLuasNasional, setTotalLuasNasional] = useState<{ tahun: string | number; total: string }[]>([]);
  const [loadingProvinsi, setLoadingProvinsi] = useState<boolean>(true);
  const [selectedTahunLuas, setSelectedTahunLuas] = useState<string>('2026');
  const [searchProvinsi, setSearchProvinsi] = useState<string>('');

  // Luas Kabupaten states
  const [kabupatenList, setKabupatenList] = useState<KabupatenLuasItem[]>([]);
  const [loadingKabupaten, setLoadingKabupaten] = useState<boolean>(false);
  const [searchKabupaten, setSearchKabupaten] = useState<string>('');
  const [kabupatenPage, setKabupatenPage] = useState<number>(1);

  // 1. Fetch Hotspot Realtime
  useEffect(() => {
    let isMounted = true;
    setLoadingHotspot(true);
    fetch(`/api/sipongi?action=sebaran&late=${timeframe}&satelit=${selectedSatelit}&confidence=${selectedConfidence}&provinsi=all`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        setHotspotData(json.data || []);
        setLoadingHotspot(false);
      })
      .catch((err) => {
        console.error('Error fetching hotspot data:', err);
        if (isMounted) setLoadingHotspot(false);
      });

    return () => { isMounted = false; };
  }, [timeframe, selectedSatelit, selectedConfidence]);

  // 2. Fetch Grafik Hotspot Bulanan
  useEffect(() => {
    let isMounted = true;
    setLoadingGrafik(true);
    fetch(`/api/sipongi?action=grafik_hotspot&text=NASA-TERRA%2FAQUA&satelit=NASA-MODIS&tahun=${selectedGrafikTahun}`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        setGrafikHotspotData(json.data || []);
        setLoadingGrafik(false);
      })
      .catch((err) => {
        console.error('Error fetching grafik hotspot:', err);
        if (isMounted) setLoadingGrafik(false);
      });

    return () => { isMounted = false; };
  }, [selectedGrafikTahun]);

  // 3. Fetch Luas Kebakaran Provinsi (sekaligus data total nasional)
  useEffect(() => {
    let isMounted = true;
    setLoadingProvinsi(true);
    fetch(`/api/sipongi?action=luas_provinsi&tahunAwal=2015&tahunAkhir=2026`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        setProvinsiList(json.data || []);
        setTotalLuasNasional(json.total || []);
        setLoadingProvinsi(false);
      })
      .catch((err) => {
        console.error('Error fetching luas provinsi:', err);
        if (isMounted) setLoadingProvinsi(false);
      });

    return () => { isMounted = false; };
  }, []);

  // 4. Fetch Luas Kebakaran Kabupaten
  useEffect(() => {
    if (activeTab !== 'luas_kabupaten' || kabupatenList.length > 0) return;
    let isMounted = true;
    setLoadingKabupaten(true);
    fetch(`/api/sipongi?action=luas_kabupaten&provinsi=all&tahunAwal=2015&tahunAkhir=2026`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        setKabupatenList(json.data || []);
        setLoadingKabupaten(false);
      })
      .catch((err) => {
        console.error('Error fetching luas kabupaten:', err);
        if (isMounted) setLoadingKabupaten(false);
      });

    return () => { isMounted = false; };
  }, [activeTab, kabupatenList.length]);

  // Helper untuk parsing angka desimal Indonesia ("202.004,30" -> 202004.30)
  const parseIndoNumber = (str?: string): number => {
    if (!str) return 0;
    const clean = str.replace(/\./g, '').replace(',', '.').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Helper format angka Indonesia
  const formatIndoNumber = (num: number, decimals = 2): string => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  // Hotspot summary calculations
  const totalHotspotCount = useMemo(() => {
    return hotspotData.reduce((acc, h) => acc + (h.counter || 0), 0);
  }, [hotspotData]);

  // Hotspot Top 10 Kabupaten
  const top10KabHotspot = useMemo(() => {
    const map: Record<string, { kabupaten: string; provinsi: string; count: number }> = {};
    hotspotData.forEach((h) => {
      const kab = h.kabupaten || '-';
      if (!map[kab]) {
        map[kab] = { kabupaten: kab, provinsi: h.provinsi || '-', count: 0 };
      }
      map[kab].count += (h.counter || 0);
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [hotspotData]);

  // Hotspot Top 10 Provinsi
  const top10ProvHotspot = useMemo(() => {
    const map: Record<string, { provinsi: string; count: number }> = {};
    hotspotData.forEach((h) => {
      const p = h.provinsi || '-';
      if (!map[p]) {
        map[p] = { provinsi: p, count: 0 };
      }
      map[p].count += (h.counter || 0);
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [hotspotData]);

  // Grafik data format for Recharts
  const monthlyChartData = useMemo(() => {
    return BULAN_LABELS.map((month, idx) => ({
      bulan: month,
      hotspot: grafikHotspotData[idx] || 0,
    }));
  }, [grafikHotspotData]);

  // Historical National Fire Area for Recharts (2015-2026)
  const historicalTotalChartData = useMemo(() => {
    return totalLuasNasional.map((item) => ({
      tahun: String(item.tahun),
      luasHa: parseIndoNumber(item.total),
      displayLuas: item.total,
    }));
  }, [totalLuasNasional]);

  // Top Provinsi by Fire Area in selected year
  const topProvinsiLuasData = useMemo(() => {
    const list = provinsiList.map((p) => {
      const entry = p.data_luas?.find((d) => String(d.tahun) === selectedTahunLuas);
      const valStr = entry?.luas || entry?.total || '0';
      const num = parseIndoNumber(valStr);
      return {
        nama: p.nama_provinsi,
        luasHa: num,
        displayLuas: valStr,
      };
    });
    return list.sort((a, b) => b.luasHa - a.luasHa);
  }, [provinsiList, selectedTahunLuas]);

  // Filtered Provinsi Table
  const filteredProvinsiTable = useMemo(() => {
    if (!searchProvinsi) return provinsiList;
    const q = searchProvinsi.toLowerCase();
    return provinsiList.filter((p) => p.nama_provinsi.toLowerCase().includes(q));
  }, [provinsiList, searchProvinsi]);

  // Filtered Kabupaten Table with Pagination
  const filteredKabupatenTable = useMemo(() => {
    let list = kabupatenList;
    if (searchKabupaten) {
      const q = searchKabupaten.toLowerCase();
      list = list.filter((k) => k.nama.toLowerCase().includes(q));
    }
    return list;
  }, [kabupatenList, searchKabupaten]);

  const itemsPerPage = 12;
  const totalKabupatenPages = Math.max(1, Math.ceil(filteredKabupatenTable.length / itemsPerPage));
  const currentKabupatenRows = useMemo(() => {
    const start = (kabupatenPage - 1) * itemsPerPage;
    return filteredKabupatenTable.slice(start, start + itemsPerPage);
  }, [filteredKabupatenTable, kabupatenPage]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-xs font-sans" style={{ color: 'var(--text-primary)' }}>
      
      {/* ============================================================
          1. HEADER APP BAR & SUB-NAV TOOLBAR
          ============================================================ */}
      <div
        className="flex-none p-3.5 space-y-2.5 transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 2px 4px -1px rgba(0,0,0,0.08)',
          borderBottom: '1px solid var(--border-faint)'
        }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Title & Live Status */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <span>Sistem Monitoring Karhutla (SIPONGI)</span>
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping inline-block" />
                  Live KLHK
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Data resmi sebaran titik panas satelit NASA & indikasi luas kebakaran hutan dan lahan Kementerian LHK
              </p>
            </div>
          </div>

          {/* Action Back Button */}
          <button
            onClick={onBackToGeneral}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs border hover:opacity-90 active:scale-95 shrink-0"
            style={{
              backgroundColor: 'var(--bg-page)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Analisis Bencana</span>
          </button>
        </div>

        {/* Subtabs Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setActiveTab('hotspot')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'hotspot'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-red-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Sebaran Hotspot ({timeframe} Jam)</span>
          </button>

          <button
            onClick={() => setActiveTab('grafik')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'grafik'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-red-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tren Hotspot Bulanan (2015-2026)</span>
          </button>

          <button
            onClick={() => setActiveTab('luas_provinsi')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'luas_provinsi'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-red-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Luas Karhutla per Provinsi</span>
          </button>

          <button
            onClick={() => setActiveTab('luas_kabupaten')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'luas_kabupaten'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-red-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Luas Karhutla per Kab/Kota</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          2. OFFICIAL NOTICE & INSIGHT BANNER (Sesuai Arahan User)
          ============================================================ */}
      <div className="flex-none p-3 pb-0">
        <div
          className="p-3 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderColor: 'rgba(239, 68, 68, 0.25)'
          }}
        >
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1">
              <div className="text-[11.5px] leading-snug">
                <strong className="text-red-700 dark:text-red-400 font-extrabold">Catatan Resmi Analisis Areal Karhutla (KLHK):</strong>{' '}
                <span className="text-slate-700 dark:text-slate-200">
                  Jumlah areal karhutla di Indonesia periode <strong>Januari – Juli 2026 (202.004,30 ha)</strong> mengalami{' '}
                  <span className="font-extrabold text-red-600 dark:text-red-400">PENINGKATAN sebesar 47% (64.996,88 ha)</span> dibandingkan tahun 2019 dan{' '}
                  <span className="font-extrabold text-red-600 dark:text-red-400">80% (109.080,25 ha)</span> dibandingkan tahun 2023. Jika dibandingkan tahun 2025, luas areal karhutla tahun 2026 naik sebesar{' '}
                  <span className="font-extrabold text-red-600 dark:text-red-400">69% (82.791,04 ha)</span>.
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span>* Luas kawasan hutan wilayah tertentu yang ditunjuk dan/atau ditetapkan oleh pemerintah untuk dipertahankan keberadaannya sebagai hutan tetap.</span>
                <span>*** Data input terverifikasi sampai dengan Juli 2026.</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <a
              href="https://opsroom.sipongidata.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-red-700 dark:text-red-300 hover:underline inline-flex items-center gap-1"
            >
              <span>Portal SIPONGI</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================
          3. MAIN TAB CONTENT AREA
          ============================================================ */}
      <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-3">
        
        {/* ==================== SUBTAB 1: SEBARAN HOTSPOT ==================== */}
        {activeTab === 'hotspot' && (
          <div className="space-y-3">
            {/* Filter Bar for Hotspot */}
            <div
              className="p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-2xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wide">Rentang Waktu:</span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                  <button
                    onClick={() => setTimeframe('24')}
                    className={`px-3 py-1 rounded-lg font-extrabold text-[10.5px] transition-all cursor-pointer ${
                      timeframe === '24' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    24 Jam Terakhir
                  </button>
                  <button
                    onClick={() => setTimeframe('48')}
                    className={`px-3 py-1 rounded-lg font-extrabold text-[10.5px] transition-all cursor-pointer ${
                      timeframe === '48' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    48 Jam Terakhir
                  </button>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <span className="font-bold text-[11px] text-slate-500">Confidence:</span>
                  <select
                    value={selectedConfidence}
                    onChange={(e) => setSelectedConfidence(e.target.value)}
                    className="p-1 px-2 rounded-lg text-[10.5px] font-bold border outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="all">Semua (High / Med / Low)</option>
                    <option value="high">Hanya High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-bold text-[11px] text-slate-500">Satelit:</span>
                  <select
                    value={selectedSatelit}
                    onChange={(e) => setSelectedSatelit(e.target.value)}
                    className="p-1 px-2 rounded-lg text-[10.5px] font-bold border outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="all-nasa">Semua Satelit NASA</option>
                    <option value="NASA-MODIS">NASA-MODIS (TERRA/AQUA)</option>
                    <option value="NASA-SNPP">NASA-SNPP VIIRS</option>
                    <option value="NASA-NOAA20">NASA-NOAA20</option>
                  </select>
                </div>
              </div>

              {/* KPI Pill */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Total Hotspot:</span>
                <span className="px-2.5 py-1 rounded-xl bg-orange-600 text-white font-black text-xs shadow-xs">
                  {totalHotspotCount.toLocaleString('id-ID')} Titik
                </span>
              </div>
            </div>

            {/* Map and Top Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-[460px]">
              {/* Map Panel (Col 2) */}
              <div className="lg:col-span-2 h-full rounded-2xl overflow-hidden border shadow-sm relative" style={{ borderColor: 'var(--border-subtle)' }}>
                {loadingHotspot ? (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-300">
                    <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-xs font-bold text-orange-400">Mengunduh Sebaran Hotspot SIPONGI ({timeframe} Jam)...</div>
                  </div>
                ) : (
                  <SipongiHotspotMap
                    hotspots={hotspotData}
                    selectedKabupaten={selectedMapKabupaten}
                    onSelectKabupaten={(kab) => setSelectedMapKabupaten(kab)}
                    timeframe={timeframe}
                  />
                )}
              </div>

              {/* Sidebar Ranking Lists (Col 1) */}
              <div
                className="h-full rounded-2xl border p-3 flex flex-col justify-between overflow-hidden shadow-xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-orange-600">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Top 10 Kab/Kota Hotspot</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold">{timeframe} Jam</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {top10KabHotspot.map((item, idx) => (
                      <div
                        key={item.kabupaten}
                        onClick={() => setSelectedMapKabupaten(item.kabupaten)}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedMapKabupaten === item.kabupaten
                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-transparent'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="font-extrabold text-[11px] truncate flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 text-[9.5px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate">{item.kabupaten}</span>
                          </div>
                          <div className="text-[9.5px] text-slate-400 truncate pl-5">{item.provinsi}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-orange-600 text-white font-black text-[10.5px] shrink-0">
                          {item.count}
                        </span>
                      </div>
                    ))}
                    {top10KabHotspot.length === 0 && !loadingHotspot && (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        Tidak ada titik panas terdeteksi pada parameter filter ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Prov Summary */}
                <div className="pt-2 border-t mt-2 shrink-0 space-y-1.5" style={{ borderColor: 'var(--border-faint)' }}>
                  <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Top 3 Provinsi Terdampak:</div>
                  <div className="grid grid-cols-3 gap-1">
                    {top10ProvHotspot.slice(0, 3).map((p) => (
                      <div key={p.provinsi} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-center">
                        <div className="text-[9.5px] font-bold text-slate-600 dark:text-slate-300 truncate" title={p.provinsi}>{p.provinsi}</div>
                        <div className="text-[11px] font-black text-orange-600">{p.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUBTAB 2: GRAFIK HOTSPOT (2015-2026) ==================== */}
        {activeTab === 'grafik' && (
          <div className="space-y-3">
            {/* Filter Bar */}
            <div
              className="p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-2xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wide">Pilih Tahun Analisis:</span>
                <select
                  value={selectedGrafikTahun}
                  onChange={(e) => setSelectedGrafikTahun(e.target.value)}
                  className="p-1.5 px-3 rounded-xl text-xs font-black border outline-none cursor-pointer bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800"
                >
                  {Array.from({ length: 12 }, (_, i) => 2015 + i).reverse().map((thn) => (
                    <option key={thn} value={String(thn)}>Tahun {thn}</option>
                  ))}
                </select>
                <span className="text-[10.5px] text-slate-400">Sensor: NASA-TERRA / AQUA MODIS</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Total Hotspot Tahun {selectedGrafikTahun}:</span>
                <span className="px-3 py-1 rounded-xl bg-orange-600 text-white font-black text-xs shadow-xs">
                  {grafikHotspotData.reduce((a, b) => a + b, 0).toLocaleString('id-ID')} Titik
                </span>
              </div>
            </div>

            {/* Main Chart */}
            <div
              className="p-4 rounded-2xl border space-y-3 shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-orange-600">
                    <BarChart3 className="w-4 h-4" />
                    <span>Tren Titik Panas Bulanan Tahun {selectedGrafikTahun} (Januari - Desember)</span>
                  </h3>
                  <p className="text-[10.5px] text-slate-400">Puncak sebaran hotspot karhutla umumnya terjadi pada periode musim kemarau (Juli - Oktober)</p>
                </div>
              </div>

              <div className="h-72 w-full">
                {loadingGrafik ? (
                  <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold">Memuat Grafik Hotspot...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hotspotGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '10px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          fontSize: '11px',
                        }}
                        formatter={(val) => [`${Number(val || 0).toLocaleString('id-ID')} Titik`, 'Hotspot']}
                      />
                      <Area type="monotone" dataKey="hotspot" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#hotspotGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Monthly Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--border-faint)' }}>
                {monthlyChartData.map((m) => (
                  <div key={m.bulan} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-500">{m.bulan}</div>
                    <div className={`text-xs font-black ${m.hotspot > 1000 ? 'text-red-600' : m.hotspot > 200 ? 'text-orange-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {m.hotspot.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUBTAB 3: LUAS KEBAKARAN PER PROVINSI ==================== */}
        {activeTab === 'luas_provinsi' && (
          <div className="space-y-3">
            {/* Filter Bar */}
            <div
              className="p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-2xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wide">Tahun Pemeringkatan:</span>
                <select
                  value={selectedTahunLuas}
                  onChange={(e) => setSelectedTahunLuas(e.target.value)}
                  className="p-1.5 px-3 rounded-xl text-xs font-black border outline-none cursor-pointer bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                >
                  {Array.from({ length: 12 }, (_, i) => 2015 + i).reverse().map((thn) => (
                    <option key={thn} value={String(thn)}>Tahun {thn}</option>
                  ))}
                </select>

                <div className="relative ml-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari provinsi..."
                    value={searchProvinsi}
                    onChange={(e) => setSearchProvinsi(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none w-48"
                    style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>

              {/* National Total Pill */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Total Karhutla Nasional {selectedTahunLuas}:</span>
                <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs shadow-xs">
                  {totalLuasNasional.find((t) => String(t.tahun) === selectedTahunLuas)?.total || '0'} ha
                </span>
              </div>
            </div>

            {/* Visual Charts: Historical Trend + Top 10 Provinces */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Historical Trend 2015-2026 */}
              <div
                className="p-3.5 rounded-2xl border space-y-2 shadow-xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Tren Luas Karhutla Nasional (2015 - 2026)</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Satuan: Hektar (ha)</span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historicalTotalChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="tahun" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          fontSize: '11px',
                        }}
                        formatter={(val) => [`${formatIndoNumber(Number(val || 0))} ha`, 'Luas Karhutla']}
                      />
                      <Bar dataKey="luasHa" radius={[6, 6, 0, 0]}>
                        {historicalTotalChartData.map((entry) => (
                          <Cell
                            key={entry.tahun}
                            fill={entry.tahun === selectedTahunLuas ? '#dc2626' : '#f97316'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 10 Provinces Bar Chart */}
              <div
                className="p-3.5 rounded-2xl border space-y-2 shadow-xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Top 10 Provinsi Terluas Tahun {selectedTahunLuas}</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Satuan: Hektar (ha)</span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProvinsiLuasData.slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="nama" tick={{ fontSize: 9.5 }} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          fontSize: '11px',
                        }}
                        formatter={(val) => [`${formatIndoNumber(Number(val || 0))} ha`, 'Luas Karhutla']}
                      />
                      <Bar dataKey="luasHa" fill="#ef4444" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Full Table */}
            <div
              className="rounded-2xl border overflow-hidden shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-faint)' }}>
                <h4 className="font-black text-xs uppercase tracking-wider">
                  Daftar Luas Karhutla Seluruh Provinsi ({filteredProvinsiTable.length} Provinsi)
                </h4>
                <span className="text-[10.5px] text-slate-400">Kolom tahun 2015 s.d. 2026 (hektar)</span>
              </div>

              <div className="overflow-x-auto max-h-80">
                {loadingProvinsi ? (
                  <div className="p-10 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold">Mengunduh data luas provinsi dari SIPONGI...</span>
                  </div>
                ) : (
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="p-2.5 pl-4">No</th>
                        <th className="p-2.5">Provinsi</th>
                        <th className="p-2.5 text-right font-black text-red-600 bg-red-50 dark:bg-red-950/30">
                          {selectedTahunLuas} (ha)
                        </th>
                        <th className="p-2.5 text-right">2025</th>
                        <th className="p-2.5 text-right">2024</th>
                        <th className="p-2.5 text-right">2023</th>
                        <th className="p-2.5 text-right">2022</th>
                        <th className="p-2.5 text-right">2021</th>
                        <th className="p-2.5 text-right">2020</th>
                        <th className="p-2.5 text-right">2019</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-faint)' }}>
                      {filteredProvinsiTable.map((prov, idx) => {
                        const getLuas = (thn: string) => {
                          const itm = prov.data_luas?.find((d) => String(d.tahun) === thn);
                          return itm?.luas || itm?.total || '-';
                        };

                        return (
                          <tr key={prov.id_mendagri || prov.nama_provinsi} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-2.5 pl-4 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-2.5 font-bold">{prov.nama_provinsi}</td>
                            <td className="p-2.5 text-right font-extrabold text-red-600 bg-red-50/50 dark:bg-red-950/20">
                              {getLuas(selectedTahunLuas)}
                            </td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2025')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2024')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2023')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2022')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2021')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2020')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2019')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUBTAB 4: LUAS KEBAKARAN PER KAB/KOTA ==================== */}
        {activeTab === 'luas_kabupaten' && (
          <div className="space-y-3">
            {/* Filter Bar */}
            <div
              className="p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-2xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wide">Pencarian & Tahun:</span>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama kabupaten/kota..."
                    value={searchKabupaten}
                    onChange={(e) => {
                      setSearchKabupaten(e.target.value);
                      setKabupatenPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none w-56"
                    style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <select
                  value={selectedTahunLuas}
                  onChange={(e) => setSelectedTahunLuas(e.target.value)}
                  className="p-1.5 px-3 rounded-xl text-xs font-black border outline-none cursor-pointer bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                >
                  {Array.from({ length: 12 }, (_, i) => 2015 + i).reverse().map((thn) => (
                    <option key={thn} value={String(thn)}>Tahun {thn}</option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-slate-500">
                Total: <strong className="text-red-600">{filteredKabupatenTable.length}</strong> Kabupaten / Kota
              </div>
            </div>

            {/* Table */}
            <div
              className="rounded-2xl border overflow-hidden shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="overflow-x-auto max-h-[420px]">
                {loadingKabupaten ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold">Mengunduh data luas per kabupaten dari SIPONGI...</span>
                  </div>
                ) : (
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="p-2.5 pl-4">No</th>
                        <th className="p-2.5">Kabupaten / Kota</th>
                        <th className="p-2.5 text-right font-black text-red-600 bg-red-50 dark:bg-red-950/30">
                          {selectedTahunLuas} (ha)
                        </th>
                        <th className="p-2.5 text-right">2025</th>
                        <th className="p-2.5 text-right">2024</th>
                        <th className="p-2.5 text-right">2023</th>
                        <th className="p-2.5 text-right">2022</th>
                        <th className="p-2.5 text-right">2021</th>
                        <th className="p-2.5 text-right">2020</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-faint)' }}>
                      {currentKabupatenRows.map((kab, idx) => {
                        const getLuas = (thn: string) => {
                          const itm = kab.data_luas?.find((d) => String(d.tahun) === thn);
                          return itm?.luas || itm?.total || '-';
                        };

                        const actualIndex = (kabupatenPage - 1) * itemsPerPage + idx + 1;

                        return (
                          <tr key={kab.id_mendagri || kab.nama} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-2.5 pl-4 text-slate-400 font-bold">{actualIndex}</td>
                            <td className="p-2.5 font-bold">{kab.nama}</td>
                            <td className="p-2.5 text-right font-extrabold text-red-600 bg-red-50/50 dark:bg-red-950/20">
                              {getLuas(selectedTahunLuas)}
                            </td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2025')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2024')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2023')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2022')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2021')}</td>
                            <td className="p-2.5 text-right text-slate-600 dark:text-slate-300">{getLuas('2020')}</td>
                          </tr>
                        );
                      })}
                      {currentKabupatenRows.length === 0 && !loadingKabupaten && (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                            Tidak ditemukan kabupaten/kota dengan pencarian &quot;{searchKabupaten}&quot;
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {totalKabupatenPages > 1 && (
                <div className="p-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-faint)' }}>
                  <button
                    onClick={() => setKabupatenPage((p) => Math.max(1, p - 1))}
                    disabled={kabupatenPage === 1}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  <span className="text-xs font-bold text-slate-500">
                    Halaman {kabupatenPage} dari {totalKabupatenPages}
                  </span>

                  <button
                    onClick={() => setKabupatenPage((p) => Math.min(totalKabupatenPages, p + 1))}
                    disabled={kabupatenPage === totalKabupatenPages}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
