'use client';

import { useState } from 'react';
import { ClipboardList, Users, Tent, Home, TrendingUp, MapPin, Building2, X } from 'lucide-react';
import { DIBI_TOTAL } from '@/data/dibiStats';

type CardIcon = React.ReactNode;

type Kejadian = {
  korban_jiwa: number;
  pengungsi: number;
  rumah_terdampak?: number;
};

const NATIONAL_CARDS = [
  {
    id: 'kejadian',
    label: 'Total Kejadian Bencana',
    sublabel: 'Data DIBI BNPB (2011–2026)',
    getValue: () => DIBI_TOTAL.kejadian.toLocaleString('id'),
    unit: 'kejadian',
    icon: <ClipboardList className="w-5 h-5 text-[#1f8080]" /> as CardIcon,
    accentBg: 'bg-[#1f8080]/10',
    accentBorder: 'group-hover:border-[#1f8080]',
    accentText: 'text-[#1f8080]',
    getTrend: () => '50.000+ Terverifikasi',
    trendUp: true,
  },
  {
    id: 'korban',
    label: 'Meninggal & Hilang',
    sublabel: 'Total Korban Jiwa',
    getValue: () => (DIBI_TOTAL.meninggal + DIBI_TOTAL.hilang).toLocaleString('id'),
    unit: 'jiwa',
    icon: <Users className="w-5 h-5 text-amber-600" /> as CardIcon,
    accentBg: 'bg-amber-50',
    accentBorder: 'group-hover:border-amber-400',
    accentText: 'text-amber-700',
    getTrend: () => `${DIBI_TOTAL.luka.toLocaleString('id')} luka/sakit`,
    trendUp: false,
  },
  {
    id: 'pengungsi',
    label: 'Menderita & Mengungsi',
    sublabel: 'Populasi Terdampak',
    getValue: () => (DIBI_TOTAL.pengungsi / 1_000_000).toFixed(1) + ' Jt',
    unit: 'jiwa',
    icon: <Tent className="w-5 h-5 text-emerald-600" /> as CardIcon,
    accentBg: 'bg-emerald-50',
    accentBorder: 'group-hover:border-emerald-400',
    accentText: 'text-emerald-700',
    getTrend: () => '82,7 juta total pengungsi',
    trendUp: false,
  },
  {
    id: 'rumah',
    label: 'Kerusakan Rumah',
    sublabel: 'Rusak Berat/Sedang/Ringan',
    getValue: () => (DIBI_TOTAL.rumah_terdampak / 1_000_000).toFixed(2) + ' Jt',
    unit: 'unit',
    icon: <Home className="w-5 h-5 text-[#19506e]" /> as CardIcon,
    accentBg: 'bg-[#19506e]/10',
    accentBorder: 'group-hover:border-[#19506e]',
    accentText: 'text-[#19506e]',
    getTrend: () => '11,8 juta unit terendam/rusak',
    trendUp: true,
  },
];

interface Props {
  status?: string;
  regionData?: Kejadian[];
  regionLabel?: string;
  onClearRegion?: () => void;
}

