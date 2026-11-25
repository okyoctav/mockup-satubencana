'use client';

import { ExternalLink, Building2, ShieldCheck } from 'lucide-react';

interface Partner {
  name: string;
  fullName: string;
  role: string;
  tag: string;
  url: string;
  logo: string;
}

const PARTNERS: Partner[] = [
  {
    name: 'BNPB',
    fullName: 'Badan Nasional Penanggulangan Bencana',
    role: 'Walidata Bencana Nasional & Kebijakan Penanggulangan',
    tag: 'Walidata Nasional',
    url: 'https://bnpb.go.id',
    logo: '/logo/logo_bnpb.png',
  },
  {
    name: 'BMKG',
    fullName: 'Badan Meteorologi, Klimatologi, dan Geofisika',
    role: 'Penyedia Peringatan Dini Cuaca, Iklim, Gempa & Tsunami',
    tag: 'Early Warning System',
    url: 'https://bmkg.go.id',
    logo: '/logo/logo_bmkg.png',
  },
  {
    name: 'BIG',
    fullName: 'Badan Informasi Geospasial',
    role: 'Penyelenggara Informasi Geospasial Dasar (IGD) & Peta NKRI',
    tag: 'Standar Geospasial',
    url: 'https://big.go.id',
    logo: '/logo/logo_big.png',
  },
  {
    name: 'PVMBG / KESDM',
    fullName: 'Pusat Vulkanologi & Mitigasi Bencana Geologi',
    role: 'Pemantauan Aktivitas Gunung Api & Kerentanan Gerakan Tanah',
    tag: 'Vulkanologi & Magma',
    url: 'https://vsi.esdm.go.id',
    logo: '/logo/pvmbg.png',
  },
  {
    name: 'Bappenas',
    fullName: 'Kementerian PPN / Bappenas',
    role: 'Perencanaan Pembangunan Nasional & Ketahanan Wilayah',
    tag: 'Perencanaan Wilayah',
    url: 'https://bappenas.go.id',
    logo: '/logo/logo bappenas.png',
  },
  {
    name: 'Kemendagri',
    fullName: 'Kementerian Dalam Negeri',
    role: 'Penguatan Kapasitas Penyelenggaraan Bencana di Daerah & BPBD',
    tag: 'Otonomi & Daerah',
    url: 'https://kemendagri.go.id',
    logo: '/logo/logo_kemendagri.png',
  },
];

export default function MitraSection() {
  return (
    <section className="relative w-full py-16 sm:py-20 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black tracking-wider uppercase">
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>KOLABORASI & SATU DATA INDONESIA</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Ekosistem Walidata & Kementerian / Lembaga Mitra
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Didukung oleh sinergi antar-lembaga pemerintah untuk memastikan validitas, interoperabilitas, dan keterbukaan data bencana nasional.
          </p>
        </div>

        {/* 6 Partners Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {PARTNERS.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-6 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div>
                {/* Logo and Tag */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="h-12 w-28 flex items-center justify-start">
                    <img
                      src={partner.logo}
                      alt={`Logo ${partner.name}`}
                      className="max-h-11 w-auto max-w-full object-contain filter group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {partner.tag}
                  </span>
                </div>

                {/* Name & Role */}
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {partner.name}
                </h3>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                  {partner.fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                  {partner.role}
                </p>
              </div>

              {/* Bottom Link */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sumber Terverifikasi</span>
                </span>
                <div className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Kunjungi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}
