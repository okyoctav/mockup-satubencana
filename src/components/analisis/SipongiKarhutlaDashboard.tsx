'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Flame, Radio, TrendingUp, MapPin, ArrowLeft,
  Search, BarChart3, Layers, Info, ExternalLink, ChevronRight,
  ChevronLeft, Award, X, ShieldAlert, Globe, ArrowDown, ArrowUp, ArrowUpDown
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import {
  buildSipongiNamaToKode,
  matchProvinsiOption,
} from '@/lib/sipongiGeo';

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

type SipongiTab = 'hotspot' | 'grafik' | 'luas_provinsi' | 'luas_kabupaten';

function readSipongiUrlState(sp: URLSearchParams): {
  late: '24' | '48' | null;
  conf: string | null;
  sat: string | null;
  tab: SipongiTab | null;
  prov: string | null;
} {
  const lateRaw = sp.get('late');
  const late: '24' | '48' | null =
    lateRaw === '24' || lateRaw === '48' ? lateRaw : null;
  const confRaw = sp.get('conf');
  const conf =
    confRaw === 'high' || confRaw === 'medium' || confRaw === 'low' || confRaw === 'all'
      ? confRaw
      : null;
  const satRaw = sp.get('sat');
  const sat =
    satRaw === 'all-nasa' ||
    satRaw === 'NASA-MODIS' ||
    satRaw === 'NASA-SNPP' ||
    satRaw === 'NASA-NOAA20'
      ? satRaw
      : null;
  const tabRaw = sp.get('tab');
  const tab: SipongiTab | null =
    tabRaw === 'hotspot' ||
    tabRaw === 'grafik' ||
    tabRaw === 'luas_provinsi' ||
    tabRaw === 'luas_kabupaten'
      ? tabRaw
      : null;
  const prov = sp.get('prov');
  return { late, conf, sat, tab, prov };
}

