'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AdminLayout } from '@/app/admin/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import bencanaData from '@/data/bencana.json';

const AdminLeafletDampak = dynamic(() => import('@/components/dashboard/AdminLeafletDampak'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[640px] items-center justify-center border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Memuat peta simulasi dampak...
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

export default function SimulasiDampakPage() {
  const { theme } = useTheme();
  const [flyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  return (
    <AdminLayout
      title="Simulasi Dampak"
      subtitle="Draw AOI — Dukcapil online atau HexKab lokal"
      disableMainPadding
    >
      <div className="flex h-full min-h-[calc(100vh-10rem)] flex-col">
        <div className="relative min-h-[680px] flex-1 overflow-hidden border border-slate-200 bg-white shadow-sm">
          <AdminLeafletDampak data={allData} flyTo={flyTo} theme={theme} />
        </div>
      </div>
    </AdminLayout>
  );
}
