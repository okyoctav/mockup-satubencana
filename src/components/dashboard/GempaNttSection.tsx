'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  Users,
  Home,
  School,
  Building,
  Building2,
  HeartPulse,
  Church,
  Store,
  Compass,
  Activity,
  RefreshCw,
  Filter,
  Table as TableIcon,
} from 'lucide-react';

export interface GempaNttFeature {
  objectid: number;
  kib: string;
  id_kab: string;
  provinsi: string;
  kabupaten: string;
  tanggal_update: number;
  jenis_bencana: string;
  meninggal: number;
  luka_sakit_: number;
  menderita_: number;
  mengungsi_: number;
  kk_terdampak: number;
  kk_mengungsi: number;
  rumah_rusak_ringan: number;
  rumah_rusak_sedang: number;
  rumah_rusak_berat: number;
  rumah_rusak: number;
  pendidikan_rusak_berat: number;
  pendidikan_rusak_sedang: number;
  pendidikan_rusak_ringan: number;
  pendidikan_rusak: number;
  rumah_ibadat_rusak_ringan: number;
  rumah_ibadat_rusak: number;
  fasyankes_rusak_ringan: number;
  fasyankes_rusak: number;
  kantor_rusak_ringan: number;
  kantor_rusak: number;
  kios_ruko_rusak_ringan: number;
  jumlah_jaringan_irigasi: number;
  jumlah_jalan: number;
}

