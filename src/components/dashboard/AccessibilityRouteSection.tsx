'use client';

import { useState } from 'react';
import { Truck, Compass, Route, RefreshCw } from 'lucide-react';
import { EstimationData } from './LogisticAnalysisSection';

interface Props {
  estimationData?: EstimationData | null;
}

export default function AccessibilityRouteSection({ estimationData }: Props) {
  const defaultPop = estimationData?.totalPopulasi && estimationData.totalPopulasi > 0 ? estimationData.totalPopulasi : 1000;
  const [populasi, setPopulasi] = useState<number>(defaultPop);
  const [estimasiJarakKm, setEstimasiJarakKm] = useState<number>(45); // 45 Km ke gudang BPBD/BNPB

  const totalKK = estimationData ? estimationData.totalKeluarga : Math.ceil(populasi / 4);

  // 1. Kebutuhan Armada Mobilisasi & Truk Logistik
  const trukLogistik6Roda = Math.ceil(populasi / 1000); // 1 truk (6 Ton) per 1000 jiwa
  const mobilOperasionalDoubleCabin = Math.max(2, Math.ceil(populasi / 1500));
  const motorTrailEvakuasi = Math.max(4, Math.ceil(populasi / 500));

  // 2. Kebutuhan Alat Berat Pembersihan Jalur Darurat (Search & Rescue Support)
  const excavatorAlatBerat = Math.max(1, Math.ceil(populasi / 2500));
  const wheelLoaderDozzer = Math.max(1, Math.ceil(populasi / 3500));
  const dumpTrukPembersihPuing = Math.ceil(excavatorAlatBerat * 2);

  // 3. Estimasi Waktu Tempuh & Konsumsi BBM Armada Evakuasi
  const waktuTempuhKategori = estimasiJarakKm > 50 ? 'Jalur Terisolasi (>50 Km)' : 'Jalur Terjangkau (<50 Km)';
  const bbmSolarTrukLiterPerTrip = Math.round((estimasiJarakKm / 4) * trukLogistik6Roda); // 1 Liter / 4 Km per truk

  return (
    <div className="space-y-6 font-sans">
      {/* SECTION HEADER */}
      <div className="bg-gradient-to-r from-[#19506e] to-[#1f8080] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-300 animate-pulse" />
            <h2 className="font-bold text-lg tracking-tight">Analisis Aksesibilitas & Rute Evakuasi / Distribusi Logistik</h2>
          </div>
          <p className="text-xs text-slate-200">
            Simulasi armada truk distribusi logistik, mobilisasi alat berat pembersih jalur darurat, dan estimasi waktu tempuh evakuasi.
          </p>
        </div>

        <button
          onClick={() => {
            setPopulasi(1000);
            setEstimasiJarakKm(45);
          }}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Parameter</span>
        </button>
      </div>

      {/* LIVE SYNC BANNER FROM MAP DRAW */}
      {estimationData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-xs font-medium space-y-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>
              <strong>Data Spasial Terhubung Dari Peta (BAPPENAS & BIG):</strong> Populasi <strong>{estimationData.totalPopulasi.toLocaleString('id')} jiwa</strong> ({totalKK.toLocaleString('id')} KK)
            </span>
          </div>

          {estimationData.kelurahanDampak && estimationData.kelurahanDampak.length > 0 && (
            <div className="pt-2 border-t border-emerald-200/60">
              <span className="font-bold text-[#19506e] block mb-1">🏛️ Wilayah Kelurahan / Desa Terdampak:</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {estimationData.kelurahanDampak.map((k, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[11px] text-[#19506e] font-semibold flex items-center gap-1">
                    <span>📍 {k.namaKelurahan}</span>
                    {k.kodeKemendagri && (
                      <span className="text-[9px] bg-slate-100 px-1 py-0.2 rounded font-mono font-bold text-slate-700">
                        [{k.kodeKemendagri}]
                      </span>
                    )}
                    <span className="text-slate-500 font-normal">({k.namaKecamatan || k.namaKabupaten})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PARAMETER CONTROL PANEL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-[#19506e] uppercase tracking-wider block mb-1.5">
            Populasi Area Terdampak (Jiwa)
          </label>
          <input
            type="number"
            value={populasi}
            onChange={(e) => setPopulasi(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#19506e] uppercase tracking-wider block mb-1.5">
            Jarak Dari Posko/Gudang Utama (Km)
          </label>
          <input
            type="number"
            min="1"
            max="300"
            value={estimasiJarakKm}
            onChange={(e) => setEstimasiJarakKm(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
          />
        </div>

        <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-xl p-3 flex flex-col justify-center space-y-1 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider">Status Aksesibilitas Jalur:</span>
          <span className="text-xs font-extrabold text-sky-800">
            {waktuTempuhKategori} ({bbmSolarTrukLiterPerTrip} L Solar/Konvoi)
          </span>
        </div>
      </div>

      {/* 3 GRID CARDS KLASTER MOBILISASI & RUTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. ARMADA TRUK DISTRIBUSI LOGISTIK */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">1. Armada Logistik & Evakuasi</h3>
              <p className="text-[11px] text-slate-500">Mobilisasi angkutan darat</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🚚 Truk Logistik (Kapasitas 6 Ton)</span>
              <span className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border">{trukLogistik6Roda} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🛻 Mobil Operasional Double Cabin (4x4)</span>
              <span className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border">{mobilOperasionalDoubleCabin} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🏍️ Motor Trail Evakuasi Offroad</span>
              <span className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border">{motorTrailEvakuasi} Unit</span>
            </div>
          </div>
        </div>

        {/* 2. ALAT BERAT PEMBERSIHAN JALUR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-[#19506e]/10 text-[#19506e]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">2. Alat Berat Pembersih Jalur</h3>
              <p className="text-[11px] text-slate-500">Penanganan longsor & puing</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🚜 Excavator Pembersih Longsor</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{excavatorAlatBerat} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🏗️ Wheel Loader / Dozer</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{wheelLoaderDozzer} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🚛 Dump Truck Pengangkut Puing</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{dumpTrukPembersihPuing} Unit</span>
            </div>
          </div>
        </div>

        {/* 3. EVALUASI RUTE & DISTRIBUSI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">3. Estimasi Distribusi Rute</h3>
              <p className="text-[11px] text-slate-500">Konsumsi BBM & waktu tempuh</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">📏 Jarak Tempuh Ke Posko Utama</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{estimasiJarakKm} Km</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">⛽ BBM Solar Sekali Konvoi (PP)</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{bbmSolarTrukLiterPerTrip} Liter</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">⏱️ Estimasi Waktu Tempuh Konvoi</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{Math.round(estimasiJarakKm * 1.8)} Menit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
