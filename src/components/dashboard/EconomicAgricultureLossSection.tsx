'use client';

import { useState } from 'react';
import { Sprout, Tractor, Factory, Home, RefreshCw } from 'lucide-react';
import { EstimationData } from './LogisticAnalysisSection';

interface Props {
  estimationData?: EstimationData | null;
}

export default function EconomicAgricultureLossSection({ estimationData }: Props) {
  const defaultPop = estimationData?.totalPopulasi && estimationData.totalPopulasi > 0 ? estimationData.totalPopulasi : 1000;
  const [populasi, setPopulasi] = useState<number>(defaultPop);
  const [estimasiLuasHa, setEstimasiLuasHa] = useState<number>(120); // Estimasi 120 Hektar area terdampak
  const [persenLahanPertanian, setPersenLahanPertanian] = useState<number>(45); // 45% lahan pertanian/kebun

  const totalKK = estimationData ? estimationData.totalKeluarga : Math.ceil(populasi / 4);

  // 1. Estimasi Kerusakan Sektor Pertanian, Perkebunan, & Perikanan
  const luasLahanPertanianHa = Number(((estimasiLuasHa * persenLahanPertanian) / 100).toFixed(1));
  const estimasiKerugianBerasRp = Math.round(luasLahanPertanianHa * 5 * 6500 * 1000); // 5 Ton/Ha x Rp 6.500/kg
  const estimasiBibitPupukRusakRp = Math.round(luasLahanPertanianHa * 4500000); // Rp 4.5 Jt/Ha
  const kelompokTaniTerdampak = Math.ceil(luasLahanPertanianHa / 15); // 1 klp tani per 15 Ha

  // 2. Estimasi Kerusakan Rumah & Pemukiman Warga (Standar BNPB)
  const estimasiRumahRusakBerat = Math.round(totalKK * 0.15); // 15% rusak berat
  const estimasiRumahRusakSedang = Math.round(totalKK * 0.25); // 25% rusak sedang
  const estimasiRumahRusakRingan = Math.round(totalKK * 0.35); // 35% rusak ringan

  // Kerugian Finansial Sektor Pemukiman (Standar Bantuan Stimulan BNPB: RB 50 Jt, RS 25 Jt, RR 10 Jt)
  const kerugianRumahRp = (estimasiRumahRusakBerat * 50000000) + (estimasiRumahRusakSedang * 25000000) + (estimasiRumahRusakRingan * 10000000);

  // 3. Estimasi Kerugian Umkm & Sektor Mata Pencaharian
  const estimasiUmkmTerdampak = Math.ceil(totalKK * 0.20); // 20% KK memiliki UMKM/Usaha Mikro
  const estimasiKerugianUsahaRp = estimasiUmkmTerdampak * 7500000; // Rp 7.5 Jt per UMKM

  // Total Estimasi Kerugian Ekonomi Makro (Rp)
  const totalKerugianEkonomiRp = estimasiKerugianBerasRp + estimasiBibitPupukRusakRp + kerugianRumahRp + estimasiKerugianUsahaRp;

  return (
    <div className="space-y-6 font-sans">
      {/* SECTION HEADER */}
      <div className="bg-gradient-to-r from-[#1f8080] to-[#19506e] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sprout className="w-6 h-6 text-emerald-300 animate-pulse" />
            <h2 className="font-bold text-lg tracking-tight">Analisis Kerugian Ekonomi & Lahan Produktif</h2>
          </div>
          <p className="text-xs text-slate-200">
            Simulasi estimasi nilai kerusakan sektor pertanian, aset pemukiman warga, dan potensi kehilangan mata pencaharian UMKM.
          </p>
        </div>

        <button
          onClick={() => {
            setPopulasi(1000);
            setEstimasiLuasHa(120);
            setPersenLahanPertanian(45);
          }}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Parameter</span>
        </button>
      </div>

      {/* LIVE SYNC BANNER FROM MAP DRAW */}
      {estimationData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-xs font-medium space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>
              <strong>Data Terhubung Dari Simulasi Polygon Peta:</strong> Total Populasi Terestimasi <strong>{estimationData.totalPopulasi.toLocaleString('id')} Jiwa</strong> ({totalKK.toLocaleString('id')} KK Pemukiman Terdampak)
            </span>
          </div>

          {/* Rincian Demografi Lengkap (Sama Seperti Popup Estimasi Peta) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-emerald-200/80">
            <div className="bg-white/80 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">👨 Laki-laki</span>
              <span className="font-extrabold text-[#19506e] text-xs">{estimationData.totalLakiLaki.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">👩 Perempuan</span>
              <span className="font-extrabold text-[#19506e] text-xs">{estimationData.totalPerempuan.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">👴 Lansia</span>
              <span className="font-extrabold text-[#19506e] text-xs">{estimationData.totalLansia.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">🧒 Balita</span>
              <span className="font-extrabold text-[#19506e] text-xs">{estimationData.totalBalita.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-cyan-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-cyan-700 font-semibold block">🧾 Disabilitas (PD1)</span>
              <span className="font-extrabold text-cyan-700 text-xs">{estimationData.totalPd1.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-purple-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-purple-700 font-semibold block">📊 Disabilitas (PD2)</span>
              <span className="font-extrabold text-purple-700 text-xs">{estimationData.totalPd2.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">🏠 Total KK</span>
              <span className="font-extrabold text-[#1f8080] text-xs">{estimationData.totalKeluarga.toLocaleString('id')}</span>
            </div>
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
            Estimasi Luas Area Terdampak (Hektar)
          </label>
          <input
            type="number"
            value={estimasiLuasHa}
            onChange={(e) => setEstimasiLuasHa(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#19506e] uppercase tracking-wider block mb-1.5">
            Proporsi Lahan Pertanian / Perkebunan (%)
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={persenLahanPertanian}
            onChange={(e) => setPersenLahanPertanian(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
          />
        </div>

        <div className="bg-[#19506e] text-white rounded-xl p-3 flex flex-col justify-center space-y-1 shadow-md">
          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Total Estimasi Kerugian Ekonomi:</span>
          <span className="text-base font-extrabold text-white">
            Rp {(totalKerugianEkonomiRp / 1000000000).toFixed(2)} Miliar
          </span>
        </div>
      </div>

      {/* 3 GRID CARDS KERUSAKAN SEKTOR EKONOMI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. SEKTOR PERTANIAN & AGRO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">1. Kerusakan Sektor Pertanian</h3>
              <p className="text-[11px] text-slate-500">Pangan, Perkebunan, & Peternakan</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🌾 Luas Lahan Pertanian Terdampak</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{luasLahanPertanianHa} Ha</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🌾 Estimasi Gagal Panen (Ton Padi/Beras)</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{(luasLahanPertanianHa * 5).toLocaleString('id')} Ton</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">💰 Kerugian Hasil Panen (Rp)</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">Rp {(estimasiKerugianBerasRp / 1000000).toFixed(1)} Jt</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🧑‍🌾 Kelompok Tani (Poktan) Terdampak</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{kelompokTaniTerdampak} Poktan</span>
            </div>
          </div>
        </div>

        {/* 2. SEKTOR PEMUKIMAN & RUMAH */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">2. Aset Pemukiman & Rumah</h3>
              <p className="text-[11px] text-slate-500">Kategori kerusakan fisik bangunan BNPB</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-[#EF4444]">🏠 Rumah Rusak Berat (RB)</span>
              <span className="font-bold text-[#EF4444] bg-white px-2.5 py-1 rounded-lg border">{estimasiRumahRusakBerat} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-[#F97316]">🏠 Rumah Rusak Sedang (RS)</span>
              <span className="font-bold text-[#F97316] bg-white px-2.5 py-1 rounded-lg border">{estimasiRumahRusakSedang} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-[#EAB308]">🏠 Rumah Rusak Ringan (RR)</span>
              <span className="font-bold text-[#EAB308] bg-white px-2.5 py-1 rounded-lg border">{estimasiRumahRusakRingan} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">💵 Estimasi Kerugian Rumah (Rp)</span>
              <span className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border">Rp {(kerugianRumahRp / 1000000000).toFixed(2)} Miliar</span>
            </div>
          </div>
        </div>

        {/* 3. SEKTOR UMKM & MATA PENCAHARIAN */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">3. UMKM & Mata Pencaharian</h3>
              <p className="text-[11px] text-slate-500">Dampak ekonomi mikro & usaha warga</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🏪 Unit UMKM Terdampak</span>
              <span className="font-bold text-purple-700 bg-white px-2.5 py-1 rounded-lg border">{estimasiUmkmTerdampak} Usaha</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">💼 Potensi Kerugian Modal Usaha</span>
              <span className="font-bold text-purple-700 bg-white px-2.5 py-1 rounded-lg border">Rp {(estimasiKerugianUsahaRp / 1000000).toFixed(1)} Jt</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">💵 Kerugian Total Sektor Mikro</span>
              <span className="font-bold text-purple-700 bg-white px-2.5 py-1 rounded-lg border">Rp {(estimasiKerugianUsahaRp / 1000000).toFixed(1)} Jt</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
