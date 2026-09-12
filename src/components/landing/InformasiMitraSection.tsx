'use client';

import { useState } from 'react';
import {
  Building2,
  ExternalLink,
  ShieldAlert,
  FileText,
  PhoneCall,
  CheckCircle2,
  Layers,
  Sparkles,
  BookOpen,
  Database,
  ArrowRight
} from 'lucide-react';

const MITRA_LIST = [
  {
    nama: 'BNPB',
    kepanjangan: 'Badan Nasional Penanggulangan Bencana',
    deskripsi: 'Lembaga pemerintah nonkementerian yang melaksanakan tugas penanggulangan bencana di Indonesia secara terencana, terpadu, dan menyeluruh.',
    url: 'https://bnpb.go.id',
    logo: '/logo/logo_bnpb.png',
    tag: 'Walidata Bencana Nasional',
    status: 'Terhubung Real-Time',
    color: '#0EA5E9'
  },
  {
    nama: 'BMKG',
    kepanjangan: 'Badan Meteorologi, Klimatologi, dan Geofisika',
    deskripsi: 'Penyedia data pengamatan meteorologi, klimatologi, kualitas udara, gempa bumi, serta sistem peringatan dini tsunami nasional.',
    url: 'https://bmkg.go.id',
    logo: '/logo/logo_bmkg.png',
    tag: 'Sistem Peringatan Dini',
    status: 'API Early Warning Active',
    color: '#10B981'
  },
  {
    nama: 'PVMBG / KESDM',
    kepanjangan: 'Pusat Vulkanologi dan Mitigasi Bencana Geologi',
    deskripsi: 'Unit kerja di bawah KESDM yang memantau tingkat aktivitas gunung api, pemetaan zona kerentanan bencana geologi, dan tanah longsor.',
    url: 'https://vsi.esdm.go.id',
    logo: '/logo/logo_bnpb.png',
    tag: 'Pemantauan Vulkanologi',
    status: 'Update Aktivitas Magma',
    color: '#F59E0B'
  },
  {
    nama: 'BIG',
    kepanjangan: 'Badan Informasi Geospasial',
    deskripsi: 'Penyelenggara Informasi Geospasial Dasar (IGD) yang menetapkan standar peta rupa bumi, batas wilayah, dan geoportal nasional.',
    url: 'https://big.go.id',
    logo: '/logo/logo_big.png',
    tag: 'Standardisasi Geospasial',
    status: 'Geoportal RupaBumi',
    color: '#6366F1'
  },
  {
    nama: 'BRIN',
    kepanjangan: 'Badan Riset dan Inovasi Nasional',
    deskripsi: 'Pusat riset dan inovasi teknologi kebumian, pemodelan simulasi dampak bencana, dan analisis penginderaan jauh satelit.',
    url: 'https://brin.go.id',
    logo: '/logo/logo_brin.png',
    tag: 'Riset & Teknologi Satelit',
    status: 'Inovasi Riset Aktif',
    color: '#EC4899'
  },
  {
    nama: 'Kemendagri / BPBD',
    kepanjangan: 'Kementerian Dalam Negeri & BPBD Provinsi/Kabupaten',
    deskripsi: 'Koordinasi lintas pemerintah daerah dan penguatan kapasitas Satuan Tugas BPBD dalam penanganan logistik dan pengungsian.',
    url: 'https://kemendagri.go.id',
    logo: '/logo/logo_kemendagri.png',
    tag: 'Koordinasi Daerah',
    status: '38 Provinsi Terkoordinasi',
    color: '#8B5CF6'
  },
];

const INFORMASI_PANDUAN = [
  {
    id: 'standar-data',
    title: 'Standar & Integrasi Data Geospasial',
    icon: Database,
    content: 'Seluruh data bencana yang disajikan pada portal SatuBencana dikumpulkan sesuai standar ISO 19115 (Geographic Information) dan format GeoJSON/SHP resmi. Data dikurasi dari BNPB, BMKG, dan BPBD Daerah untuk memastikan akurasi spasial dan temporal.'
  },
  {
    id: 'sistem-peringatan',
    title: 'Prosedur Early Warning & Notifikasi Darurat',
    icon: ShieldAlert,
    content: 'Integrasi sistem peringatan dini gempa bumi dan tsunami BMKG terhubung melalui protokol WSS / REST API. Notifikasi sirine dan pengumuman tanggap darurat disalurkan secara real-time ke posko BPBD wilayah terdampak.'
  },
  {
    id: 'kebijakan-akses',
    title: 'Kebijakan Data Terbuka (Open Data Policy)',
    icon: FileText,
    content: 'Portal SatuBencana mendukung prinsip Open Government Data. Peneliti, akademisi, dan publik dapat memanfaatkan data agregat kerentanan bencana untuk keperluan kajian riset dan mitigasi non-komersial.'
  },
  {
    id: 'layanan-darurat',
    title: 'Kontak Darurat & Posko Pengaduan 117',
    icon: PhoneCall,
    content: 'Untuk laporan kejadian bencana darurat atau verifikasi informasi lapangan, silakan hubungi Call Center Bencana BNPB melalui nomor bebas pulsa 117 atau posko BPBD provinsi setempat yang siaga 24/7.'
  }
];

