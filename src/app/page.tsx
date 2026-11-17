'use client';

import { useEffect } from 'react';
import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/landing/HeroSection';
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
    <main className="relative min-h-screen w-full flex flex-col font-sans" style={{ background: 'var(--bg-page)' }}>
      <Navbar activePath="/" />

      <div className="flex-1 relative pt-[58px] w-full flex flex-col">
        <HeroSection />
      </div>
    </main>
  );
}
