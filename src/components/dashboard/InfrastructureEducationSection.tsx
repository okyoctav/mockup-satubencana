'use client';

import { useState } from 'react';
import { School, Building, Zap, RefreshCw } from 'lucide-react';
import { EstimationData } from './LogisticAnalysisSection';

interface Props {
  estimationData?: EstimationData | null;
}

export default function InfrastructureEducationSection({ estimationData }: Props) {
  const defaultPop = estimationData?.totalPopulasi && estimationData.totalPopulasi > 0 ? estimationData.totalPopulasi : 1000;
  const [populasi, setPopulasi] = useState<number>(defaultPop);
  const [estimasiKerusakanPct, setEstimasiKerusakanPct] = useState<number>(15);

  const totalBalitaPAUD = estimationData ? estimationData.totalBalita : Math.round(populasi * 0.10);
  const siswaSD = Math.round(populasi * 0.14);
  const siswaSMP = Math.round(populasi * 0.07);
  const siswaSMA = Math.round(populasi * 0.06);
  const totalSiswaTerdampak = totalBalitaPAUD + siswaSD + siswaSMP + siswaSMA;

  const tendaSekolahDarurat = Math.ceil(totalSiswaTerdampak / 60);
  const paketSchoolInABox = Math.ceil(totalSiswaTerdampak / 40);
  const paketRecreationKit = Math.ceil(totalSiswaTerdampak / 80);
  const guruPendampingDarurat = Math.ceil(totalSiswaTerdampak / 30);

  const totalKK = estimationData ? estimationData.totalKeluarga : Math.ceil(populasi / 4);
  const balaiDesaGedungOlahraga = Math.ceil(totalKK / 50);
  const rumahIbadahEvakuasi = Math.ceil(totalKK / 30);
  const mcKDaruratMobile = Math.ceil(populasi / 50);
  const poskoKomandoKlaster = Math.max(1, Math.ceil(populasi / 3000));

  const gensetDaruratKva = Math.ceil(populasi / 500) * 15;
  const tangkiAirBersih1000L = Math.ceil(populasi / 200);
  const lampuSorotPenerangan = Math.ceil(populasi / 250) * 4;

  return (
    <div className="space-y-6 font-sans">
      {/* SECTION HEADER */}
      <div className="bg-gradient-to-r from-[#19506e] to-[#1f8080] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-amber-300" />
            <h2 className="font-bold text-lg tracking-tight">Analisis Dampak Fasilitas Umum & Infrastruktur Kritis</h2>
          </div>
          <p className="text-xs text-slate-200">
            Simulasi kebutuhan ruang belajar darurat (School-in-a-Box), pemetaan gedung evakuasi sekunder, dan genset penerangan fasilitas umum.
          </p>
        </div>

        <button
          onClick={() => {
            setPopulasi(1000);
            setEstimasiKerusakanPct(15);
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
              <strong>Data Spasial Terhubung Dari Peta (BAPPENAS & BIG):</strong> Populasi <strong>{estimationData.totalPopulasi.toLocaleString('id')} jiwa</strong> ({totalSiswaTerdampak.toLocaleString('id')} Siswa Usia Sekolah)
            </span>
          </div>

          {estimationData.kelurahanDampak && estimationData.kelurahanDampak.length > 0 && (
            <div className="pt-2 border-t border-emerald-200/60 space-y-2">
              <div>
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

              {estimationData.sekolahDampak && estimationData.sekolahDampak.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/60">
                  <span className="font-bold text-amber-900 block mb-1">
                    🏫 Sekolah Terdampak Dapodik ({estimationData.sekolahDampak.length} Lokasi):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {estimationData.sekolahDampak.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-[11px] text-amber-900 font-semibold flex items-center gap-1">
                        <span>🏫 {s.nama}</span>
                        <span className="text-[9px] bg-amber-200/80 px-1 py-0.2 rounded font-mono text-amber-950 font-bold">
                          {s.bentuk}
                        </span>
                        {s.kecamatan && <span className="text-amber-700 font-normal">({s.kecamatan})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
            Tingkat Risiko Dampak Fisik (%)
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={estimasiKerusakanPct}
            onChange={(e) => setEstimasiKerusakanPct(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
          />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-center space-y-1">
          <span className="text-[11px] font-bold text-slate-500">Estimasi Siswa Usia Sekolah:</span>
          <div className="flex justify-between text-xs font-bold text-[#19506e]">
            <span>🎒 PAUD/SD: {(totalBalitaPAUD + siswaSD).toLocaleString('id')} anak</span>
            <span>🎓 SMP/SMA: {(siswaSMP + siswaSMA).toLocaleString('id')} anak</span>
          </div>
        </div>
      </div>

      {/* 3 GRID CARDS KLASTER INFRASTRUKTUR & PENDIDIKAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. KLASTER PENDIDIKAN & RUANG BELAJAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">1. Klaster Pendidikan Darurat</h3>
              <p className="text-[11px] text-slate-500">Standar UNICEF & Kemendikbudristek</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🎪 Tenda Kelas Belajar Darurat</span>
              <span className="font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border">{tendaSekolahDarurat} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">📦 Paket School-in-a-Box (Alat Tulis)</span>
              <span className="font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border">{paketSchoolInABox} Kit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">⚽ Early Childhood & Recreation Kit</span>
              <span className="font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border">{paketRecreationKit} Kit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">👩‍🏫 Guru / Tenaga Pengajar Siaga</span>
              <span className="font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border">{guruPendampingDarurat} Orang</span>
            </div>
          </div>
        </div>

        {/* 2. FASILITAS UMUM & EVAKUASI SEKUNDER */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">2. Fasilitas Evakuasi Sekunder</h3>
              <p className="text-[11px] text-slate-500">Kapasitas shelter & posko komunitas</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🏛️ Balai Desa / GOR Tempat Evakuasi</span>
              <span className="font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border">{balaiDesaGedungOlahraga} Lokasi</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🕌 Rumah Ibadah Posko Komunitas</span>
              <span className="font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border">{rumahIbadahEvakuasi} Lokasi</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🚽 Toilet & MCK Mobile Portable</span>
              <span className="font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border">{mcKDaruratMobile} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🚩 Posko Komando Klaster Wilayah</span>
              <span className="font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border">{poskoKomandoKlaster} Posko</span>
            </div>
          </div>
        </div>

        {/* 3. INFRASTRUKTUR KRITIS & LIFELINE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">3. Energi & Utilitas Kritis</h3>
              <p className="text-[11px] text-slate-500">Pasokan listrik darurat & air bersih</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">⚡ Genset Listrik Darurat</span>
              <span className="font-bold text-amber-600 bg-white px-2.5 py-1 rounded-lg border">{gensetDaruratKva} KVA</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🚰 Tandon Air Bersih (1.000 Liter)</span>
              <span className="font-bold text-amber-600 bg-white px-2.5 py-1 rounded-lg border">{tangkiAirBersih1000L} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">💡 Lampu Sorot Penerangan Posko</span>
              <span className="font-bold text-amber-600 bg-white px-2.5 py-1 rounded-lg border">{lampuSorotPenerangan} Unit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
