'use client';

import { useState } from 'react';
import { PackageCheck, Droplets, Tent, Utensils, Shirt, HeartPulse, HeartHandshake, RefreshCw, ChevronDown, ChevronUp, Info, X } from 'lucide-react';

export interface SekolahDampakItem {
  nama: string;
  bentuk: string;
  status?: string;
  alamat?: string;
  kecamatan?: string;
  jmlGuru?: number;
  rombel?: number;
  jmlTendik?: number;
  jmlLab?: number;
  jmlPerpus?: number;
}

export interface EstimationData {
  totalPopulasi: number;
  totalLakiLaki: number;
  totalPerempuan: number;
  totalLansia: number;
  totalBalita: number;
  totalPd1: number;
  totalPd2: number;
  totalKeluarga: number;
  kelurahanDampak?: { namaKelurahan: string; namaKecamatan: string; namaKabupaten: string; namaProvinsi: string; kodeKemendagri?: string }[];
  sekolahDampak?: SekolahDampakItem[];
}

interface Props {
  estimationData?: EstimationData | null;
}

export default function LogisticAnalysisSection({ estimationData }: Props) {
  const defaultPop = estimationData?.totalPopulasi && estimationData.totalPopulasi > 0 ? estimationData.totalPopulasi : 1000;
  const [populasi, setPopulasi] = useState<number>(defaultPop);
  const [durasiHari, setDurasiHari] = useState<number>(7);

  // Auto-calc percentages if estimationData is provided
  const calcBalitaPct = estimationData?.totalPopulasi ? Number(((estimationData.totalBalita / estimationData.totalPopulasi) * 100).toFixed(1)) : 10;
  const calcLansiaPct = estimationData?.totalPopulasi ? Number(((estimationData.totalLansia / estimationData.totalPopulasi) * 100).toFixed(1)) : 8;
  const calcBumilPct = 3;
  const calcBusuiPct = 4;
  const calcDifabelPct = estimationData?.totalPopulasi ? Number((((estimationData.totalPd1 + estimationData.totalPd2) / estimationData.totalPopulasi) * 100).toFixed(1)) : 2;

  const [persenIbuHamil, setPersenIbuHamil] = useState<number>(calcBumilPct);
  const [persenIbuMenyusui, setPersenIbuMenyusui] = useState<number>(calcBusuiPct);
  const [persenLansia, setPersenLansia] = useState<number>(calcLansiaPct);
  const [persenBalita, setPersenBalita] = useState<number>(calcBalitaPct);
  const [persenDisabilitas] = useState<number>(calcDifabelPct);

  const [isVariableOpen, setIsVariableOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<{ title: string; content: string } | null>(null);

  // Info explanations derived from metode_analisis.md
  const PARAM_INFOS: Record<string, { title: string; content: string }> = {
    durasiHari: {
      title: '⏱️ Durasi Tanggap (Hari)',
      content: 'Status Tanggap Darurat Bencana pertama kali ditetapkan oleh Kepala Daerah / BNPB untuk siklus awal 7 Hari (Fase Emergency Relief Pertama - UU No. 24/2007 & Perka BNPB No. 10/2012). Angka durasi ini menjadi perkalian linier harian untuk menghitung konsumsi beras, air minum, kantong sampah, dan higiene kit.',
    },
    ibuHamil: {
      title: '🤱 Ibu Hamil (%)',
      content: 'Berdasarkan Standar Paket Pelayanan Awal Minimum (PPAM) Kesehatan Reproduksi Bencana (Kemenkes RI & UNFPA), persentase Ibu Hamil dihitung dari Crude Birth Rate (CBR) dan prevalensi kehamilan nasional sebesar 3% dari total populasi. Digunakan untuk menentukan kebutuhan Maternity Kit, PMT biskuit ibu hamil, dan bidan posko.',
    },
    ibuMenyusui: {
      title: '🍼 Ibu Menyusui (%)',
      content: 'Mengacu pada standar PPAM Kemenkes RI & WHO, ibu menyusui dihitung dari estimasi jumlah ibu yang memiliki bayi usia 0–24 bulan (ASI Eksklusif & Pendamping) yang bernilai rata-rata 4% dari total populasi. Digunakan untuk penyediaan ruang laktasi kit, suplemen gizi, dan alat simpan ASI perah.',
    },
    lansia: {
      title: '👴 Lansia (%)',
      content: 'Persentase lansia (populasi usia ≥ 60 tahun) diperoleh secara otomatis (Real-Time) dari irisan polygon peta BAPPENAS DTSEN. Jika tanpa peta, digunakan standar demografi nasional BPS sebesar 8% dari populasi. Digunakan untuk menentukan kebutuhan tim medis geriatri, popok dewasa, dan tensimeter lansia.',
    },
    balita: {
      title: '👶 Balita (%)',
      content: 'Persentase balita (anak usia 0–5 tahun) diperoleh secara otomatis (Real-Time) dari irisan polygon peta BAPPENAS DTSEN. Jika tanpa peta, digunakan acuan demografi nasional BPS sebesar 10% dari populasi. Digunakan untuk menentukan kebutuhan popok balita (4 pcs/hari), makanan pendamping ASI (MP-ASI), dan School-in-a-Box PAUD.',
    },
  };

  // Kalkulasi Demografi
  const jmlBalita = Math.round((populasi * persenBalita) / 100);
  const jmlLansia = Math.round((populasi * persenLansia) / 100);
  const jmlIbuHamil = Math.round((populasi * persenIbuHamil) / 100);
  const jmlIbuMenyusui = Math.round((populasi * persenIbuMenyusui) / 100);
  const jmlDisabilitas = Math.round((populasi * persenDisabilitas) / 100);
  const jmlKeluarga = Math.ceil(populasi / 4);

  // 1. Air Minum (Permen PPPA No 8/2024)
  const airHari1 = populasi * 5;
  const airHariLanjut = populasi * 20 * Math.max(0, durasiHari - 1);
  const totalAirMinum = airHari1 + airHariLanjut;

  // 2. Sanitasi & Higiene (Perka 7/2008 & PPAM 2025)
  const jmlJamban = Math.ceil(populasi / 20);
  const tandon1000L = Math.ceil(jmlJamban / 3);
  const keranAir = tandon1000L * 6;
  const emberGayung = Math.ceil(populasi / 20);
  const plastikSampah = Math.ceil(populasi / 20) * durasiHari;
  const popokBalitaHari = jmlBalita * 4;
  const popokDewasaHari = (jmlLansia + jmlDisabilitas) * 4;
  const pembalutBulan = Math.ceil(populasi * 0.5) * 2; // estimasi 50% wanita

  // 3. Hunian & Logistik Darurat (Juklak 3/2023 & Sphere)
  const tendaKeluarga = jmlKeluarga;
  const tendaPengungsi20 = Math.ceil(populasi / 20);
  const tikar = jmlKeluarga;
  const selimutBantalVelbed = populasi;

  // 4. Pangan (Bapanas No 11/2023)
  const berasKgPerHari = populasi * 0.25;
  const totalBerasKg = berasKgPerHari * durasiHari;
  const paketMakananSiapSajiHari = populasi * 3;

  // 5. Sandang & Kebersihan (Perka 10/2012)
  const setPakaianLengkap = populasi * 2;
  const setIbadah = populasi;

  // 6. Kesehatan & Psikososial (Permenkes & PPAM)
  const dokter = Math.ceil(populasi / 1000);
  const perawat = Math.ceil(populasi / 200);
  const bidan = Math.ceil(populasi / 500);
  const pekerjaSosial = Math.ceil((jmlBalita + jmlDisabilitas + jmlLansia) / 7);

  return (
    <div className="space-y-6 font-sans">
      {/* SECTION HEADER */}
      <div className="bg-gradient-to-r from-[#19506e] to-[#1f8080] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-emerald-300" />
            <h2 className="font-bold text-lg tracking-tight">Analisis Kebutuhan Logistik & Klaster Pengungsian</h2>
          </div>
          <p className="text-xs text-slate-200">Kalkulator estimasi standar logistik darurat sesuai Permen PPPA, Perka BNPB, Bapanas, Juklak 2023, & Standar Sphere Project.</p>
        </div>

        <button
          onClick={() => {
            setPopulasi(1000); setDurasiHari(7);
          }}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Parameter</span>
        </button>
      </div>

      {/* LIVE TRIGGER BANNER FROM MAP DRAW (BAPPENAS & BIG) */}
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
              <span className="text-[10px] text-cyan-700 font-semibold block">🧾 Disabilitas Berat (PD1)</span>
              <span className="font-extrabold text-cyan-700 text-xs">{estimationData.totalPd1.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-purple-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-purple-700 font-semibold block">📊 Disabilitas Sedang (PD2)</span>
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
            <span className="font-bold text-xs text-[#19506e] tracking-wide uppercase">⚙️ Variable Estimasi & Parameter Logistik</span>
            <span className="text-[10px] bg-[#1f8080]/10 text-[#1f8080] font-semibold px-2 py-0.5 rounded-md border border-[#1f8080]/20">
              {durasiHari} Hari • Bumil {persenIbuHamil}% ({jmlIbuHamil.toLocaleString('id')} jiwa) • Busui {persenIbuMenyusui}% ({jmlIbuMenyusui.toLocaleString('id')} jiwa) • Lansia {persenLansia}% ({jmlLansia.toLocaleString('id')} jiwa) • Balita {persenBalita}% ({jmlBalita.toLocaleString('id')} jiwa)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span>{isVariableOpen ? 'Sembunyikan' : 'Pengaturan Parameter Variable'}</span>
            {isVariableOpen ? <ChevronUp className="w-4 h-4 text-[#19506e]" /> : <ChevronDown className="w-4 h-4 text-[#19506e]" />}
          </div>
        </button>

        {/* Accordion Content Form Body */}
        {isVariableOpen && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-white border-t border-slate-100">
            {/* 1. Durasi Tanggap */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#19506e] uppercase tracking-wider">Durasi Tanggap (Hari)</label>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal(PARAM_INFOS.durasiHari)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Informasi Metodologi Durasi Tanggap"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                value={durasiHari}
                onChange={(e) => setDurasiHari(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                <span>Total Siklus:</span>
                <span className="font-bold text-[#19506e] bg-slate-100 px-1.5 py-0.5 rounded">{durasiHari} Hari Tanggap</span>
              </div>
            </div>

            {/* 2. Ibu Hamil */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">Ibu Hamil (%)</label>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal(PARAM_INFOS.ibuHamil)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Informasi Metodologi Ibu Hamil"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                value={persenIbuHamil}
                onChange={(e) => setPersenIbuHamil(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#1f8080]"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                <span>Hasil Estimasi:</span>
                <span className="font-extrabold text-[#1f8080] bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                  = {jmlIbuHamil.toLocaleString('id')} Jiwa
                </span>
              </div>
            </div>

            {/* 3. Ibu Menyusui */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">Ibu Menyusui (%)</label>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal(PARAM_INFOS.ibuMenyusui)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Informasi Metodologi Ibu Menyusui"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                value={persenIbuMenyusui}
                onChange={(e) => setPersenIbuMenyusui(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#1f8080]"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                <span>Hasil Estimasi:</span>
                <span className="font-extrabold text-[#1f8080] bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                  = {jmlIbuMenyusui.toLocaleString('id')} Jiwa
                </span>
              </div>
            </div>

            {/* 4. Lansia */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">Lansia (%)</label>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal(PARAM_INFOS.lansia)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Informasi Metodologi Lansia"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                value={persenLansia}
                onChange={(e) => setPersenLansia(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#1f8080]"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                <span>Hasil Estimasi:</span>
                <span className="font-extrabold text-[#19506e] bg-sky-50 border border-sky-200/60 px-1.5 py-0.5 rounded">
                  = {jmlLansia.toLocaleString('id')} Jiwa
                </span>
              </div>
            </div>

            {/* 5. Balita */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">Balita (%)</label>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal(PARAM_INFOS.balita)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Informasi Metodologi Balita"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                value={persenBalita}
                onChange={(e) => setPersenBalita(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#1f8080]"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                <span>Hasil Estimasi:</span>
                <span className="font-extrabold text-[#19506e] bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
                  = {jmlBalita.toLocaleString('id')} Jiwa
                </span>
              </div>
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

      {/* ESTIMATION SUMMARY CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* KELOMPOK 1: AIR MINUM & SANITASI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#19506e]">1. Air Minum, Sanitasi & Kebersihan</h3>
              <p className="text-[10px] text-slate-400">Permen PPPA No 8/2024 & Perka 7/2008</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Total Air Minum:</span>
              <strong className="text-[#19506e]">{totalAirMinum.toLocaleString('id')} Liter</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Jamban Darurat (1 / 20 jiwa):</span>
              <strong className="text-[#19506e]">{jmlJamban} Unit</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Tandon Air 1.000L (1 / 3 jamban):</span>
              <strong className="text-[#19506e]">{tandon1000L} Unit</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Keran Air Tambahan:</span>
              <strong className="text-[#19506e]">{keranAir} Unit</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Ember & Gayung Set:</span>
              <strong className="text-[#19506e]">{emberGayung} Set</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Plastik Sampah Harian:</span>
              <strong className="text-[#19506e]">{plastikSampah} Lembar</strong>
            </div>
          </div>
        </div>

        {/* KELOMPOK 2: HUNIAN & PERLENGKAPAN */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Tent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#19506e]">2. Hunian & Perlengkapan Darurat</h3>
              <p className="text-[10px] text-slate-400">Juklak 3/2023 & Acuan Sphere</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Tenda Keluarga (4 jiwa):</span>
              <strong className="text-[#19506e]">{tendaKeluarga} Unit</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Tenda Pengungsi (20 jiwa):</span>
              <strong className="text-[#19506e]">{tendaPengungsi20} Unit</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Estimasi Luas Lahan Tenda:</span>
              <strong className="text-[#19506e]">{(tendaKeluarga * 13.5).toLocaleString('id')} m²</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Selimut, Bantal & Matras:</span>
              <strong className="text-[#19506e]">{selimutBantalVelbed.toLocaleString('id')} Pcs</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Tikar Keluarga:</span>
              <strong className="text-[#19506e]">{tikar} Lembar</strong>
            </div>
          </div>
        </div>

        {/* KELOMPOK 3: PANGAN & LOGISTIK BAHAN POKOK */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#19506e]">3. Pangan & Konsumsi Nutrisi</h3>
              <p className="text-[10px] text-slate-400">Perbadan Bapanas No 11/2023</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Beras (0.25kg/orang/hari):</span>
              <strong className="text-[#19506e]">{totalBerasKg.toLocaleString('id')} Kg</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Total Paket Makanan Siap Saji:</span>
              <strong className="text-[#19506e]">{(paketMakananSiapSajiHari * durasiHari).toLocaleString('id')} Paket</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Asupan Lauk Pauk (1.200 Kkal):</span>
              <strong className="text-[#19506e] font-semibold">Tersedia per Posko</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Tambahan Nutrisi Bumil/Busui:</span>
              <strong className="text-emerald-600">{jmlIbuHamil + jmlIbuMenyusui} Paket Gizi</strong>
            </div>
          </div>
        </div>

        {/* KELOMPOK 4: SANDANG & HIGIENE DIRI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#19506e]">4. Sandang & Kit Individu</h3>
              <p className="text-[10px] text-slate-400">Perka 10/2012 & Standar Kit PPAM</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Set Pakaian Lengkap (2 set/orang):</span>
              <strong className="text-[#19506e]">{setPakaianLengkap.toLocaleString('id')} Set</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Perlengkapan Ibadah:</span>
              <strong className="text-[#19506e]">{setIbadah.toLocaleString('id')} Set</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Popok Balita (4 pcs/hari):</span>
              <strong className="text-[#19506e]">{(popokBalitaHari * durasiHari).toLocaleString('id')} Pcs</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Popok Dewasa/Lansia (4 pcs/hari):</span>
              <strong className="text-[#19506e]">{(popokDewasaHari * durasiHari).toLocaleString('id')} Pcs</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Pembalut Wanita (Bulanan):</span>
              <strong className="text-[#19506e]">{pembalutBulan.toLocaleString('id')} Pack</strong>
            </div>
          </div>
        </div>

        {/* KELOMPOK 5: KESEHATAN SDM */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <div className="p-2 rounded-xl bg-[#1f8080]/10 text-[#1f8080]">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#19506e]">5. SDM Layanan Kesehatan</h3>
              <p className="text-[10px] text-slate-400">Rasio Medis Standar Permenkes</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Dokter (1 / 1.000 orang):</span>
              <strong className="text-[#19506e]">{dokter} Orang</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Perawat (1 / 200 orang):</span>
              <strong className="text-[#19506e]">{perawat} Orang</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Bidan (1 / 500 orang):</span>
              <strong className="text-[#19506e]">{bidan} Orang</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Tenaga Kesehatan Masyarakat:</span>
              <strong className="text-[#19506e]">Minimal 1 Orang</strong>
            </div>
          </div>
        </div>

        {/* KELOMPOK 6: DUKUNGAN PSIKOSOSIAL */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#19506e]">6. Layanan Psikososial & Disabilitas</h3>
              <p className="text-[10px] text-slate-400">Perlindungan Ramah Anak & Difabel</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Tenda Layanan Psikososial:</span>
              <strong className="text-[#19506e]">Min. 1 per Posko</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Ruang Ramah Pasutri & Anak:</span>
              <strong className="text-[#19506e]">Min. 1 per Posko</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Pekerja Sosial (1 / 7 pasien rentan):</span>
              <strong className="text-[#19506e]">{pekerjaSosial} Orang</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Total Pasien Rentan (Anak/Lansia/Difabel):</span>
              <strong className="text-rose-600">{jmlBalita + jmlLansia + jmlDisabilitas} Jiwa</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
