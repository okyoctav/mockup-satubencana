"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, ArrowLeft, Share2, Check, ChevronRight } from 'lucide-react';

const BLOG_DATA: Record<string, {
  title: string;
  category: string;
  tagColor: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  image: string;
  summary: string;
  sections: { id: string; title: string; content: string }[];
}> = {
  '1': {
    title: 'Integrasi Pemodelan Spasial AI 9Router & Data Terpadu Dukcapil K5 dalam Mitigasi Bencana Nasional',
    category: 'Sistem Peringatan Dini (EWS)',
    tagColor: '#0EA5E9',
    date: '18 Agustus 2026',
    readTime: '6 menit baca',
    author: 'Tim Geospasial BNPB',
    authorRole: 'Subdit Pemodelan Kebencanaan',
    image: '/images/blog/featured.jpg',
    summary: 'Bagaimana arsitektur K5 menggabungkan simulasi demografi mikro, peta dasar RBI 5K BIG, dan AI LLM 16.384 token untuk mempercepat keputusan tanggap darurat saat Pra, Saat, dan Pasca Bencana.',
    sections: [
      {
        id: 'pendahuluan',
        title: '1. Pendahuluan & Latar Belakang Arsitektur K5',
        content: 'Dalam tata kelola bencana modern, kecepatan dan presisi informasi geospasial menjadi penentu utama dalam mengurangi angka fatalitas. Sistem Informasi Kebencanaan K5 mengintegrasikan peta dasar Skala 1:5.000 (RBI 5K BIG) dengan agregasi data kependudukan Dukcapil hingga level Kelurahan/Desa. Sinergi ini memungkinkan petugas posko bencana menghitung estimasi jumlah lansia, balita, disabilitas, dan jumlah keluarga yang terdampak hanya dalam hitungan detik setelah sebuah poligon bencana digambar di canvas peta interaktif.',
      },
      {
        id: 'integrasi-ai-9router',
        title: '2. Pemodelan Spasial AI & 9Router Dynamic Tokens',
        content: 'Integrasi AI LLM via 9Router memberikan terobosan baru dalam penyusunan laporan rekomendasi situasi. Dengan dukungan batas token keluaran hingga 16.384 token (~13.000 kata), sistem AI mampu memproses seluruh konteks demografi mikro dan variabel cuaca BMKG tanpa risiko teks terpotong di tengah jalan. AI secara otomatis menginjeksi data kejadian terkini (seperti jumlah korban, titik koordinat, dan status siaga) ke dalam prompt untuk menghasilkan dokumen rekomendasi aksi darurat secara otomatis.',
      },
      {
        id: 'analisis-pra-bencana',
        title: '3. Simulasi Pra Bencana: Mitigasi & Kesiapsiagaan',
        content: 'Pada tahap Pra Bencana, arsitektur K5 memanfaatkan pemetaan kerentanan berbasis Hexbin Resolution 9 (DTSEN BAPPENAS). Petugas dapat mengidentifikasi area permukiman padat penduduk yang berada di sepanjang garis sesar aktif atau bantaran sungai rawan banjir bandang. Tindakan pencegahan seperti simulasi evakuasi mandiri, penyuluhan warga, dan alokasi logistik pra-bencana dapat diskenariokan secara akurat.',
      },
      {
        id: 'tanggap-darurat',
        title: '4. Fase Saat Bencana: Tanggap Darurat & Penyelamatan',
        content: 'Saat bencana terjadi, layar Peta Utama K5 secara otomatis menampilkan indikator peringatan BMKG Gempa Terkini dan peringatan dini cuaca ekstrim. Fitur OSRM Routing Engine membantu pengemudi armada logistik menemukan jalur tercepat menuju posko pengungsian terdekat dengan kalkulasi konsumsi bahan bakar kendaraan secara akurat.',
      },
      {
        id: 'pemulihan-pasca-bencana',
        title: '5. Pemulihan Pasca Bencana & Transparansi Hak Atas Tanah',
        content: 'Pada tahap Pasca Bencana, pemulihan permukiman warga membutuhkan kepastian hukum. Integrasi layer Hak Atas Tanah (ATR/BPN Sulawesi) memungkinkan tim verifikasi mengidentifikasi batas kepemilikan tanah Hak Milik, Hak Pakai, dan Hak Pengelolaan warga yang terdampak, sehingga program bantuan rekonstruksi rumah tepat sasaran dan bebas sengketa.',
      },
      {
        id: 'kesimpulan',
        title: '6. Kesimpulan & Rekomendasi Masa Depan',
        content: 'Penerapan Sistem Kebencanaan K5 membuktikan bahwa kolaborasi antar-lembaga (BNPB, BAPPENAS, BIG, BMKG, Kemendagri, dan ATR/BPN) yang didukung oleh teknologi geospasial cerdas dan AI dapat meningkatkan kesiapsiagaan bangsa Indonesia dalam menghadapi bencana di masa depan.',
      },
    ],
  },
  '2': {
    title: 'Penerapan Digital Twin & AI Predictive Analytics untuk Simulasi Risiko Banjir Bandang',
    category: 'Teknologi AI & Prediksi',
    tagColor: '#22C55E',
    date: '15 Agustus 2026',
    readTime: '4 menit baca',
    author: 'Pusat Riset Kebencanaan',
    authorRole: 'Laboratorium Digital Twin',
    image: '/images/blog/early_warning.jpg',
    summary: 'Studi kasus penggunaan model elevasi 3D dan data curah hujan BMKG 10 hari dalam mengestimasi wilayah terdampak secara real-time.',
    sections: [
      {
        id: 'konsep-digital-twin',
        title: '1. Konsep Digital Twin Topografi 3D',
        content: 'Digital Twin topografi memanfaatkan data citra satelit dan Digital Terrain Model (DTM) untuk merepresentasikan kondisi kontur permukaan bumi secara presisi tinggi dalam bentuk 3D digital.',
      },
      {
        id: 'simulasi-curah-hujan',
        title: '2. Simulasi Curah Hujan BMKG 10 Hari',
        content: 'Dengan mengintegrasikan data prakiraan curah hujan 10 hari BMKG, model AI dapat mensimulasikan debit limpasan air hujan di daerah aliran sungai (DAS) dan memprediksi genangan banjir.',
      },
      {
        id: 'rekomendasi-evakuasi',
        title: '3. Rekomendasi Evakuasi & Mitigasi Risiko',
        content: 'Hasil simulasi risiko banjir memberikan peringatan dini otomatis kepada masyarakat di zona bahaya untuk segera melakukan evakuasi mandiri sebelum luapan air mencapai permukiman.',
      },
    ],
  },
  '3': {
    title: 'Optimasi Rute Evakuasi & Dispersi Logistik Darurat Menggunakan OSRM Routing Engine',
    category: 'Logistik & Evakuasi',
    tagColor: '#F59E0B',
    date: '12 Agustus 2026',
    readTime: '5 menit baca',
    author: 'Subdit Logistik & Perbekalan',
    authorRole: 'Manajemen Rantai Pasok',
    image: '/images/blog/logistics.jpg',
    summary: 'Menghitung waktu tempuh tercepat, estimasi bahan bakar armada truk, dan jalur aman antar posko bantuan utama.',
    sections: [
      {
        id: 'tantangan-distribusi',
        title: '1. Tantangan Distribusi Logistik Darurat',
        content: 'Kerusakan infrastruktur jalan dan jembatan akibat gempa atau banjir sering kali menghambat pengiriman bantuan medis dan makanan bagi korban selamat.',
      },
      {
        id: 'algoritma-osrm',
        title: '2. Algoritma OSRM Fast Routing Engine',
        content: 'Teknologi OSRM memproses jaringan jalan OpenStreetMap secara waktu nyata untuk menghitung rute alternatif tercepat dan teraman dari gudang logistik ke posko pengungsian.',
      },
      {
        id: 'efisiensi-bahan-bakar',
        title: '3. Estimasi Bahan Bakar & Armada Truk',
        content: 'Kalkulasi kebutuhan BBM dan kapasitas tonase kendaraan memastikan efisiensi distribusi bantuan logistik tanpa hambatan kelangkaan bahan bakar di daerah bencana.',
      },
    ],
  },
  '4': {
    title: 'Visualisasi Multi-Layer RBI 5K Sulawesi 2024 & Hak Atas Tanah (ATR/BPN)',
    category: 'Sistem Geospasial',
    tagColor: '#A855F7',
    date: '10 Agustus 2026',
    readTime: '5 menit baca',
    author: 'Direktorat Informasi Geospasial',
    authorRole: 'Subdit Peta Dasar',
    image: '/images/blog/gis_mapping.jpg',
    summary: 'Penataan 37 sub-layer peta dasar BIG dan analisis kepemilikan tanah AHT untuk transparansi pemulihan pasca bencana.',
    sections: [
      {
        id: 'peta-dasar-big',
        title: '1. Peta Dasar Skala 1:5.000 Sulawesi 2024',
        content: 'Peta Dasar RBI 5K BIG menyajikan detail geospasial tingkat tinggi mencakup garis pantai, batas wilayah administrasi, jaringan transportasi, hipsografi kontur, dan penutup lahan.',
      },
      {
        id: 'layer-atr-bpn',
        title: '2. Integrasi Layer Hak Atas Tanah ATR/BPN',
        content: 'Peta Hak Atas Tanah (AHT) ATR/BPN Se-Sulawesi memberikan data kepemilikan lahan yang transparan untuk mempercepat pemulihan ekonomi dan pembangunan kembali kawasan bencana.',
      },
    ],
  },
};