export default function SipongiKarhutlaDashboard({ onBackToGeneral }: SipongiKarhutlaDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlHydratedRef = useRef(false);

  // Main subtab
  const [activeTab, setActiveTab] = useState<SipongiTab>('hotspot');

  // Hotspot states (Tab 1) — default confidence High untuk briefing
  const [timeframe, setTimeframe] = useState<'24' | '48'>('48');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('high');
  const [selectedSatelit, setSelectedSatelit] = useState<string>('all-nasa');
  const [selectedProvinsi, setSelectedProvinsi] = useState<string>('all');
  const [hotspotData, setHotspotData] = useState<HotspotItem[]>([]);
  const [loadingHotspot, setLoadingHotspot] = useState<boolean>(true);
  const [hotspotFeed, setHotspotFeed] = useState<'live' | 'cache' | 'fallback' | 'empty' | 'error' | 'loading'>('loading');
  const [selectedMapKabupaten, setSelectedMapKabupaten] = useState<string | null>(null);
  const [luasCutoffLabel, setLuasCutoffLabel] = useState<string>('');
  const [namaToKode, setNamaToKode] = useState<Map<string, string>>(() => new Map());

  // Map View Mode: Satupeta Leaflet vs Official SIPONGI WebGIS iframe
  const [mapViewMode, setMapViewMode] = useState<'satupeta' | 'sipongi'>('satupeta');

  // Baseline nasional (satu sumber) untuk kartu KPI — tidak ikut filter peta
  const [hotspot24Total, setHotspot24Total] = useState<number | null>(null);
  const [hotspot48Total, setHotspot48Total] = useState<number | null>(null);
  const [hotspot24High, setHotspot24High] = useState<number | null>(null);
  const [hotspot48High, setHotspot48High] = useState<number | null>(null);
  const [baselineFeed, setBaselineFeed] = useState<'live' | 'cache' | 'fallback' | 'error' | 'loading'>('loading');

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
  const [sortKeyProv, setSortKeyProv] = useState<string | number>('total');
  const [sortOrderProv, setSortOrderProv] = useState<'asc' | 'desc'>('desc');

  // Luas Kabupaten states with year range (Tab 4)
  const [startTahunKab, setStartTahunKab] = useState<number>(2015);
  const [endTahunKab, setEndTahunKab] = useState<number>(2026);
  const [kabupatenList, setKabupatenList] = useState<KabupatenLuasItem[]>([]);
  const [loadingKabupaten, setLoadingKabupaten] = useState<boolean>(false);
  const [searchKabupaten, setSearchKabupaten] = useState<string>('');
  const [kabupatenPage, setKabupatenPage] = useState<number>(1);
  const [sortKeyKab, setSortKeyKab] = useState<string | number>('total');
  const [sortOrderKab, setSortOrderKab] = useState<'asc' | 'desc'>('desc');

  const handleSortProv = (key: string | number) => {
    if (String(sortKeyProv) === String(key)) {
      setSortOrderProv((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKeyProv(key);
      setSortOrderProv('desc');
    }
  };

  const handleSortKab = (key: string | number) => {
    if (String(sortKeyKab) === String(key)) {
      setSortOrderKab((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKeyKab(key);
      setSortOrderKab('desc');
    }
    setKabupatenPage(1);
  };

  // Hydrate filter dari URL (shareable)
  useEffect(() => {
    if (urlHydratedRef.current) return;
    urlHydratedRef.current = true;
    const parsed = readSipongiUrlState(searchParams);
    if (parsed.late) setTimeframe(parsed.late);
    if (parsed.conf) setSelectedConfidence(parsed.conf);
    if (parsed.sat) setSelectedSatelit(parsed.sat);
    if (parsed.tab) setActiveTab(parsed.tab);
    if (parsed.prov) setSelectedProvinsi(parsed.prov);
  }, [searchParams]);

  // Persist filter ke URL tanpa reload
  useEffect(() => {
    if (!urlHydratedRef.current) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', 'sipongi');
    params.set('late', timeframe);
    params.set('conf', selectedConfidence);
    params.set('sat', selectedSatelit);
    params.set('tab', activeTab);
    if (selectedProvinsi && selectedProvinsi !== 'all') params.set('prov', selectedProvinsi);
    else params.delete('prov');

    const next = params.toString();
    if (next === searchParams.toString()) return;
    router.replace(`${pathname}?${next}`, { scroll: false });
  }, [
    timeframe,
    selectedConfidence,
    selectedSatelit,
    selectedProvinsi,
    activeTab,
    pathname,
    router,
    searchParams,
  ]);

  const handleBack = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    ['mode', 'late', 'conf', 'sat', 'tab', 'prov'].forEach((k) => params.delete(k));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    onBackToGeneral();
  }, [onBackToGeneral, pathname, router, searchParams]);

  const sumHotspots = (list: HotspotItem[]) =>
    list.reduce((acc, h) => acc + (h.counter || 0), 0);
  const sumHigh = (list: HotspotItem[]) =>
    list.reduce(
      (acc, h) => acc + (String(h.confidence).toLowerCase() === 'high' ? h.counter || 0 : 0),
      0,
    );

  // Baseline nasional tunggal (24 + 48) — untuk kartu KPI
  useEffect(() => {
    const ac = new AbortController();
    const loadBaseline = async () => {
      setBaselineFeed('loading');
      try {
        const [res24, res48] = await Promise.all([
          fetch(
            '/api/sipongi?action=sebaran&late=24&satelit=all-nasa&confidence=all&provinsi=all',
            { cache: 'no-store', signal: ac.signal },
          ),
          fetch(
            '/api/sipongi?action=sebaran&late=48&satelit=all-nasa&confidence=all&provinsi=all',
            { cache: 'no-store', signal: ac.signal },
          ),
        ]);
        if (ac.signal.aborted) return;
        const cacheHdr = (res48.headers.get('x-cache') || res24.headers.get('x-cache') || '').toUpperCase();
        const [j24, j48] = await Promise.all([
          res24.json().catch(() => ({})),
          res48.json().catch(() => ({})),
        ]);
        if (ac.signal.aborted) return;
        if (!res24.ok || !res48.ok || j24?.error || j48?.error) {
          setBaselineFeed('error');
          return;
        }
        const list24: HotspotItem[] = Array.isArray(j24?.data) ? j24.data : [];
        const list48: HotspotItem[] = Array.isArray(j48?.data) ? j48.data : [];
        setHotspot24Total(sumHotspots(list24));
        setHotspot48Total(sumHotspots(list48));
        setHotspot24High(sumHigh(list24));
        setHotspot48High(sumHigh(list48));
        if (cacheHdr === 'FALLBACK_STALE') setBaselineFeed('fallback');
        else if (cacheHdr === 'CACHE' || cacheHdr === 'HIT') setBaselineFeed('cache');
        else setBaselineFeed('live');
      } catch (err) {
        if (ac.signal.aborted) return;
        console.error('Error fetching SIPONGI baseline:', err);
        setBaselineFeed('error');
      }
    };
    loadBaseline();
    const timer = window.setInterval(loadBaseline, 5 * 60 * 1000);
    return () => {
      ac.abort();
      window.clearInterval(timer);
    };
  }, []);

  // Index kode Kemendagri dari luas kab (nasional, sekali)
  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/sipongi?action=luas_kabupaten&provinsi=all&tahunAwal=2026&tahunAkhir=2026', {
      cache: 'no-store',
      signal: ac.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (ac.signal.aborted) return;
        const rows = Array.isArray(json?.data) ? json.data : [];
        setNamaToKode(buildSipongiNamaToKode(rows));
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  // Fetch hotspot peta mengikuti filter (terpisah dari baseline KPI)
  useEffect(() => {
    const ac = new AbortController();
    setLoadingHotspot(true);
    setHotspotFeed('loading');
    setSelectedMapKabupaten(null);

    const provParam = encodeURIComponent(selectedProvinsi || 'all');
    fetch(
      `/api/sipongi?action=sebaran&late=${timeframe}&satelit=${encodeURIComponent(selectedSatelit)}&confidence=${encodeURIComponent(selectedConfidence)}&provinsi=${provParam}`,
      { cache: 'no-store', signal: ac.signal },
    )
      .then(async (res) => {
        const cacheHdr = (res.headers.get('x-cache') || '').toUpperCase();
        const json = await res.json().catch(() => ({}));
        if (ac.signal.aborted) return;
        if (!res.ok || json?.error) {
          setHotspotData([]);
          setHotspotFeed('error');
          setLoadingHotspot(false);
          return;
        }
        const list: HotspotItem[] = Array.isArray(json?.data) ? json.data : [];
        setHotspotData(list);
        if (list.length === 0) setHotspotFeed('empty');
        else if (cacheHdr === 'FALLBACK_STALE') setHotspotFeed('fallback');
        else if (cacheHdr === 'CACHE' || cacheHdr === 'HIT') setHotspotFeed('cache');
        else setHotspotFeed('live');
        setLoadingHotspot(false);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.error('Error fetching hotspot data:', err);
        setHotspotData([]);
        setHotspotFeed('error');
        setLoadingHotspot(false);
      });

    return () => ac.abort();
  }, [timeframe, selectedSatelit, selectedConfidence, selectedProvinsi]);

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

  // 3. Fetch Luas Kebakaran Provinsi (Tab 3 + insight banner)
  useEffect(() => {
    const ac = new AbortController();
    setLoadingProvinsi(true);
    fetch(`/api/sipongi?action=luas_provinsi&tahunAwal=2015&tahunAkhir=2026`, {
      cache: 'no-store',
      signal: ac.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (ac.signal.aborted) return;
        setProvinsiList(Array.isArray(json?.data) ? json.data : []);
        setTotalLuasNasional(Array.isArray(json?.total) ? json.total : []);
        setLuasCutoffLabel(typeof json?.last === 'string' ? json.last : '');
        setLoadingProvinsi(false);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.error('Error fetching luas provinsi:', err);
        setLoadingProvinsi(false);
      });

    return () => ac.abort();
  }, []);

  // 4. Fetch Luas Kebakaran Kabupaten (Tab 4) — ikut filter provinsi bila dipilih
  useEffect(() => {
    if (activeTab !== 'luas_kabupaten') return;
    const ac = new AbortController();
    setLoadingKabupaten(true);
    setKabupatenPage(1);
    const provParam = encodeURIComponent(selectedProvinsi || 'all');
    fetch(
      `/api/sipongi?action=luas_kabupaten&provinsi=${provParam}&tahunAwal=2015&tahunAkhir=2026`,
      { cache: 'no-store', signal: ac.signal },
    )
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (ac.signal.aborted) return;
        setKabupatenList(Array.isArray(json?.data) ? json.data : []);
        setLoadingKabupaten(false);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.error('Error fetching luas kabupaten:', err);
        setKabupatenList([]);
        setLoadingKabupaten(false);
      });

    return () => ac.abort();
  }, [activeTab, selectedProvinsi]);

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

  const provinsiOptions = useMemo(() => {
    const names = provinsiList.map((p) => p.nama_provinsi).filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'id'));
  }, [provinsiList]);

  // Samakan nama provinsi dari URL ke opsi resmi SIPONGI
  useEffect(() => {
    if (!provinsiOptions.length || selectedProvinsi === 'all') return;
    const matched = matchProvinsiOption(selectedProvinsi, provinsiOptions);
    if (matched && matched !== selectedProvinsi) setSelectedProvinsi(matched);
  }, [provinsiOptions, selectedProvinsi]);

  const isFilterScoped =
    selectedProvinsi !== 'all' ||
    selectedConfidence !== 'all' ||
    selectedSatelit !== 'all-nasa';

  const filterScopeLabel = useMemo(() => {
    const parts: string[] = [];
    parts.push(selectedProvinsi === 'all' ? 'Nasional' : selectedProvinsi);
    parts.push(
      selectedConfidence === 'all'
        ? 'Semua confidence'
        : `Confidence ${selectedConfidence}`,
    );
    if (selectedSatelit !== 'all-nasa') parts.push(selectedSatelit);
    parts.push(`${timeframe} jam`);
    return parts.join(' · ');
  }, [selectedProvinsi, selectedConfidence, selectedSatelit, timeframe]);

  /** Insight luas nasional dari total live (bukan teks hardcoded). */
  const luasInsight = useMemo(() => {
    if (!totalLuasNasional.length) return null;
    const byYear: Record<number, number> = {};
    totalLuasNasional.forEach((row) => {
      const y = parseInt(String(row.tahun), 10);
      if (!Number.isFinite(y)) return;
      byYear[y] = parseIndoNumber(row.total);
    });
    const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
    const currentYear = years[years.length - 1];
    if (!currentYear || !byYear[currentYear]) return null;
    const currentHa = byYear[currentYear];
    const baselines = [currentYear - 1, 2023, 2019].filter(
      (y) => y !== currentYear && byYear[y] != null && byYear[y] > 0,
    );
    const comparisons = baselines.map((y) => {
      const base = byYear[y];
      const delta = currentHa - base;
      const pct = (delta / base) * 100;
      return { year: y, baseHa: base, deltaHa: delta, pct };
    });
    return { currentYear, currentHa, comparisons, cutoff: luasCutoffLabel };
  }, [totalLuasNasional, luasCutoffLabel]);

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

    return list.sort((a, b) => {
      if (sortKeyProv === 'total') {
        return sortOrderProv === 'desc' ? b.totalRange - a.totalRange : a.totalRange - b.totalRange;
      }
      if (sortKeyProv === 'nama') {
        return sortOrderProv === 'desc'
          ? b.nama_provinsi.localeCompare(a.nama_provinsi)
          : a.nama_provinsi.localeCompare(b.nama_provinsi);
      }
      // Specific year (e.g. 2026, 2025...)
      const entryA = a.data_luas?.find((d) => String(d.tahun) === String(sortKeyProv));
      const valA = parseIndoNumber(entryA?.luas || entryA?.total || '0');
      const entryB = b.data_luas?.find((d) => String(d.tahun) === String(sortKeyProv));
      const valB = parseIndoNumber(entryB?.luas || entryB?.total || '0');
      return sortOrderProv === 'desc' ? valB - valA : valA - valB;
    });
  }, [provinsiList, yearsInProvRange, searchProvinsi, sortKeyProv, sortOrderProv]);

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

    return list.sort((a, b) => {
      if (sortKeyKab === 'total') {
        return sortOrderKab === 'desc' ? b.totalRange - a.totalRange : a.totalRange - b.totalRange;
      }
      if (sortKeyKab === 'nama') {
        return sortOrderKab === 'desc'
          ? b.nama.localeCompare(a.nama)
          : a.nama.localeCompare(b.nama);
      }
      // Specific year
      const entryA = a.data_luas?.find((d) => String(d.tahun) === String(sortKeyKab));
      const valA = parseIndoNumber(entryA?.luas || entryA?.total || '0');
      const entryB = b.data_luas?.find((d) => String(d.tahun) === String(sortKeyKab));
      const valB = parseIndoNumber(entryB?.luas || entryB?.total || '0');
      return sortOrderKab === 'desc' ? valB - valA : valA - valB;
    });
  }, [kabupatenList, yearsInKabRange, searchKabupaten, sortKeyKab, sortOrderKab]);

  const itemsPerPage = 12;
  const totalKabupatenPages = Math.max(1, Math.ceil(filteredKabupatenTable.length / itemsPerPage));
  const currentKabupatenRows = useMemo(() => {
    const start = (kabupatenPage - 1) * itemsPerPage;
    return filteredKabupatenTable.slice(start, start + itemsPerPage);
  }, [filteredKabupatenTable, kabupatenPage]);

  // Helper untuk merender ikon panah pengurutan kolom tabel
  const renderSortIcon = (currentKey: string | number, activeKey: string | number, activeOrder: 'asc' | 'desc') => {
    const isActive = String(currentKey) === String(activeKey);
    if (isActive) {
      return activeOrder === 'desc' ? (
        <ArrowDown className="w-3 h-3 text-red-600 dark:text-red-400 font-black inline shrink-0" />
      ) : (
        <ArrowUp className="w-3 h-3 text-red-600 dark:text-red-400 font-black inline shrink-0" />
      );
    }
    return <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 opacity-40 group-hover:opacity-90 inline shrink-0" />;
  };

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
          {/* Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <span>Sistem Monitoring Karhutla (SIPONGI)</span>
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                  KLHK
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    hotspotFeed === 'live'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                      : hotspotFeed === 'cache'
                        ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
                        : hotspotFeed === 'fallback'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                          : hotspotFeed === 'loading'
                            ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            : hotspotFeed === 'empty'
                              ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                  }`}
                  title="Status feed sebaran hotspot"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      hotspotFeed === 'live'
                        ? 'bg-emerald-500'
                        : hotspotFeed === 'cache'
                          ? 'bg-sky-500'
                          : hotspotFeed === 'fallback'
                            ? 'bg-amber-500'
                            : hotspotFeed === 'loading'
                              ? 'bg-slate-400 animate-pulse'
                              : hotspotFeed === 'empty'
                                ? 'bg-slate-400'
                                : 'bg-rose-500'
                    }`}
                  />
                  {hotspotFeed === 'live'
                    ? 'Live'
                    : hotspotFeed === 'cache'
                      ? 'Cache'
                      : hotspotFeed === 'fallback'
                        ? 'Cadangan'
                        : hotspotFeed === 'loading'
                          ? 'Memuat'
                          : hotspotFeed === 'empty'
                            ? 'Kosong'
                            : 'Gagal'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Data resmi sebaran titik panas satelit NASA & indikasi luas kebakaran hutan dan lahan Kementerian LHK
              </p>
            </div>
          </div>

          {/* Action Back Button */}
          <button
            onClick={handleBack}
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
                <strong className="text-red-700 dark:text-red-400 font-extrabold">Ringkasan Luas Karhutla (SIPONGI live):</strong>{' '}
                {loadingProvinsi && !luasInsight ? (
                  <span className="text-slate-500">Menghitung dari data resmi…</span>
                ) : luasInsight ? (
                  <span className="text-slate-700 dark:text-slate-200">
                    Areal karhutla nasional tahun <strong>{luasInsight.currentYear}</strong>
                    {luasInsight.cutoff ? (
                      <>
                        {' '}
                        (kumulatif s.d. <strong>{luasInsight.cutoff}</strong>)
                      </>
                    ) : null}
                    : <strong>{formatIndoNumber(luasInsight.currentHa)} ha</strong>
                    {luasInsight.comparisons.length > 0 ? (
                      <>
                        .{' '}
                        {luasInsight.comparisons.map((c, idx) => {
                          const naik = c.deltaHa >= 0;
                          return (
                            <span key={c.year}>
                              {idx > 0 ? '; ' : ''}
                              <span className={`font-extrabold ${naik ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {naik ? 'naik' : 'turun'} {formatIndoNumber(Math.abs(c.pct), 0)}% ({formatIndoNumber(Math.abs(c.deltaHa))} ha)
                              </span>
                              {' '}vs {c.year}
                            </span>
                          );
                        })}
                        .
                      </>
                    ) : (
                      '.'
                    )}
                  </span>
                ) : (
                  <span className="text-slate-500">Data luas nasional belum tersedia.</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span>* Angka tahun berjalan biasanya kumulatif hingga bulan cutoff SIPONGI; bandingkan hati-hati dengan tahun penuh.</span>
                {luasInsight?.cutoff ? <span>*** Input terverifikasi sampai dengan {luasInsight.cutoff}.</span> : null}
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
                    title="High direkomendasikan untuk briefing operasional"
                  >
                    <option value="high">High (briefing)</option>
                    <option value="all">Semua (High / Med / Low)</option>
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

                <div className="flex items-center gap-1">
                  <span className="font-bold text-[11px] text-slate-500">Provinsi:</span>
                  <select
                    value={selectedProvinsi}
                    onChange={(e) => setSelectedProvinsi(e.target.value)}
                    className="p-1 px-2 rounded-lg text-[10.5px] font-bold border outline-none cursor-pointer max-w-[180px]"
                    style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}
                    title="Filter sebaran hotspot ke provinsi"
                  >
                    <option value="all">Semua Provinsi</option>
                    {provinsiOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* KPI Pill — hasil filter peta (bukan kartu nasional) */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                    hotspotFeed === 'live'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : hotspotFeed === 'cache'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : hotspotFeed === 'fallback'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : hotspotFeed === 'error'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {hotspotFeed === 'live'
                    ? 'Live'
                    : hotspotFeed === 'cache'
                      ? 'Cache 5m'
                      : hotspotFeed === 'fallback'
                        ? 'Cadangan'
                        : hotspotFeed === 'error'
                          ? 'Gagal'
                          : hotspotFeed === 'empty'
                            ? 'Kosong'
                            : '…'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                    isFilterScoped
                      ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                  title={filterScopeLabel}
                >
                  {isFilterScoped ? 'Hasil filter' : 'Nasional'}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-orange-600 text-white font-black text-xs shadow-xs">
                  {totalHotspotCount.toLocaleString('id-ID')} Titik
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 px-0.5 leading-relaxed">
              Pill oranye = hasil filter peta saat ini ({filterScopeLabel}). Kartu KPI di bawah tetap menampilkan angka{' '}
              <strong>nasional</strong> (semua confidence) agar tidak tercampur. Marker = agregat kab/kota, bukan pixel satelit.
            </p>

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
                ) : loadingHotspot || hotspotFeed === 'loading' ? (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-300">
                    <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-xs font-bold text-orange-400">Mengunduh Sebaran Hotspot SIPONGI ({timeframe} Jam)...</div>
                  </div>
                ) : hotspotFeed === 'error' ? (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-2 text-slate-300 px-6 text-center">
                    <ShieldAlert className="w-8 h-8 text-rose-400" />
                    <div className="text-xs font-bold text-rose-300">Gagal memuat sebaran hotspot SIPONGI</div>
                    <div className="text-[10px] text-slate-400">Coba ubah filter atau buka Peta Resmi SIPONGI.</div>
                  </div>
                ) : hotspotFeed === 'empty' ? (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-2 text-slate-300 px-6 text-center">
                    <Flame className="w-8 h-8 text-slate-500" />
                    <div className="text-xs font-bold text-slate-300">Tidak ada hotspot pada filter ini</div>
                    <div className="text-[10px] text-slate-400">
                      {selectedProvinsi === 'all' ? 'Nasional' : selectedProvinsi} · {timeframe} jam
                    </div>
                  </div>
                ) : (
                  <SipongiHotspotMap
                    hotspots={hotspotData}
                    selectedKabupaten={selectedMapKabupaten}
                    onSelectKabupaten={(kab) => setSelectedMapKabupaten(kab)}
                    timeframe={timeframe}
                    focusProvinsi={selectedProvinsi}
                    namaToKode={namaToKode}
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
                className="group relative overflow-hidden p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all hover:shadow-md min-h-[122px]"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                {/* 3D Illustration Graphic from SIPONGI Reference */}
                <img
                  src="/images/sipongi/card_hotspot_today.png"
                  alt="Satelit Hotspot NASA Realtime"
                  className="absolute right-0 bottom-0 top-0 h-full max-h-[135px] w-auto max-w-[50%] object-contain object-right-bottom pointer-events-none select-none z-0 opacity-95 dark:opacity-85 transition-transform duration-500 group-hover:scale-105"
                />

                <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Hotspot Nasional 24 Jam</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs">
                    Nasional
                  </span>
                </div>
                <div className="relative z-10 my-1 max-w-[60%]">
                  <div className="text-2xl font-black text-orange-600 tracking-tight">
                    {baselineFeed === 'loading' && hotspot24Total == null
                      ? '…'
                      : (hotspot24Total ?? 0).toLocaleString('id-ID')}
                    <span className="text-xs font-bold text-slate-400 ml-1.5">Titik</span>
                  </div>
                </div>
                <div className="relative z-10 text-[10px] text-slate-400 mt-1 flex items-center justify-between gap-2">
                  <span>Semua confidence · NASA</span>
                  <span
                    title="Angka nasional tetap, tidak berubah saat filter peta"
                    className="text-orange-800 font-bold bg-orange-50/80 dark:bg-orange-950/40 px-1.5 py-0.5 rounded-md border border-orange-200/80 shrink-0"
                  >
                    24 jam
                  </span>
                </div>
              </div>

              {/* Card 2: Akumulasi Hotspot 48 Jam */}
              <div
                className="group relative overflow-hidden p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all hover:shadow-md min-h-[122px]"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                {/* 3D Illustration Graphic from SIPONGI Reference */}
                <img
                  src="/images/sipongi/card_hotspot_48h.png"
                  alt="Layer Peta & Grafik Sebaran Nasional"
                  className="absolute right-0 bottom-0 top-0 h-full max-h-[135px] w-auto max-w-[52%] object-contain object-right-bottom pointer-events-none select-none z-0 opacity-95 dark:opacity-85 transition-transform duration-500 group-hover:scale-105"
                />

                <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Hotspot Nasional 48 Jam</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs">
                    Nasional
                  </span>
                </div>
                <div className="relative z-10 my-1 max-w-[60%]">
                  <div className="text-2xl font-black text-amber-600 tracking-tight">
                    {baselineFeed === 'loading' && hotspot48Total == null
                      ? '…'
                      : (hotspot48Total ?? 0).toLocaleString('id-ID')}
                    <span className="text-xs font-bold text-slate-400 ml-1.5">Titik</span>
                  </div>
                </div>
                <div className="relative z-10 text-[10px] text-slate-400 mt-1 flex items-center justify-between gap-2">
                  <span>Semua confidence · NASA</span>
                  <span className="text-amber-600 font-bold bg-amber-50/80 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md shrink-0">
                    48 jam
                  </span>
                </div>
              </div>

              {/* Card 3: Kepercayaan Tinggi (High Confidence) */}
              <div
                className="group relative overflow-hidden p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all hover:shadow-md min-h-[122px]"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                {/* 3D Illustration Graphic from SIPONGI Reference */}
                <img
                  src="/images/sipongi/card_high_confidence.png"
                  alt="Radar & Perisai Prioritas Ground Check"
                  className="absolute right-0 bottom-0 top-0 h-full max-h-[135px] w-auto max-w-[50%] object-contain object-right-bottom pointer-events-none select-none z-0 opacity-95 dark:opacity-85 transition-transform duration-500 group-hover:scale-105"
                />

                <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>High Confidence Nasional</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs">
                    Nasional
                  </span>
                </div>
                <div className="relative z-10 my-1 max-w-[60%]">
                  <div className="text-2xl font-black text-red-600 tracking-tight">
                    {baselineFeed === 'loading' && hotspot48High == null
                      ? '…'
                      : ((timeframe === '24' ? hotspot24High : hotspot48High) ?? 0).toLocaleString('id-ID')}
                    <span className="text-xs font-bold text-slate-400 ml-1.5">Titik</span>
                  </div>
                </div>
                <div className="relative z-10 text-[10px] text-slate-400 mt-1 flex items-center justify-between gap-2">
                  <span>Prioritas ground check · {timeframe} jam</span>
                  <span className="text-red-600 font-bold bg-red-50/80 dark:bg-red-950/40 px-1.5 py-0.5 rounded-md shrink-0">
                    High
                  </span>
                </div>
              </div>

              {/* Card 4: Top Wilayah Paling Rawan (#1) */}
              <div
                onClick={() => top10KabHotspot[0] && setSelectedMapKabupaten(top10KabHotspot[0].kabupaten)}
                className={`group relative overflow-hidden p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all hover:shadow-md min-h-[122px] ${
                  top10KabHotspot[0] ? 'cursor-pointer hover:border-orange-500 hover:scale-[1.01]' : ''
                }`}
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                title="Klik untuk menyorot wilayah ini di peta"
              >
                {/* 3D Illustration Graphic from SIPONGI Reference */}
                <img
                  src="/images/sipongi/card_critical_region.png"
                  alt="Epicenter Hotspot Merauke Papua"
                  className="absolute right-0 bottom-0 top-0 h-full max-h-[135px] w-auto max-w-[50%] object-contain object-right-bottom pointer-events-none select-none z-0 opacity-95 dark:opacity-85 transition-transform duration-500 group-hover:scale-105"
                />

                <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="truncate">Kab Teratas (Filter)</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase shrink-0 shadow-2xs border ${
                      isFilterScoped
                        ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800'
                        : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {isFilterScoped ? 'Filter' : 'Nasional'}
                  </span>
                </div>
                <div className="relative z-10 my-1 max-w-[60%]">
                  <div className="text-base font-black text-rose-600 truncate tracking-tight uppercase" title={top10KabHotspot[0]?.kabupaten || '-'}>
                    {loadingHotspot
                      ? 'Memuat…'
                      : top10KabHotspot[0]?.kabupaten || 'Tidak ada hotspot'}
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 mt-0.5">
                    {top10KabHotspot[0]?.count
                      ? `${top10KabHotspot[0].count.toLocaleString('id-ID')} Titik Panas`
                      : '—'}
                  </div>
                </div>
                <div className="relative z-10 text-[10px] text-slate-400 mt-1 flex items-center justify-between truncate gap-2">
                  <span className="truncate" title={filterScopeLabel}>
                    {top10KabHotspot[0]?.provinsi || filterScopeLabel}
                  </span>
                  <span className="text-rose-600 font-bold shrink-0 bg-rose-50/80 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md">
                    Top 1 ↗
                  </span>
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
              <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2" style={{ borderColor: 'var(--border-faint)' }}>
                <h4 className="font-black text-xs uppercase tracking-wider">
                  Daftar Luas Karhutla Provinsi ({filteredProvinsiTable.length} Provinsi) · Rentang {minProvYear} - {maxProvYear}
                </h4>
                <div className="flex items-center gap-2 text-[10.5px]">
                  <span className="text-slate-400">Satuan: hektar (ha)</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">
                    Urutan: <strong className="text-red-600">{sortKeyProv === 'total' ? `Total (${minProvYear}-${maxProvYear})` : sortKeyProv === 'nama' ? 'Nama Provinsi' : `Tahun ${sortKeyProv}`}</strong> ({sortOrderProv === 'desc' ? 'Tertinggi ↓' : 'Terendah ↑'})
                  </span>
                </div>
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
                        <th className="p-2.5 pl-4 w-12">No</th>
                        <th
                          onClick={() => handleSortProv('nama')}
                          className="p-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors select-none group"
                          title="Klik untuk mengurutkan berdasarkan nama provinsi"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Provinsi</span>
                            {renderSortIcon('nama', sortKeyProv, sortOrderProv)}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSortProv('total')}
                          className={`p-2.5 text-right font-black cursor-pointer transition-colors select-none group ${
                            sortKeyProv === 'total'
                              ? 'bg-red-100/80 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100/50'
                          }`}
                          title="Klik untuk mengurutkan berdasarkan Total Akumulasi Luas Karhutla"
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <span>Total ({minProvYear}-{maxProvYear})</span>
                            {renderSortIcon('total', sortKeyProv, sortOrderProv)}
                          </div>
                        </th>
                        {/* Dynamic columns from max to min */}
                        {[...yearsInProvRange].reverse().map((y) => (
                          <th
                            key={`th-${y}`}
                            onClick={() => handleSortProv(y)}
                            className={`p-2.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors select-none group ${
                              String(sortKeyProv) === String(y)
                                ? 'bg-orange-100/80 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-black'
                                : ''
                            }`}
                            title={`Klik untuk mengurutkan berdasarkan luas karhutla tahun ${y}`}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span>{y}</span>
                              {renderSortIcon(y, sortKeyProv, sortOrderProv)}
                            </div>
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
                            {[...yearsInProvRange].reverse().map((y) => {
                              const isSortedCol = String(sortKeyProv) === String(y);
                              return (
                                <td
                                  key={`td-${prov.nama_provinsi}-${y}`}
                                  className={`p-2.5 text-right transition-colors ${
                                    isSortedCol
                                      ? 'font-bold bg-orange-50/40 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300'
                                      : 'text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {getLuas(y)}
                                </td>
                              );
                            })}
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

                <div className="flex items-center gap-1">
                  <span className="text-[10.5px] text-slate-400">Provinsi:</span>
                  <select
                    value={selectedProvinsi}
                    onChange={(e) => setSelectedProvinsi(e.target.value)}
                    className="p-1 px-2 rounded-xl text-xs font-bold border outline-none cursor-pointer max-w-[170px]"
                    style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="all">Semua Provinsi</option>
                    {provinsiOptions.map((name) => (
                      <option key={`kab-prov-${name}`} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                
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

              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                <span>Total: <strong className="text-red-600">{filteredKabupatenTable.length}</strong> Kabupaten / Kota</span>
                <span className="text-slate-300">•</span>
                <span>
                  Urutan: <strong className="text-red-600">{sortKeyKab === 'total' ? `Total (${minKabYear}-${maxKabYear})` : sortKeyKab === 'nama' ? 'Nama Kab/Kota' : `Tahun ${sortKeyKab}`}</strong> ({sortOrderKab === 'desc' ? 'Tertinggi ↓' : 'Terendah ↑'})
                </span>
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
                        <th className="p-2.5 pl-4 w-12">No</th>
                        <th
                          onClick={() => handleSortKab('nama')}
                          className="p-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors select-none group"
                          title="Klik untuk mengurutkan berdasarkan nama kabupaten/kota"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Kabupaten / Kota</span>
                            {renderSortIcon('nama', sortKeyKab, sortOrderKab)}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSortKab('total')}
                          className={`p-2.5 text-right font-black cursor-pointer transition-colors select-none group ${
                            sortKeyKab === 'total'
                              ? 'bg-red-100/80 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100/50'
                          }`}
                          title="Klik untuk mengurutkan berdasarkan Total Akumulasi Luas Karhutla"
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <span>Total ({minKabYear}-{maxKabYear}) (ha)</span>
                            {renderSortIcon('total', sortKeyKab, sortOrderKab)}
                          </div>
                        </th>
                        {/* Dynamic columns from max to min */}
                        {[...yearsInKabRange].reverse().map((y) => (
                          <th
                            key={`k-th-${y}`}
                            onClick={() => handleSortKab(y)}
                            className={`p-2.5 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors select-none group ${
                              String(sortKeyKab) === String(y)
                                ? 'bg-orange-100/80 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-black'
                                : ''
                            }`}
                            title={`Klik untuk mengurutkan berdasarkan luas karhutla tahun ${y}`}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span>{y}</span>
                              {renderSortIcon(y, sortKeyKab, sortOrderKab)}
                            </div>
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
                            {[...yearsInKabRange].reverse().map((y) => {
                              const isSortedCol = String(sortKeyKab) === String(y);
                              return (
                                <td
                                  key={`k-td-${kab.nama}-${y}`}
                                  className={`p-2.5 text-right transition-colors ${
                                    isSortedCol
                                      ? 'font-bold bg-orange-50/40 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300'
                                      : 'text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {getLuas(y)}
                                </td>
                              );
                            })}
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
