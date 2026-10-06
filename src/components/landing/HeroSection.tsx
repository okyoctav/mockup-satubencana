'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Database,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';

const HeroCanvas = dynamic(() => import('@/components/three/HeroCanvas'), {
  ssr: false,
});

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [activePhase, setActivePhase] = useState<'pra' | 'saat' | 'pasca'>('pra');
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    // Auto cycle through phases every 5 seconds for dynamic feel
    const interval = setInterval(() => {
      setActivePhase((prev) => (prev === 'pra' ? 'saat' : prev === 'saat' ? 'pasca' : 'pra'));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-full w-full overflow-hidden select-none flex items-center"
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

      {/* Main Container - Strict Fullscreen Fit Without Scroll */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center py-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center h-full max-h-[calc(100vh-76px)]">
          
          {/* ============================================================
              LEFT PANEL (Col 1-6): Executive Title & 3 Phase Cards (Stacked Downward)
              ============================================================ */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-3 sm:space-y-3.5">
            
            {/* Main Headline */}
            <div className="space-y-1.5">
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-[1.15]"
                style={{ color: 'var(--text-primary)' }}
              >
                Manajemen{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Data Bencana
                </span>
              </h1>
              <p
                className="text-xs sm:text-sm font-medium leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Sistem Informasi data bencana terintegrasi untuk perencanaan pembangunan nasional.
              </p>
            </div>

            {/* 3 Phase Cards Stacked Vertically Below the Text */}
            <div className="flex flex-col gap-2 sm:gap-2.5">
              
              {/* FASE 1: PRA-BENCANA */}
              <div
                onClick={() => setActivePhase('pra')}
                className={`group relative rounded-2xl p-3 sm:p-3.5 border transition-all duration-300 cursor-pointer overflow-hidden ${
                  activePhase === 'pra' ? 'ring-2 ring-emerald-500/50 shadow-md scale-[1.01]' : 'opacity-85 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: activePhase === 'pra' ? 'rgba(16,185,129,0.5)' : 'var(--border-faint)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        FASE 01 · PRABENCANA
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">Pra-Bencana</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>
                      Mitigasi, Kesiapsiagaan, dan Peringatan Dini
                    </h3>
                    
                    <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      Pemodelan ancaman dan risiko bencana untuk mengurangi dampak bencana serta informasi cepat bahaya.
                    </p>
                  </div>

                  <div className="w-16 sm:w-20 h-16 sm:h-20 shrink-0 relative flex items-center justify-center">
                    <svg viewBox="0 0 120 100" className="w-full h-full max-w-[90px]">
                      <defs>
                        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
                        </linearGradient>
                        <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <circle cx="60" cy="50" r="42" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                      <circle cx="60" cy="50" r="30" fill="none" stroke="#10B981" strokeWidth="1.2" opacity="0.45" />
                      <circle cx="60" cy="50" r="18" fill="url(#radarGlow)" />
                      <path d="M60 22 L84 32 C84 62 60 76 60 76 C60 76 36 62 36 32 Z" fill="url(#shieldGrad)" stroke="#10B981" strokeWidth="2" />
                      <line x1="60" y1="50" x2="88" y2="35" stroke="#34D399" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                      <circle cx="48" cy="40" r="3" fill="#10B981" className="animate-ping" />
                      <circle cx="48" cy="40" r="2.5" fill="#ffffff" />
                      <circle cx="74" cy="45" r="2.5" fill="#34D399" />
                      <circle cx="60" cy="62" r="3" fill="#059669" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* FASE 2: SAAT BENCANA */}
              <div
                onClick={() => setActivePhase('saat')}
                className={`group relative rounded-2xl p-3 sm:p-3.5 border transition-all duration-300 cursor-pointer overflow-hidden ${
                  activePhase === 'saat' ? 'ring-2 ring-amber-500/50 shadow-md scale-[1.01]' : 'opacity-85 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: activePhase === 'saat' ? 'rgba(245,158,11,0.5)' : 'var(--border-faint)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        FASE 02 · TANGGAP DARURAT
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">Saat Bencana</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>
                      Kaji Cepat Dampak Bencana
                    </h3>

                    <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      Pengkajian secara cepat dan tepat terhadap lokasi kejadian, kerusakan, dan sumberdaya darurat.
                    </p>
                  </div>

                  <div className="w-16 sm:w-20 h-16 sm:h-20 shrink-0 relative flex items-center justify-center">
                    <svg viewBox="0 0 120 100" className="w-full h-full max-w-[90px]">
                      <defs>
                        <linearGradient id="beaconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#EA580C" stopOpacity="0.25" />
                        </linearGradient>
                      </defs>
                      <polygon points="60,24 82,36 82,64 60,76 38,64 38,36" fill="url(#beaconGrad)" stroke="#F59E0B" strokeWidth="2" />
                      <circle cx="60" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.35" strokeDasharray="4 2" />
                      <circle cx="60" cy="50" r="16" fill="rgba(245,158,11,0.2)" />
                      <circle cx="60" cy="50" r="8" fill="#F59E0B" />
                      <circle cx="60" cy="50" r="4" fill="#ffffff" />
                      <line x1="60" y1="50" x2="25" y2="30" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
                      <line x1="60" y1="50" x2="95" y2="30" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
                      <line x1="60" y1="50" x2="60" y2="88" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
                      <circle cx="25" cy="30" r="4" fill="#EF4444" className="animate-pulse" />
                      <circle cx="95" cy="30" r="4" fill="#10B981" />
                      <circle cx="60" cy="88" r="3.5" fill="#3B82F6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* FASE 3: PASCA-BENCANA */}
              <div
                onClick={() => setActivePhase('pasca')}
                className={`group relative rounded-2xl p-3 sm:p-3.5 border transition-all duration-300 cursor-pointer overflow-hidden ${
                  activePhase === 'pasca' ? 'ring-2 ring-sky-500/50 shadow-md scale-[1.01]' : 'opacity-85 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: activePhase === 'pasca' ? 'rgba(14,165,233,0.5)' : 'var(--border-faint)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                        FASE 03 · PASCABENCANA
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">Pasca-Bencana</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>
                      Perencanaan Rehabilitasi dan Rekonstruksi
                    </h3>

                    <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      Perencanaan pemulihan pascabencana dengan prinsip &ldquo;Build Back Better, Safer, and Sustainable&rdquo;.
                    </p>
                  </div>

                  <div className="w-16 sm:w-20 h-16 sm:h-20 shrink-0 relative flex items-center justify-center">
                    <svg viewBox="0 0 120 100" className="w-full h-full max-w-[90px]">
                      <defs>
                        <linearGradient id="growthGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>
                      <rect x="24" y="62" width="14" height="20" rx="3" fill="#0284C7" opacity="0.4" />
                      <rect x="44" y="50" width="14" height="32" rx="3" fill="#0EA5E9" opacity="0.6" />
                      <rect x="64" y="36" width="14" height="46" rx="3" fill="#38BDF8" opacity="0.8" />
                      <rect x="84" y="24" width="14" height="58" rx="3" fill="url(#growthGrad)" />
                      <path d="M20 74 Q 50 60, 92 20" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="92" cy="20" r="4.5" fill="#38BDF8" className="animate-ping" />
                      <circle cx="92" cy="20" r="3.5" fill="#ffffff" stroke="#0284C7" strokeWidth="1.5" />
                      <path d="M98 32 C 108 48, 104 70, 88 80 C 72 90, 48 88, 36 82" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.65" />
                      <polygon points="34,80 38,86 42,80" fill="#10B981" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* ============================================================
              RIGHT PANEL (Col 7-12): Akses Cepat, 2 Cards with Circular Arrow, Big Dashboard Card
              ============================================================ */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-3 sm:space-y-3.5">
            
            {/* Header: Akses Cepat */}
            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg lg:text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Akses Cepat
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Pilih jalur informasi sesuai kebutuhan Anda
              </p>
            </div>

            {/* 2 Cards: Sejarah Kebencanaan & Data Kebencanaan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Card 1: Sejarah Kebencanaan */}
              <Link
                href="/sejarah-kebencanaan"
                className="group relative rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 hover:shadow-md hover:scale-[1.01] flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-faint)',
                  minHeight: '125px',
                }}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      Sejarah Kebencanaan
                    </h3>
                  </div>
                  <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    Telusuri kronologi dan rekam jejak kejadian bencana.
                  </p>
                </div>

                {/* Circular Arrow Button (Bottom-Right) */}
                <div className="flex justify-end pt-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-[#194f70] group-hover:text-white group-hover:border-[#194f70] flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:scale-110">
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>

              {/* Card 2: Data Kebencanaan */}
              <Link
                href="/analisis-data"
                className="group relative rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 hover:shadow-md hover:scale-[1.01] flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-faint)',
                  minHeight: '125px',
                }}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center justify-center">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      Data Kebencanaan
                    </h3>
                  </div>
                  <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    Akses data, indikator, dan informasi kebencanaan terintegrasi.
                  </p>
                </div>

                {/* Circular Arrow Button (Bottom-Right) */}
                <div className="flex justify-end pt-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-[#194f70] group-hover:text-white group-hover:border-[#194f70] flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:scale-110">
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>

            </div>

            {/* Large Card Below: Buka Dashboard with Cover /images/PETA2.png */}
            <div
              className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md transition-all duration-300 hover:shadow-xl hover:border-sky-500/50 flex flex-col justify-between"
              style={{
                minHeight: '170px',
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
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/45" />

              {/* Card Content */}
              <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-[9.5px] font-extrabold text-teal-300 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-teal-300" />
                    <span>Pusat Kendali Spasial</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Dashboard Manajemen Data Bencana
                  </h3>
                  <p className="text-[11px] text-slate-200 leading-relaxed line-clamp-2 max-w-sm">
                    Eksplorasi peta interaktif skala 50K terpadu dengan simulasi multi-sektor dan respon darurat terintegrasi.
                  </p>
                </div>

                <div>
                  <Link
                    href="/dashboard_k5"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md transition-all duration-200 hover:scale-105 active:scale-95 group/btn"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                    <span>Buka Dashboard</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
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
