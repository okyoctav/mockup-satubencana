'use client';

import Link from 'next/link';
import {
  Activity,
  Flame,
  CloudLightning,
  Mountain,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface MetricItem {
  id: string;
  label: string;
  title: string;
  desc: string;
  status: string;
  statusColor: string;
  icon: typeof Activity;
  href: string;
  tag: string;
}

const METRICS: MetricItem[] = [
  {
    id: 'bnpb',
    label: 'Walidata Bencana Nasional',
    title: 'DIBI & Katalog Bencana',
    desc: 'Rekam jejak kejadian bencana terintegrasi standar nasional BNPB.',
    status: 'Sinkronisasi Otomatis',
    statusColor: 'bg-emerald-500',
    icon: Activity,
    href: '/analisis-data',
    tag: 'BNPB Verified',
  },
  {
    id: 'bmkg',
    label: 'Peringatan Dini & Nowcasting',
    title: 'Sensor Cuaca & Gempa Real-Time',
    desc: 'Pemantauan gempa bumi terkini, cuaca ekstrem, dan peringatan dini BMKG.',
    status: 'Live Feed Aktif',
    statusColor: 'bg-sky-500',
    icon: CloudLightning,
    href: '/analisis-data',
    tag: 'EWS BMKG',
  },
  {
    id: 'firms',
    label: 'Sensor Satelit & Karhutla',
    title: 'NASA FIRMS & SIPONGI',
    desc: 'Deteksi sebaran titik panas (hotspot) satelit MODIS & VIIRS di seluruh Indonesia.',
    status: 'Update Tiap Jam',
    statusColor: 'bg-amber-500',
    icon: Flame,
    href: '/analisis-data',
    tag: 'Satelit Satuan',
  },
  {
    id: 'pvmbg',
    label: 'Pemantauan Vulkanologi',
    title: 'Aktivitas Gunung Api',
    desc: 'Data status tingkat aktivitas magma dan pos pengamatan gunung api PVMBG.',
    status: 'Siaga & Waspada',
    statusColor: 'bg-rose-500',
    icon: Mountain,
    href: '/analisis-data',
    tag: 'Magma Indonesia',
  },
  {
    id: 'big',
    label: 'Infrastruktur Geospasial',
    title: 'MVT & PMTiles Vector Layer',
    desc: 'Rendering ratusan ribu titik geotagging & batas administrasi BIG tanpa lag.',
    status: 'PMTiles Ready',
    statusColor: 'bg-indigo-500',
    icon: Layers,
    href: '/dashboard',
    tag: 'Standar BIG',
  },
];

export default function LiveDisasterBar() {
  return (
    <section className="relative w-full py-8 sm:py-10 border-y border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/60 text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>PEMANTAUAN MULTI-SENSOR TERPADU</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Status Walidata & Intelijen Bencana Real-Time
            </h2>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Terhubung API K/L Terverifikasi</span>
          </div>
        </div>

        {/* 5-Column Grid Status Cards (Data-Dense Dashboard Pattern) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {METRICS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/70 p-4 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <div>
                  {/* Top Bar with Icon and Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <Icon className="w-4.5 h-4.5 stroke-[2.2]" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.statusColor}`} />
                      <span>{item.status}</span>
                    </div>
                  </div>

                  {/* Tag & Title */}
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {item.label}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    {item.desc}
                  </p>
                </div>

                {/* Bottom Footer */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold">
                    {item.tag}
                  </span>
                  <div className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Lihat</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