const STATS_DATA = [
  { label: 'Instansi Mitra Terhubung', value: '12+', icon: Building2, color: 'text-sky-500' },
  { label: 'Cakupan Wilayah Spasial', value: '38 Provinsi', icon: Layers, color: 'text-emerald-500' },
  { label: 'Status Integrasi System', value: 'Realtime 24/7', icon: CheckCircle2, color: 'text-indigo-500' },
  { label: 'Kategori Kejadian Terdata', value: '8 Jenis Bencana', icon: ShieldAlert, color: 'text-amber-500' },
];

export default function InformasiMitraSection() {
  const [activeTab, setActiveTab] = useState(INFORMASI_PANDUAN[0].id);

  return (
    <div className="w-full min-h-screen pb-16 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* 1. HERO BANNER HEADER */}
      <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[rgb(25,79,112)]/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[rgb(25,79,112)]/10 dark:bg-sky-500/20 border border-[rgb(25,79,112)]/20 dark:border-sky-500/40 text-[rgb(25,79,112)] dark:text-sky-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Pusat Informasi Publik & Jejaring Kemitraan Strategis</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Kemitraan Terpadu Penanggulangan Bencana Indonesia
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            Menghubungkan data geospasial presisi, sistem peringatan dini, dan kebijakan mitigasi bencana lintas Kementerian/Lembaga nasional untuk keselamatan masyarakat.
          </p>

          <div className="pt-2 flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 text-xs font-extrabold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              API Feed Live: BNPB · BMKG · BIG · PVMBG · BRIN
            </span>
          </div>
        </div>
      </div>

      {/* 2. STATISTIK KEMITRAAN BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS_DATA.map((st) => (
          <div
            key={st.label}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors"
          >
            <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${st.color}`}>
              <st.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {st.value}
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {st.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. MITRA UTAMA & LEMBAGA TERHUBUNG */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[rgb(25,79,112)] dark:text-sky-400" />
              <span>Mitra Instansi & Organisasi Terkait</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Integrasi walidata geospasial dan sumber informasi kebumian nasional resmi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MITRA_LIST.map((m) => (
            <div
              key={m.nama}
              className="group rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.logo}
                      alt={`Logo ${m.nama}`}
                      className="h-10 w-auto object-contain shrink-0"
                    />
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white transition-colors group-hover:text-[rgb(25,79,112)] dark:group-hover:text-sky-400">
                        {m.nama}
                      </h3>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {m.tag}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 line-clamp-1 mb-1">
                    {m.kepanjangan}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 font-normal leading-relaxed">
                    {m.deskripsi}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{m.status}</span>
                </span>

                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[rgb(25,79,112)] dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Portal Resmi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. INFORMASI PUBLIK & STANDAR PANDUAN */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[rgb(25,79,112)] dark:text-sky-400" />
            <span>Informasi Publik & Pedoman Data Kebencanaan</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Panduan teknis, tata kelola data terbuka, dan saluran pengaduan resmi
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Tab Navigation */}
          <div className="lg:col-span-4 space-y-2">
            {INFORMASI_PANDUAN.map((item) => {
              const isActive = activeTab === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all font-bold text-xs flex items-center justify-between border ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/40 text-[rgb(25,79,112)] dark:text-sky-300 border-[rgb(25,79,112)]/30 dark:border-sky-500/40 shadow-sm'
                      : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className={`w-4 h-4 ${isActive ? 'text-[rgb(25,79,112)] dark:text-sky-400' : 'text-slate-400 dark:text-slate-400'}`} />
                    <span>{item.title}</span>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${isActive ? 'opacity-100 text-[rgb(25,79,112)] dark:text-sky-400' : 'opacity-0'}`} />
                </button>
              );
            })}
          </div>

          {/* Active Tab Content Card */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 transition-colors">
            {INFORMASI_PANDUAN.filter(i => i.id === activeTab).map((curr) => {
              const IconComp = curr.icon;
              return (
                <div key={curr.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[rgb(25,79,112)] dark:text-sky-400 shadow-sm">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {curr.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed font-normal text-slate-600 dark:text-slate-300">
                    {curr.content}
                  </p>
                </div>
              );
            })}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">Dokumen Publikasi Resmi 2026</span>
              <a
                href="https://bnpb.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[rgb(25,79,112)] dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>Unduh Pedoman PDF</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FOOTER COPY */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          © 2026 SatuBencana — Sistem Informasi Geospasial & Kemitraan Kebencanaan Nasional.
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-500">
          Diperbarui secara berkala melalui pengintegrasian API Badan Nasional Penanggulangan Bencana (BNPB).
        </p>
      </div>
    </div>
  );
}
