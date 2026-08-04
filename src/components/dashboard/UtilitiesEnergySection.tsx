'use client';

import { useState } from 'react';
import { Zap, Radio, Lightbulb, RefreshCw, ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import { EstimationData } from './LogisticAnalysisSection';

interface Props {
  estimationData?: EstimationData | null;
}

export default function UtilitiesEnergySection({ estimationData }: Props) {
  const [isVariableOpen, setIsVariableOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<{ title: string; content: string } | null>(null);

  const PARAM_INFOS = {
    populasi: {
      title: '👥 Total Populasi Terdampak (Jiwa)',
      content: 'Populasi total terestimasi yang digunakan sebagai perkalian kebutuhan daya genset (20 KVA per 400 jiwa) dan peralatan telekomunikasi radio V-SAT.',
    },
    blackout: {
      title: '⚡ Estimasi Durasi Blackout / Pemadaman Listrik (Hari)',
      content: 'Berdasarkan standar utilitas kebencanaan PLN & ESDM, durasi pemadaman listrik menentukan total estimasi pasokan BBM solar (4 Liter/KVA per 24 jam) yang wajib disiapkan di posko komando.',
    },
  };
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-xs font-medium space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>
              <strong>Data Terhubung Dari Simulasi Polygon Peta:</strong> Total Populasi Terestimasi <strong>{estimationData.totalPopulasi.toLocaleString('id')} Jiwa</strong>
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

      {/* VARIABLE ACCORDION CONTROL PANEL */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all">
        {/* Accordion Toggle Header */}
        <button
          onClick={() => setIsVariableOpen(!isVariableOpen)}
          className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between transition-colors border-b border-slate-200/60"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs text-[#19506e] tracking-wide uppercase">⚙️ Variable Estimasi & Parameter Energi & Utilitas</span>
            <span className="text-[10px] bg-[#1f8080]/10 text-[#1f8080] font-semibold px-2 py-0.5 rounded-md border border-[#1f8080]/20">
              Populasi {populasi.toLocaleString('id')} Jiwa • Blackout {estimasiBlackoutHari} Hari • Solar {totalBbmSolarLiter.toLocaleString('id')} Liter
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span>{isVariableOpen ? 'Sembunyikan' : 'Pengaturan Parameter Variable'}</span>
            {isVariableOpen ? <ChevronUp className="w-4 h-4 text-[#19506e]" /> : <ChevronDown className="w-4 h-4 text-[#19506e]" />}
          </div>
        </button>

        {/* Accordion Content Form Body */}
        {isVariableOpen && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border-t border-slate-100">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#19506e] uppercase tracking-wider">Populasi Area Terdampak (Jiwa)</label>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal(PARAM_INFOS.populasi)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Informasi Metodologi Populasi"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                value={populasi}
                onChange={(e) => setPopulasi(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#19506e] uppercase tracking-wider">Durasi Padam Listrik (Hari)</label>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal(PARAM_INFOS.blackout)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Informasi Metodologi Durasi Padam"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                min="1"
                max="30"
                value={estimasiBlackoutHari}
                onChange={(e) => setEstimasiBlackoutHari(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                <span>Konsumsi Solar/Hari:</span>
                <span className="font-extrabold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
                  = {konsumsiSolarLiterPerHari.toLocaleString('id')} Liter/Hari
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex flex-col justify-center space-y-1 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Kebutuhan BBM Solar:</span>
              <span className="text-base font-extrabold text-amber-700">
                {totalBbmSolarLiter.toLocaleString('id')} Liter
              </span>
            </div>
          </div>
        )}
      </div>

      {/* INFO EXPLANATION POPUP MODAL */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-[#1f8080]" />
                <span>{activeInfoModal.title}</span>
              </h3>
              <button
                onClick={() => setActiveInfoModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs leading-relaxed text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p>{activeInfoModal.content}</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveInfoModal(null)}
                className="px-4 py-2 bg-[#19506e] hover:bg-[#19506e]/90 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

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
