'use client';

import dynamic from 'next/dynamic';

const DashboardLeafletK4 = dynamic(() => import('./DashboardLeafletK4'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Memuat peta K4...
    </div>
  ),
});

interface Props {
  data: { id: number; nama: string; provinsi: string; kabupaten: string; lat: number; lng: number; jenis: string; tanggal: string; korban_jiwa: number; pengungsi: number; rumah_terdampak?: number; status: string; level: string }[];
  flyTo: { lat: number; lng: number; zoom: number } | null;
  theme: string;
}

export default function DashboardMapK4({ data, flyTo, theme }: Props) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <DashboardLeafletK4 data={data} flyTo={flyTo} theme={theme} />
    </div>
  );
}
