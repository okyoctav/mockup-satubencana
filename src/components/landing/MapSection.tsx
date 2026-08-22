"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowRight, Tag, ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import blogData from '@/data/blog.json';


const TESTIMONIALS = [
  {
    id: 1,
    quote: 'Sistem Dashboard K5 memberikan lompatan teknologi luar biasa. Kecepatan simulasi demografi mikro Dukcapil dan peta dasar RBI 5K BIG membantu kami mengambil keputusan taktis tanggap darurat dalam hitungan detik.',
    author: 'Dr. Raditya Jati',
    role: 'Deputi Bidang Sistem & Strategi Kebencanaan BNPB',
    agency: 'Badan Nasional Penanggulangan Bencana',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    id: 2,
    quote: 'Dukungan AI 9Router dengan batas token 16.384 token memungkinkan tim krisis menyusun laporan situasi komprehensif tanpa terpotong. Visualisasi 37 sub-layer BIG sangat presisi!',
    author: 'Ir. Ahmad Subandrio, M.Sc.',
    role: 'Kepala Pusat Data & Informasi Geospasial',
    agency: 'BAPPENAS & Geospatial Taskforce',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    id: 3,
    quote: 'Fitur OSRM Routing Engine & integrasi Hak Atas Tanah ATR/BPN Se-Sulawesi menjadi instrumen krusial bagi armada logistik darurat dan percepatan pemulihan rumah warga terdampak.',
    author: 'Siti Nurhaliza, S.STP.',
    role: 'Koordinator Lapangan Penanggulangan Bencana Daerah',
    agency: 'BPBD Provinsi Sulawesi Utara',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    rating: 5,
  },
];

export default function MapSection() {
  const allGridPosts = blogData;

  // Pagination state for 3 cards per page
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;
  const totalPages = Math.ceil(allGridPosts.length / postsPerPage);

  const currentGridPosts = allGridPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // Testimonial Carousel State
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleNextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const handlePrevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const currentTestimonial = TESTIMONIALS[testimonialIndex];

  return (
    <section id="peta" className="relative py-24 px-6 overflow-hidden transition-colors duration-300" style={{ background: 'var(--bg-section)' }}>
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#0EA5E9]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
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

        {/* 1. BANNER POSTER UTAMA (FULL WIDTH, HEIGHT AUTOMATIC) */}
        <div className="group relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300">
          <img
            src="/image/poster.jpeg"
            alt="Poster Informasi Kebencanaan"
            className="w-full h-auto block rounded-3xl transition-transform duration-500 group-hover:scale-[1.005]"
          />
        </div>

        {/* 2. PORTRAIT BOOK-POSTER CARDS (4 CARDS PER SLIDE, FULL COVER IMAGE, TEXT OVERLAY & HOVER READ BUTTON) */}
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {currentGridPosts.map((post) => (
              <article
                key={post.id}
                className="relative aspect-[3/4.4] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border border-slate-200/80 dark:border-slate-800"
              >
                {/* Full Cover Image */}
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover object-center group-hover:scale-110 transition-transform duration-700"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/20 group-hover:from-slate-950/98 transition-colors duration-500" />

                {/* Category Tag (Top Left) */}
                <div className="absolute top-3.5 left-3.5 z-10">
                  <span
                    className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white shadow-md backdrop-blur-md"
                    style={{ backgroundColor: post.tagColor }}
                  >
                    {post.category}
                  </span>
                </div>

                {/* Card Content Overlay (Front Text) */}
                <div className="absolute inset-0 p-5 flex flex-col justify-end z-10 text-white space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-300">
                    <Calendar className="w-3 h-3 text-[#0EA5E9]" />
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>

                  <Link href={`/blog/${post.id}`}>
                    <h4 className="text-sm font-bold leading-snug line-clamp-3 text-white group-hover:text-[#0EA5E9] transition-colors cursor-pointer drop-shadow-sm">
                      {post.title}
                    </h4>
                  </Link>

                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed opacity-90">
                    {post.excerpt}
                  </p>

                  {/* Hover Floating Read Button */}
                  <div className="pt-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Link
                      href={`/blog/${post.id}`}
                      className="w-full py-2 px-3 rounded-xl bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Baca Artikel</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="text-[#0EA5E9] font-bold"
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 3. TESTIMONIAL SECTION: SINGLE-TESTIMONIAL CAROUSEL WITH DOTS AND ARROWS */}
        <div className="bg-gradient-to-br from-slate-900 via-[#19506e] to-slate-900 rounded-3xl p-8 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/10">
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0EA5E9]/20 blur-[100px] rounded-full pointer-events-none" />
          <Quote className="absolute bottom-6 right-8 w-32 h-32 text-white/5 pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-bold tracking-widest uppercase text-sky-300">
                <span>Apresiasi & Testimoni Pakar</span>
              </div>

              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            {/* Testimonial Quote Content */}
            <div className="min-h-[140px] flex items-center">
              <p className="text-lg md:text-2xl font-medium leading-relaxed italic text-slate-100">
                &ldquo;{currentTestimonial.quote}&rdquo;
              </p>
            </div>

            {/* Testimonial Author & Carousel Navigation */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={currentTestimonial.avatar}
                  alt={currentTestimonial.author}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#0EA5E9] shadow-md"
                />
                <div>
                  <h4 className="text-base font-bold text-white">{currentTestimonial.author}</h4>
                  <p className="text-xs text-sky-200">{currentTestimonial.role}</p>
                  <p className="text-[11px] text-slate-400">{currentTestimonial.agency}</p>
                </div>
              </div>

              {/* Navigation Arrows & Dots */}
              <div className="flex items-center gap-4 self-end sm:self-auto">
                {/* Navigation Dots */}
                <div className="flex items-center gap-2">
                  {TESTIMONIALS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTestimonialIndex(idx)}
                      className="text-[#0EA5E9] font-bold"
                    />
                  ))}
                </div>

                {/* Arrows */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevTestimonial}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextTestimonial}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
