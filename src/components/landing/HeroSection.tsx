'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
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
            className="lg:col-span-3 rounded-3xl border p-5 sm:p-6 shadow-xs flex flex-col justify-start gap-4 transition-all duration-300"
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

            {/* Siklus Penanggulangan Bencana - Teks Informasi Rapat ke Atas */}
            <div className="space-y-3 pt-1 select-none">
              
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

            {/* 2 Cards: Sejarah Kebencanaan & Data Kebencanaan (Sesuai Referensi Screenshot 2026-10-11 at 15.53.44.png) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              
              {/* Card 1: Sejarah Kebencanaan */}
              <Link
                href="/sejarah-kebencanaan"
                className="group relative bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[220px] sm:min-h-[240px]"
              >
                {/* Ilustrasi Gambar Sejarah di Sisi Kanan */}
                <div className="absolute -right-2 -bottom-2 top-0 w-[55%] sm:w-[58%] pointer-events-none flex items-end justify-end overflow-hidden">
                  <img
                    src="/sejarah.png"
                    alt="Sejarah Kebencanaan"
                    className="w-full h-full object-contain object-right-bottom group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Konten Sisi Kiri */}
                <div className="relative z-10 space-y-3 max-w-[55%] sm:max-w-[58%]">
                  {/* Icon Badge Green */}
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/90 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:bg-emerald-100/80 transition-colors">
                    <BookOpen className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-[26px] font-black tracking-tight text-[#0a2540] leading-[1.15]">
                      Sejarah<br />Kebencanaan
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                      Telusuri kronologi dan rekam jejak kejadian bencana.
                    </p>
                  </div>
                </div>

                {/* CTA Action: Link teks underline + Panah lingkaran */}
                <div className="relative z-10 flex items-center gap-3 pt-4 mt-2">
                  <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-[#0a2540] border-b-2 border-[#0a2540] pb-0.5 group-hover:text-emerald-700 group-hover:border-emerald-700 transition-colors">
                    Eksplorasi Riwayat
                  </span>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#0a2540] group-hover:border-[#0a2540] group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                  </div>
                </div>
              </Link>

              {/* Card 2: Data Kebencanaan */}
              <Link
                href="/analisis-data"
                className="group relative bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden min-h-[220px] sm:min-h-[240px]"
              >
                {/* Ilustrasi Gambar Data Kebencanaan di Sisi Kanan */}
                <div className="absolute -right-2 -bottom-2 top-0 w-[55%] sm:w-[58%] pointer-events-none flex items-end justify-end overflow-hidden">
                  <img
                    src="/datakebencanaan.png"
                    alt="Data Kebencanaan"
                    className="w-full h-full object-contain object-right-bottom group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Konten Sisi Kiri */}
                <div className="relative z-10 space-y-3 max-w-[55%] sm:max-w-[58%]">
                  {/* Icon Badge Blue */}
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/90 flex items-center justify-center text-blue-600 shadow-2xs group-hover:bg-blue-100/80 transition-colors">
                    <Database className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-[26px] font-black tracking-tight text-[#0a2540] leading-[1.15]">
                      Data<br />Kebencanaan
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                      Akses data, indikator, dan informasi kebencanaan terintegrasi.
                    </p>
                  </div>
                </div>

                {/* CTA Action: Link teks underline + Panah lingkaran */}
                <div className="relative z-10 flex items-center gap-3 pt-4 mt-2">
                  <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-[#0a2540] border-b-2 border-[#0a2540] pb-0.5 group-hover:text-blue-700 group-hover:border-blue-700 transition-colors">
                    Buka Basis Data
                  </span>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#0a2540] group-hover:border-[#0a2540] group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                  </div>
                </div>
              </Link>

            </div>

            {/* Large Card Below: Impact Assessment Dashboard with 300px Height & Cover /images/backgroundaseesment.png */}
            <div
              className="group relative rounded-2xl overflow-hidden border border-slate-800/80 shadow-lg transition-all duration-300 hover:shadow-2xl flex flex-col justify-between"
              style={{
                height: '300px',
                minHeight: '300px',
              }}
            >
              {/* Background Image: /images/backgroundaseesment.png (with text removed from background image) */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: 'url(/images/backgroundaseesment.png)',
                }}
              />
              
              {/* Soft Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/30 to-transparent pointer-events-none" />

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
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