export default function StatCards({ status, regionData, regionLabel, onClearRegion }: Props) {
  const [showRehabModal, setShowRehabModal] = useState(false);
  const showRehab = status === 'pasca';

  // Compute dynamic stats from region-filtered data
  const regionStats = regionData
    ? {
        kejadian: regionData.length,
        korban_jiwa: regionData.reduce((s, k) => s + k.korban_jiwa, 0),
        pengungsi: regionData.reduce((s, k) => s + k.pengungsi, 0),
        rumah_terdampak: regionData.reduce((s, k) => s + (k.rumah_terdampak ?? 0), 0),
      }
    : null;

  // Build display cards
  const cards = regionStats
    ? [
        {
          id: 'kejadian',
          label: 'Total Kejadian Bencana',
          sublabel: regionLabel ?? 'Wilayah Terpilih',
          value: regionStats.kejadian.toLocaleString('id'),
          unit: 'kejadian',
          icon: <ClipboardList className="w-5 h-5 text-[#1f8080]" /> as CardIcon,
          accentBg: 'bg-[#1f8080]/10',
          accentBorder: 'group-hover:border-[#1f8080]',
          accentText: 'text-[#1f8080]',
          trend: `dari ${DIBI_TOTAL.kejadian.toLocaleString('id')} nasional`,
          trendUp: true,
        },
        {
          id: 'korban',
          label: 'Meninggal & Hilang',
          sublabel: 'Korban Jiwa Wilayah',
          value: regionStats.korban_jiwa.toLocaleString('id'),
          unit: 'jiwa',
          icon: <Users className="w-5 h-5 text-amber-600" /> as CardIcon,
          accentBg: 'bg-amber-50',
          accentBorder: 'group-hover:border-amber-400',
          accentText: 'text-amber-700',
          trend: 'berdasarkan data wilayah',
          trendUp: false,
        },
        {
          id: 'pengungsi',
          label: 'Menderita & Mengungsi',
          sublabel: 'Total Pengungsi Wilayah',
          value: regionStats.pengungsi >= 1_000_000
            ? (regionStats.pengungsi / 1_000_000).toFixed(1) + ' Jt'
            : regionStats.pengungsi.toLocaleString('id'),
          unit: 'jiwa',
          icon: <Tent className="w-5 h-5 text-emerald-600" /> as CardIcon,
          accentBg: 'bg-emerald-50',
          accentBorder: 'group-hover:border-emerald-400',
          accentText: 'text-emerald-700',
          trend: 'berdasarkan data wilayah',
          trendUp: false,
        },
        {
          id: 'rumah',
          label: 'Kerusakan Rumah',
          sublabel: 'Rusak/Terendam Wilayah',
          value: regionStats.rumah_terdampak > 0
            ? regionStats.rumah_terdampak.toLocaleString('id')
            : '—',
          unit: regionStats.rumah_terdampak > 0 ? 'unit' : '',
          icon: <Home className="w-5 h-5 text-[#19506e]" /> as CardIcon,
          accentBg: 'bg-[#19506e]/10',
          accentBorder: 'group-hover:border-[#19506e]',
          accentText: 'text-[#19506e]',
          trend: regionStats.rumah_terdampak > 0 ? 'berdasarkan data wilayah' : 'data lokal terbatas',
          trendUp: true,
        },
      ]
    : NATIONAL_CARDS.map((c) => ({
        id: c.id,
        label: c.label,
        sublabel: c.sublabel,
        value: c.getValue(),
        unit: c.unit,
        icon: c.icon,
        accentBg: c.accentBg,
        accentBorder: c.accentBorder,
        accentText: c.accentText,
        trend: c.getTrend(),
        trendUp: c.trendUp,
      }));

  const REHAB_ROWS = [
    { provinsi: 'Aceh', program: 5240, a2026: 'Rp 24.413.584.187.060', a2027: 'Rp 18.700.109.534.662', a2028: 'Rp 15.884.670.865.237', total: 'Rp 58.998.364.586.959' },
    { provinsi: 'Sumatera Utara', program: 1971, a2026: 'Rp 8.968.931.090.944', a2027: 'Rp 7.996.217.522.392', a2028: 'Rp 6.450.248.696.599', total: 'Rp 23.415.397.309.935' },
    { provinsi: 'Sumatera Barat', program: 4791, a2026: 'Rp 7.856.905.150.891', a2027: 'Rp 5.816.725.182.105', a2028: 'Rp 8.650.463.097.458', total: 'Rp 22.324.093.430.454' },
  ];

  return (
    <div className="space-y-3">
      {/* Region filter header notification if active */}
      {regionLabel && (
        <div className="flex items-center justify-between bg-[#1f8080]/10 border border-[#1f8080]/30 rounded-xl px-4 py-2 text-xs text-[#19506e]">
          <div className="flex items-center gap-2 font-medium">
            <MapPin className="w-4 h-4 text-[#1f8080]" />
            <span>Menampilkan data statistik khusus: <strong className="font-bold text-[#19506e]">{regionLabel}</strong></span>
          </div>
          {onClearRegion && (
            <button
              onClick={onClearRegion}
              className="text-xs font-semibold text-[#1f8080] hover:underline"
            >
              Reset ke Data Nasional ✕
            </button>
          )}
        </div>
      )}

      {/* Grid of Stat Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${showRehab ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        {showRehab && (
          <div
            onClick={() => setShowRehabModal(true)}
            className="group relative bg-white border border-emerald-300 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden border-l-4 border-l-emerald-500"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Rehab-Rekon Total
                </span>
                <h3 className="text-xs font-bold text-slate-700 leading-tight mt-0.5">
                  Anggaran Alokasi
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-emerald-700 tracking-tight leading-none">
                Rp 104,7 T
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-medium">
              <span>Akumulasi 2026–2028</span>
              <span>Rincian ➔</span>
            </div>
          </div>
        )}

        {cards.map((card) => (
          <div
            key={card.id}
            className={`group relative bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default overflow-hidden ${card.accentBorder}`}
          >
            {/* Subtle top accent bar on hover */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:${card.accentBg} transition-colors`} />

            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  {card.sublabel}
                </span>
                <h3 className="text-xs font-bold text-slate-700 leading-tight">
                  {card.label}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl ${card.accentBg} shrink-0 transition-transform group-hover:scale-110 duration-200`}>
                {card.icon}
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-[#19506e] transition-colors">
                {card.value}
              </span>
              {card.unit && (
                <span className="text-xs font-semibold text-slate-500">
                  {card.unit}
                </span>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 truncate max-w-[170px]">
                {card.trend}
              </span>
              <div className="flex items-center gap-1 font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Details if Rehab selected */}
      {showRehabModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Alokasi Rehab-Rekon Per Provinsi</h3>
              <button onClick={() => setShowRehabModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-2.5">Provinsi</th>
                    <th className="p-2.5">Program</th>
                    <th className="p-2.5">2026</th>
                    <th className="p-2.5">2027</th>
                    <th className="p-2.5">2028</th>
                    <th className="p-2.5 text-emerald-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {REHAB_ROWS.map((r) => (
                    <tr key={r.provinsi} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-semibold text-slate-800">{r.provinsi}</td>
                      <td className="p-2.5 text-slate-600">{r.program}</td>
                      <td className="p-2.5 text-slate-600">{r.a2026}</td>
                      <td className="p-2.5 text-slate-600">{r.a2027}</td>
                      <td className="p-2.5 text-slate-600">{r.a2028}</td>
                      <td className="p-2.5 font-bold text-emerald-600">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
