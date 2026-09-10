'use client';

import Navbar from '@/components/ui/Navbar';
import AnalysisSection from '@/components/landing/AnalysisSection';

export default function AnalisisDataPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden flex flex-col font-sans" style={{ background: 'var(--bg-page)' }}>
      <Navbar activePath="/analisis-data" />

      <div className="flex-1 relative pt-20 h-[calc(100vh-80px)] w-full overflow-hidden">
        <AnalysisSection />
      </div>
    </main>
  );
}
