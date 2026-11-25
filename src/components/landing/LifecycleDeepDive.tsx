'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Zap,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

interface PhaseDetail {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  colorHex: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  icon: typeof Shield;
  highlights: string[];
  keyTools: { title: string; desc: string }[];
  ctaLabel: string;
  ctaHref: string;
}

const PHASES: PhaseDetail[] = [
  {
    id: 'prabencana',
    number: '01',
    name: 'Prabencana',
    subtitle: 'Mitigasi & Kesiapsiagaan',
    description:
      'Penyusunan baseline data risiko, pemodelan ancaman bahaya, serta kesiapsiagaan sistem peringatan dini sebelum peristiwa bencana terjadi.',
    colorHex: '#059669',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-900/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
    icon: Shield,
    highlights: [
      'Pemodelan spasial bahaya banjir, longsor, dan erupsi',
      'Integrasi peringatan dini BMKG & pos magma PVMBG',
      'Penyusunan peta zona rawan dan jalur evakuasi mandiri',
    ],
    keyTools: [
      { title: 'Simulasi Luapan Sungai', desc: 'Skenario ketinggian genangan air di bantaran Bengawan Solo.' },
      { title: 'Buffer Radius Gunung Api', desc: 'Pemetaan Kawasan Rawan Bencana (KRB) I, II, dan III.' },
      { title: 'Analisis Fasilitas Publik', desc: 'Inventarisasi keterpaparan gedung sekolah Dapodik.' },
    ],
    ctaLabel: 'Eksplorasi Skenario Prabencana',
    ctaHref: '/simulasi-modeling',
  },
  {
    id: 'tanggap-darurat',
    number: '02',
    name: 'Tanggap Darurat',
    subtitle: 'Kaji Cepat & Respons Terpadu',
    description:
      'Pengkajian cepat sesaat setelah bencana terjadi untuk memetakan luas cakupan wilayah, estimasi korban, dan orkestrasi bantuan darurat secara presisi.',
    colorHex: '#D97706',
    accentBg: 'bg-amber-50 dark:bg-amber-950/40',
    accentBorder: 'border-amber-200 dark:border-amber-900/60',
    accentText: 'text-amber-700 dark:text-amber-400',
    icon: Zap,
    highlights: [
      'Estimasi cepat total jiwa dan kepala keluarga terdampak',
      'Pemilahan demografi kelompok rentan (anak & lansia)',
      'Sensor masking nama korban untuk perlindungan privasi',
    ],
    keyTools: [
      { title: 'Polygon Rapid Assessment', desc: 'Tarik area seleksi polygon untuk agregasi data seketika.' },
      { title: 'Geotagging Bitung MVT', desc: 'Visualisasi titik koordinat korban dan kerusakan real-time.' },
      { title: 'Katalog DIBI BNPB', desc: 'Rekapitulasi peristiwa bencana multi-kategori se-Indonesia.' },
    ],
    ctaLabel: 'Buka Dashboard Kaji Cepat',
    ctaHref: '/dashboard',
  },
  {
    id: 'pascabencana',
    number: '03',
    name: 'Pascabencana',
    subtitle: 'Rehabilitasi & Rekonstruksi',
    description:
      'Perencanaan pemulihan terpadu berbasis bukti dengan prinsip Build Back Better, Safer, and Sustainable menuju ketangguhan wilayah jangka panjang.',
    colorHex: '#2563EB',
    accentBg: 'bg-blue-50 dark:bg-blue-950/40',
    accentBorder: 'border-blue-200 dark:border-blue-900/60',
    accentText: 'text-blue-700 dark:text-blue-400',
    icon: RotateCcw,
    highlights: [
      'Sinkronisasi status hak atas tanah (ATR/BPN)',
      'Penilaian kebutuhan pascabencana (JITU PASCA / DaLA)',
      'Arsip rekam jejak dan kronologi pemulihan wilayah',
    ],
    keyTools: [
      { title: 'Verifikasi Kepemilikan Lahan', desc: 'Validasi batas bidang tanah untuk relokasi dan ganti rugi.' },
      { title: 'Sejarah & Dokumentasi', desc: 'Basis pengetahuan pembelajaran dari bencana masa lampau.' },
      { title: 'Monitoring Progres R3P', desc: 'Pelacakan rencana aksi rehabilitasi dan rekonstruksi fisik.' },
    ],
    ctaLabel: 'Lihat Arsip & Rekam Jejak',
    ctaHref: '/sejarah-kebencanaan',
  },
];

export default function LifecycleDeepDive() {
  const [activeTab, setActiveTab] = useState('tanggap-darurat');
  const current = PHASES.find((p) => p.id === activeTab) || PHASES[1];
  const CurrentIcon = current.icon;

  return (
    <section className="relative w-full py-16 sm:py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black tracking-wider uppercase">
            <span>SIKLUS MANAJEMEN BENCANA TERPADU</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Tiga Fase Orkestrasi Data Penanggulangan Bencana
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Menyajikan rantai nilai data yang berkesinambungan dari sebelum, saat terjadi, hingga pemulihan pascabencana.
          </p>
        </div>

        {/* Phase Pill Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {PHASES.map((phase) => {
            const Icon = phase.icon;
            const isSelected = activeTab === phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => setActiveTab(phase.id)}
                type="button"
                className={`inline-flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? `${phase.accentBg} ${phase.accentText} border-2 ${phase.accentBorder} shadow-sm scale-102`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>Fase {phase.number} · {phase.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Detailed Phase View */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (5 Cols): Phase Identity & Highlights */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${current.accentBg} ${current.accentBorder} border flex items-center justify-center ${current.accentText} shadow-2xs`}>
                  <CurrentIcon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <span className={`text-xs font-black uppercase tracking-wider ${current.accentText}`}>
                    Fase {current.number} · {current.subtitle}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    {current.name}
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {current.description}
              </p>

              {/* Highlights List */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Kemampuan Analisis Kunci:
                </span>
                {current.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <CheckCircle2 className={`w-4 h-4 ${current.accentText} shrink-0 mt-0.5`} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Direct Action Link */}
              <div className="pt-3">
                <Link
                  href={current.ctaHref}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer`}
                  style={{ backgroundColor: current.colorHex }}
                >
                  <span>{current.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Column (7 Cols): Specific Tools Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {current.keyTools.map((tool, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-5 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-black text-xs">
                      {idx + 1}
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug">
                      {tool.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Siap Digunakan</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
