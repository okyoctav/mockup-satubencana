'use client';

import { useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import LiveDisasterBar from '@/components/landing/LiveDisasterBar';
import FeaturesSection from '@/components/landing/FeaturesSection';
import LifecycleDeepDive from '@/components/landing/LifecycleDeepDive';
import MitraSection from '@/components/landing/MitraSection';
import FooterSection from '@/components/landing/FooterSection';
import { useTheme } from '@/contexts/ThemeContext';

export default function Home() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (!saved) {
      setTheme('light');
    }
  }, [setTheme]);

  return (
    <main
      className="relative min-h-screen w-full flex flex-col font-sans selection:bg-blue-600 selection:text-white"
      style={{ background: 'var(--bg-page)' }}
    >
      {/* Top Fixed Navigation */}
      <Navbar activePath="/" />

      {/* Main Page Flow */}
      <div className="flex-1 relative pt-[58px] w-full flex flex-col">
        {/* 1. Command Center Hero Section (Wireframe Twin-Panel) */}
        <HeroSection />

        {/* 2. Live Intelligence & Disaster Sensors Bar */}
        <LiveDisasterBar />

        {/* 3. Key Platform Capabilities & Features */}
        <FeaturesSection />

        {/* 4. Interactive 3-Phase Disaster Lifecycle */}
        <LifecycleDeepDive />

        {/* 5. Institutional Partners & Ecosystem */}
        <MitraSection />

        {/* 6. Comprehensive Unified Footer */}
        <FooterSection />
      </div>
    </main>
  );
}
