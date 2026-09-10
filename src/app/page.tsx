'use client';

import { useState } from 'react';
import Navbar, { LandingTab } from '@/components/ui/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import MapSection from '@/components/landing/MapSection';
import AnalysisSection from '@/components/landing/AnalysisSection';
import FooterSection from '@/components/landing/FooterSection';

export default function Home() {
  const [activeTab, setActiveTab] = useState<LandingTab>('beranda');

  return (
    <main className="relative h-screen w-screen overflow-hidden flex flex-col font-sans" style={{ background: 'var(--bg-page)' }}>
      <Navbar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

      <div className="flex-1 relative pt-20 h-[calc(100vh-80px)] w-full overflow-hidden">
        {activeTab === 'beranda' && <HeroSection onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'peta' && <MapSection />}
        {activeTab === 'analisis' && <AnalysisSection />}
        {activeTab === 'informasi' && <FooterSection />}
      </div>
    </main>
  );
}
