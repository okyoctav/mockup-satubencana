"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowRight, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import blogData from '@/data/blog.json';

const LandingInteractiveMap = dynamic(() => import('./LandingInteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-slate-900 flex items-center justify-center text-white text-xs font-bold gap-2">
      <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      <span>Memuat Peta Spasial Interaktif Bencana...</span>
    </div>
  ),
});

export default function MapSection() {
  const allGridPosts = blogData;

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter posts based on search query
  const filteredPosts = allGridPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const postsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));

  const currentGridPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <section id="peta" className="relative h-full w-full overflow-hidden flex flex-col transition-colors duration-300" style={{ background: 'var(--bg-section)' }}>
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#0EA5E9]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full h-full flex flex-col overflow-hidden">
        {/* 2-Column Fullscreen Layout Edge-to-Edge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Interactive Map (Full Height & Width) */}
          <div className="lg:col-span-7 h-full flex flex-col min-h-0 relative">
            {/* Map Title Floating Overlay Tag */}
            <div className="absolute top-4 left-4 z-20 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60 shadow-xl pointer-events-none">
              <h2 className="text-sm md:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9] animate-pulse" />
                Sejarah Kebencanaan
              </h2>
              <p className="text-[10px] text-slate-300">
                Peta lokasi spasial kejadian bencana di Indonesia
              </p>
            </div>
            
            <div className="w-full h-full">
              <LandingInteractiveMap />
            </div>
          </div>

          {/* Right Column: Article Cards & History List */}
          <div className="lg:col-span-5 h-full flex flex-col justify-between min-h-0 overflow-hidden bg-slate-950/90 p-4 border-l border-slate-800/80 backdrop-blur-xl">
            {/* Top Bar: Title & Search Input */}
            <div className="space-y-3 pb-3 border-b border-slate-800/80 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                  Arsip & Artikel Bencana
                </h3>
                <span className="text-[10px] text-slate-400 font-medium bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  Hal {currentPage} / {totalPages}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari artikel / lokasi bencana..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0EA5E9] transition-colors"
                />
              </div>
            </div>

            {/* Articles Grid (Full Cover Image with Overlay Title & Dark Gradient) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 py-3 overflow-y-auto">
              {currentGridPosts.length > 0 ? (
                currentGridPosts.map((post) => (
                  <article
                    key={post.id}
                    className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-slate-800 flex flex-col h-full bg-slate-900"
                  >
                    {/* Full Card Background Image */}
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover object-center group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20 group-hover:from-slate-950/95 transition-colors duration-300" />

                    {/* Category Tag (Top Left) */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span
                        className="px-2 py-0.5 rounded-md text-[9px] font-extrabold text-white shadow-md backdrop-blur-md"
                        style={{ backgroundColor: post.tagColor }}
                      >
                        {post.category}
                      </span>
                    </div>

                    {/* Content Area Over Image */}
                    <div className="relative z-10 p-3 flex flex-col justify-end flex-1 text-white space-y-1 mt-12">
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-300 font-medium">
                        <Calendar className="w-2.5 h-2.5 text-[#0EA5E9]" />
                        <span>{post.date}</span>
                      </div>

                      <Link href={`/blog/${post.id}`}>
                        <h4 className="text-xs font-bold leading-snug line-clamp-2 text-white group-hover:text-[#0EA5E9] transition-colors cursor-pointer drop-shadow-md">
                          {post.title}
                        </h4>
                      </Link>

                      <Link
                        href={`/blog/${post.id}`}
                        className="pt-1 text-[10px] font-bold text-[#0EA5E9] hover:text-[#0EA5E9]/80 flex items-center gap-1 transition-colors"
                      >
                        <span>Baca Artikel</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center h-full text-slate-500 text-xs py-8 space-y-1">
                  <Search className="w-6 h-6 text-slate-600 mb-1" />
                  <span>Artikel tidak ditemukan</span>
                  <span className="text-[10px]">Coba kata kunci pencarian lain</span>
                </div>
              )}
            </div>

            {/* Compact Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 shrink-0">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-5 h-5 rounded text-[10px] font-bold transition-all ${
                        currentPage === page
                          ? 'bg-[#0EA5E9] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
