'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AdminLayout } from '@/app/admin/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import bencanaData from '@/data/bencana.json';

const AdminLeafletK3 = dynamic(() => import('@/components/dashboard/AdminLeafletK3'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[640px] items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Memuat peta simulasi K3...
    </div>
  ),
});

type Kejadian = {
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
};

const allData = bencanaData.kejadian as Kejadian[];

export default function SimulasiK3Page() {
  const { theme } = useTheme();
  const [flyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  // stats removed for admin view

  return (
    <AdminLayout title="Simulasi K3" subtitle="Peta interaktif fullscreen untuk simulasi dampak wilayah">
      <div className="flex h-full min-h-[calc(100vh-10rem)] flex-col">
        {/* Top stats removed for admin map */}

        <div className="relative flex-1 overflow-hidden bg-white">
          <AdminLeafletK3 data={allData} flyTo={flyTo} theme={theme} />
        </div>
      </div>
    </AdminLayout>
  );
}
