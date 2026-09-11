'use client';

import Navbar from '@/components/ui/Navbar';
import InformasiMitraSection from '@/components/landing/InformasiMitraSection';

export default function InformasiMitraPage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col font-sans overflow-x-hidden" style={{ background: 'var(--bg-page)' }}>
      <Navbar activePath="/informasi-mitra" />

      <div className="flex-1 relative pt-[58px] w-full">
        <InformasiMitraSection />
      </div>
    </main>
  );
}
