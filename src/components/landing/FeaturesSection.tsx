'use client';

import Link from 'next/link';
import {
  Users,
  Layers,
  TrendingUp,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface FeatureCard {
  id: string;
  badge: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  icon: typeof Users;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

const FEATURES: FeatureCard[] = [
  {
    id: 'rapid-assessment',
    badge: 'Kaji Cepat Dampak',
    title: 'Estimasi Cepat Area Terdampak & Demografi',
    description:
      'Perhitungan instan jumlah jiwa, kepala keluarga, kelompok rentan (anak-anak, balita, dan lansia), serta status hak atas tanah (ATR/BPN) berbasis polygon seleksi spasial.',
    bullets: [
      'Agregasi demografi jiwa terdampak presisi',
      'Pemilahan usia spesifik balita & lansia',
      'Sinkronisasi hak atas tanah Kementerian ATR/BPN',
    ],
    ctaLabel: 'Buka Impact Assessment',
    ctaHref: '/dashboard',
    icon: Users,
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    accentBorder: 'border-emerald-200 dark:border-emerald-900/60',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'webgis-pmtiles',
    badge: 'Arsitektur Spasial',
    title: 'WebGIS Ringan PMTiles & Vector Tiles',
    description:
      'Pengolahan peta interaktif tanpa hambatan latensi server. Menampilkan ratusan ribu data geotagging (seperti Geotagging Kota Bitung) dan batas wilayah BIG secara instan.',
    bullets: [
      'Format MVT & PMTiles hemat kuota & cepat',
      'Filtering dinamis multi-kategori on-the-fly',
      'Integrasi Geoportal Standar BIG & Satupeta',
    ],
    ctaLabel: 'Eksplorasi Peta Interaktif',
    ctaHref: '/dashboard',
    icon: Layers,
    accentBg: 'bg-blue-50 dark:bg-blue-950/40',
    accentBorder: 'border-blue-200 dark:border-blue-900/60',
    accentText: 'text-blue-700 dark:text-blue-400',
  },
  {
    id: 'simulation-modeling',
    badge: 'Pemodelan Multi-Bahaya',
    title: 'Simulasi Skenario & Kerentanan Wilayah',
    description:
      'Pemodelan spasial dampak bencana secara prediktif, mulai dari luapan hidrometeorologi (Sungai Bengawan Solo) hingga radius bahaya erupsi vulkanologi dan keterpaparan fasilitas pendidikan Dapodik.',
    bullets: [
      'Simulasi ketinggian genangan banjir sungai',
      'Analisis keterpaparan sekolah (Dapodik Kemendikbud)',
      'Pemetaan buffer zona bahaya erupsi gunung api',
    ],
    ctaLabel: 'Uji Simulasi & Modeling',
    ctaHref: '/simulasi-modeling',
    icon: TrendingUp,
    accentBg: 'bg-amber-50 dark:bg-amber-950/40',
    accentBorder: 'border-amber-200 dark:border-amber-900/60',
    accentText: 'text-amber-700 dark:text-amber-400',
  },
  {
    id: 'data-privacy',
    badge: 'Etika & Privasi Data',
    title: 'Sensor Masking & Proteksi Keamanan',
    description:
      'Penerapan standar privasi data kependudukan terdampak bencana melalui sensor animasi blur adaptif dan otentikasi kata sandi terverifikasi untuk membuka data sensitif.',
    bullets: [
      'Animasi blur masking nama lengkap penduduk',
      'Otentikasi keamanan password terverifikasi',
      'Kepatuhan regulasi perlindungan data pribadi',
    ],
    ctaLabel: 'Pelajari Protokol Data',
    ctaHref: '/informasi-mitra',
    icon: Lock,
    accentBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    accentBorder: 'border-indigo-200 dark:border-indigo-900/60',
    accentText: 'text-indigo-700 dark:text-indigo-400',
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative w-full py-16 sm:py-20 bg-slate-50/60 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-black tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>FITUR UNGGULAN SATU BENCANA</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Teknologi Intelijen Spasial & Analitik Dampak Bencana
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Menghubungkan data lintas kementerian dan lembaga dalam satu arsitektur terpadu, mendukung tindakan cepat berbasis bukti ilmiah.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-6 sm:p-8 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className={`w-12 h-12 rounded-2xl ${feat.accentBg} ${feat.accentBorder} border flex items-center justify-center ${feat.accentText} shadow-2xs group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${feat.accentBg} ${feat.accentText} border ${feat.accentBorder}`}>
                      {feat.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2.5">
                    {feat.description}
                  </p>

                  {/* Feature Checkpoints */}
                  <ul className="mt-5 space-y-2 border-t border-slate-100 dark:border-slate-700/60 pt-4">
                    {feat.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Action CTA */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                  <Link
                    href={feat.ctaHref}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors group/link cursor-pointer"
                  >
                    <span>{feat.ctaLabel}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
