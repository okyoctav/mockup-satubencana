'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar, { LandingTab } from '@/components/ui/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import MapSection from '@/components/landing/MapSection';
import AnalysisSection from '@/components/landing/AnalysisSection';
import FooterSection from '@/components/landing/FooterSection';

function HomeContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as LandingTab | null;
  const [activeTab, setActiveTab] = useState<LandingTab>('beranda');

  useEffect(() => {
    if (tabParam && ['beranda', 'peta', 'analisis', 'informasi'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white text-xs font-bold gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
        <span>Memuat aplikasi...</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
