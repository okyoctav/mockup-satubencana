'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center h-full max-h-[calc(100vh-80px)]">
          
          {/* ============================================================
              LEFT PANEL (Col 1-5): Executive Title & Overview
              ============================================================ */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-5 lg:space-y-6">
            
            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]"
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
                className="text-sm sm:text-base font-medium leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Ekosistem geospasial satu pintu yang menghubungkan tata kelola data dan informasi pra bencana, tanggap darurat hingga rekonstruksi pasca bencana di seluruh indonesia
              </p>
            </div>

            {/* Interactive Phase Controller / Indicator */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {(['pra', 'saat', 'pasca'] as const).map((p) => {
                const colors = {
                  pra: { bg: 'rgba(16,185,129,0.12)', text: '#059669', border: 'rgba(16,185,129,0.3)' },
                  saat: { bg: 'rgba(245,158,11,0.12)', text: '#D97706', border: 'rgba(245,158,11,0.3)' },
                  pasca: { bg: 'rgba(14,165,233,0.12)', text: '#0284C7', border: 'rgba(14,165,233,0.3)' }
                };
                const label = p === 'pra' ? '01. Pra-Bencana' : p === 'saat' ? '02. Saat Bencana' : '03. Pasca-Bencana';
                const isActive = activePhase === p;
                return (
                  <button
                    key={p}
                    onClick={() => setActivePhase(p)}
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border shadow-2xs"
                    style={{
                      backgroundColor: isActive ? 'rgb(25, 79, 112)' : colors[p].bg,
                      color: isActive ? '#ffffff' : colors[p].text,
                      borderColor: isActive ? 'rgb(25, 79, 112)' : colors[p].border,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

          </div>

          {/* ============================================================
              RIGHT PANEL (Col 6-12): Interconnected 3-Phase Cycle Cards with Dynamic SVGs
              ============================================================ */}
          <div className="lg:col-span-7 flex flex-col justify-center gap-3 relative">

            {/* ------------------------------------------------------------
                FASE 1: PRA-BENCANA (Mitigasi & Kesiapsiagaan)
                ------------------------------------------------------------ */}
            <div
              onClick={() => setActivePhase('pra')}
              className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer overflow-hidden ${
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
                  
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Pemodelan bahaya multisektoral, kerentanan wilayah, mengurangi dampak bencana sebelum kejadian dan memberikan informasi cepat potensi bahaya terdeteksi
                  </p>
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
              className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer overflow-hidden ${
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

                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Komando lapangan terpusat dalam koordinasi multi-instansi (BPBD, Basarnas, TNI/Polri), jalur evakuasi hingga penyaluran logistik darurat pengungsi dalam menyelamatkan jiwa, memenuhi kebutuhan dasar, mengendalikan situasi, dan mencegah dampak bencana menjadi lebih besar
                  </p>
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
              className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer overflow-hidden ${
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

                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Asesmen cepat kerusakan bangunan, bantuan stimulan hingga rekonstruksi hunian dalam mengembalikan fungsi kehidupan masyarakat setelah masa tanggap darurat sekaligus membangun kembali wilayah agar lebih aman dan tangguh terhadap bencana.
                  </p>
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

