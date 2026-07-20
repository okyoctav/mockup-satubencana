'use client';

import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardMap from '@/components/dashboard/DashboardMap';
import bencanaData from '@/data/bencana.json';

interface Kejadian {
  id: number;
  nama: string;
  provinsi: string;
  kabupaten: string;
  lat: number;
  lng: number;
  jenis: string;
  tanggal: string;
  korban_jiwa: number;
  pengungsi: number;
  rumah_terdampak?: number;
  status: string;
  level: string;
}

export default function Page() {
  const { theme } = useTheme();
  const data = useMemo(() => (bencanaData.kejadian as Kejadian[]), []);

  return (
    <div style={{ width: '100%', height: '100vh', background: 'var(--bg-page)' }}>
      <DashboardMap data={data} flyTo={null} theme={theme} />
    </div>
  );
}
