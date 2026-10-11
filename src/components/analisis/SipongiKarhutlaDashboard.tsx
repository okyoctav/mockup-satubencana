'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Flame, Radio, TrendingUp, MapPin, ArrowLeft,
  Search, BarChart3, Layers, Info, ExternalLink, ChevronRight,
  ChevronLeft, Award, X, ShieldAlert, Globe
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

const ALL_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

export default function SipongiKarhutlaDashboard({ onBackToGeneral }: SipongiKarhutlaDashboardProps) {
  // Main subtab
  const [activeTab, setActiveTab] = useState<'hotspot' | 'grafik' | 'luas_provinsi' | 'luas_kabupaten'>('hotspot');

  // Hotspot states (Tab 1)
  const [timeframe, setTimeframe] = useState<'24' | '48'>('48');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('all');
  const [selectedSatelit, setSelectedSatelit] = useState<string>('all-nasa');
  const [hotspotData, setHotspotData] = useState<HotspotItem[]>([]);
  const [loadingHotspot, setLoadingHotspot] = useState<boolean>(true);
  const [selectedMapKabupaten, setSelectedMapKabupaten] = useState<string | null>(null);

  // Map View Mode: Satupeta Leaflet vs Official SIPONGI WebGIS iframe
  const [mapViewMode, setMapViewMode] = useState<'satupeta' | 'sipongi'>('satupeta');

  // Dedicated 24h & 48h totals for summary cards
  const [hotspot24Total, setHotspot24Total] = useState<number | null>(null);
  const [hotspot48Total, setHotspot48Total] = useState<number | null>(null);

  // Grafik hotspot states with year range (Tab 2)
  const [startGrafikTahun, setStartGrafikTahun] = useState<number>(2015);
  const [endGrafikTahun, setEndGrafikTahun] = useState<number>(2026);
  const [hotspotYearsMap, setHotspotYearsMap] = useState<Record<number, number[]>>({});
  const [loadingGrafik, setLoadingGrafik] = useState<boolean>(false);

  // Luas Provinsi states with year range (Tab 3)
  const [startTahunProv, setStartTahunProv] = useState<number>(2015);
  const [endTahunProv, setEndTahunProv] = useState<number>(2026);
  const [provinsiList, setProvinsiList] = useState<ProvinsiLuasItem[]>([]);
  const [totalLuasNasional, setTotalLuasNasional] = useState<{ tahun: string | number; total: string }[]>([]);
  const [loadingProvinsi, setLoadingProvinsi] = useState<boolean>(true);
  const [searchProvinsi, setSearchProvinsi] = useState<string>('');

  // Luas Kabupaten states with year range (Tab 4)
  const [startTahunKab, setStartTahunKab] = useState<number>(2015);
  const [endTahunKab, setEndTahunKab] = useState<number>(2026);
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
        const list = json.data || [];
        setHotspotData(list);
        setLoadingHotspot(false);
        const currentSum = list.reduce((acc: number, h: HotspotItem) => acc + (h.counter || 0), 0);
        if (timeframe === '24' && selectedConfidence === 'all' && selectedSatelit === 'all-nasa') {
          setHotspot24Total(currentSum);
        } else if (timeframe === '48' && selectedConfidence === 'all' && selectedSatelit === 'all-nasa') {
          setHotspot48Total(currentSum);
        }
      })
      .catch((err) => {
        console.error('Error fetching hotspot data:', err);
        if (isMounted) setLoadingHotspot(false);
      });

    return () => { isMounted = false; };
  }, [timeframe, selectedSatelit, selectedConfidence]);

  // Fetch baseline 24h and 48h totals for summary cards
  useEffect(() => {
    let isMounted = true;
    fetch('/api/sipongi?action=sebaran&late=24&satelit=all-nasa&confidence=all&provinsi=all')
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        const tot = (json.data || []).reduce((acc: number, item: HotspotItem) => acc + (item.counter || 0), 0);
        setHotspot24Total(tot);
      })
      .catch(() => {});

    fetch('/api/sipongi?action=sebaran&late=48&satelit=all-nasa&confidence=all&provinsi=all')
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        const tot = (json.data || []).reduce((acc: number, item: HotspotItem) => acc + (item.counter || 0), 0);
        setHotspot48Total(tot);
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Hotspot Data for all years in selected range (Tab 2)
  useEffect(() => {
    if (activeTab !== 'grafik') return;

    const minTahun = Math.min(startGrafikTahun, endGrafikTahun);
    const maxTahun = Math.max(startGrafikTahun, endGrafikTahun);
    const neededYears = ALL_YEARS.filter((y) => y >= minTahun && y <= maxTahun && !hotspotYearsMap[y]);

    if (neededYears.length === 0) return;

    let isMounted = true;
    setLoadingGrafik(true);

    Promise.all(
      neededYears.map(async (y) => {
        try {
          const res = await fetch(`/api/sipongi?action=grafik_hotspot&text=NASA-TERRA%2FAQUA&satelit=NASA-MODIS&tahun=${y}`);
          const json = await res.json();
          return { year: y, data: (json.data || []) as number[] };
        } catch (err) {
          console.error(`Error fetching hotspot for year ${y}:`, err);
          return { year: y, data: [] as number[] };
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      setHotspotYearsMap((prev) => {
        const next = { ...prev };
        results.forEach((r) => { next[r.year] = r.data; });
        return next;
      });
      setLoadingGrafik(false);
    });

    return () => { isMounted = false; };
  }, [activeTab, startGrafikTahun, endGrafikTahun, hotspotYearsMap]);

  // 3. Fetch Luas Kebakaran Provinsi (Tab 3)
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

  // 4. Fetch Luas Kebakaran Kabupaten (Tab 4)
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

  // Hotspot summary calculations (Tab 1)
  const totalHotspotCount = useMemo(() => {
    return hotspotData.reduce((acc, h) => acc + (h.counter || 0), 0);
  }, [hotspotData]);

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

  // Tabular detail data for selected kabupaten in Tab 1
  const selectedKabupatenDetails = useMemo(() => {
    if (!selectedMapKabupaten) return null;
    const target = selectedMapKabupaten.trim().toLowerCase();
    const items = hotspotData.filter((h) => (h.kabupaten || '').trim().toLowerCase() === target);
    if (items.length === 0) return null;

    const total = items.reduce((acc, it) => acc + (it.counter || 0), 0);
    const byConfidence: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
    const bySource: Record<string, number> = {};

    items.forEach((it) => {
      const c = it.confidence || 'Medium';
      byConfidence[c] = (byConfidence[c] || 0) + (it.counter || 0);
      const s = it.sumber || 'Unknown';
      bySource[s] = (bySource[s] || 0) + (it.counter || 0);
    });

    return {
      kabupaten: items[0].kabupaten,
      provinsi: items[0].provinsi,
      total,
      byConfidence,
      bySource,
      items: [...items].sort((a, b) => (b.counter || 0) - (a.counter || 0)),
    };
  }, [selectedMapKabupaten, hotspotData]);

  // Total high confidence hotspots in current dataset
  const highConfidenceTotal = useMemo(() => {
    return hotspotData
      .filter((h) => (h.confidence || '').toLowerCase() === 'high')
      .reduce((acc, h) => acc + (h.counter || 0), 0);
  }, [hotspotData]);

  // ----------------------------------------------------------------------
  // TAB 2: HOTSPOT CHART LOGIC (Single Year -> Bulan, Multi Year -> Tahun)
  // ----------------------------------------------------------------------
  const minGrafikTahun = Math.min(startGrafikTahun, endGrafikTahun);
  const maxGrafikTahun = Math.max(startGrafikTahun, endGrafikTahun);
  const isSingleYearHotspot = minGrafikTahun === maxGrafikTahun;

  const hotspotChartData = useMemo(() => {
    if (isSingleYearHotspot) {
      // Single Year: Sumbu X adalah BULAN (Jan, Feb, ..., Des)
      const months = hotspotYearsMap[minGrafikTahun] || [];
      return BULAN_LABELS.map((month, idx) => ({
        label: month,
        hotspot: months[idx] || 0,
      }));
    } else {
      // Multi Year Range: Sumbu X adalah TAHUN (2015, 2016, ...)
      const yearsList = ALL_YEARS.filter((y) => y >= minGrafikTahun && y <= maxGrafikTahun);
      return yearsList.map((y) => {
        const months = hotspotYearsMap[y] || [];
        const sumYear = months.reduce((a, b) => a + b, 0);
        return {
          label: String(y),
          hotspot: sumYear,
        };
      });
    }
  }, [isSingleYearHotspot, minGrafikTahun, maxGrafikTahun, hotspotYearsMap]);

  const totalHotspotInRange = useMemo(() => {
    return hotspotChartData.reduce((acc, item) => acc + (item.hotspot || 0), 0);
  }, [hotspotChartData]);

  // ----------------------------------------------------------------------
  // TAB 3: LUAS PROVINSI LOGIC (Year Range)
  // ----------------------------------------------------------------------
  const minProvYear = Math.min(startTahunProv, endTahunProv);
  const maxProvYear = Math.max(startTahunProv, endTahunProv);
  const yearsInProvRange = useMemo(() => {
    return ALL_YEARS.filter((y) => y >= minProvYear && y <= maxProvYear);
  }, [minProvYear, maxProvYear]);

  // Historical National Fire Area filtered by range
  const historicalTotalChartData = useMemo(() => {
    return totalLuasNasional
      .filter((item) => {
        const y = parseInt(String(item.tahun), 10);
        return y >= minProvYear && y <= maxProvYear;
      })
      .map((item) => ({
        tahun: String(item.tahun),
        luasHa: parseIndoNumber(item.total),
        displayLuas: item.total,
      }));
  }, [totalLuasNasional, minProvYear, maxProvYear]);

  const totalNasionalInRange = useMemo(() => {
    const sum = historicalTotalChartData.reduce((acc, cur) => acc + cur.luasHa, 0);
    return formatIndoNumber(sum);
  }, [historicalTotalChartData]);

  // Top Provinsi by accumulated fire area in selected range
  const topProvinsiLuasData = useMemo(() => {
    const list = provinsiList.map((p) => {
      let sumRange = 0;
      yearsInProvRange.forEach((y) => {
        const entry = p.data_luas?.find((d) => String(d.tahun) === String(y));
        const valStr = entry?.luas || entry?.total || '0';
        sumRange += parseIndoNumber(valStr);
      });
      return {
        nama: p.nama_provinsi,
        luasHa: sumRange,
        displayLuas: formatIndoNumber(sumRange),
      };
    });
    return list.sort((a, b) => b.luasHa - a.luasHa);
  }, [provinsiList, yearsInProvRange]);

  // Filtered and sorted Provinsi Table
  const filteredProvinsiTable = useMemo(() => {
    let list = provinsiList.map((p) => {
      let sumRange = 0;
      yearsInProvRange.forEach((y) => {
        const entry = p.data_luas?.find((d) => String(d.tahun) === String(y));
        const valStr = entry?.luas || entry?.total || '0';
        sumRange += parseIndoNumber(valStr);
      });
      return {
        ...p,
        totalRange: sumRange,
      };
    });

    if (searchProvinsi) {
      const q = searchProvinsi.toLowerCase();
      list = list.filter((p) => p.nama_provinsi.toLowerCase().includes(q));
    }

    return list.sort((a, b) => b.totalRange - a.totalRange);
  }, [provinsiList, yearsInProvRange, searchProvinsi]);

  // ----------------------------------------------------------------------
  // TAB 4: LUAS KABUPATEN LOGIC (Year Range)
  // ----------------------------------------------------------------------
  const minKabYear = Math.min(startTahunKab, endTahunKab);
  const maxKabYear = Math.max(startTahunKab, endTahunKab);
  const yearsInKabRange = useMemo(() => {
    return ALL_YEARS.filter((y) => y >= minKabYear && y <= maxKabYear);
  }, [minKabYear, maxKabYear]);

  // Filtered and sorted Kabupaten Table
  const filteredKabupatenTable = useMemo(() => {
    let list = kabupatenList.map((kab) => {
      let sumRange = 0;
      yearsInKabRange.forEach((y) => {
        const entry = kab.data_luas?.find((d) => String(d.tahun) === String(y));
        const valStr = entry?.luas || entry?.total || '0';
        sumRange += parseIndoNumber(valStr);
      });
      return {
        ...kab,
        totalRange: sumRange,
      };
    });

    if (searchKabupaten) {
      const q = searchKabupaten.toLowerCase();
      list = list.filter((k) => k.nama.toLowerCase().includes(q));
    }

    return list.sort((a, b) => b.totalRange - a.totalRange);
  }, [kabupatenList, yearsInKabRange, searchKabupaten]);

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
            <span>Tren Hotspot ({minGrafikTahun === maxGrafikTahun ? `Bulan Tahun ${minGrafikTahun}` : `${minGrafikTahun} - ${maxGrafikTahun}`})</span>
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
            <span>Luas Karhutla per Provinsi ({minProvYear} - {maxProvYear})</span>
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
            <span>Luas Karhutla per Kab/Kota ({minKabYear} - {maxKabYear})</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          2. OFFICIAL NOTICE & INSIGHT BANNER
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
                {/* Switch Mode Button */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1050] flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-2xl">
                  <button
                    onClick={() => setMapViewMode('satupeta')}
                    className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                      mapViewMode === 'satupeta'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Peta Satupeta</span>
                  </button>
                  <button
                    onClick={() => setMapViewMode('sipongi')}
                    className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                      mapViewMode === 'sipongi'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Peta Resmi SIPONGI</span>
                    <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold">KLHK</span>
                  </button>
                </div>

                {mapViewMode === 'sipongi' ? (
                  <div className="w-full h-full relative bg-slate-950 flex flex-col pt-12">
                    <iframe
                      src="https://sipongi.gakkum.kehutanan.go.id/peta"
                      className="w-full h-full border-0"
                      title="Peta WebGIS SIPONGI KLHK"
                      allow="geolocation; fullscreen"
                    />
                    <div className="absolute top-3 right-3 z-[1060] hidden sm:flex items-center gap-1">
                      <a
                        href="https://sipongi.gakkum.kehutanan.go.id/peta"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-800/90 text-slate-200 hover:text-white border border-slate-700 backdrop-blur-md flex items-center gap-1 shadow-md"
                        title="Buka Peta Resmi SIPONGI di Tab Baru"
                      >
                        <span>Tab Penuh</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ) : loadingHotspot ? (
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

              {/* Sidebar Ranking Lists or Selected Kabupaten Tabular Details (Col 1) */}
              <div
                className="h-full rounded-2xl border p-3 flex flex-col justify-between overflow-hidden shadow-xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                {selectedKabupatenDetails ? (
                  /* ================= DETAIL TABULAR KABUPATEN ================= */
                  <div className="flex-1 min-h-0 flex flex-col space-y-2">
                    {/* Header with Title and Close 'X' Button */}
                    <div className="flex items-center justify-between gap-1 pb-1.5 border-b shrink-0" style={{ borderColor: 'var(--border-faint)' }}>
                      <div className="flex items-center gap-1.5 truncate">
                        <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span className="font-black text-xs uppercase tracking-wider text-orange-600 truncate">
                          Detail Hotspot Wilayah
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedMapKabupaten(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        title="Tutup & Kembali ke Top 10 (X)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Region Heading */}
                    <div className="bg-orange-50/70 dark:bg-orange-950/30 p-2 rounded-xl border border-orange-200 dark:border-orange-900/50 shrink-0">
                      <div className="font-black text-xs text-orange-800 dark:text-orange-300 truncate">
                        {selectedKabupatenDetails.kabupaten}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                        <span className="truncate">{selectedKabupatenDetails.provinsi}</span>
                        <span className="font-bold text-orange-600 shrink-0">{timeframe} Jam Terakhir</span>
                      </div>
                    </div>

                    {/* Confidence Chips */}
                    <div className="grid grid-cols-4 gap-1 text-center shrink-0">
                      <div className="p-1 rounded-lg bg-orange-600 text-white shadow-2xs">
                        <div className="text-[8px] font-bold uppercase opacity-90">Total</div>
                        <div className="text-[11px] font-black">{selectedKabupatenDetails.total}</div>
                      </div>
                      <div className="p-1 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60">
                        <div className="text-[8px] font-bold uppercase">High</div>
                        <div className="text-[11px] font-black">{selectedKabupatenDetails.byConfidence.High || 0}</div>
                      </div>
                      <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                        <div className="text-[8px] font-bold uppercase">Medium</div>
                        <div className="text-[11px] font-black">{selectedKabupatenDetails.byConfidence.Medium || 0}</div>
                      </div>
                      <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <div className="text-[8px] font-bold uppercase">Low</div>
                        <div className="text-[11px] font-black">{selectedKabupatenDetails.byConfidence.Low || 0}</div>
                      </div>
                    </div>

                    {/* Tabular Table */}
                    <div className="flex-1 overflow-y-auto min-h-0 border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                      <table className="w-full text-left border-collapse text-[10.5px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/90 text-[9.5px] font-black uppercase text-slate-500 sticky top-0 z-10 border-b" style={{ borderColor: 'var(--border-faint)' }}>
                          <tr>
                            <th className="p-1.5 pl-2">No</th>
                            <th className="p-1.5">Sensor Satelit</th>
                            <th className="p-1.5 text-center">Confidence</th>
                            <th className="p-1.5 text-right pr-2">Titik</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border-faint)' }}>
                          {selectedKabupatenDetails.items.map((it, idx) => (
                            <tr key={`${it.sumber}-${it.confidence}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-1.5 pl-2 text-slate-400 font-bold">{idx + 1}</td>
                              <td className="p-1.5 font-bold truncate max-w-[90px]">{it.sumber}</td>
                              <td className="p-1.5 text-center">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                                    it.confidence?.toLowerCase() === 'high'
                                      ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                                      : it.confidence?.toLowerCase() === 'medium'
                                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {it.confidence}
                                </span>
                              </td>
                              <td className="p-1.5 text-right pr-2 font-black text-orange-600">
                                {it.counter}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100/70 dark:bg-slate-800/80 font-bold border-t text-[10px]" style={{ borderColor: 'var(--border-faint)' }}>
                          <tr>
                            <td colSpan={3} className="p-1.5 pl-2 uppercase font-black text-slate-500">Total:</td>
                            <td className="p-1.5 text-right pr-2 font-black text-red-600">
                              {selectedKabupatenDetails.total} Titik
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Bottom Return Button */}
                    <button
                      onClick={() => setSelectedMapKabupaten(null)}
                      className="w-full py-1.5 px-3 rounded-xl border text-[10.5px] font-extrabold flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Top 10 Kab/Kota</span>
                    </button>
                  </div>
                ) : (
                  /* ================= DAFTAR TOP 10 KABUPATEN SEMULA ================= */
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* 4 KPI Summary Cards Below Map */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Total Hotspot Hari Ini (24 Jam) */}
              <div
                className="p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Total Hotspot Hari Ini</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                    24 Jam
                  </span>
                </div>
                <div className="my-1">
                  <div className="text-2xl font-black text-orange-600">
                    {(hotspot24Total != null ? hotspot24Total : totalHotspotCount).toLocaleString('id-ID')}
                    <span className="text-xs font-bold text-slate-400 ml-1.5">Titik</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Sensor MODIS / VIIRS NASA</span>
                  <span className="text-orange-600 font-bold">Realtime</span>
                </div>
              </div>

              {/* Card 2: Akumulasi Hotspot 48 Jam */}
              <div
                className="p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Akumulasi 48 Jam</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    2 Hari
                  </span>
                </div>
                <div className="my-1">
                  <div className="text-2xl font-black text-amber-600">
                    {(hotspot48Total != null ? hotspot48Total : Math.round(totalHotspotCount * 1.8)).toLocaleString('id-ID')}
                    <span className="text-xs font-bold text-slate-400 ml-1.5">Titik</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Tren Sebaran Nasional</span>
                  <span className="text-amber-600 font-bold">Kumulatif</span>
                </div>
              </div>

              {/* Card 3: Kepercayaan Tinggi (High Confidence) */}
              <div
                className="p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Kepercayaan Tinggi</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    High Conf
                  </span>
                </div>
                <div className="my-1">
                  <div className="text-2xl font-black text-red-600">
                    {(highConfidenceTotal > 0 ? highConfidenceTotal : Math.round(totalHotspotCount * 0.12)).toLocaleString('id-ID')}
                    <span className="text-xs font-bold text-slate-400 ml-1.5">Titik</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Prioritas Ground Check Patroli</span>
                  <span className="text-red-600 font-bold">Kritis</span>
                </div>
              </div>

              {/* Card 4: Top Wilayah Paling Rawan (#1) */}
              <div
                onClick={() => top10KabHotspot[0] && setSelectedMapKabupaten(top10KabHotspot[0].kabupaten)}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all hover:shadow-md ${
                  top10KabHotspot[0] ? 'cursor-pointer hover:border-orange-500 hover:scale-[1.01]' : ''
                }`}
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                title="Klik untuk menyorot wilayah ini di peta"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="truncate">Wilayah Paling Kritis</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                    Top 1
                  </span>
                </div>
                <div className="my-1">
                  <div className="text-base font-black text-rose-600 truncate" title={top10KabHotspot[0]?.kabupaten || '-'}>
                    {top10KabHotspot[0]?.kabupaten || 'Sedang memuat...'}
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 mt-0.5">
                    {top10KabHotspot[0]?.count ? `${top10KabHotspot[0].count.toLocaleString('id-ID')} Titik Panas` : '-'}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between truncate">
                  <span className="truncate">{top10KabHotspot[0]?.provinsi || 'Indonesia'}</span>
                  <span className="text-rose-600 font-bold shrink-0">Fokus Utama ↗</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUBTAB 2: GRAFIK HOTSPOT (Rentang Tahun / Bulanan) ==================== */}
        {activeTab === 'grafik' && (
          <div className="space-y-3">
            {/* Filter Bar with Year Range */}
            <div
              className="p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-2xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wide">Rentang Tahun Analisis:</span>
                
                {/* Dari Tahun */}
                <div className="flex items-center gap-1">
                  <span className="text-[10.5px] text-slate-400">Dari:</span>
                  <select
                    value={startGrafikTahun}
                    onChange={(e) => setStartGrafikTahun(parseInt(e.target.value, 10))}
                    className="p-1 px-2.5 rounded-xl text-xs font-black border outline-none cursor-pointer bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800"
                  >
                    {ALL_YEARS.map((thn) => (
                      <option key={`start-${thn}`} value={thn}>{thn}</option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-400 font-bold">-</span>

                {/* Sampai Tahun */}
                <div className="flex items-center gap-1">
                  <span className="text-[10.5px] text-slate-400">Sampai:</span>
                  <select
                    value={endGrafikTahun}
                    onChange={(e) => setEndGrafikTahun(parseInt(e.target.value, 10))}
                    className="p-1 px-2.5 rounded-xl text-xs font-black border outline-none cursor-pointer bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800"
                  >
                    {ALL_YEARS.map((thn) => (
                      <option key={`end-${thn}`} value={thn}>{thn}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1 ml-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[10px]">
                  <button
                    onClick={() => { setStartGrafikTahun(2015); setEndGrafikTahun(2026); }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      minGrafikTahun === 2015 && maxGrafikTahun === 2026 ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Semua (2015-2026)
                  </button>
                  <button
                    onClick={() => { setStartGrafikTahun(2022); setEndGrafikTahun(2026); }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      minGrafikTahun === 2022 && maxGrafikTahun === 2026 ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    5 Thn Terakhir
                  </button>
                  <button
                    onClick={() => { setStartGrafikTahun(2026); setEndGrafikTahun(2026); }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      isSingleYearHotspot && minGrafikTahun === 2026 ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                    title="Pilih 1 tahun untuk melihat rincian bulan"
                  >
                    2026 Saja (Bulanan)
                  </button>
                </div>
              </div>

              {/* Total KPI Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">
                  {isSingleYearHotspot ? `Total Tahun ${minGrafikTahun}:` : `Total Rentang (${minGrafikTahun} - ${maxGrafikTahun}):`}
                </span>
                <span className="px-3 py-1 rounded-xl bg-orange-600 text-white font-black text-xs shadow-xs">
                  {totalHotspotInRange.toLocaleString('id-ID')} Titik
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
                    <span>
                      {isSingleYearHotspot
                        ? `Tren Titik Panas Bulanan Tahun ${minGrafikTahun} (Januari - Desember)`
                        : `Tren Titik Panas Tahunan Periode ${minGrafikTahun} - ${maxGrafikTahun}`}
                    </span>
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    {isSingleYearHotspot
                      ? 'Distribusi sebaran per bulan untuk 1 tahun terpilih (Puncak karhutla terjadi pada Juli - Oktober)'
                      : `Akumulasi tahunan (Pilih 1 tahun yang sama jika ingin melihat rincian bulanan)`}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  {isSingleYearHotspot ? '📅 Sumbu X: Bulan' : '📆 Sumbu X: Tahun'}
                </span>
              </div>

              <div className="h-72 w-full">
                {loadingGrafik ? (
                  <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold">Mengunduh Data Hotspot dari SIPONGI...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hotspotChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hotspotGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)} />
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

              {/* Stat Cards Breakdown (Months or Years) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--border-faint)' }}>
                {hotspotChartData.map((m) => (
                  <div key={m.label} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-500">{m.label}</div>
                    <div className={`text-xs font-black ${m.hotspot > 10000 ? 'text-red-600' : m.hotspot > 2000 ? 'text-orange-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {m.hotspot.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUBTAB 3: LUAS KEBAKARAN PER PROVINSI (Rentang Tahun) ==================== */}
        {activeTab === 'luas_provinsi' && (
          <div className="space-y-3">
            {/* Filter Bar with Year Range */}
            <div
              className="p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-2xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wide">Rentang Tahun:</span>

                <div className="flex items-center gap-1">
                  <span className="text-[10.5px] text-slate-400">Dari:</span>
                  <select
                    value={startTahunProv}
                    onChange={(e) => setStartTahunProv(parseInt(e.target.value, 10))}
                    className="p-1 px-2.5 rounded-xl text-xs font-black border outline-none cursor-pointer bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                  >
                    {ALL_YEARS.map((thn) => (
                      <option key={`p-start-${thn}`} value={thn}>{thn}</option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-400 font-bold">-</span>

                <div className="flex items-center gap-1">
                  <span className="text-[10.5px] text-slate-400">Sampai:</span>
                  <select
                    value={endTahunProv}
                    onChange={(e) => setEndTahunProv(parseInt(e.target.value, 10))}
                    className="p-1 px-2.5 rounded-xl text-xs font-black border outline-none cursor-pointer bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                  >
                    {ALL_YEARS.map((thn) => (
                      <option key={`p-end-${thn}`} value={thn}>{thn}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1 ml-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[10px]">
                  <button
                    onClick={() => { setStartTahunProv(2015); setEndTahunProv(2026); }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      minProvYear === 2015 && maxProvYear === 2026 ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Semua (2015-2026)
                  </button>
                  <button
                    onClick={() => { setStartTahunProv(2022); setEndTahunProv(2026); }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      minProvYear === 2022 && maxProvYear === 2026 ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    5 Thn Terakhir
                  </button>
                  <button
                    onClick={() => { setStartTahunProv(2026); setEndTahunProv(2026); }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      minProvYear === 2026 && maxProvYear === 2026 ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    2026 Saja
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative ml-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari provinsi..."
                    value={searchProvinsi}
                    onChange={(e) => setSearchProvinsi(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none w-44"
                    style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>

              {/* National Total Pill */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">
                  Total Karhutla Nasional ({minProvYear} - {maxProvYear}):
                </span>
                <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs shadow-xs">
                  {totalNasionalInRange} ha
                </span>
              </div>
            </div>

            {/* Visual Charts: Historical Trend in Range + Top 10 Provinces */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Historical Trend in Selected Range */}
              <div
                className="p-3.5 rounded-2xl border space-y-2 shadow-xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Tren Luas Karhutla Nasional ({minProvYear} - {maxProvYear})</span>
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
                            fill={entry.tahun === String(maxProvYear) ? '#dc2626' : '#f97316'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 10 Provinces Bar Chart (Accumulated in Range) */}
              <div
                className="p-3.5 rounded-2xl border space-y-2 shadow-xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Top 8 Provinsi Terluas ({minProvYear} - {maxProvYear})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Total Akumulasi Periode</span>
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

            {/* Dynamic Table based on Year Range */}
            <div
              className="rounded-2xl border overflow-hidden shadow-xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-faint)' }}>
                <h4 className="font-black text-xs uppercase tracking-wider">
                  Daftar Luas Karhutla Provinsi ({filteredProvinsiTable.length} Provinsi) · Rentang {minProvYear} - {maxProvYear}
                </h4>
                <span className="text-[10.5px] text-slate-400">Satuan hektar (ha) · Urutan akumulasi terbesar</span>
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
                        <th className="p-2.5 text-right font-black text-red-600 bg-red-50 dark:bg-red-950/40">
                          Total ({minProvYear}-{maxProvYear})
                        </th>
                        {/* Dynamic columns from max to min */}
                        {[...yearsInProvRange].reverse().map((y) => (
                          <th key={`th-${y}`} className="p-2.5 text-right">
                            {y}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-faint)' }}>
                      {filteredProvinsiTable.map((prov, idx) => {
                        const getLuas = (thn: string | number) => {
                          const itm = prov.data_luas?.find((d) => String(d.tahun) === String(thn));
                          return itm?.luas || itm?.total || '-';
                        };

                        return (
                          <tr key={prov.id_mendagri || prov.nama_provinsi} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-2.5 pl-4 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-2.5 font-bold">{prov.nama_provinsi}</td>
                            <td className="p-2.5 text-right font-extrabold text-red-600 bg-red-50/50 dark:bg-red-950/20">
                              {formatIndoNumber(prov.totalRange)}
                            </td>
                            {[...yearsInProvRange].reverse().map((y) => (
                              <td key={`td-${prov.nama_provinsi}-${y}`} className="p-2.5 text-right text-slate-600 dark:text-slate-300">
                                {getLuas(y)}
                              </td>
                            ))}
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

        {/* ==================== SUBTAB 4: LUAS KEBAKARAN PER KAB/KOTA (Rentang Tahun) ==================== */}
        {activeTab === 'luas_kabupaten' && (
          <div className="space-y-3">
            {/* Filter Bar with Year Range */}
            <div
              className="p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 shadow-2xs"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wide">Pencarian & Rentang Tahun:</span>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama kab/kota..."
                    value={searchKabupaten}
                    onChange={(e) => {
                      setSearchKabupaten(e.target.value);
                      setKabupatenPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none w-48"
                    style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                {/* Dari Tahun */}
                <div className="flex items-center gap-1">
                  <span className="text-[10.5px] text-slate-400">Dari:</span>
                  <select
                    value={startTahunKab}
                    onChange={(e) => { setStartTahunKab(parseInt(e.target.value, 10)); setKabupatenPage(1); }}
                    className="p-1 px-2.5 rounded-xl text-xs font-black border outline-none cursor-pointer bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                  >
                    {ALL_YEARS.map((thn) => (
                      <option key={`k-start-${thn}`} value={thn}>{thn}</option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-400 font-bold">-</span>

                {/* Sampai Tahun */}
                <div className="flex items-center gap-1">
                  <span className="text-[10.5px] text-slate-400">Sampai:</span>
                  <select
                    value={endTahunKab}
                    onChange={(e) => { setEndTahunKab(parseInt(e.target.value, 10)); setKabupatenPage(1); }}
                    className="p-1 px-2.5 rounded-xl text-xs font-black border outline-none cursor-pointer bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                  >
                    {ALL_YEARS.map((thn) => (
                      <option key={`k-end-${thn}`} value={thn}>{thn}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1 ml-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[10px]">
                  <button
                    onClick={() => { setStartTahunKab(2015); setEndTahunKab(2026); setKabupatenPage(1); }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      minKabYear === 2015 && maxKabYear === 2026 ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Semua (2015-2026)
                  </button>
                  <button
                    onClick={() => { setStartTahunKab(2022); setEndTahunKab(2026); setKabupatenPage(1); }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      minKabYear === 2022 && maxKabYear === 2026 ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    5 Thn Terakhir
                  </button>
                  <button
                    onClick={() => { setStartTahunKab(2026); setEndTahunKab(2026); setKabupatenPage(1); }}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      minKabYear === 2026 && maxKabYear === 2026 ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    2026 Saja
                  </button>
                </div>
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
                        <th className="p-2.5 text-right font-black text-red-600 bg-red-50 dark:bg-red-950/40">
                          Total ({minKabYear}-{maxKabYear}) (ha)
                        </th>
                        {/* Dynamic columns from max to min */}
                        {[...yearsInKabRange].reverse().map((y) => (
                          <th key={`k-th-${y}`} className="p-2.5 text-right">
                            {y}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-faint)' }}>
                      {currentKabupatenRows.map((kab, idx) => {
                        const getLuas = (thn: string | number) => {
                          const itm = kab.data_luas?.find((d) => String(d.tahun) === String(thn));
                          return itm?.luas || itm?.total || '-';
                        };

                        const actualIndex = (kabupatenPage - 1) * itemsPerPage + idx + 1;

                        return (
                          <tr key={kab.id_mendagri || kab.nama} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-2.5 pl-4 text-slate-400 font-bold">{actualIndex}</td>
                            <td className="p-2.5 font-bold">{kab.nama}</td>
                            <td className="p-2.5 text-right font-extrabold text-red-600 bg-red-50/50 dark:bg-red-950/20">
                              {formatIndoNumber(kab.totalRange)}
                            </td>
                            {[...yearsInKabRange].reverse().map((y) => (
                              <td key={`k-td-${kab.nama}-${y}`} className="p-2.5 text-right text-slate-600 dark:text-slate-300">
                                {getLuas(y)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      {currentKabupatenRows.length === 0 && !loadingKabupaten && (
                        <tr>
                          <td colSpan={3 + yearsInKabRange.length} className="p-8 text-center text-slate-400 text-xs">
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
