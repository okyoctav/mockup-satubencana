'use client';

import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  HelpCircle,
  Layers,
  PackageCheck,
  HeartPulse,
  School,
  Sprout,
  Zap,
  Truck,
  Sparkles,
  Activity,
  ShieldAlert,
  Database
} from 'lucide-react';

interface DashboardIntroModalProps {
  isOpen: boolean;
  onCloseTemporarily: () => void;
  onDismissPermanently: () => void;
}

export default function DashboardIntroModal({
  isOpen,
  onCloseTemporarily,
  onDismissPermanently
}: DashboardIntroModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseTemporarily();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onCloseTemporarily]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-all duration-300"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* ============================================================
            1. MODAL HEADER (BAPPENAS TEAL-BLUE GRADIENT)
            ============================================================ */}
        <div
          className="text-white px-5 sm:px-6 py-4.5 border-b border-[#00695c] flex items-center justify-between gap-4 shrink-0 shadow-md"
          style={{
            background: 'linear-gradient(135deg, rgb(25, 79, 112), rgb(15, 55, 80))'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-800/90 text-teal-100 border border-teal-600 font-extrabold tracking-wider uppercase">
                  Panduan Sistem · SatuBencana Bappenas
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold">
                  Versi Terpadu K5
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Mengenal Dashboard Manajemen Data Bencana (MDB)
              </h2>
            </div>
          </div>

          {/* Quick Close (Temporary) */}
          <button
            onClick={onCloseTemporarily}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors border border-white/20 shrink-0 cursor-pointer"
            title="Tutup sementara (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================
            2. SCROLLABLE CONTENT BODY
            ============================================================ */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
          
          {/* QUESTION 1: UNTUK APA SIH DASHBOARD INI? */}
          <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/40 dark:from-slate-800/60 dark:to-teal-950/20 border border-teal-500/20 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#0a1e36] dark:text-teal-300">
              <div className="w-7 h-7 rounded-lg bg-[#00695c] text-white flex items-center justify-center shrink-0 shadow-xs">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-black tracking-tight">
                Untuk apa sih Dashboard MDB ini?
              </h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs sm:text-[13px]">
              Dashboard <strong>Manajemen Data Bencana (MDB)</strong> adalah platform komando geospasial terintegrasi yang dikembangkan untuk 
              <strong> mempercepat pengambilan keputusan, pemodelan skenario kontinjensi, dan orkestrasi respon tanggap darurat kebencanaan</strong> di seluruh Indonesia.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300 text-xs">
                  <Database className="w-3.5 h-3.5" />
                  <span>Satu Data Multi-Sektor</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Mengintegrasikan data historis DIBI BNPB, peringatan dini BMKG/PVMBG, titik panas NASA FIRMS, hingga batas administrasi resmi BAPPENAS 50K 2023.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300 text-xs">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Estimasi Dampak Cepat</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Mengalkulasi secara otomatis sebaran korban jiwa, pengungsi, rumah terendam/rusak, sekolah terdampak, serta infrastruktur kritis secara presisi.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-xs">
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Kesiapsiagaan Aksi Nyata</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Menghitung kebutuhan logistik riil (tenda, beras, air), kesiagaan rumah sakit darurat, dan rute evakuasi/distribusi bantuan yang bebas rintangan.
                </p>
              </div>
            </div>
          </section>

          {/* QUESTION 2: DAPAT APA SAJA DI DASHBOARD MDB INI? */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0a1e36] dark:text-teal-300">
              <div className="w-7 h-7 rounded-lg bg-[#194f70] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-black tracking-tight">
                Dapat apa saja di Dashboard MDB ini?
              </h3>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Dashboard ini menyediakan modul visualisasi dan analisis komprehensif yang siap digunakan langsung:
            </p>

            {/* Grid of Capabilities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              
              {/* Feature 1: Peta Spasial WMS */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-teal-500/50 transition-all flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Peta Spasial & WMS BAPPENAS</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Batas wilayah administrasi 50K resmi GeoServer BAPPENAS, radius bahaya gempa/vulkanik, dan citra satelit resolusi tinggi.
                  </p>
                </div>
              </div>

              {/* Feature 2: Simulasi 9 Bencana */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-500/50 transition-all flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Skenario 9 Jenis Bencana</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Simulasi terpilah untuk Banjir, Longsor, Cuaca Ekstrem, Gempabumi, Erupsi, Tsunami, Karhutla, Kekeringan, dan Abrasi.
                  </p>
                </div>
              </div>

              {/* Feature 3: Analisis Logistik */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-500/50 transition-all flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Kalkulator Logistik Pengungsi</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Perhitungan otomatis kebutuhan beras (ton), air bersih (liter), tenda keluarga, selimut, dan kapasitas posko darurat.
                  </p>
                </div>
              </div>

              {/* Feature 4: Medis & Faskes */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-rose-500/50 transition-all flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-600/10 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Kesiapsiagaan Medis & Faskes</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Pemetaan rumah sakit terdekat, ketersediaan tempat tidur gawat darurat, dan kebutuhan nakes lapangan.
                  </p>
                </div>
              </div>

              {/* Feature 5: Fasum & Pendidikan */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-amber-500/50 transition-all flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-600/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Fasum & Sekolah (Dapodik)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Deteksi bangunan sekolah, tempat ibadah, kantor pemerintahan, dan jembatan penghubung yang mengalami kerusakan.
                  </p>
                </div>
              </div>

              {/* Feature 6: Ekonomi & Pertanian */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-green-500/50 transition-all flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-green-600/10 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Kerugian Ekonomi & Lahan</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Estimasi kerusakan hektar sawah, kebun produktif, serta estimasi kerugian finansial (Rp) per wilayah otonom.
                  </p>
                </div>
              </div>

              {/* Feature 7: Energi & Utilitas */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-amber-500/50 transition-all flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-600/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Energi & Utilitas Kritis</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Pemantauan gardu distribusi PLN, jaringan transmisi listrik, pipa PDAM, dan BTS seluler darurat.
                  </p>
                </div>
              </div>

              {/* Feature 8: Rute & Aksesibilitas */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-sky-500/50 transition-all flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-600/10 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Rute Evakuasi & Jalur Logistik</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Penentuan jalur darat aman untuk konvoi truk bantuan dan penandaan titik jalan terputus akibat longsor/banjir.
                  </p>
                </div>
              </div>

              {/* Feature 9: CAKNA AI Assistant */}
              <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-purple-50/60 dark:bg-purple-950/20 hover:border-purple-500/50 transition-all flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-purple-900 dark:text-purple-300">CAKNA AI (Asisten Analitis)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Penyusunan ringkasan situasi darurat otomatis (*Situation Report*) dan rekomendasi prioritas tanggap darurat berbasis AI.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* QUICK START: 3 LANGKAH MUDAH */}
          <section className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>🚀 3 Langkah Mudah Menggunakan Dashboard:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#194f70] text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <span>Pilih <strong>Wilayah</strong> di dropdown atas (Provinsi/Kab-Kota).</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#194f70] text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <span>Pilih <strong>Jenis Bencana</strong> di bilah No. 1.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#194f70] text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <span>Buka <strong>Tab Modul</strong> untuk melihat logistik, medis, fasum, dsb.</span>
              </div>
            </div>
          </section>

        </div>

        {/* ============================================================
            3. MODAL ACTION FOOTER (2 BUTTONS SPECIFIED BY USER)
            ============================================================ */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 font-medium text-center sm:text-left">
            <span>Pilihan Anda dapat dibuka kembali kapan saja via tombol </span>
            <span className="font-bold text-teal-700 dark:text-teal-400">&ldquo;Panduan Dashboard&rdquo;</span>
            <span> di bagian atas.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* BUTTON 2: HANYA CLOSE (AKAN MUNCUL KEMBALI SAAT BUKA HALAMAN) */}
            <button
              type="button"
              onClick={onCloseTemporarily}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Tutup sekarang (akan muncul lagi saat halaman dibuka kembali)"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Tutup Sementara</span>
            </button>

            {/* BUTTON 1: SUDAH PAHAM (TIDAK AKAN MUNCUL LAGI) */}
            <button
              type="button"
              onClick={onDismissPermanently}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#00695c] hover:bg-[#004d40] text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              title="Saya sudah paham dan jangan tampilkan modal ini lagi"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-200" />
              <span>Paham, Jangan Tampilkan Lagi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