const FALLBACK_DATA: GempaNttFeature[] = [
  {
    objectid: 5,
    kib: "5316107202608151",
    id_kab: "53.09",
    provinsi: "Nusa Tenggara Timur",
    kabupaten: "Ngada",
    tanggal_update: 1788314400000,
    jenis_bencana: "Gempabumi",
    meninggal: 6,
    luka_sakit_: 118,
    menderita_: 0,
    mengungsi_: 18494,
    kk_terdampak: 1179,
    kk_mengungsi: 4842,
    rumah_rusak_ringan: 8384,
    rumah_rusak_sedang: 2653,
    rumah_rusak_berat: 1260,
    rumah_rusak: 12297,
    pendidikan_rusak_berat: 53,
    pendidikan_rusak_sedang: 46,
    pendidikan_rusak_ringan: 40,
    pendidikan_rusak: 151,
    rumah_ibadat_rusak_ringan: 0,
    rumah_ibadat_rusak: 92,
    fasyankes_rusak_ringan: 8,
    fasyankes_rusak: 21,
    kantor_rusak_ringan: 0,
    kantor_rusak: 115,
    kios_ruko_rusak_ringan: 0,
    jumlah_jaringan_irigasi: 3,
    jumlah_jalan: 17
  },
  {
    objectid: 10,
    kib: "5316107202608151",
    id_kab: "73.01",
    provinsi: "Sulawesi Selatan",
    kabupaten: "Kepulauan Selayar",
    tanggal_update: 1788080400000,
    jenis_bencana: "Gempabumi",
    meninggal: 0,
    luka_sakit_: 0,
    menderita_: 0,
    mengungsi_: 1161,
    kk_terdampak: 311,
    kk_mengungsi: 0,
    rumah_rusak_ringan: 9,
    rumah_rusak_sedang: 4,
    rumah_rusak_berat: 0,
    rumah_rusak: 13,
    pendidikan_rusak_berat: 0,
    pendidikan_rusak_sedang: 0,
    pendidikan_rusak_ringan: 0,
    pendidikan_rusak: 0,
    rumah_ibadat_rusak_ringan: 0,
    rumah_ibadat_rusak: 0,
    fasyankes_rusak_ringan: 0,
    fasyankes_rusak: 0,
    kantor_rusak_ringan: 0,
    kantor_rusak: 0,
    kios_ruko_rusak_ringan: 0,
    jumlah_jaringan_irigasi: 0,
    jumlah_jalan: 0
  },
  {
    objectid: 2,
    kib: "5316107202608151",
    id_kab: "52.72",
    provinsi: "Nusa Tenggara Barat",
    kabupaten: "Kota Bima",
    tanggal_update: 1788080400000,
    jenis_bencana: "Gempabumi",
    meninggal: 0,
    luka_sakit_: 1,
    menderita_: 6,
    mengungsi_: 0,
    kk_terdampak: 1,
    kk_mengungsi: 0,
    rumah_rusak_ringan: 2,
    rumah_rusak_sedang: 1,
    rumah_rusak_berat: 0,
    rumah_rusak: 3,
    pendidikan_rusak_berat: 0,
    pendidikan_rusak_sedang: 0,
    pendidikan_rusak_ringan: 0,
    pendidikan_rusak: 0,
    rumah_ibadat_rusak_ringan: 1,
    rumah_ibadat_rusak: 1,
    fasyankes_rusak_ringan: 0,
    fasyankes_rusak: 0,
    kantor_rusak_ringan: 0,
    kantor_rusak: 0,
    kios_ruko_rusak_ringan: 0,
    jumlah_jaringan_irigasi: 0,
    jumlah_jalan: 0
  },
  {
    objectid: 8,
    kib: "5316107202608151",
    id_kab: "53.16",
    provinsi: "Nusa Tenggara Timur",
    kabupaten: "Nagekeo",
    tanggal_update: 1788314400000,
    jenis_bencana: "Gempabumi",
    meninggal: 20,
    luka_sakit_: 167,
    menderita_: 0,
    mengungsi_: 49475,
    kk_terdampak: 2862,
    kk_mengungsi: 0,
    rumah_rusak_ringan: 8596,
    rumah_rusak_sedang: 2727,
    rumah_rusak_berat: 4079,
    rumah_rusak: 15402,
    pendidikan_rusak_berat: 86,
    pendidikan_rusak_sedang: 94,
    pendidikan_rusak_ringan: 51,
    pendidikan_rusak: 238,
    rumah_ibadat_rusak_ringan: 0,
    rumah_ibadat_rusak: 50,
    fasyankes_rusak_ringan: 1,
    fasyankes_rusak: 11,
    kantor_rusak_ringan: 0,
    kantor_rusak: 74,
    kios_ruko_rusak_ringan: 0,
    jumlah_jaringan_irigasi: 0,
    jumlah_jalan: 7
  },
  {
    objectid: 6,
    kib: "5316107202608151",
    id_kab: "53.10",
    provinsi: "Nusa Tenggara Timur",
    kabupaten: "Manggarai",
    tanggal_update: 1788314446591,
    jenis_bencana: "Gempabumi",
    meninggal: 51,
    luka_sakit_: 623,
    menderita_: 0,
    mengungsi_: 64924,
    kk_terdampak: 1983,
    kk_mengungsi: 0,
    rumah_rusak_ringan: 8450,
    rumah_rusak_sedang: 6686,
    rumah_rusak_berat: 7622,
    rumah_rusak: 22758,
    pendidikan_rusak_berat: 137,
    pendidikan_rusak_sedang: 107,
    pendidikan_rusak_ringan: 48,
    pendidikan_rusak: 328,
    rumah_ibadat_rusak_ringan: 28,
    rumah_ibadat_rusak: 49,
    fasyankes_rusak_ringan: 7,
    fasyankes_rusak: 28,
    kantor_rusak_ringan: 8,
    kantor_rusak: 68,
    kios_ruko_rusak_ringan: 1,
    jumlah_jaringan_irigasi: 18,
    jumlah_jalan: 29
  },
  {
    objectid: 4,
    kib: "5316107202608151",
    id_kab: "53.08",
    provinsi: "Nusa Tenggara Timur",
    kabupaten: "Ende",
    tanggal_update: 1788314400000,
    jenis_bencana: "Gempabumi",
    meninggal: 3,
    luka_sakit_: 90,
    menderita_: 0,
    mengungsi_: 152,
    kk_terdampak: 121,
    kk_mengungsi: 0,
    rumah_rusak_ringan: 6837,
    rumah_rusak_sedang: 1950,
    rumah_rusak_berat: 1360,
    rumah_rusak: 10147,
    pendidikan_rusak_berat: 47,
    pendidikan_rusak_sedang: 80,
    pendidikan_rusak_ringan: 40,
    pendidikan_rusak: 175,
    rumah_ibadat_rusak_ringan: 44,
    rumah_ibadat_rusak: 87,
    fasyankes_rusak_ringan: 10,
    fasyankes_rusak: 21,
    kantor_rusak_ringan: 52,
    kantor_rusak: 98,
    kios_ruko_rusak_ringan: 0,
    jumlah_jaringan_irigasi: 0,
    jumlah_jalan: 7
  },
  {
    objectid: 1,
    kib: "5316107202608151",
    id_kab: "52.06",
    provinsi: "Nusa Tenggara Barat",
    kabupaten: "Bima",
    tanggal_update: 1788080400000,
    jenis_bencana: "Gempabumi",
    meninggal: 0,
    luka_sakit_: 1,
    menderita_: 0,
    mengungsi_: 0,
    kk_terdampak: 10,
    kk_mengungsi: 0,
    rumah_rusak_ringan: 4,
    rumah_rusak_sedang: 4,
    rumah_rusak_berat: 1,
    rumah_rusak: 9,
    pendidikan_rusak_berat: 0,
    pendidikan_rusak_sedang: 0,
    pendidikan_rusak_ringan: 0,
    pendidikan_rusak: 0,
    rumah_ibadat_rusak_ringan: 0,
    rumah_ibadat_rusak: 0,
    fasyankes_rusak_ringan: 0,
    fasyankes_rusak: 0,
    kantor_rusak_ringan: 1,
    kantor_rusak: 1,
    kios_ruko_rusak_ringan: 0,
    jumlah_jaringan_irigasi: 0,
    jumlah_jalan: 0
  },
  {
    objectid: 9,
    kib: "5316107202608151",
    id_kab: "53.19",
    provinsi: "Nusa Tenggara Timur",
    kabupaten: "Manggarai Timur",
    tanggal_update: 1788314400000,
    jenis_bencana: "Gempabumi",
    meninggal: 40,
    luka_sakit_: 498,
    menderita_: 0,
    mengungsi_: 30098,
    kk_terdampak: 8254,
    kk_mengungsi: 0,
    rumah_rusak_ringan: 10837,
    rumah_rusak_sedang: 6039,
    rumah_rusak_berat: 7516,
    rumah_rusak: 24392,
    pendidikan_rusak_berat: 141,
    pendidikan_rusak_sedang: 84,
    pendidikan_rusak_ringan: 30,
    pendidikan_rusak: 295,
    rumah_ibadat_rusak_ringan: 0,
    rumah_ibadat_rusak: 118,
    fasyankes_rusak_ringan: 5,
    fasyankes_rusak: 28,
    kantor_rusak_ringan: 0,
    kantor_rusak: 94,
    kios_ruko_rusak_ringan: 0,
    jumlah_jaringan_irigasi: 22,
    jumlah_jalan: 92
  },
  {
    objectid: 7,
    kib: "5316107202608151",
    id_kab: "53.15",
    provinsi: "Nusa Tenggara Timur",
    kabupaten: "Manggarai Barat",
    tanggal_update: 1788314400000,
    jenis_bencana: "Gempabumi",
    meninggal: 1,
    luka_sakit_: 138,
    menderita_: 0,
    mengungsi_: 27564,
    kk_terdampak: 1763,
    kk_mengungsi: 0,
    rumah_rusak_ringan: 4831,
    rumah_rusak_sedang: 1598,
    rumah_rusak_berat: 3313,
    rumah_rusak: 9742,
    pendidikan_rusak_berat: 20,
    pendidikan_rusak_sedang: 36,
    pendidikan_rusak_ringan: 12,
    pendidikan_rusak: 77,
    rumah_ibadat_rusak_ringan: 0,
    rumah_ibadat_rusak: 50,
    fasyankes_rusak_ringan: 14,
    fasyankes_rusak: 23,
    kantor_rusak_ringan: 0,
    kantor_rusak: 77,
    kios_ruko_rusak_ringan: 0,
    jumlah_jaringan_irigasi: 0,
    jumlah_jalan: 0
  },
  {
    objectid: 3,
    kib: "5316107202608151",
    id_kab: "53.07",
    provinsi: "Nusa Tenggara Timur",
    kabupaten: "Sikka",
    tanggal_update: 1788314400000,
    jenis_bencana: "Gempabumi",
    meninggal: 6,
    luka_sakit_: 48,
    menderita_: 0,
    mengungsi_: 4665,
    kk_terdampak: 1540,
    kk_mengungsi: 0,
    rumah_rusak_ringan: 2457,
    rumah_rusak_sedang: 852,
    rumah_rusak_berat: 939,
    rumah_rusak: 4248,
    pendidikan_rusak_berat: 18,
    pendidikan_rusak_sedang: 66,
    pendidikan_rusak_ringan: 24,
    pendidikan_rusak: 114,
    rumah_ibadat_rusak_ringan: 38,
    rumah_ibadat_rusak: 72,
    fasyankes_rusak_ringan: 14,
    fasyankes_rusak: 25,
    kantor_rusak_ringan: 23,
    kantor_rusak: 56,
    kios_ruko_rusak_ringan: 0,
    jumlah_jaringan_irigasi: 0,
    jumlah_jalan: 5
  }
];

