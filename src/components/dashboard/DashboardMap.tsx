'use client';

import dynamic from 'next/dynamic';
import { EstimationData } from './LogisticAnalysisSection';

const DashboardLeaflet = dynamic(() => import('./DashboardLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center border border-slate-200 bg-slate-50 text-sm text-slate-500 font-sans">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#1f8080] animate-ping" />
        <span>Memuat peta…</span>
      </div>
    </div>
  ),
});

export type DrawEstimationStats = EstimationData;

interface Props {
  data: { id: number; nama: string; provinsi: string; kabupaten: string; lat: number; lng: number; jenis: string; tanggal: string; korban_jiwa: number; pengungsi: number; rumah_terdampak?: number; status: string; level: string }[];
  flyTo: { lat: number; lng: number; zoom: number } | null;
  theme: string;
  kodeKemendagri?: string;
  /** Nama wilayah filter (provinsi atau kab/kota) */
  wilayahNama?: string;
  /** Nama provinsi induk saat filter kab/kota */
  wilayahProvinsi?: string;
  selectedJenis?: string;
  selectedKejadianId?: number | null;
  onKejadianMarkerClick?: (id: number) => void;
  selectedVolcanoSlug?: string | null;
  onVolcanoMarkerClick?: (slug: string) => void;
  selectedBmkgKey?: string | null;
  onBmkgMarkerClick?: (key: string) => void;
  /** Naikkan angka untuk memaksa tampil ripple BMKG (dari panel gempa) */
  bmkgShowSignal?: number;
  bmkgPreferredMode?: 'terkini' | 'dirasakan' | 'autogempa';
  onDrawEstimation?: (stats: DrawEstimationStats) => void;
  onActiveOverlaysChange?: (overlays: string[]) => void;
}

export default function DashboardMap({
  data,
  flyTo,
  theme,
  kodeKemendagri,
  wilayahNama,
  wilayahProvinsi,
  selectedJenis,
  selectedKejadianId = null,
  onKejadianMarkerClick,
  selectedVolcanoSlug = null,
  onVolcanoMarkerClick,
  selectedBmkgKey = null,
  onBmkgMarkerClick,
  bmkgShowSignal = 0,
  bmkgPreferredMode = 'terkini',
  onDrawEstimation,
  onActiveOverlaysChange,
}: Props) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <DashboardLeaflet
        data={data}
        flyTo={flyTo}
        theme={theme}
        kodeKemendagri={kodeKemendagri}
        wilayahNama={wilayahNama}
        wilayahProvinsi={wilayahProvinsi}
        selectedJenis={selectedJenis}
        selectedKejadianId={selectedKejadianId}
        onKejadianMarkerClick={onKejadianMarkerClick}
        selectedVolcanoSlug={selectedVolcanoSlug}
        onVolcanoMarkerClick={onVolcanoMarkerClick}
        selectedBmkgKey={selectedBmkgKey}
        onBmkgMarkerClick={onBmkgMarkerClick}
        bmkgShowSignal={bmkgShowSignal}
        bmkgPreferredMode={bmkgPreferredMode}
        onDrawEstimation={onDrawEstimation}
        onActiveOverlaysChange={onActiveOverlaysChange}
      />
    </div>
  );
}
