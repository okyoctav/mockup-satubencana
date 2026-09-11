'use client';

import Navbar from '@/components/ui/Navbar';
import FooterSection from '@/components/landing/FooterSection';

export default function InformasiMitraPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden flex flex-col font-sans" style={{ background: 'var(--bg-page)' }}>
      <Navbar activePath="/informasi-mitra" />

      <div className="flex-1 relative pt-[58px] h-[calc(100vh-58px)] w-full overflow-hidden">
        <FooterSection />
      </div>
    </main>
  );
}
