'use client';

import dynamic from 'next/dynamic';

const DashboardLeaflet = dynamic(() => import('./DashboardLeaflet'), { ssr: false });

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
  status: string;
  level: string;
}

interface Props {
  data: Kejadian[];
  flyTo: { lat: number; lng: number; zoom: number } | null;
  theme: string;
}

export default function DashboardMap({ data, flyTo, theme }: Props) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <DashboardLeaflet data={data} flyTo={flyTo} theme={theme} />
    </div>
  );
}
