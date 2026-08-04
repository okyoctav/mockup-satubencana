'use client';

import { useState } from 'react';
import { School, Building, Zap, RefreshCw, ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import { EstimationData } from './LogisticAnalysisSection';

interface Props {
  estimationData?: EstimationData | null;
}

export default function InfrastructureEducationSection({ estimationData }: Props) {
  const defaultPop = estimationData?.totalPopulasi && estimationData.totalPopulasi > 0 ? estimationData.totalPopulasi : 1000;
  const [populasi, setPopulasi] = useState<number>(defaultPop);
  const [estimasiKerusakanPct, setEstimasiKerusakanPct] = useState<number>(15);

  const [isVariableOpen, setIsVariableOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<{ title: string; content: string } | null>(null);

  const PARAM_INFOS = {
    populasi: {
      title: '👥 Populasi Area Terdampak (Jiwa)',
      content: 'Populasi total terestimasi yang digunakan untuk menghitung rasio jumlah siswa usia sekolah (PAUD 10%, SD 14%, SMP 7%, SMA 6%) dan kapasitas balai desa/gedung evakuasi.',
    },
    kerusakan: {
      title: '🏫 Tingkat Risiko Dampak Fisik (%)',
      content: 'Berdasarkan standar UNICEF & Perka BNPB No. 07/2008, persentase estimasi dampak fisik sekolah menentukan jumlah tenda kelas darurat, paket School-in-a-Box, dan tenda kegiatan psikososial anak.',
    },
  };

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
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-xs font-medium space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>
              <strong>Data Terhubung Dari Simulasi Polygon Peta:</strong> Total Populasi Terestimasi <strong>{estimationData.totalPopulasi.toLocaleString('id')} Jiwa</strong> ({totalSiswaTerdampak.toLocaleString('id')} Siswa Usia Sekolah)
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

              {estimationData.sekolahDampak && estimationData.sekolahDampak.length > 0 && (() => {
                const list = estimationData.sekolahDampak;
                const totalGuru = list.reduce((acc, s) => acc + (s.jmlGuru || 0), 0);
                const totalRombel = list.reduce((acc, s) => acc + (s.rombel || 0), 0);
                const totalTendik = list.reduce((acc, s) => acc + (s.jmlTendik || 0), 0);
                const totalLab = list.reduce((acc, s) => acc + (s.jmlLab || 0), 0);
                const totalPerpus = list.reduce((acc, s) => acc + (s.jmlPerpus || 0), 0);

                const jenjangGroups = [
                  { key: 'SD', label: 'Sekolah Dasar (SD/SDLB)', color: '#EF4444', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', items: list.filter((s) => s.bentuk.toUpperCase().includes('SD')) },
                  { key: 'SMP', label: 'Sekolah Menengah Pertama (SMP/SMPLB)', color: '#3B82F6', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', items: list.filter((s) => s.bentuk.toUpperCase().includes('SMP')) },
                  { key: 'SMA', label: 'Sekolah Menengah Atas (SMA/SMK/SMLB)', color: '#10B981', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', items: list.filter((s) => s.bentuk.toUpperCase().includes('SMA') || s.bentuk.toUpperCase().includes('SMK')) },
                  { key: 'SLB', label: 'Sekolah Luar Biasa (SLB)', color: '#8B5CF6', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', items: list.filter((s) => s.bentuk.toUpperCase() === 'SLB') },
                  { key: 'SPK', label: 'Sekolah SPK', color: '#F59E0B', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', items: list.filter((s) => s.bentuk.toUpperCase().includes('SPK')) },
                ].filter((g) => g.items.length > 0);

                const knownKeys = ['SD', 'SMP', 'SMA', 'SMK', 'SLB', 'SPK'];
                const others = list.filter((s) => !knownKeys.some((k) => s.bentuk.toUpperCase().includes(k)));
                if (others.length > 0) {
                  jenjangGroups.push({ key: 'LAIN', label: 'Sekolah Lainnya', color: '#64748B', bgColor: 'bg-slate-50', borderColor: 'border-slate-200', items: others });
                }

                return (
                  <div className="pt-3 border-t border-emerald-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-500/10 border border-amber-300/80 p-2.5 rounded-xl">
                      <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                        <School className="w-4 h-4 text-amber-700" />
                        <span>🏫 Rincian Sekolah Terdampak Dapodik ({list.length} Lokasi):</span>
                      </span>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-amber-900 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200">👨‍🏫 {totalGuru.toLocaleString('id')} Guru</span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200">📐 {totalRombel.toLocaleString('id')} Rombel</span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200">📋 {totalTendik.toLocaleString('id')} Tendik</span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200">🔬 {totalLab.toLocaleString('id')} Lab</span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-amber-200">📚 {totalPerpus.toLocaleString('id')} Perpus</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {jenjangGroups.map((group) => (
                        <div key={group.key} className={`p-3 rounded-xl border ${group.bgColor} ${group.borderColor} space-y-1.5`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: group.color }}>
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: group.color }} />
                              <span>{group.label} ({group.items.length} Sekolah)</span>
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              Total Guru: {group.items.reduce((a, s) => a + (s.jmlGuru || 0), 0)} | Rombel: {group.items.reduce((a, s) => a + (s.rombel || 0), 0)} | Lab: {group.items.reduce((a, s) => a + (s.jmlLab || 0), 0)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                            {group.items.map((s, idx) => (
                              <div key={idx} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs space-y-1">
                                <div className="font-bold text-slate-800 flex items-center justify-between gap-2">
                                  <span>{s.nama}</span>
                                  {s.status && (
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${s.status === 'Negeri' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                                      {s.status}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                                  <span>👨‍🏫 {s.jmlGuru || 0} Guru</span>
                                  <span>📐 {s.rombel || 0} Rombel</span>
                                  <span>📋 {s.jmlTendik || 0} Tendik</span>
                                  <span>🔬 {s.jmlLab || 0} Lab</span>
                                  <span>📚 {s.jmlPerpus || 0} Perpus</span>
                                  {s.kecamatan && <span className="text-slate-400">📍 {s.kecamatan}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
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
            <span className="font-bold text-xs text-[#19506e] tracking-wide uppercase">⚙️ Variable Estimasi & Parameter Infrastruktur</span>
            <span className="text-[10px] bg-[#1f8080]/10 text-[#1f8080] font-semibold px-2 py-0.5 rounded-md border border-[#1f8080]/20">
              Populasi {populasi.toLocaleString('id')} Jiwa • Dampak Fisik {estimasiKerusakanPct}% ({totalSiswaTerdampak.toLocaleString('id')} siswa)
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
                <label className="text-[11px] font-bold text-[#19506e] uppercase tracking-wider">Tingkat Risiko Dampak Fisik (%)</label>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal(PARAM_INFOS.kerusakan)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Informasi Metodologi Dampak Fisik"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={estimasiKerusakanPct}
                onChange={(e) => setEstimasiKerusakanPct(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                <span>Hasil Estimasi Siswa:</span>
                <span className="font-extrabold text-[#19506e] bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
                  = {totalSiswaTerdampak.toLocaleString('id')} Siswa
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-center space-y-1">
              <span className="text-[11px] font-bold text-slate-500">Estimasi Siswa Usia Sekolah:</span>
              <div className="flex flex-col gap-1 text-xs font-bold text-[#19506e]">
                <span>🎒 PAUD/SD: {(totalBalitaPAUD + siswaSD).toLocaleString('id')} anak</span>
                <span>🎓 SMP/SMA: {(siswaSMP + siswaSMA).toLocaleString('id')} anak</span>
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
