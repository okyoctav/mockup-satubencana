"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowRight, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';
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
  const allGridPosts = blogData as Array<{
    id: string;
    disasterId?: number[];
    disasterNames?: string[];
    category: string;
    tagColor: string;
    title: string;
    excerpt: string;
    author: string;
    authorRole: string;
    date: string;
    readTime: string;
    image: string;
    sections: Array<{ id: string; title: string; content: string }>;
  }>;

  // Search, Disaster Filter, Panel Collapse & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisaster, setSelectedDisaster] = useState<{ ID?: number; Nama_Bencana?: string; Jenis_Bencana?: string } | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter posts based on search query AND selected disaster from map marker
  const filteredPosts = allGridPosts.filter((post) => {
    // Search query filter
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

    // Map marker disaster filter
    let matchesDisaster = true;
    if (selectedDisaster) {
      const matchById = selectedDisaster.ID != null && post.disasterId?.includes(selectedDisaster.ID);
      const matchByName = selectedDisaster.Nama_Bencana && post.disasterNames?.some(name =>
        selectedDisaster.Nama_Bencana?.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(selectedDisaster.Nama_Bencana?.toLowerCase() || '')
      );
      const matchByJenis = selectedDisaster.Jenis_Bencana && post.excerpt.toLowerCase().includes(selectedDisaster.Jenis_Bencana.toLowerCase());

      matchesDisaster = Boolean(matchById || matchByName || matchByJenis);
    }

    return matchesSearch && matchesDisaster;
  });

  const postsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));

  const currentGridPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectDisasterFromMap = (disaster: { ID?: number; Nama_Bencana?: string; Jenis_Bencana?: string } | null) => {
    setSelectedDisaster(disaster);
    setIsPanelOpen(true);
    setCurrentPage(1);
  };

  return (
    <section id="peta" className="relative h-full w-full overflow-hidden flex flex-col transition-colors duration-300" style={{ background: 'var(--bg-section)' }}>
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#0EA5E9]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full h-full flex flex-col overflow-hidden">
        {/* Fullscreen Layout with Collapsible Side Panel */}
        <div className="relative flex-1 min-h-0 w-full h-full flex overflow-hidden">
          {/* Left / Full Canvas: Interactive Map */}
          <div className="h-full flex-1 flex flex-col min-h-0 relative w-full">
            <div className="w-full h-full">
              <LandingInteractiveMap
                onSelectDisaster={handleSelectDisasterFromMap}
                rightExtraControls={
                  <button
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className="bg-slate-900/40 dark:bg-slate-900/40 bg-white/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl px-3.5 py-2 shadow-2xl ring-1 ring-black/5 hover:bg-slate-900/60 dark:hover:bg-slate-900/60 transition-all flex items-center gap-2 text-slate-800 dark:text-white text-xs font-bold"
                    title={isPanelOpen ? "Tutup Panel Artikel" : "Buka Arsip & Artikel Bencana"}
                  >
                    <FileText className="w-4 h-4 text-[#0EA5E9]" />
                    <span>{isPanelOpen ? "Sembunyikan Artikel" : "Arsip & Artikel"}</span>
                    {filteredPosts.length > 0 && (
                      <span className="bg-[#0EA5E9] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {filteredPosts.length}
                      </span>
                    )}
                  </button>
                }
              />
            </div>
          </div>

          {/* Right Sliding Collapsible Panel: Article Cards & History List */}
          <div
            className={`h-full flex flex-col justify-between min-h-0 overflow-hidden border-l transition-all duration-500 z-30 ${
              isPanelOpen
                ? 'w-full lg:w-[480px] opacity-100 translate-x-0'
                : 'w-0 opacity-0 translate-x-full pointer-events-none border-none p-0'
            }`}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-faint)',
            }}
          >
            {isPanelOpen && (
              <div className="h-full flex flex-col justify-between p-4 overflow-hidden">
                {/* Top Bar: Title, Active Filter Badge & Search Input */}
                <div className="space-y-3 pb-3 border-b shrink-0" style={{ borderColor: 'var(--border-faint)' }}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <FileText className="w-4 h-4 text-[#0EA5E9]" />
                      Arsip & Artikel Bencana
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: 'var(--bg-section)',
                          color: 'var(--text-secondary)',
                          borderColor: 'var(--border-faint)'
                        }}
                      >
                        Hal {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setIsPanelOpen(false)}
                        className="text-slate-400 hover:text-rose-500 font-bold text-sm p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
                        title="Tutup Panel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Active Selected Disaster Tag Badge */}
                  {selectedDisaster && (
                    <div className="flex items-center justify-between bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 rounded-xl px-3 py-1.5 text-xs text-[#0EA5E9]">
                      <span className="truncate font-semibold text-[11px]">
                        📍 Terfilter Peta: <b>{selectedDisaster.Nama_Bencana}</b>
                      </span>
                      <button
                        onClick={() => setSelectedDisaster(null)}
                        className="ml-2 font-bold text-slate-400 hover:text-rose-500 text-xs shrink-0"
                        title="Reset Filter Peta"
                      >
                        ✕ Reset
                      </button>
                    </div>
                  )}

                  {/* Search Bar */}
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari judul artikel, tanggal, atau jenis..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs transition-colors outline-none"
                      style={{
                        backgroundColor: 'var(--bg-section)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-faint)'
                      }}
                    />
                  </div>
                </div>

                {/* Articles Stacked List View */}
                <div className="flex-1 min-h-0 py-3 overflow-y-auto space-y-2.5 pr-1">
                  {currentGridPosts.length > 0 ? (
                    currentGridPosts.map((post) => (
                      <article
                        key={post.id}
                        className="group rounded-2xl p-3 border transition-all duration-200 hover:shadow-md flex items-center gap-3"
                        style={{
                          backgroundColor: 'var(--bg-section)',
                          borderColor: 'var(--border-faint)'
                        }}
                      >
                        {/* Thumbnail Image */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200/20">
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>

                        {/* Article Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded text-[9px] font-extrabold text-white shadow-xs"
                              style={{ backgroundColor: post.tagColor }}
                            >
                              {post.category}
                            </span>
                            <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              <Calendar className="w-3 h-3 text-[#0EA5E9]" />
                              <span>{post.date}</span>
                            </div>
                          </div>

                          <Link href={`/blog/${post.id}`}>
                            <h4
                              className="text-xs font-bold leading-snug line-clamp-1 transition-colors cursor-pointer group-hover:text-[#0EA5E9]"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {post.title}
                            </h4>
                          </Link>

                          <p className="text-[10.5px] line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                            {post.excerpt}
                          </p>
                        </div>

                        {/* Arrow Action Button */}
                        <Link
                          href={`/blog/${post.id}`}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#0EA5E9] transition-all shrink-0"
                          title="Baca Artikel"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </article>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-xs py-8 space-y-1" style={{ color: 'var(--text-muted)' }}>
                      <Search className="w-6 h-6 mb-1 opacity-50" />
                      <span>Artikel tidak ditemukan</span>
                      <span className="text-[10px]">Coba kata kunci pencarian lain</span>
                    </div>
                  )}
                </div>

                {/* Compact Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t shrink-0" style={{ borderColor: 'var(--border-faint)' }}>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      style={{
                        backgroundColor: 'var(--bg-section)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-faint)'
                      }}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                            currentPage === page
                              ? 'bg-[#0EA5E9] text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      style={{
                        backgroundColor: 'var(--bg-section)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-faint)'
                      }}
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
