'use client';

import Image from 'next/image';
import { Calendar, User, ArrowRight, Tag, Bookmark, Share2 } from 'lucide-react';

const BLOG_POSTS = [
  {
    id: 1,
    category: 'Sistem Peringatan Dini (EWS)',
    tagColor: '#0EA5E9',
    title: 'Integrasi Pemodelan Spasial AI 9Router & Data Terpadu Dukcapil K5 dalam Mitigasi Bencana Nasional',
    excerpt: 'Bagaimana arsitektur K5 menggabungkan simulasi demografi mikro, peta dasar RBI 5K BIG, dan AI LLM 16.384 token untuk mempercepat keputusan tanggap darurat saat Pra, Saat, dan Pasca Bencana.',
    author: 'Tim Geospasial BNPB',
    date: '18 Agustus 2026',
    readTime: '6 menit baca',
    image: '/images/blog/featured.jpg',
    featured: true,
  },
  {
    id: 2,
    category: 'Teknologi AI & Prediksi',
    tagColor: '#22C55E',
    title: 'Penerapan Digital Twin & AI Predictive Analytics untuk Simulasi Risiko Banjir Bandang',
    excerpt: 'Studi kasus penggunaan model elevasi 3D dan data curah hujan BMKG 10 hari dalam mengestimasi wilayah terdampak secara real-time.',
    author: 'Pusat Riset Kebencanaan',
    date: '15 Agustus 2026',
    readTime: '4 menit baca',
    image: '/images/blog/early_warning.jpg',
    featured: false,
  },
  {
    id: 3,
    category: 'Logistik & Evakuasi',
    tagColor: '#F59E0B',
    title: 'Optimasi Rute Evakuasi & Dispersi Logistik Darurat Menggunakan OSRM Routing Engine',
    excerpt: 'Menghitung waktu tempuh tercepat, estimasi bahan bakar armada truk, dan jalur aman antar posko bantuan utama.',
    author: 'Subdit Logistik & Perbekalan',
    date: '12 Agustus 2026',
    readTime: '5 menit baca',
    image: '/images/blog/logistics.jpg',
    featured: false,
  },
  {
    id: 4,
    category: 'Sistem Geospasial',
    tagColor: '#A855F7',
    title: 'Visualisasi Multi-Layer RBI 5K Sulawesi 2024 & Hak Atas Tanah (ATR/BPN)',
    excerpt: 'Penataan 37 sub-layer peta dasar BIG dan analisis kepemilikan tanah AHT untuk transparansi pemulihan pasca bencana.',
    author: 'Direktorat Informasi Geospasial',
    date: '10 Agustus 2026',
    readTime: '5 menit baca',
    image: '/images/blog/gis_mapping.jpg',
    featured: false,
  },
];

export default function MapSection() {
  const featuredPost = BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];
  const gridPosts = BLOG_POSTS.filter((p) => !p.featured);

  return (
    <section id="peta" className="relative py-24 px-6 overflow-hidden" style={{ background: 'var(--bg-section)' }}>
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#0EA5E9]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="mb-14 text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] text-xs font-bold tracking-widest uppercase">
            <Tag className="w-3.5 h-3.5" />
            <span>SECTION 02 · Wawasan & Berita Kebencanaan</span>
          </div>
          <h2 className="text-3.5xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Wawasan Kritis{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #0EA5E9, #22C55E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Kebencanaan & Geospasial
            </span>
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Publikasi majalah digital terbaru mengenai teknologi AI 9Router, analisis spasial K5, dan manajemen darurat pra-saat-pasca bencana.
          </p>
        </div>

        {/* 1. LARGE FEATURED POST AT THE TOP */}
        <div className="mb-12 group">
          <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12">
            {/* Image Container */}
            <div className="lg:col-span-7 relative min-h-[320px] lg:min-h-[440px] overflow-hidden">
              <Image
                src={featuredPost.image}
                alt={featuredPost.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent lg:hidden" />
              <div className="absolute top-4 left-4 z-10">
                <span
                  className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white shadow-lg backdrop-blur-md"
                  style={{ backgroundColor: featuredPost.tagColor }}
                >
                  🔥 Laporan Utama
                </span>
              </div>
            </div>

            {/* Content Container */}
            <div className="lg:col-span-5 p-7 lg:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="text-[#0EA5E9] font-bold">{featuredPost.category}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <span>•</span>
                  <span>{featuredPost.readTime}</span>
                </div>

                <h3 className="text-xl lg:text-2.5xl font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-[#0EA5E9] transition-colors">
                  {featuredPost.title}
                </h3>

                <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 flex items-center justify-center text-[#0EA5E9] font-bold text-xs">
                    BNPB
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{featuredPost.author}</span>
                    <span className="text-[10px] text-slate-400">Tim Riset Utama</span>
                  </div>
                </div>

                <button className="px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 hover:translate-x-1">
                  <span>Baca Selengkapnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SMALLER POST CARDS ARRANGED IN A GRID BENEATH */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {gridPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      className="px-3 py-1 rounded-lg text-[10px] font-bold text-white shadow-md backdrop-blur-md"
                      style={{ backgroundColor: post.tagColor }}
                    >
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>{post.date}</span>
                    </div>
                    <span>{post.readTime}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#0EA5E9] transition-colors">
                    {post.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 mt-4">
                <div className="flex items-center gap-2 pt-4">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{post.author}</span>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-[#0EA5E9] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-[#0EA5E9] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