export default function GempaNttSection() {
  const [data, setData] = useState<GempaNttFeature[]>(FALLBACK_DATA);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [selectedProvinsi, setSelectedProvinsi] = useState<string>('Semua');
  const [selectedKabupaten, setSelectedKabupaten] = useState<string>('Semua');

  const fetchLayerData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        'https://gis.bnpb.go.id/server/rest/services/2026_gempabumi_ntt/mv_gempa_ntt_2026_v2/MapServer/29/query?where=1%3D1&outFields=*&f=json'
      );
      if (res.ok) {
        const json = await res.json();
        if (json.features && json.features.length > 0) {
          const parsed = json.features.map((f: { attributes: GempaNttFeature }) => f.attributes);
          setData(parsed);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data live Layer 29 BNPB, menggunakan data cache fallback:', err);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  };

  useEffect(() => {
    fetchLayerData();
  }, []);

  // Filter daftar provinsi & kabupaten secara dinamis
  const listProvinsi = useMemo(() => {
    const list = Array.from(new Set(data.map((d) => d.provinsi)));
    return ['Semua', ...list];
  }, [data]);

  const listKabupaten = useMemo(() => {
    let filtered = data;
    if (selectedProvinsi !== 'Semua') {
      filtered = filtered.filter((d) => d.provinsi === selectedProvinsi);
    }
    const list = Array.from(new Set(filtered.map((d) => d.kabupaten)));
    return ['Semua', ...list];
  }, [data, selectedProvinsi]);

  // Filtered dataset berdasarkan pilihan pengguna
  const filteredData = useMemo(() => {
    return data.filter((d) => {
      if (selectedProvinsi !== 'Semua' && d.provinsi !== selectedProvinsi) return false;
      if (selectedKabupaten !== 'Semua' && d.kabupaten !== selectedKabupaten) return false;
      return true;
    });
  }, [data, selectedProvinsi, selectedKabupaten]);

  // Agregasi SUM statistik
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        meninggal: acc.meninggal + (item.meninggal || 0),
        luka_sakit_: acc.luka_sakit_ + (item.luka_sakit_ || 0),
        menderita_: acc.menderita_ + (item.menderita_ || 0),
        mengungsi_: acc.mengungsi_ + (item.mengungsi_ || 0),
        kk_terdampak: acc.kk_terdampak + (item.kk_terdampak || 0),
        kk_mengungsi: acc.kk_mengungsi + (item.kk_mengungsi || 0),
        rumah_rusak_ringan: acc.rumah_rusak_ringan + (item.rumah_rusak_ringan || 0),
        rumah_rusak_sedang: acc.rumah_rusak_sedang + (item.rumah_rusak_sedang || 0),
        rumah_rusak_berat: acc.rumah_rusak_berat + (item.rumah_rusak_berat || 0),
        rumah_rusak: acc.rumah_rusak + (item.rumah_rusak || 0),
        pendidikan_rusak_berat: acc.pendidikan_rusak_berat + (item.pendidikan_rusak_berat || 0),
        pendidikan_rusak_sedang: acc.pendidikan_rusak_sedang + (item.pendidikan_rusak_sedang || 0),
        pendidikan_rusak_ringan: acc.pendidikan_rusak_ringan + (item.pendidikan_rusak_ringan || 0),
        pendidikan_rusak: acc.pendidikan_rusak + (item.pendidikan_rusak || 0),
        rumah_ibadat_rusak_ringan: acc.rumah_ibadat_rusak_ringan + (item.rumah_ibadat_rusak_ringan || 0),
        rumah_ibadat_rusak: acc.rumah_ibadat_rusak + (item.rumah_ibadat_rusak || 0),
        fasyankes_rusak_ringan: acc.fasyankes_rusak_ringan + (item.fasyankes_rusak_ringan || 0),
        fasyankes_rusak: acc.fasyankes_rusak + (item.fasyankes_rusak || 0),
        kantor_rusak_ringan: acc.kantor_rusak_ringan + (item.kantor_rusak_ringan || 0),
        kantor_rusak: acc.kantor_rusak + (item.kantor_rusak || 0),
        kios_ruko_rusak_ringan: acc.kios_ruko_rusak_ringan + (item.kios_ruko_rusak_ringan || 0),
        jumlah_jaringan_irigasi: acc.jumlah_jaringan_irigasi + (item.jumlah_jaringan_irigasi || 0),
        jumlah_jalan: acc.jumlah_jalan + (item.jumlah_jalan || 0),
      }),
      {
        meninggal: 0,
        luka_sakit_: 0,
        menderita_: 0,
        mengungsi_: 0,
        kk_terdampak: 0,
        kk_mengungsi: 0,
        rumah_rusak_ringan: 0,
        rumah_rusak_sedang: 0,
        rumah_rusak_berat: 0,
        rumah_rusak: 0,
        pendidikan_rusak_berat: 0,
        pendidikan_rusak_sedang: 0,
        pendidikan_rusak_ringan: 0,
        pendidikan_rusak: 0,
        rumah_ibadat_rusak_ringan: 0,
        rumah_ibadat_rusak: 0,
        fasyankes_rusak_ringan: 0,
        fasyankes_rusak: 0,
        kantor_rusak_ringan: 0,
        kantor_rusak: 0,
        kios_ruko_rusak_ringan: 0,
        jumlah_jaringan_irigasi: 0,
        jumlah_jalan: 0,
      }
    );
  }, [filteredData]);

  // Data perbandingan antar Kabupaten/Kota untuk Grafik
  const chartKabupatenData = useMemo(() => {
    return filteredData.map((d) => ({
      name: d.kabupaten,
      provinsi: d.provinsi,
      Meninggal: d.meninggal,
      'Luka / Sakit': d.luka_sakit_,
      'KK Terdampak': d.kk_terdampak,
      Mengungsi: d.mengungsi_,
      'Rumah Rusak Ringan': d.rumah_rusak_ringan,
      'Rumah Rusak Sedang': d.rumah_rusak_sedang,
      'Rumah Rusak Berat': d.rumah_rusak_berat,
      'Total Rumah Rusak': d.rumah_rusak,
      'Fasilitas Pendidikan': d.pendidikan_rusak,
      'Fasilitas Kesehatan': d.fasyankes_rusak,
      Perkantoran: d.kantor_rusak,
      'Rumah Ibadat': d.rumah_ibadat_rusak,
      'Jaringan Irigasi': d.jumlah_jaringan_irigasi,
      'Jaringan Jalan': d.jumlah_jalan,
    }));
  }, [filteredData]);

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Header Banner Modul Gempa NTT */}
      <div className="bg-gradient-to-r from-[#19506e] via-[#165176] to-[#1f8080] rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-300 animate-pulse" />
            <span>Layer ArcGIS Layer 29 — Terintegrasi BNPB</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Analisis Dampak Gempabumi NTT 2026</h2>
          <p className="text-xs md:text-sm text-slate-200 max-w-2xl leading-relaxed">
            Statistik agregat real-time korban jiwa, pengungsian, kerusakan rumah tinggal, sarana pendidikan, fasyankes, perkantoran, dan infrastruktur wilayah terdampak.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            onClick={fetchLayerData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold backdrop-blur transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Memuat...' : 'Refresh Data'}</span>
          </button>
          {lastRefreshed && (
            <span className="text-[10px] text-slate-300 hidden sm:inline">Pukul {lastRefreshed}</span>
          )}
        </div>
      </div>

      {/* Dynamic Filter Controls Panel */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#1f8080]/10 text-[#1f8080]">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#19506e] block">Filter Wilayah Terintegrasi</span>
            <span className="text-[10px] text-slate-400">Pilih Provinsi dan Kabupaten/Kota untuk kalkulasi dinamis</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Dropdown Provinsi */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Provinsi:</span>
            <select
              value={selectedProvinsi}
              onChange={(e) => {
                setSelectedProvinsi(e.target.value);
                setSelectedKabupaten('Semua');
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#19506e] outline-none cursor-pointer focus:border-[#1f8080] w-full"
            >
              {listProvinsi.map((prov) => (
                <option key={prov} value={prov}>
                  {prov === 'Semua' ? '🌐 Semua Provinsi' : prov}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Kabupaten */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Kabupaten/Kota:</span>
            <select
              value={selectedKabupaten}
              onChange={(e) => setSelectedKabupaten(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#19506e] outline-none cursor-pointer focus:border-[#1f8080] w-full"
            >
              {listKabupaten.map((kab) => (
                <option key={kab} value={kab}>
                  {kab === 'Semua' ? '🏛️ Semua Kab/Kota' : kab}
                </option>
              ))}
            </select>
          </div>

          {(selectedProvinsi !== 'Semua' || selectedKabupaten !== 'Semua') && (
            <button
              onClick={() => {
                setSelectedProvinsi('Semua');
                setSelectedKabupaten('Semua');
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-medium hover:bg-rose-100 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 1. AGGREGATE SUMMARY STAT CARDS (SUM) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Meninggal */}
        <div className="bg-white rounded-2xl p-3.5 border border-rose-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Meninggal Dunia</span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600 tracking-tight">
              {totals.meninggal.toLocaleString('id')}
            </div>
            <span className="text-[10px] text-slate-400">Jiwa meninggal</span>
          </div>
        </div>

        {/* Luka / Sakit */}
        <div className="bg-white rounded-2xl p-3.5 border border-amber-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Luka / Sakit</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 tracking-tight">
              {totals.luka_sakit_.toLocaleString('id')}
            </div>
            <span className="text-[10px] text-slate-400">Korban luka-luka</span>
          </div>
        </div>

        {/* Mengungsi */}
        <div className="bg-white rounded-2xl p-3.5 border border-purple-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Pengungsi</span>
            <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-600 tracking-tight">
              {totals.mengungsi_.toLocaleString('id')}
            </div>
            <span className="text-[10px] text-slate-400">
              {totals.kk_mengungsi > 0 ? `${totals.kk_mengungsi.toLocaleString('id')} KK` : 'Total Jiwa'}
            </span>
          </div>
        </div>

        {/* KK Terdampak */}
        <div className="bg-white rounded-2xl p-3.5 border border-sky-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">KK Terdampak</span>
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-sky-600 tracking-tight">
              {totals.kk_terdampak.toLocaleString('id')}
            </div>
            <span className="text-[10px] text-slate-400">Kepala Keluarga</span>
          </div>
        </div>

        {/* Total Rumah Rusak */}
        <div className="bg-white rounded-2xl p-3.5 border border-indigo-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Rumah Rusak</span>
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-600 tracking-tight">
              {totals.rumah_rusak.toLocaleString('id')}
            </div>
            <span className="text-[10px] text-slate-400">
              RB: {totals.rumah_rusak_berat.toLocaleString('id')} | RS: {totals.rumah_rusak_sedang.toLocaleString('id')} | RR: {totals.rumah_rusak_ringan.toLocaleString('id')}
            </span>
          </div>
        </div>

        {/* Fasilitas Pendidikan */}
        <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Fasilitas Pendidikan</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {totals.pendidikan_rusak.toLocaleString('id')}
            </div>
            <span className="text-[10px] text-slate-400">
              RB: {totals.pendidikan_rusak_berat} | RS: {totals.pendidikan_rusak_sedang} | RR: {totals.pendidikan_rusak_ringan}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Facility Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Fasyankes Rusak</span>
            <span className="text-base font-bold text-slate-800">{totals.fasyankes_rusak.toLocaleString('id')} unit</span>
            <span className="text-[10px] text-slate-500 block">RR: {totals.fasyankes_rusak_ringan}</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <Church className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Rumah Ibadat Rusak</span>
            <span className="text-base font-bold text-slate-800">{totals.rumah_ibadat_rusak.toLocaleString('id')} unit</span>
            <span className="text-[10px] text-slate-500 block">RR: {totals.rumah_ibadat_rusak_ringan}</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Perkantoran Rusak</span>
            <span className="text-base font-bold text-slate-800">{totals.kantor_rusak.toLocaleString('id')} unit</span>
            <span className="text-[10px] text-slate-500 block">RR: {totals.kantor_rusak_ringan}</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Kios / Ruko Rusak</span>
            <span className="text-base font-bold text-slate-800">{totals.kios_ruko_rusak_ringan.toLocaleString('id')} unit</span>
            <span className="text-[10px] text-slate-500 block">Rusak Ringan</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Infrastruktur</span>
            <span className="text-xs font-bold text-slate-800 block">Irigasi: {totals.jumlah_jaringan_irigasi}</span>
            <span className="text-xs font-bold text-slate-800 block">Jalan: {totals.jumlah_jalan} ruas</span>
          </div>
        </div>
      </div>

      {/* 2. CHARTS SECTION (GRAFIK PERBANDINGAN ANTA KABUPATEN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: PERBANDINGAN KORBAN PER KABUPATEN */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#19506e]">Perbandingan Korban Jiwa & Dampak Sosial</h3>
                <p className="text-[10px] text-slate-400">Grafik jumlah Meninggal & Luka/Sakit per Kabupaten/Kota</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartKabupatenData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Meninggal" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Luka / Sakit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="KK Terdampak" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: PERBANDINGAN KERUSAKAN RUMAH (BERAT, SEDANG, RINGAN) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#19506e]">Tingkat Kerusakan Rumah Tinggal</h3>
                <p className="text-[10px] text-slate-400">Breakdown Rumah Rusak (Berat, Sedang, Ringan) per Kabupaten</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartKabupatenData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Rumah Rusak Berat" stackId="a" fill="#dc2626" />
                <Bar dataKey="Rumah Rusak Sedang" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Rumah Rusak Ringan" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: PERBANDINGAN FASILITAS PENDIDIKAN & FASYANKES */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#19506e]">Kerusakan Fasilitas Publik & Infrastruktur Kritis</h3>
                <p className="text-[10px] text-slate-400">Komparasi unit rusak: Sekolah, Fasyankes, Perkantoran, dan Rumah Ibadat</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartKabupatenData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Fasilitas Pendidikan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Perkantoran" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rumah Ibadat" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Fasilitas Kesehatan" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Jaringan Irigasi" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Jaringan Jalan" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. TABLE DATA REKAPITULASI DETAIL PER KABUPATEN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-[#1f8080]" />
            <h3 className="text-xs font-bold text-[#19506e]">Tabel Rekapitulasi Data Rinci per Kabupaten/Kota</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">{filteredData.length} Kab/Kota Terdampak</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Kabupaten / Kota</th>
                <th className="py-2.5 px-3 text-right text-rose-600">Meninggal</th>
                <th className="py-2.5 px-3 text-right text-amber-600">Luka/Sakit</th>
                <th className="py-2.5 px-3 text-right text-purple-600">Pengungsi</th>
                <th className="py-2.5 px-3 text-right text-sky-600">KK Terdampak</th>
                <th className="py-2.5 px-3 text-right text-indigo-600">Rumah Rusak (RB/RS/RR)</th>
                <th className="py-2.5 px-3 text-right text-emerald-600">Sekolah Rusak</th>
                <th className="py-2.5 px-3 text-right text-rose-500">Fasyankes</th>
                <th className="py-2.5 px-3 text-right">Perkantoran</th>
                <th className="py-2.5 px-3 text-right">Ibadat</th>
                <th className="py-2.5 px-3 text-right">Irigasi/Jalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredData.map((item) => (
                <tr key={item.objectid} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#19506e]">
                    {item.kabupaten}
                    <span className="block text-[10px] text-slate-400 font-normal">{item.provinsi}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-rose-600">{item.meninggal || 0}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-600">{item.luka_sakit_ || 0}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-purple-600">{(item.mengungsi_ || 0).toLocaleString('id')}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-sky-600">{(item.kk_terdampak || 0).toLocaleString('id')}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-indigo-600">
                    {(item.rumah_rusak || 0).toLocaleString('id')}
                    <span className="block text-[9px] text-slate-400 font-normal">
                      ({item.rumah_rusak_berat || 0} / {item.rumah_rusak_sedang || 0} / {item.rumah_rusak_ringan || 0})
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                    {item.pendidikan_rusak || 0}
                    <span className="block text-[9px] text-slate-400 font-normal">
                      ({item.pendidikan_rusak_berat || 0} RB)
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-rose-500">{item.fasyankes_rusak || 0}</td>
                  <td className="py-2.5 px-3 text-right">{item.kantor_rusak || 0}</td>
                  <td className="py-2.5 px-3 text-right">{item.rumah_ibadat_rusak || 0}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    {item.jumlah_jaringan_irigasi || 0} / {item.jumlah_jalan || 0}
                  </td>
                </tr>
              ))}

              {/* Total Summary Row */}
              <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-3 px-3">TOTAL AGREGAT ({filteredData.length} Kab/Kota)</td>
                <td className="py-3 px-3 text-right text-rose-600">{totals.meninggal.toLocaleString('id')}</td>
                <td className="py-3 px-3 text-right text-amber-600">{totals.luka_sakit_.toLocaleString('id')}</td>
                <td className="py-3 px-3 text-right text-purple-600">{totals.mengungsi_.toLocaleString('id')}</td>
                <td className="py-3 px-3 text-right text-sky-600">{totals.kk_terdampak.toLocaleString('id')}</td>
                <td className="py-3 px-3 text-right text-indigo-600">{totals.rumah_rusak.toLocaleString('id')}</td>
                <td className="py-3 px-3 text-right text-emerald-600">{totals.pendidikan_rusak.toLocaleString('id')}</td>
                <td className="py-3 px-3 text-right text-rose-500">{totals.fasyankes_rusak.toLocaleString('id')}</td>
                <td className="py-3 px-3 text-right">{totals.kantor_rusak.toLocaleString('id')}</td>
                <td className="py-3 px-3 text-right">{totals.rumah_ibadat_rusak.toLocaleString('id')}</td>
                <td className="py-3 px-3 text-right">{totals.jumlah_jaringan_irigasi} / {totals.jumlah_jalan}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
