import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import MapSection from '@/components/landing/MapSection';
import AnalysisSection from '@/components/landing/AnalysisSection';
import FooterSection from '@/components/landing/FooterSection';

export default function Home() {
  return (
    <main className="relative min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
      <HeroSection />
      <MapSection />
      <AnalysisSection />
      <FooterSection />
    </main>
  );
}
