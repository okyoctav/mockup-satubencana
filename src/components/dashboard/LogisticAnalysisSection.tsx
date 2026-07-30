'use client';

import { useState } from 'react';
import { PackageCheck, Droplets, Tent, Utensils, Shirt, HeartPulse, HeartHandshake, RefreshCw } from 'lucide-react';

export default function LogisticAnalysisSection() {
  const [populasi, setPopulasi] = useState<number>(1000);
  const [durasiHari, setDurasiHari] = useState<number>(7);
  const [persenIbuHamil, setPersenIbuHamil] = useState<number>(3);
  const [persenIbuMenyusui, setPersenIbuMenyusui] = useState<number>(4);
  const [persenLansia, setPersenLansia] = useState<number>(8);
  const [persenBalita, setPersenBalita] = useState<number>(10);
  const [persenDisabilitas] = useState<number>(2);

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

      {/* INPUT PARAMETER CONTROL PANEL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label className="text-[11px] font-bold text-[#19506e] uppercase tracking-wider block mb-1">Populasi Terestimasi</label>
          <input
            type="number"
            value={populasi}
            onChange={(e) => setPopulasi(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#19506e] uppercase tracking-wider block mb-1">Durasi Tanggap (Hari)</label>
          <input
            type="number"
            value={durasiHari}
            onChange={(e) => setDurasiHari(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Ibu Hamil (%)</label>
          <input
            type="number"
            value={persenIbuHamil}
            onChange={(e) => setPersenIbuHamil(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Ibu Menyusui (%)</label>
          <input
            type="number"
            value={persenIbuMenyusui}
            onChange={(e) => setPersenIbuMenyusui(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Lansia (%)</label>
          <input
            type="number"
            value={persenLansia}
            onChange={(e) => setPersenLansia(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Balita (%)</label>
          <input
            type="number"
            value={persenBalita}
            onChange={(e) => setPersenBalita(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
          />
        </div>
      </div>

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