export default function BlogDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';
  const post = BLOG_DATA[id] || BLOG_DATA['1'];

  const [activeSection, setActiveSection] = useState(post.sections[0]?.id || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (const sec of post.sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post.sections]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/#peta"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Wawasan Kebencanaan</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-[#0EA5E9] hover:text-white dark:hover:bg-[#0EA5E9] transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Banner / Article Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-12 px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="px-3.5 py-1 rounded-xl text-xs font-extrabold text-white shadow-md"
              style={{ backgroundColor: post.tagColor }}
            >
              {post.category}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{post.readTime}</span>
          </div>

          <h1 className="text-2.5xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {post.title}
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            {post.summary}
          </p>

          <div className="pt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 flex items-center justify-center text-[#0EA5E9] font-bold text-xs">
                BNPB
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{post.author}</span>
                <span className="text-[10px] text-slate-400">{post.authorRole}</span>
              </div>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span>{post.date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content Layout: Sticky Table of Contents Sidebar + Main Reading Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* STICKY TABLE OF CONTENTS SIDEBAR (LEFT 30% / 4 COLS) */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9] animate-pulse" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Daftar Isi Artikel (Scrollspy)
                </h3>
              </div>

              <nav className="space-y-1 text-xs">
                {post.sections.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="block py-2.5 px-3 rounded-xl font-medium transition-all flex items-center justify-between"
                    >
                      <span className="truncate">{sec.title}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                    </a>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span>💡 Halaman otomatis menyorot bab yang sedang Anda baca.</span>
              </div>
            </div>
          </aside>

          {/* MAIN ARTICLE READING CONTENT (RIGHT 70% / 8 COLS) */}
          <main className="lg:col-span-8 space-y-10">
            {/* Featured Image */}
            <div className="relative h-72 md:h-[400px] w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
              <Image src={post.image} alt={post.title} fill className="object-cover" priority />
            </div>

            {/* Content Sections */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-sm space-y-10">
              {post.sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="scroll-mt-28 space-y-4">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                    {sec.title}
                  </h2>
                  <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                    {sec.content}
                  </p>
                </section>
              ))}
            </div>

            {/* Back Button Footer */}
            <div className="pt-6 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
              <Link
                href="/#peta"
                className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-[#0EA5E9] hover:text-white dark:hover:bg-[#0EA5E9] text-xs font-bold text-slate-700 dark:text-slate-300 transition-all inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Beranda Kebencanaan</span>
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
