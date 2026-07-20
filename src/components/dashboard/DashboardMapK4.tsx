'use client';

import dynamic from 'next/dynamic';

const AdminLeafletK4 = dynamic(() => import('./AdminLeafletK4'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Memuat peta K4...
    </div>
  ),
});

interface Props {
  flyTo: { lat: number; lng: number; zoom: number } | null;
  theme: string;
}

export default function DashboardMapK4({ flyTo, theme }: Props) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <AdminLeafletK4 flyTo={flyTo} theme={theme} />
    </div>
  );
}
