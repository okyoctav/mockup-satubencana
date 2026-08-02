'use client';

import { useState } from 'react';
import { HeartPulse, Stethoscope, Building2, Pill, RefreshCw } from 'lucide-react';
import { EstimationData } from './LogisticAnalysisSection';

interface Props {
  estimationData?: EstimationData | null;
}

export default function MedicalEmergencySection({ estimationData }: Props) {
  const defaultPop = estimationData?.totalPopulasi && estimationData.totalPopulasi > 0 ? estimationData.totalPopulasi : 1000;
  const [populasi, setPopulasi] = useState<number>(defaultPop);
  const [estimasiKorbanLukaPct, setEstimasiKorbanLukaPct] = useState<number>(5);

  const totalKorbanLuka = Math.round((populasi * estimasiKorbanLukaPct) / 100);
  const korbanLukaBerat = Math.round(totalKorbanLuka * 0.3);
  const korbanLukaRingan = totalKorbanLuka - korbanLukaBerat;

  const totalLansia = estimationData ? estimationData.totalLansia : Math.round(populasi * 0.08);
  const totalBalita = estimationData ? estimationData.totalBalita : Math.round(populasi * 0.10);
  const totalDisabilitas = estimationData ? (estimationData.totalPd1 + estimationData.totalPd2) : Math.round(populasi * 0.02);

  const dokterUmum = Math.ceil(populasi / 1000);
  const dokterSpesialisAnak = Math.ceil(totalBalita / 500);
  const perawatMedis = Math.ceil(populasi / 200);
  const bidanDesa = Math.ceil(populasi / 500);
  const timPsikososial = Math.ceil((totalBalita + totalLansia + totalDisabilitas) / 10);

  const emergencyHealthKit1000 = Math.ceil(populasi / 1000);
  const cairanInfusKolf = (korbanLukaBerat * 4) + (korbanLukaRingan * 1);
  const paketPerbanKasa = totalKorbanLuka * 3;
  const serumTetanusATS = korbanLukaBerat;
  const kitResusitasi = Math.ceil(populasi / 2000);
  const pemantauGulaDarahTensi = Math.ceil(totalLansia / 20);

  const ambulansEmergency = Math.max(1, Math.ceil(totalKorbanLuka / 25));
  const poskesdesTenda = Math.ceil(populasi / 2000);
  const bedEmergencyVelbed = Math.ceil(totalKorbanLuka * 0.5);

  return (
    <div className="space-y-6 font-sans">
      {/* SECTION HEADER */}
      <div className="bg-gradient-to-r from-[#1f8080] to-[#19506e] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-rose-300 animate-pulse" />
            <h2 className="font-bold text-lg tracking-tight">Analisis Kebutuhan Medis & Faskes Darurat</h2>
          </div>
          <p className="text-xs text-slate-200">
            Simulasi kebutuhan SDM kesehatan, paket obat esensial (IEHK), BMHP, dan posko medis darurat berbasis Permenkes & Standar WHO/PPAM.
          </p>
        </div>

        <button
          onClick={() => {
            setPopulasi(1000);
            setEstimasiKorbanLukaPct(5);
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
              <strong>Data Spasial Terhubung Dari Peta (BAPPENAS & BIG):</strong> Populasi <strong>{estimationData.totalPopulasi.toLocaleString('id')} jiwa</strong> ({totalBalita} Balita, {totalLansia} Lansia, {totalDisabilitas} Disabilitas)
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
            Total Populasi Terdampak (Jiwa)
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
            Estimasi Tingkat Korban Luka (%)
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={estimasiKorbanLukaPct}
            onChange={(e) => setEstimasiKorbanLukaPct(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
          />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-center space-y-1">
          <span className="text-[11px] font-bold text-slate-500">Breakdown Estimasi Korban Luka:</span>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-amber-600">🩹 Luka Ringan: {korbanLukaRingan.toLocaleString('id')} jiwa</span>
            <span className="text-rose-600">🚑 Luka Berat: {korbanLukaBerat.toLocaleString('id')} jiwa</span>
          </div>
        </div>
      </div>

      {/* 3 GRID CARDS KLUSTER KESEHATAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. SDM KESEHATAN DARURAT */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">1. Kebutuhan SDM Kesehatan</h3>
              <p className="text-[11px] text-slate-500">Standar minimal per 1.000 pengungsi</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">👨‍⚕️ Dokter Umum</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{dokterUmum} Orang</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">👶 Dokter Spesialis Anak / Pediatrik</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{dokterSpesialisAnak} Orang</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🩺 Perawat Medis Emergency</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{perawatMedis} Orang</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🤱 Bidan Siaga Pengungsian</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{bidanDesa} Orang</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🧠 Tim DUKPS / Kesehatan Jiwa</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{timPsikososial} Orang</span>
            </div>
          </div>
        </div>

        {/* 2. LOGISTIK OBAT & BMHP */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">2. Paket Obat Esensial & BMHP</h3>
              <p className="text-[11px] text-slate-500">Standard Interagency Emergency Health Kit</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">💊 IEHK Kit Obat Darurat (1.000 jiwa)</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{emergencyHealthKit1000} Kit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🧪 Cairan Infus (RL / NaCl)</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{cairanInfusKolf.toLocaleString('id')} Kolf</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🩹 Kasa Steril & Perban Luka</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{paketPerbanKasa.toLocaleString('id')} Roll</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">💉 Serum Tetanus (ATS)</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{serumTetanusATS} Ampul</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🩺 Kit Resusitasi & Oksigen Tabung</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{kitResusitasi} Set</span>
            </div>
          </div>
        </div>

        {/* 3. FASKES & AMBULANS DARURAT */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">3. Posko & Armada Medis</h3>
              <p className="text-[11px] text-slate-500">Mobilisasi sarana kesehatan darurat</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🚑 Ambulans Transport / Emergency</span>
              <span className="font-bold text-rose-700 bg-white px-2.5 py-1 rounded-lg border">{ambulansEmergency} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🎪 Tenda Poskesdes / Rumah Sakit Lapangan</span>
              <span className="font-bold text-rose-700 bg-white px-2.5 py-1 rounded-lg border">{poskesdesTenda} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🛏️ Bed Observasi / Velbed Medis</span>
              <span className="font-bold text-rose-700 bg-white px-2.5 py-1 rounded-lg border">{bedEmergencyVelbed} Bed</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🩸 Kit Pemeriksaan Tensi/Gula Lansia</span>
              <span className="font-bold text-rose-700 bg-white px-2.5 py-1 rounded-lg border">{pemantauGulaDarahTensi} Kit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
