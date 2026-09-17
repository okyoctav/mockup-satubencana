"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  Calendar, ArrowRight, ChevronLeft, ChevronRight, Search,
  X, BookOpen
} from 'lucide-react';
import blogData from '@/data/blog.json';
import { DisasterItem } from './LandingInteractiveMap';

const LandingInteractiveMap = dynamic(() => import('./LandingInteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-slate-900 flex flex-col items-center justify-center text-white text-xs font-bold gap-3">
      <div className="w-8 h-8 rounded-full border-3 border-teal-500 border-t-transparent animate-spin" />
      <span className="tracking-wider uppercase text-[11px] text-teal-400">Memuat Peta Spasial Kebencanaan...</span>
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeArticleTab, setActiveArticleTab] = useState<'semua' | 'terfilter'>('semua');

  // Filter posts based on search query AND active tabs/selected disaster
  const filteredPosts = allGridPosts.filter((post) => {
    // Search query
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Filter by selected map disaster
    if (activeArticleTab === 'terfilter' || selectedDisaster) {
      if (!selectedDisaster) return true;
      const matchById = selectedDisaster.ID != null && post.disasterId?.includes(selectedDisaster.ID);
      const matchByName = selectedDisaster.Nama_Bencana && post.disasterNames?.some(name =>
        selectedDisaster.Nama_Bencana?.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(selectedDisaster.Nama_Bencana?.toLowerCase() || '')
      );
      const matchByJenis = selectedDisaster.Jenis_Bencana && post.excerpt.toLowerCase().includes(selectedDisaster.Jenis_Bencana.toLowerCase());

      return Boolean(matchById || matchByName || matchByJenis);
    }

    return true;
  });

  const postsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));

  const currentGridPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSelectDisasterFromMap = (disaster: DisasterItem | null) => {
    setSelectedDisaster(disaster);
    setIsPanelOpen(true);
    setActiveArticleTab('terfilter');
    setCurrentPage(1);
  };

  return (
    <section id="peta" className="relative h-full w-full overflow-hidden flex flex-col font-sans" style={{ background: 'var(--bg-section)' }}>
      
      <div className="relative z-10 w-full h-full flex flex-col overflow-hidden">
        <div className="relative flex-1 min-h-0 w-full h-full flex overflow-hidden">
          
          {/* Main Leaflet Interactive Map Canvas */}
          <div className="h-full flex-1 flex flex-col min-h-0 relative w-full">
            <LandingInteractiveMap
              onSelectDisaster={handleSelectDisasterFromMap}
              rightExtraControls={
                /* Material Floating Action Button (FAB) for Archive & Articles */
                <button
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  className="px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-2 cursor-pointer transition-all duration-300 shadow-lg text-white"
                  style={{
                    backgroundColor: isPanelOpen ? '#e53935' : 'rgb(25, 79, 112)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)'
                  }}
                  title={isPanelOpen ? "Tutup SideNav Artikel" : "Buka Arsip & Artikel Bencana"}
                >
                  {isPanelOpen ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Tutup Arsip</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      <span>Arsip & Artikel</span>
                      {filteredPosts.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                          {filteredPosts.length}
                        </span>
                      )}
                    </>
                  )}
                </button>
              }
            />
          </div>

          {/* ============================================================
              MATERIAL DESIGN SIDENAV DRAWER (Right Sliding Panel)
              ============================================================ */}
          <div
            className={`h-full flex flex-col justify-between min-h-0 overflow-hidden transition-all duration-500 z-40 ${
              isPanelOpen
                ? 'w-full sm:w-[460px] opacity-100 translate-x-0'
                : 'w-0 opacity-0 translate-x-full pointer-events-none border-none p-0'
            }`}
            style={{
              backgroundColor: 'var(--bg-card)',
              boxShadow: isPanelOpen ? '-4px 0 24px rgba(0,0,0,0.2)' : 'none',
              borderLeft: '1px solid var(--border-faint)'
            }}
          >
            {isPanelOpen && (
              <div className="h-full flex flex-col justify-between overflow-hidden">
                
                {/* 1. Material App Bar Header */}
                <div 
                  className="p-4 text-white shrink-0 flex flex-col gap-2"
                  style={{ backgroundColor: 'rgb(25, 79, 112)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-300" />
                      <h3 className="text-sm font-black uppercase tracking-wider">
                        Arsip Dokumen & Artikel
                      </h3>
                    </div>

                    <button
                      onClick={() => setIsPanelOpen(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                      title="Tutup Panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-teal-100 font-medium">
                    Dokumentasi sejarah peristiwa, kajian ilmiah, dan kronologi kebencanaan Indonesia
                  </p>
                </div>

                {/* 2. Material Tabs & Filter Header */}
                <div className="p-3 border-b space-y-2 shrink-0" style={{ borderColor: 'var(--border-faint)' }}>
                  {/* Material Tab Bar */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                      onClick={() => {
                        setActiveArticleTab('semua');
                        setCurrentPage(1);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                        activeArticleTab === 'semua'
                          ? 'bg-white dark:bg-slate-900 text-[rgb(25,79,112)] dark:text-teal-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Semua Dokumen ({allGridPosts.length})
                    </button>

                    <button
                      onClick={() => {
                        setActiveArticleTab('terfilter');
                        setCurrentPage(1);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                        activeArticleTab === 'terfilter'
                          ? 'bg-white dark:bg-slate-900 text-[rgb(25,79,112)] dark:text-teal-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Terfilter Peta</span>
                      {selectedDisaster && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                      )}
                    </button>
                  </div>

                  {/* Selected Map Disaster Indicator Chip - Warna Tegas Solid */}
                  {selectedDisaster && (
                    <div 
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: 'rgb(25, 79, 112)' }}
                    >
                      <div className="truncate text-xs font-bold flex items-center gap-1.5">
                        <span>📍 Lokasi Peta:</span>
                        <span className="font-extrabold text-amber-300">{selectedDisaster.Nama_Bencana}</span>
                        <span className="opacity-90 font-medium">({selectedDisaster.Tahun})</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDisaster(null);
                          setActiveArticleTab('semua');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider ml-2 shrink-0 transition-colors cursor-pointer shadow-xs"
                      >
                        Reset
                      </button>
                    </div>
                  )}

                  {/* Material Input Search Bar */}
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari arsip bencana, tahun, atau kategori..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                {/* 3. Material Card Article List (Tanpa Cover Gambar) */}
                <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-2.5">
                  {currentGridPosts.length > 0 ? (
                    currentGridPosts.map((post) => (
                      <article
                        key={post.id}
                        className="group rounded-2xl border p-3.5 transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-2"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-faint)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                        }}
                      >
                        {/* Top Metadata: Category Pill & Date */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wide text-white shadow-xs"
                            style={{ backgroundColor: post.tagColor || '#00897b' }}
                          >
                            {post.category}
                          </span>

                          <div className="flex items-center gap-1 text-[10.5px] text-slate-400 font-medium">
                            <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span>{post.date}</span>
                          </div>
                        </div>

                        {/* Article Title */}
                        <Link href={`/blog/${post.id}`}>
                          <h4
                            className="text-xs sm:text-sm font-black leading-snug line-clamp-2 transition-colors cursor-pointer group-hover:text-teal-600"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {post.title}
                          </h4>
                        </Link>

                        {/* Article Excerpt */}
                        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                          {post.excerpt}
                        </p>

                        {/* Card Action Bar Footer */}
                        <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-faint)' }}>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Oleh {post.author}
                          </span>

                          <Link
                            href={`/blog/${post.id}`}
                            className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors hover:underline text-[rgb(25,79,112)] dark:text-teal-400 cursor-pointer"
                          >
                            <span>Baca Artikel</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-xs space-y-2 text-slate-400">
                      <BookOpen className="w-8 h-8 opacity-40 text-teal-600" />
                      <div className="font-bold">Dokumen Tidak Ditemukan</div>
                      <div className="text-[10px]">Coba gunakan kata kunci lain atau pilih tab Semua Dokumen</div>
                    </div>
                  )}
                </div>

                {/* 4. Material Pagination Controls Footer */}
                {totalPages > 1 && (
                  <div 
                    className="p-3 border-t shrink-0 flex items-center justify-between"
                    style={{ 
                      borderColor: 'var(--border-faint)',
                      backgroundColor: 'var(--bg-card)'
                    }}
                  >
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            currentPage === page
                              ? 'bg-[rgb(25,79,112)] text-white shadow-sm'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                      style={{ borderColor: 'var(--border-subtle)' }}
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
