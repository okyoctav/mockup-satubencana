'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Database,
  ChevronRight,
  Shield,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { DEFAULT_DASHBOARD_PATH } from '@/lib/routes';

const HeroCanvas = dynamic(() => import('@/components/three/HeroCanvas'), {
  ssr: false,
});

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [activePhase, setActivePhase] = useState<number>(2); // Default to Fase 2 (Tanggap Darurat / Kaji Cepat)
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const phaseData = [
    {
      id: 1,
      badge: 'Fase 01 · Prabencana',
      title: 'Mitigasi & Kesiapsiagaan',
      desc: 'Pemodelan risiko ancaman bencana, mitigasi, kesiapsiagaan, dan sistem peringatan dini.',
      color: 'rgb(11, 127, 85)',
      lightBg: 'rgba(11, 127, 85, 0.08)',
      borderColor: 'rgba(11, 127, 85, 0.25)',
      tools: 'Simulasi Luapan Sungai & Radius Gunung Api',
      link: '/simulasi-modeling',
      icon: Shield,
    },
    {
      id: 2,
      badge: 'Fase 02 · Tanggap Darurat',
      title: 'Kaji Cepat Dampak Bencana',
      desc: 'Pengkajian cepat dan tepat terhadap lokasi, kerusakan, serta orkestrasi respons tanggap darurat.',
      color: 'rgb(205, 130, 3)',
      lightBg: 'rgba(205, 130, 3, 0.08)',
      borderColor: 'rgba(205, 130, 3, 0.25)',
      tools: 'Estimasi Jiwa, Kelompok Rentan, & Hak Tanah',
      link: DEFAULT_DASHBOARD_PATH,
      icon: Zap,
    },
    {
      id: 3,
      badge: 'Fase 03 · Pascabencana',
      title: 'Rehabilitasi & Rekonstruksi',
      desc: 'Perencanaan pemulihan terpadu dengan prinsip Build Back Better, Safer, and Sustainable.',
      color: 'rgb(9, 153, 216)',
      lightBg: 'rgba(9, 153, 216, 0.08)',
      borderColor: 'rgba(9, 153, 216, 0.25)',
      tools: 'Arsip Sejarah & Rekam Jejak Pemulihan',
      link: '/sejarah-kebencanaan',
      icon: RotateCcw,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative flex-1 w-full min-h-[calc(100vh-58px)] overflow-hidden select-none flex items-center justify-center py-4 sm:py-6"
      style={{ background: 'var(--hero-bg)' }}
    >
      {/* Dynamic Three.js Particle Field */}
      {mounted && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <HeroCanvas />
        </div>
      )}

      {/* Subtle radial ambient glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle 600px at 70% 50%, rgba(14,165,233,0.06), transparent 80%), radial-gradient(circle 500px at 20% 60%, rgba(34,197,94,0.05), transparent 70%)',
        }}
      />

      {/* Main Container - Balanced Side-by-Side Wireframe Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 lg:gap-6 items-stretch">
          
          {/* ============================================================
              LEFT PANEL (30% Width - Col 1-3): Executive Title & Interactive Phases
              ============================================================ */}
          <div
            className="lg:col-span-3 rounded-3xl border p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4 transition-all duration-300 backdrop-blur-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-faint)',
            }}
          >
            <div className="space-y-4">
              {/* Top Institutional Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>SATU DATA BENCANA NASIONAL</span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h1
                  className="text-xl sm:text-2xl font-black tracking-tight leading-[1.2]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Manajemen Data Bencana
                </h1>
                <p
                  className="text-xs font-medium leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Sistem informasi data geospasial terintegrasi untuk perencanaan pembangunan wilayah yang tangguh dan responsif.
                </p>
              </div>

              {/* Siklus Penanggulangan Bencana - Interactive Phase Cards */}
              <div className="space-y-2 pt-1 select-none">
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Siklus Penanggulangan Bencana
                  </span>
                  <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
                    Pilih Fase
                  </span>
                </div>

                {phaseData.map((phase) => {
                  const isSelected = activePhase === phase.id;
                  return (
                    <div
                      key={phase.id}
                      onClick={() => setActivePhase(phase.id)}
                      className={`rounded-2xl p-2.5 transition-all duration-200 cursor-pointer border ${
                        isSelected
                          ? 'border-slate-300 dark:border-slate-700 shadow-2xs'
                          : 'border-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                      style={{
                        backgroundColor: isSelected ? phase.lightBg : 'transparent',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: phase.color }}
                          />
                          <span
                            className="text-[10.5px] font-black uppercase tracking-wider"
                            style={{ color: phase.color }}
                          >
                            {phase.badge}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-3xs">
                            Aktif
                          </span>
                        )}
                      </div>

                      <div className="pl-4 space-y-0.5 mt-1">
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100">
                          {phase.title}
                        </h3>
                        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {phase.desc}
                        </p>
                      </div>

                      {/* Tool Preview on Active Phase */}
                      {isSelected && (
                        <div className="mt-2 pl-4 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          <span className="truncate pr-1">{phase.tools}</span>
                          <Link
                            href={phase.link}
                            className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline shrink-0 font-bold"
                          >
                            <span>Buka</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Footer in Left Panel */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <Link
                href="/informasi-mitra"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Pelajari Metodologi</span>
              </Link>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                v1.2 Dev
              </span>
            </div>

          </div>

          {/* ============================================================
              RIGHT PANEL (70% Width - Col 4-10): Akses Cepat, 2 Cards, and 300px Dashboard
              ============================================================ */}
          <div
            className="lg:col-span-7 rounded-3xl border p-5 sm:p-7 shadow-xs flex flex-col justify-between gap-5 transition-all duration-300 backdrop-blur-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-faint)',
            }}
          >
            {/* Header: Akses Cepat + Sistem Aktif Status */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Akses Cepat
                </h2>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Pilih jalur informasi dan analisis sesuai mandat operasional Anda.
                </p>
              </div>

              {/* Status Badge: Sistem Aktif */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sistem Aktif & Sinkron</span>
              </div>
            </div>

            {/* 2 Cards: Sejarah Kebencanaan & Data Kebencanaan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              
              {/* Card 1: Sejarah Kebencanaan */}
              <Link
                href="/sejarah-kebencanaan"
                className="group relative border border-slate-200/90 rounded-[30px] p-6 sm:p-7 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[220px] sm:min-h-[240px] cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                style={{
                  background: 'linear-gradient(to top, #eafaf1 0%, #ffffff 70%)',
                }}
              >
                {/* Bagian Kanan: Ilustrasi Sejarah Kebencanaan */}
                <div className="absolute right-0 top-0 bottom-0 w-[48%] sm:w-[50%] pointer-events-none flex items-center justify-end overflow-hidden pr-2 sm:pr-4">
                  <img
                    src="/sejarah.png"
                    alt="Ilustrasi Sejarah Kebencanaan"
                    className="max-h-[175px] sm:max-h-[195px] w-auto max-w-full object-contain object-right group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Bagian Kiri: Teks & Tombol Aksi */}
                <div className="relative z-10 flex flex-col justify-between h-full max-w-[52%] sm:max-w-[50%] space-y-4">
                  <div className="space-y-3">
                    {/* Sudut kiri atas: Ikon Badge */}
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#eafaf1] border border-[#d2f4e2] flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs group-hover:bg-[#dff6e8] transition-colors">
                      <BookOpen className="w-6.5 h-6.5 sm:w-7 sm:h-7 stroke-[2.2]" />
                    </div>

                    {/* Judul utama & deskripsi singkat */}
                    <div className="space-y-1">
                      <h3 className="text-lg sm:text-xl font-black tracking-tight text-[#0a2540] leading-tight">
                        Sejarah Kebencanaan
                      </h3>
                      <p className="text-xs sm:text-[13px] font-medium text-slate-500 leading-relaxed">
                        Telusuri kronologi dan rekam jejak<br className="hidden sm:inline" /> kejadian bencana.
                      </p>
                    </div>
                  </div>

                  {/* Paling bawah: Teks aksi & Chevron */}
                  <div className="pt-3 border-t border-slate-200/80">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xs sm:text-[13px] font-black tracking-tight text-[#0a2540] group-hover:text-emerald-700 transition-colors">
                        Eksplorasi Riwayat
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#e2f7ed] text-[#0b7f55] flex items-center justify-center shadow-2xs group-hover:bg-[#d2f4e2] group-hover:translate-x-1 transition-all">
                        <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.8]" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Card 2: Data Kebencanaan */}
              <Link
                href="/analisis-data"
                className="group relative border border-slate-200/90 rounded-[30px] p-6 sm:p-7 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[220px] sm:min-h-[240px] cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                style={{
                  background: 'linear-gradient(to top, #e9f4fd 0%, #ffffff 70%)',
                }}
              >
                {/* Bagian Kanan: Ilustrasi Data Kebencanaan */}
                <div className="absolute right-0 top-0 bottom-0 w-[48%] sm:w-[50%] pointer-events-none flex items-center justify-end overflow-hidden pr-2 sm:pr-4">
                  <img
                    src="/datakebencanaan.png"
                    alt="Ilustrasi Basis Data Kebencanaan"
                    className="max-h-[175px] sm:max-h-[195px] w-auto max-w-full object-contain object-right group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Bagian Kiri: Teks & Tombol Aksi */}
                <div className="relative z-10 flex flex-col justify-between h-full max-w-[52%] sm:max-w-[50%] space-y-4">
                  <div className="space-y-3">
                    {/* Sudut kiri atas: Ikon Badge */}
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#eef6ff] border border-[#d9ebff] flex items-center justify-center text-blue-600 shrink-0 shadow-2xs group-hover:bg-[#e2efff] transition-colors">
                      <Database className="w-6.5 h-6.5 sm:w-7 sm:h-7 stroke-[2.2]" />
                    </div>

                    {/* Judul utama & deskripsi singkat */}
                    <div className="space-y-1">
                      <h3 className="text-lg sm:text-xl font-black tracking-tight text-[#0a2540] leading-tight">
                        Data Kebencanaan
                      </h3>
                      <p className="text-xs sm:text-[13px] font-medium text-slate-500 leading-relaxed">
                        Akses data, indikator, dan informasi<br className="hidden sm:inline" /> kebencanaan terintegrasi.
                      </p>
                    </div>
                  </div>

                  {/* Paling bawah: Teks aksi & Chevron */}
                  <div className="pt-3 border-t border-slate-200/80">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xs sm:text-[13px] font-black tracking-tight text-[#0a2540] group-hover:text-blue-700 transition-colors">
                        Buka Basis Data
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#dee8fb] text-[#1d70f5] flex items-center justify-center shadow-2xs group-hover:bg-[#d0e0fb] group-hover:translate-x-1 transition-all">
                        <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.8]" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

            </div>

            {/* Featured Impact Assessment Dashboard Card (300px Height) */}
            <div
              className="group relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
              style={{
                height: '300px',
                minHeight: '300px',
              }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: 'url(/images/backgroundaseesment.png)',
                }}
              />
              
              {/* Soft Gradient Overlay for Text Readability & Contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none" />

              {/* Card Content */}
              <div className="relative z-10 p-5 sm:p-7 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2.5 max-w-md">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-extrabold text-slate-200 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>ANALISIS & PENGAMBILAN KEPUTUSAN SPASIAL</span>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                    Impact Assessment Dashboard
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Visualisasikan dampak bencana, agregasi jiwa terdampak, kelompok rentan balita/lansia, serta hak atas tanah ATR/BPN untuk respons cepat.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={DEFAULT_DASHBOARD_PATH}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm shadow-md transition-all duration-200 hover:scale-102 active:scale-98 group/btn cursor-pointer"
                  >
                    <span>Buka Dashboard Utama</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>

                  <Link
                    href="/simulasi-modeling"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white border border-white/20 font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer"
                  >
                    <span>Simulasi Dampak</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
