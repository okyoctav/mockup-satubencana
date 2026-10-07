'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Database,
  ChevronRight,
} from 'lucide-react';

const HeroCanvas = dynamic(() => import('@/components/three/HeroCanvas'), {
  ssr: false,
});

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
              LEFT PANEL (30% Width - Col 1-3): Executive Title & Simplified Phases
              ============================================================ */}
          <div
            className="lg:col-span-3 rounded-3xl border p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4 transition-all duration-300"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-faint)',
            }}
          >
            {/* Title & Description */}
            <div className="space-y-1.5">
              <h1
                className="text-xl sm:text-2xl font-black tracking-tight leading-[1.2]"
                style={{
                  background: 'linear-gradient(135deg, #E11D48 0%, #EA580C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Manajemen Data Bencana
              </h1>
              <p
                className="text-xs font-medium leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Sistem informasi data terintegrasi untuk perencanaan pembangunan yang tangguh dan responsif.
              </p>
            </div>

            {/* Siklus Penanggulangan Bencana - Teks Informasi Terpadu (Tanpa Border Card) */}
            <div className="flex-1 flex flex-col justify-between py-1 min-h-0 space-y-3.5 select-none">
              
              <div className="pt-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Siklus Penanggulangan Bencana
                </span>
              </div>

              {/* FASE 01: PRABENCANA */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Fase 01 · Prabencana
                  </span>
                </div>
                <div className="pl-4 space-y-0.5">
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100">
                    Mitigasi & Kesiapsiagaan
                  </h3>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Pemodelan risiko ancaman bencana, mitigasi, kesiapsiagaan, dan sistem peringatan dini.
                  </p>
                </div>
              </div>

              {/* FASE 02: TANGGAP DARURAT */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Fase 02 · Tanggap Darurat
                  </span>
                </div>
                <div className="pl-4 space-y-0.5">
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100">
                    Kaji Cepat Dampak Bencana
                  </h3>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Pengkajian cepat dan tepat terhadap lokasi, kerusakan, serta orkestrasi respons tanggap darurat.
                  </p>
                </div>
              </div>

              {/* FASE 03: PASCABENCANA */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    Fase 03 · Pascabencana
                  </span>
                </div>
                <div className="pl-4 space-y-0.5">
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100">
                    Rehabilitasi & Rekonstruksi
                  </h3>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Perencanaan pemulihan terpadu dengan prinsip Build Back Better, Safer, and Sustainable.
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* ============================================================
              RIGHT PANEL (70% Width - Col 4-10): Akses Cepat, 2 Cards, and 300px Dashboard
              ============================================================ */}
          <div
            className="lg:col-span-7 rounded-3xl border p-5 sm:p-7 shadow-xs flex flex-col justify-between gap-5 transition-all duration-300"
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
                  Pilih jalur informasi sesuai kebutuhan Anda.
                </p>
              </div>

              {/* Status Badge: Sistem Aktif */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sistem Aktif</span>
              </div>
            </div>

            {/* 2 Cards: Sejarah Kebencanaan & Data Kebencanaan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Card 1: Sejarah Kebencanaan */}
              <Link
                href="/sejarah-kebencanaan"
                className="group relative rounded-2xl p-4 border transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-faint)',
                  minHeight: '135px',
                }}
              >
                <div className="space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">
                    <Bookmark className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      Sejarah Kebencanaan
                    </h3>
                    <p className="text-[11px] leading-relaxed line-clamp-2 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Telusuri kronologi dan rekam jejak kejadian bencana.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dashed border-slate-200/80 dark:border-slate-800 mt-2">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Eksplorasi Riwayat
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-[#194f70] group-hover:text-white group-hover:border-[#194f70] flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:scale-105">
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>

              {/* Card 2: Data Kebencanaan */}
              <Link
                href="/analisis-data"
                className="group relative rounded-2xl p-4 border transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-faint)',
                  minHeight: '135px',
                }}
              >
                <div className="space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-sky-500 transition-colors">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      Data Kebencanaan
                    </h3>
                    <p className="text-[11px] leading-relaxed line-clamp-2 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Akses data, indikator, dan informasi kebencanaan terintegrasi.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dashed border-slate-200/80 dark:border-slate-800 mt-2">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    Buka Basis Data
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-[#194f70] group-hover:text-white group-hover:border-[#194f70] flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:scale-105">
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>

            </div>

            {/* Large Card Below: Impact Assessment Dashboard with 300px Height & Cover /images/PETA2.png */}
            <div
              className="group relative rounded-2xl overflow-hidden border border-slate-800/80 shadow-lg transition-all duration-300 hover:shadow-2xl flex flex-col justify-between"
              style={{
                height: '300px',
                minHeight: '300px',
              }}
            >
              {/* Background Image: /images/PETA2.png */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: 'url(/images/PETA2.png)',
                }}
              />
              
              {/* Dark Gradient Overlay for Maximum Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40" />

              {/* Card Content */}
              <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2.5 max-w-sm">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-[9.5px] font-extrabold text-slate-200 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span>ANALISIS & PENGAMBILAN KEPUTUSAN</span>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Impact Assessment Dashboard
                  </h3>
                  
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Visualisasikan dampak bencana dan dukung penilaian cepat untuk perencanaan respons serta pemulihan.
                  </p>
                </div>

                <div>
                  <Link
                    href="/dashboard_k5"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm shadow-md transition-all duration-200 hover:scale-105 active:scale-95 group/btn"
                  >
                    <span>Buka Dashboard</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Decorative Bar Graphic in Right Area as in Wireframe */}
              <div className="absolute right-6 bottom-7 hidden sm:flex items-end gap-2 pointer-events-none opacity-85 z-10">
                <div className="w-3.5 h-14 rounded-t-md bg-white/60 backdrop-blur-xs shadow-xs" />
                <div className="w-3.5 h-24 rounded-t-md bg-white/80 backdrop-blur-xs shadow-sm" />
                <div className="w-3.5 h-32 rounded-t-md bg-white backdrop-blur-xs shadow-md" />
                <div className="w-3.5 h-20 rounded-t-md bg-white/70 backdrop-blur-xs shadow-xs" />
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
