'use client';

import Link from 'next/link';
import {
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { DEFAULT_DASHBOARD_PATH } from '@/lib/routes';

const FOOTER_LINKS = {
  Navigasi: [
    { label: 'Beranda Utama', href: '/' },
    { label: 'Impact Assessment Dashboard', href: DEFAULT_DASHBOARD_PATH },
    { label: 'Basis Data Kebencanaan', href: '/analisis-data' },
    { label: 'Sejarah Kebencanaan', href: '/sejarah-kebencanaan' },
    { label: 'Simulasi & Modeling', href: '/simulasi-modeling' },
    { label: 'Informasi Mitra', href: '/informasi-mitra' },
  ],
  'Sumber Walidata': [
    { label: 'Portal Data BNPB (DIBI)', href: 'https://dibi.bnpb.go.id' },
    { label: 'Early Warning BMKG', href: 'https://bmkg.go.id' },
    { label: 'Geoportal BIG (Ina-Geoportal)', href: 'https://tanahair.indonesia.go.id' },
    { label: 'Magma Indonesia PVMBG', href: 'https://magma.esdm.go.id' },
    { label: 'SIPONGI Karhutla KLHK', href: 'https://sipongi.menlhk.go.id' },
  ],
  Layanan: [
    { label: 'Unduh Dokumen Metodologi', href: '/api/download-metodologi-docx' },
    { label: 'API Testing & Integrasi', href: '/api-testing' },
    { label: 'Panduan Penggunaan GIS', href: '/informasi-mitra' },
    { label: 'Portal Administrasi', href: '/admin' },
  ],
};

export default function FooterSection() {
  return (
    <footer className="relative pt-16 pb-10 bg-slate-100 dark:bg-slate-950 border-t border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400">
      
      {/* Decorative Top Accent Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-0.5 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #2563EB, #059669, transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-14">
          
          {/* Brand & Mandate (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo/logo_mdb.png"
                alt="Logo Manajemen Data Bencana"
                style={{ height: 38, width: 'auto', objectFit: 'contain' }}
              />
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
              <img
                src="/logo/Logo_kewilayahan.png"
                alt="Logo Kedeputian Pembangunan Kewilayahan"
                style={{ height: 30, width: 'auto', objectFit: 'contain' }}
              />
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Platform intelijen geospasial terpadu untuk manajemen data bencana nasional. Mendukung orkestrasi perencanaan pembangunan kewilayahan yang tangguh dari prabencana, tanggap darurat, hingga pascabencana.
            </p>

            {/* Institution Badge */}
            <div className="pt-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Penyelenggara Sistem:
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                Kedeputian Pembangunan Kewilayahan
              </p>
            </div>

            {/* Operational Status */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Operasional · Sinkronisasi 24/7</span>
            </div>
          </div>

          {/* Links Columns (3 Cols) */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => {
                  const isExternal = link.href.startsWith('http');
                  return (
                    <li key={link.label}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <span>{link.label}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom Strip: Copyright & Disclaimers */}
        <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} Satu Bencana · Kedeputian Pembangunan Kewilayahan. Seluruh hak cipta dilindungi undang-undang.
          </p>

          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Standar Satu Data Indonesia</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link href="/informasi-mitra" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Kebijakan Data
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
