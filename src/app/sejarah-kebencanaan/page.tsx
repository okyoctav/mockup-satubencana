'use client';

import Navbar from '@/components/ui/Navbar';
import MapSection from '@/components/landing/MapSection';

export default function SejarahKebencanaanPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden flex flex-col font-sans" style={{ background: 'var(--bg-page)' }}>
      <Navbar activePath="/sejarah-kebencanaan" />

      <div className="flex-1 relative pt-[58px] h-[calc(100vh-58px)] w-full overflow-hidden">
        <MapSection />
      </div>
    </main>
  );
}
