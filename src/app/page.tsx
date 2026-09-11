'use client';

import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/landing/HeroSection';

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden flex flex-col font-sans" style={{ background: 'var(--bg-page)' }}>
      <Navbar activePath="/" />

      <div className="flex-1 relative pt-[58px] h-[calc(100vh-58px)] w-full overflow-hidden">
        <HeroSection />
      </div>
    </main>
  );
}
