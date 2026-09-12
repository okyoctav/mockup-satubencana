'use client';
import Navbar from '@/components/ui/Navbar';
import AnalysisDashboard from '@/components/analisis/AnalysisDashboard';
export default function AnalisisDataPage() {
  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col font-sans" style={{ background: 'var(--bg-page)' }}>
      <Navbar activePath="/analisis-data" />
      <div className="flex-1 pt-[58px] h-[calc(100vh-58px)] w-full overflow-hidden">
        <AnalysisDashboard />
      </div>
    </main>
  );
}
