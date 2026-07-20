'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AdminLayout } from '@/app/admin/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';

const AdminLeafletK4 = dynamic(() => import('@/components/dashboard/AdminLeafletK4'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[640px] items-center justify-center border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Memuat peta simulasi K4...
    </div>
  ),
});

type FlyTo = { lat: number; lng: number; zoom: number } | null;

export default function SimulasiK4Page() {
  const { theme } = useTheme();
  const [flyTo] = useState<FlyTo>(null);

  return (
    <AdminLayout title="Simulasi K4" subtitle="Peta interaktif fullscreen untuk simulasi K4 menggunakan GeoJSON lokal" disableMainPadding>
      <div className="flex h-full min-h-[calc(100vh-10rem)] flex-col">
        <div className="relative min-h-[680px] flex-1 overflow-hidden border border-slate-200 bg-white shadow-sm">
          <AdminLeafletK4 flyTo={flyTo} theme={theme} />
        </div>
      </div>
    </AdminLayout>
  );
}
