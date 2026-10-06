'use client';

import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/landing/HeroSection';

export default function Home() {
  return (
    <main className="relative min-h-screen w-full flex flex-col font-sans" style={{ background: 'var(--bg-page)' }}>
      <Navbar activePath="/" />

      <div className="flex-1 relative pt-[60px] w-full flex items-center">
        <HeroSection />
      </div>
    </main>
  );
}
