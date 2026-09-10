'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const HeroCanvas = dynamic(() => import('@/components/three/HeroCanvas'), {
  ssr: false,
});

import { LandingTab } from '@/components/ui/Navbar';

interface HeroSectionProps {
  onNavigate?: (tab: LandingTab) => void;
}

export default function HeroSection({ onNavigate }: HeroSectionProps) {
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center overflow-hidden py-12"
      style={{ background: 'var(--hero-bg)' }}
    >
      {/* Three.js background */}
      {mounted && (
        <div className="absolute inset-0 z-0">
          <HeroCanvas />
        </div>
      )}

      {/* Radial glow center */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(14,165,233,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm font-medium"
          style={{ color: '#0EA5E9', border: '1px solid rgba(14,165,233,0.3)' }}>
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse-slow inline-block"
            style={{ backgroundColor: '#22C55E' }} />
          Sistem Aktif · Data Real-time BNPB
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6">
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
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}>
          Platform geospasial terpadu untuk analisis bencana Indonesia.
          Dari pra-bencana hingga pemulihan — semua data dalam satu ekosistem.
        </p>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {[
            { label: 'Kejadian 2024', value: '342', color: '#0EA5E9' },
            { label: 'Provinsi Terpantau', value: '38', color: '#22C55E' },
            { label: 'Titik Monitoring', value: '1.240+', color: '#F97316' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-6 py-3 rounded-2xl glass text-center"
              style={{ border: '1px solid rgba(14,165,233,0.15)' }}
            >
              <div className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/dashboard_k5"
            className="px-8 py-4 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
              boxShadow: '0 0 30px rgba(14,165,233,0.4)',
            }}
          >
            Buka Dashboard K5 →
          </a>
          <button
            onClick={() => onNavigate?.('peta')}
            className="px-8 py-4 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              boxShadow: '0 0 30px rgba(16,185,129,0.4)',
            }}
          >
            🗺️ Lihat Peta Bencana
          </button>
          <a
            href="https://inarisk.bnpb.go.id/databencana/webgis/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              boxShadow: '0 0 30px rgba(249,115,22,0.4)',
            }}
          >
            WebGIS
          </a>
        </div>
      </div>
    </section>
  );
}
