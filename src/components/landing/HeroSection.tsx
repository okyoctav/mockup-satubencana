'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, RefreshCw, ArrowDown, Activity, Sparkles } from 'lucide-react';

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
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center h-full max-h-[calc(100vh-80px)]">
          
          {/* ============================================================
              LEFT PANEL (Col 1-5): Executive Title, Philosophy & Core Stats
              ============================================================ */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4 lg:space-y-5">
            
            {/* Top Category Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide w-fit"
              style={{
                backgroundColor: 'rgba(25, 79, 112, 0.12)',
                color: 'var(--accent-blue)',
                border: '1px solid var(--border-faint)'
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Siklus Ketahanan Bencana Terpadu</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15]"
                style={{ color: 'var(--text-primary)' }}
              >
                Sistem Analisis{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Data Bencana
                </span>{' '}
                Nasional
              </h1>
              <p
                className="text-xs sm:text-sm font-medium leading-relaxed pt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Ekosistem geospasial satu pintu yang menghubungkan tata kelola data pra-bencana, 
                situasi tanggap darurat, hingga akselerasi rekonstruksi tangguh di seluruh penjuru Indonesia.
              </p>
            </div>

            {/* Core Stats Overview Cards */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div
                className="p-2.5 sm:p-3 rounded-2xl border transition-all duration-300"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Mitigasi</span>
                </div>
                <div className="text-base sm:text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  38 Prov
                </div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Peta Risiko Terintegrasi
                </div>
              </div>

              <div
                className="p-2.5 sm:p-3 rounded-2xl border transition-all duration-300"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Respons</span>
                </div>
                <div className="text-base sm:text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  24/7 Live
                </div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Early Warning Active
                </div>
              </div>

              <div
                className="p-2.5 sm:p-3 rounded-2xl border transition-all duration-300"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-faint)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div className="flex items-center gap-1.5 text-sky-500 mb-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pemulihan</span>
                </div>
                <div className="text-base sm:text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                  50.000+
                </div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Kejadian Tervalidasi
                </div>
              </div>
            </div>

            {/* Interactive Phase Flow Selector Footnote */}
            <div
              className="rounded-2xl p-3 border flex items-center justify-between gap-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.4)',
                borderColor: 'var(--border-faint)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                  Siklus Manajemen Bencana Berkesinambungan
                </span>
              </div>
              <div className="flex items-center gap-1">
                {(['pra', 'saat', 'pasca'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePhase(p)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold capitalize transition-all"
                    style={{
                      backgroundColor: activePhase === p ? 'rgb(25, 79, 112)' : 'transparent',
                      color: activePhase === p ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* ============================================================
              RIGHT PANEL (Col 6-12): Interconnected 3-Phase Cycle Cards with Dynamic SVGs
              ============================================================ */}
          <div className="lg:col-span-7 flex flex-col justify-center gap-2.5 relative">

            {/* ------------------------------------------------------------
                FASE 1: PRA-BENCANA (Mitigasi & Kesiapsiagaan)
                ------------------------------------------------------------ */}
            <div
              onClick={() => setActivePhase('pra')}
              className={`group relative rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 cursor-pointer overflow-hidden ${
                activePhase === 'pra' ? 'ring-2 ring-emerald-500/50 shadow-md scale-[1.01]' : 'opacity-85 hover:opacity-100'
              }`}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: activePhase === 'pra' ? 'rgba(16,185,129,0.5)' : 'var(--border-faint)',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left Header & Content */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      FASE 01 · MITIGASI & KESIAPSIAGAAN
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Pra-Bencana</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    Pencegahan Risiko & Peringatan Dini
                  </h3>
                  
                  <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    Pemodelan bahaya multisektoral, peta kontur kerentanan wilayah, sensor gempa/tsunami otomatis,
                    serta simulasi evakuasi untuk meminimalkan dampak sebelum bencana terjadi.
                  </p>

                  {/* Feature Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {['Peta Bahaya Spasial', 'Early Warning Sensor', 'Kajian Kerentanan', 'Simulasi Tanggap'].map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/5 text-emerald-700 border border-emerald-500/15"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Interactive SVG Graphics: Radar & Shield Scan */}
                <div className="w-20 sm:w-28 h-20 sm:h-24 shrink-0 relative flex items-center justify-center">
                  <svg viewBox="0 0 120 100" className="w-full h-full">
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

                    {/* Concentric Radar Wave Rings */}
                    <circle cx="60" cy="50" r="42" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                    <circle cx="60" cy="50" r="30" fill="none" stroke="#10B981" strokeWidth="1.2" opacity="0.45" />
                    <circle cx="60" cy="50" r="18" fill="url(#radarGlow)" />

                    {/* Shield Outline in Center */}
                    <path
                      d="M60 22 L84 32 C84 62 60 76 60 76 C60 76 36 62 36 32 Z"
                      fill="url(#shieldGrad)"
                      stroke="#10B981"
                      strokeWidth="2"
                    />

                    {/* Scanning needle effect */}
                    <line x1="60" y1="50" x2="88" y2="35" stroke="#34D399" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                    
                    {/* Pulsing Alert Nodes */}
                    <circle cx="48" cy="40" r="3" fill="#10B981" className="animate-ping" />
                    <circle cx="48" cy="40" r="2.5" fill="#ffffff" />
                    <circle cx="74" cy="45" r="2.5" fill="#34D399" />
                    <circle cx="60" cy="62" r="3" fill="#059669" />
                  </svg>
                </div>
              </div>
            </div>

            {/* FLOW SVG CONNECTOR 1 -> 2: Dynamic Downward Flow Arrow */}
            <div className="flex items-center justify-center -my-1 relative z-20">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border bg-white shadow-xs"
                style={{
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  color: '#D97706',
                }}
              >
                <ArrowDown className="w-2.5 h-2.5 animate-bounce" />
                <span>Eskalasi Insiden & Dispatch Tanggap</span>
              </div>
            </div>

            {/* ------------------------------------------------------------
                FASE 2: SAAT BENCANA (Tanggap Darurat & Penyelamatan)
                ------------------------------------------------------------ */}
            <div
              onClick={() => setActivePhase('saat')}
              className={`group relative rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 cursor-pointer overflow-hidden ${
                activePhase === 'saat' ? 'ring-2 ring-amber-500/50 shadow-md scale-[1.01]' : 'opacity-85 hover:opacity-100'
              }`}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: activePhase === 'saat' ? 'rgba(245,158,11,0.5)' : 'var(--border-faint)',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left Header & Content */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      FASE 02 · TANGGAP DARURAT & PENYELAMATAN
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Saat Bencana</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    Situasi Real-Time & Komando Terpadu
                  </h3>

                  <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    Komando lapangan terpusat, koordinasi multi-instansi (BPBD, Basarnas, TNI/Polri), 
                    jalur evakuasi presisi, serta penyaluran logistik darurat untuk keselamatan jiwa pengungsi.
                  </p>

                  {/* Feature Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {['Situation Room 24/7', 'Tracking Tim SAR', 'Logistik Posko', 'Manajemen Pengungsi'].map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/5 text-amber-700 border border-amber-500/15"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Interactive SVG Graphics: Incident Hub & Telemetry Beacons */}
                <div className="w-20 sm:w-28 h-20 sm:h-24 shrink-0 relative flex items-center justify-center">
                  <svg viewBox="0 0 120 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="beaconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#EA580C" stopOpacity="0.25" />
                      </linearGradient>
                    </defs>

                    {/* Central Dispatch Hexagon */}
                    <polygon
                      points="60,24 82,36 82,64 60,76 38,64 38,36"
                      fill="url(#beaconGrad)"
                      stroke="#F59E0B"
                      strokeWidth="2"
                    />

                    {/* Radar Pulse rings */}
                    <circle cx="60" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.35" strokeDasharray="4 2" />
                    <circle cx="60" cy="50" r="16" fill="rgba(245,158,11,0.2)" />
                    <circle cx="60" cy="50" r="8" fill="#F59E0B" />
                    <circle cx="60" cy="50" r="4" fill="#ffffff" />

                    {/* Directional Rescue Nodes */}
                    <line x1="60" y1="50" x2="25" y2="30" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="60" y1="50" x2="95" y2="30" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />
                    <line x1="60" y1="50" x2="60" y2="88" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 2" />

                    {/* Beacon indicators */}
                    <circle cx="25" cy="30" r="4" fill="#EF4444" className="animate-pulse" />
                    <circle cx="95" cy="30" r="4" fill="#10B981" />
                    <circle cx="60" cy="88" r="3.5" fill="#3B82F6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* FLOW SVG CONNECTOR 2 -> 3: Dynamic Downward Flow Arrow */}
            <div className="flex items-center justify-center -my-1 relative z-20">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border bg-white shadow-xs"
                style={{
                  borderColor: 'rgba(14, 165, 233, 0.4)',
                  color: '#0284C7',
                }}
              >
                <ArrowDown className="w-2.5 h-2.5 animate-bounce" />
                <span>Transisi Pemulihan & Build Back Better</span>
              </div>
            </div>

            {/* ------------------------------------------------------------
                FASE 3: PASCA-BENCANA (Pemulihan & Rekonstruksi)
                ------------------------------------------------------------ */}
            <div
              onClick={() => setActivePhase('pasca')}
              className={`group relative rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 cursor-pointer overflow-hidden ${
                activePhase === 'pasca' ? 'ring-2 ring-sky-500/50 shadow-md scale-[1.01]' : 'opacity-85 hover:opacity-100'
              }`}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: activePhase === 'pasca' ? 'rgba(14,165,233,0.5)' : 'var(--border-faint)',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left Header & Content */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                      FASE 03 · PEMULIHAN & REKONSTRUKSI
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Pasca-Bencana</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    Rehabilitasi Infrastruktur & Resiliensi Kota
                  </h3>

                  <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    Asesmen cepat kerusakan bangunan (Jitupasna), digitalisasi pencairan bantuan stimulan, 
                    rekonstruksi hunian tetap aman bencana, serta penguatan ketahanan wilayah jangka panjang.
                  </p>

                  {/* Feature Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {['Hitung Kerugian Cepat', 'Rekonstruksi Fasilitas', 'Bantuan Stimulan', 'Evaluasi Ketahanan'].map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/5 text-sky-700 border border-sky-500/15"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Interactive SVG Graphics: Growth & Renewal Loop */}
                <div className="w-20 sm:w-28 h-20 sm:h-24 shrink-0 relative flex items-center justify-center">
                  <svg viewBox="0 0 120 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="growthGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#0284C7" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>

                    {/* Stepped recovery bars */}
                    <rect x="24" y="62" width="14" height="20" rx="3" fill="#0284C7" opacity="0.4" />
                    <rect x="44" y="50" width="14" height="32" rx="3" fill="#0EA5E9" opacity="0.6" />
                    <rect x="64" y="36" width="14" height="46" rx="3" fill="#38BDF8" opacity="0.8" />
                    <rect x="84" y="24" width="14" height="58" rx="3" fill="url(#growthGrad)" />

                    {/* Ascending trend line curve with dot */}
                    <path
                      d="M20 74 Q 50 60, 92 20"
                      fill="none"
                      stroke="#0EA5E9"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="92" cy="20" r="4.5" fill="#38BDF8" className="animate-ping" />
                    <circle cx="92" cy="20" r="3.5" fill="#ffffff" stroke="#0284C7" strokeWidth="1.5" />

                    {/* Return cycle loop arrow symbolizing continuous resilience back to mitigation */}
                    <path
                      d="M98 32 C 108 48, 104 70, 88 80 C 72 90, 48 88, 36 82"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.65"
                    />
                    <polygon points="34,80 38,86 42,80" fill="#10B981" />
                  </svg>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

