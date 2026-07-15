'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { AdminLayout } from '@/app/admin/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import bencanaData from '@/data/bencana.json';

const DashboardLeafletK3 = dynamic(() => import('@/components/dashboard/DashboardLeafletK3'), {
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

  const stats = useMemo(() => {
    const total = allData.length;
    const aktif = allData.filter((item) => item.status === 'saat').length;
    const tinggi = allData.filter((item) => item.level === 'tinggi').length;
    return { total, aktif, tinggi };
  }, []);

  return (
    <AdminLayout title="Simulasi K3" subtitle="Peta interaktif fullscreen untuk simulasi dampak wilayah">
      <div className="flex h-full min-h-[calc(100vh-10rem)] flex-col">
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
            Total kejadian: <span className="ml-1 font-semibold text-slate-900">{stats.total}</span>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Aktif saat ini: <span className="ml-1 font-semibold">{stats.aktif}</span>
          </div>
          <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Prioritas tinggi: <span className="ml-1 font-semibold">{stats.tinggi}</span>
          </div>
        </div>

        <div className="relative min-h-[680px] flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <DashboardLeafletK3 data={allData} flyTo={flyTo} theme={theme} />
        </div>
      </div>
    </AdminLayout>
  );
}
