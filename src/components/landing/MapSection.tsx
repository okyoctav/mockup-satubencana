"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import blogData from '@/data/blog.json';

const LandingInteractiveMap = dynamic(() => import('./LandingInteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white text-xs font-bold gap-2">
      <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      <span>Memuat Peta Spasial Interaktif Bencana...</span>
    </div>
  ),
});

export default function MapSection() {
  const allGridPosts = blogData;

  // Pagination state for 4 cards per page (2x2 grid inside right panel)
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;
  const totalPages = Math.ceil(allGridPosts.length / postsPerPage);

  const currentGridPosts = allGridPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  return (
    <section id="peta" className="relative h-full w-full py-4 px-6 overflow-hidden flex flex-col transition-colors duration-300" style={{ background: 'var(--bg-section)' }}>
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#0EA5E9]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 w-full h-full flex flex-col justify-between space-y-3 overflow-hidden">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-1 shrink-0">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            <span
              style={{
                background: 'linear-gradient(135deg, #0EA5E9, #22C55E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Sejarah Kebencanaan
            </span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Publikasi dan peta interaktif sejarah lokasi kejadian bencana geospasial di seluruh Indonesia.
          </p>
        </div>

        {/* 2-Column Fullscreen Layout (Map Left 7 cols, Articles Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Interactive Map */}
          <div className="lg:col-span-7 h-full flex flex-col min-h-0">
            <div className="flex-1 w-full h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
              <LandingInteractiveMap />
            </div>
          </div>

          {/* Right Column: Article Cards & History List */}
          <div className="lg:col-span-5 h-full flex flex-col justify-between min-h-0 overflow-hidden bg-slate-900/40 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/50 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                Arsip & Artikel Bencana
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>

            {/* Articles Stacked Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 py-2 overflow-y-auto">
              {currentGridPosts.map((post) => (
                <article
                  key={post.id}
                  className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group border border-slate-700/50 flex flex-col h-full bg-slate-950/70"
                >
                  <div className="relative h-24 w-full overflow-hidden shrink-0">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-extrabold text-white shadow-md backdrop-blur-md"
                        style={{ backgroundColor: post.tagColor }}
                      >
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 flex flex-col justify-between flex-1 text-white space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                      <Calendar className="w-2.5 h-2.5 text-[#0EA5E9]" />
                      <span>{post.date}</span>
                    </div>

                    <Link href={`/blog/${post.id}`}>
                      <h4 className="text-xs font-bold leading-snug line-clamp-2 text-white group-hover:text-[#0EA5E9] transition-colors cursor-pointer">
                        {post.title}
                      </h4>
                    </Link>

                    <Link
                      href={`/blog/${post.id}`}
                      className="pt-1 text-[10px] font-bold text-[#0EA5E9] hover:text-[#0EA5E9]/80 flex items-center gap-1 transition-colors mt-auto"
                    >
                      <span>Baca</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Compact Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 shrink-0">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-6 h-6 rounded-md text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-[#0EA5E9] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
