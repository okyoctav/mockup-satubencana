'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

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
      className="relative h-full overflow-hidden w-full"
      style={{ background: 'var(--hero-bg)' }}
    >
      <div className="h-full flex flex-row items-center relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6">
        
        {/* LEFT PANEL */}
        <div className="relative w-3/5 h-full flex flex-col justify-center pr-8 z-10">
          {/* Three.js background inside left panel */}
          {mounted && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <HeroCanvas />
            </div>
          )}
          
          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-medium"
              style={{ background: 'var(--glass-bg)', color: '#0EA5E9', border: '1px solid var(--glass-border)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-slow inline-block"
                style={{ backgroundColor: '#22C55E' }} />
              Sistem Aktif · Data Real-time BNPB
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              <span style={{ color: 'var(--text-primary)' }}>Sistem Analisis</span>
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #0EA5E9, #22C55E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Data Bencana
              </span>
              <br />
              <span style={{ color: 'var(--text-primary)' }}>Nasional</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm md:text-base mb-6 leading-relaxed"
              style={{ color: 'var(--text-secondary)', maxWidth: '90%' }}>
              Platform geospasial terpadu untuk analisis bencana Indonesia.
              Dari pra-bencana hingga pemulihan — semua data dalam satu ekosistem.
            </p>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 mb-8">
              {[
                { label: 'Kejadian 2024', value: '342', color: '#0EA5E9' },
                { label: 'Provinsi Terpantau', value: '38', color: '#22C55E' },
                { label: 'Titik Monitoring', value: '1.240+', color: '#F97316' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="px-4 py-2 rounded-xl"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                >
                  <div className="text-xl font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-row flex-wrap gap-3">
              <a
                href="/dashboard_k5"
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                  boxShadow: '0 0 20px rgba(14,165,233,0.3)',
                }}
              >
                Dashboard K5 →
              </a>
              <Link
                href="/sejarah-kebencanaan"
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white transition-all duration-300 hover:scale-105 inline-flex items-center"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 0 20px rgba(16,185,129,0.3)',
                }}
              >
                🗺️ Peta Bencana
              </Link>
              <a
                href="https://inarisk.bnpb.go.id/databencana/webgis/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                  boxShadow: '0 0 20px rgba(249,115,22,0.3)',
                }}
              >
                WebGIS
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-2/5 flex flex-col gap-2 justify-center z-10 pl-2 h-full py-2">
          
          {/* Phase 1: Pra-Bencana */}
          <div className="p-3 rounded-2xl flex flex-row gap-3 items-start" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base" style={{ background: 'rgba(34,197,94,0.15)' }}>
              🛡️
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Pra-Bencana</h3>
              <p className="text-[10px] opacity-70 line-clamp-2 mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                Mitigasi dan kesiapsiagaan melalui peringatan dini dan analisis risiko wilayah.
              </p>
              <div className="grid grid-cols-2 gap-1 mt-2">
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Peringatan Dini</div>
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Peta Risiko</div>
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Edukasi</div>
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Gladi Posko</div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="font-bold text-[#22C55E] text-[11px]">85%</span>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Akurasi Prediksi</span>
              </div>
            </div>
          </div>

          {/* Phase 2: Saat Bencana */}
          <div className="p-3 rounded-2xl flex flex-row gap-3 items-start" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base" style={{ background: 'rgba(249,115,22,0.15)' }}>
              🚨
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Saat Bencana</h3>
              <p className="text-[10px] opacity-70 line-clamp-2 mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                Pemantauan real-time dan respons cepat untuk evakuasi dan logistik.
              </p>
              <div className="grid grid-cols-2 gap-1 mt-2">
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Real-time Data</div>
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Rute Evakuasi</div>
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Status Bantuan</div>
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Korban Jiwa</div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="font-bold text-[#F97316] text-[11px]">&lt; 5m</span>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Waktu Respons</span>
              </div>
            </div>
          </div>

          {/* Phase 3: Pasca-Bencana */}
          <div className="p-3 rounded-2xl flex flex-row gap-3 items-start" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base" style={{ background: 'rgba(14,165,233,0.15)' }}>
              🔄
            </div>
            <div className="flex flex-col flex-1">
              <h3 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Pasca-Bencana</h3>
              <p className="text-[10px] opacity-70 line-clamp-2 mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                Pemulihan infrastruktur dan evaluasi kerusakan pasca kejadian.
              </p>
              <div className="grid grid-cols-2 gap-1 mt-2">
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Pemulihan</div>
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Hitung Kerusakan</div>
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Rehabilitasi</div>
                <div className="text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center truncate" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>Laporan</div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="font-bold text-[#0EA5E9] text-[11px]">100%</span>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Data Terpusat</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
