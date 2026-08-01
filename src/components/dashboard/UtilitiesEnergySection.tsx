'use client';

import { useState } from 'react';
import { Zap, Radio, Lightbulb, RefreshCw } from 'lucide-react';
import { EstimationData } from './LogisticAnalysisSection';

interface Props {
  estimationData?: EstimationData | null;
}

export default function UtilitiesEnergySection({ estimationData }: Props) {
  const defaultPop = estimationData?.totalPopulasi && estimationData.totalPopulasi > 0 ? estimationData.totalPopulasi : 1000;
  const [populasi, setPopulasi] = useState<number>(defaultPop);
  const [estimasiBlackoutHari, setEstimasiBlackoutHari] = useState<number>(5);

  // 1. Kebutuhan Listrik Genset & Bahan Bakar (BBM Solar)
  const totalGensetKva = Math.ceil(populasi / 400) * 20; // 20 KVA per 400 jiwa
  const konsumsiSolarLiterPerHari = totalGensetKva * 4; // 4 Liter solar per KVA / 24 jam
  const totalBbmSolarLiter = konsumsiSolarLiterPerHari * estimasiBlackoutHari;

  // 2. Kebutuhan Alat Penerangan & Utilitas Lapangan
  const lampuSorotTower = Math.ceil(populasi / 500) * 2;
  const kabelRollListrikDarurat = Math.ceil(populasi / 200) * 3;
  const stasiunPengisianDayaMobile = Math.ceil(populasi / 300);

  // 3. Kebutuhan Alat Telekomunikasi & Radio Komunikasi Darurat
  const radioHandyTalkyHT = Math.max(4, Math.ceil(populasi / 250));
  const rigRadioBaseStation = Math.max(1, Math.ceil(populasi / 2000));
  const vSatInternetPortable = Math.max(1, Math.ceil(populasi / 1500));

  return (
    <div className="space-y-6 font-sans">
      {/* SECTION HEADER */}
      <div className="bg-gradient-to-r from-[#19506e] to-[#1f8080] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-300 animate-pulse" />
            <h2 className="font-bold text-lg tracking-tight">Analisis Kebutuhan Energi, Utilitas, & Telekomunikasi</h2>
          </div>
          <p className="text-xs text-slate-200">
            Simulasi pasokan daya genset darurat, pasokan BBM solar, serta peralatan jaringan telekomunikasi radio V-SAT area *blackout*.
          </p>
        </div>

        <button
          onClick={() => {
            setPopulasi(1000);
            setEstimasiBlackoutHari(5);
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
              <strong>Data Spasial Terhubung Dari Peta (BAPPENAS & BIG):</strong> Populasi <strong>{estimationData.totalPopulasi.toLocaleString('id')} jiwa</strong>
            </span>
          </div>

          {estimationData.kelurahanDampak && estimationData.kelurahanDampak.length > 0 && (
            <div className="pt-2 border-t border-emerald-200/60">
              <span className="font-bold text-[#19506e] block mb-1">🏛️ Wilayah Kelurahan / Desa Terdampak:</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {estimationData.kelurahanDampak.map((k, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[11px] text-[#19506e] font-semibold">
                    📍 {k.namaKelurahan} <span className="text-slate-500 font-normal">({k.namaKecamatan || k.namaKabupaten})</span>
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
            Estimasi Durasi Padam Listrik (Hari)
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={estimasiBlackoutHari}
            onChange={(e) => setEstimasiBlackoutHari(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex flex-col justify-center space-y-1 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider">Total Kebutuhan BBM Solar:</span>
          <span className="text-base font-extrabold text-amber-700">
            {totalBbmSolarLiter.toLocaleString('id')} Liter ({konsumsiSolarLiterPerHari.toLocaleString('id')} Liter/Hari)
          </span>
        </div>
      </div>

      {/* 3 GRID CARDS KLASTER ENERGI & TELEKOMUNIKASI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. KLASTER GENSET & ENERGI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">1. Pembangkit Daya Genset</h3>
              <p className="text-[11px] text-slate-500">Kebutuhan daya posko & faskes</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">⚡ Total Daya Genset Siaga</span>
              <span className="font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border">{totalGensetKva} KVA</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">⛽ BBM Solar Per Hari</span>
              <span className="font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border">{konsumsiSolarLiterPerHari.toLocaleString('id')} Liter</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🛢️ Total Stok BBM Durasi {estimasiBlackoutHari} Hari</span>
              <span className="font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border">{totalBbmSolarLiter.toLocaleString('id')} Liter</span>
            </div>
          </div>
        </div>

        {/* 2. PENERANGAN & UTILITAS POSKO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">2. Penerangan & Charging</h3>
              <p className="text-[11px] text-slate-500">Peralatan pendukung posko</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">💡 Light Tower / Lampu Sorot</span>
              <span className="font-bold text-amber-600 bg-white px-2.5 py-1 rounded-lg border">{lampuSorotTower} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🔌 Kabel Roll & Panel Distribusi</span>
              <span className="font-bold text-amber-600 bg-white px-2.5 py-1 rounded-lg border">{kabelRollListrikDarurat} Roll</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🔋 Stasiun Charging HP / Powerbank</span>
              <span className="font-bold text-amber-600 bg-white px-2.5 py-1 rounded-lg border">{stasiunPengisianDayaMobile} Posko</span>
            </div>
          </div>
        </div>

        {/* 3. KLASTER TELEKOMUNIKASI DARURAT */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">3. Jaringan Telekomunikasi</h3>
              <p className="text-[11px] text-slate-500">Radio VHF/UHF & Internet Satelit</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">📻 Radio HT (Handy Talky)</span>
              <span className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border">{radioHandyTalkyHT} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">📡 Radio Base Station RIG</span>
              <span className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border">{rigRadioBaseStation} Set</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🌐 V-SAT Internet Satelit Portable</span>
              <span className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border">{vSatInternetPortable} Unit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
