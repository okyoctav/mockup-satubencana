'use client';

import dynamic from 'next/dynamic';

const DashboardLeafletK5 = dynamic(() => import('./DashboardLeafletK5'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center border border-slate-200 bg-slate-50 text-sm text-slate-500 font-sans">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#1f8080] animate-ping" />
        <span>Memuat GIS Engine & Peta K5...</span>
      </div>
    </div>
  ),
});

export interface DrawEstimationStats {
  totalPopulasi: number;
  totalLakiLaki: number;
  totalPerempuan: number;
  totalLansia: number;
  totalBalita: number;
  totalPd1: number;
  totalPd2: number;
  totalKeluarga: number;
}

interface Props {
  data: { id: number; nama: string; provinsi: string; kabupaten: string; lat: number; lng: number; jenis: string; tanggal: string; korban_jiwa: number; pengungsi: number; rumah_terdampak?: number; status: string; level: string }[];
  flyTo: { lat: number; lng: number; zoom: number } | null;
  theme: string;
  onDrawEstimation?: (stats: DrawEstimationStats) => void;
}

export default function DashboardMapK5({ data, flyTo, theme, onDrawEstimation }: Props) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <DashboardLeafletK5 data={data} flyTo={flyTo} theme={theme} onDrawEstimation={onDrawEstimation} />
    </div>
  );
}
