"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  Calendar, ArrowRight, ChevronLeft, ChevronRight, Search,
  X, BookOpen, ExternalLink, ShieldCheck, Globe,
  Newspaper, CheckCircle2
} from 'lucide-react';
import blogData from '@/data/blog.json';
import { DisasterItem } from './LandingInteractiveMap';
import { VerifiedArticle } from '@/app/api/sejarah-berita/route';

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

  // Main navigation & drawer state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mainTab, setMainTab] = useState<'berita' | 'internal'>('berita');

  // Verified News (Google RSS Index) State
  const [verifiedArticles, setVerifiedArticles] = useState<VerifiedArticle[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState<boolean>(false);
  const [mediaFilter, setMediaFilter] = useState<string>('all');
  const [googleSearchUrl, setGoogleSearchUrl] = useState<string>('');
  const [mediaCounts, setMediaCounts] = useState<Record<string, number>>({});
  const [beritaPage, setBeritaPage] = useState<number>(1);

  // Internal documents state
  const [currentPage, setCurrentPage] = useState(1);
  const [activeInternalTab, setActiveInternalTab] = useState<'semua' | 'terfilter'>('semua');

  // Trigger Google News search whenever drawer is open, selected disaster changes, search query changes, or media filter changes
  useEffect(() => {
    if (!isPanelOpen) return;

    let q = searchQuery.trim();
    let year = '';

    if (!q && selectedDisaster) {
      q = selectedDisaster.Nama_Bencana || '';
      year = selectedDisaster.Tahun ? String(selectedDisaster.Tahun) : '';
    }

    if (!q) {
      q = 'Gempa dan Tsunami Aceh';
      year = '2004';
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoadingArticles(true);
      try {
        const url = `/api/sejarah-berita?q=${encodeURIComponent(q)}&year=${encodeURIComponent(year)}&media=${encodeURIComponent(mediaFilter)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setVerifiedArticles(data.articles || []);
          setGoogleSearchUrl(data.googleSearchUrl || '');
          setMediaCounts(data.mediaCounts || {});
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Error fetching verified articles:', err);
        }
      } finally {
        setIsLoadingArticles(false);
        setBeritaPage(1);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isPanelOpen, selectedDisaster, searchQuery, mediaFilter]);

  // Filter internal posts based on search query AND active tabs/selected disaster
  const filteredPosts = allGridPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeInternalTab === 'terfilter' || selectedDisaster) {
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

  // Internal posts pagination
  const postsPerPage = 5;
  const totalInternalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
  const currentGridPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // Verified news pagination
  const beritaPerPage = 5;
  const totalBeritaPages = Math.max(1, Math.ceil(verifiedArticles.length / beritaPerPage));
  const currentBerita = verifiedArticles.slice(
    (beritaPage - 1) * beritaPerPage,
    beritaPage * beritaPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setBeritaPage(1);
    setCurrentPage(1);
  };

  const handleSelectDisasterFromMap = (disaster: DisasterItem | null) => {
    setSelectedDisaster(disaster);
    setIsPanelOpen(true);
    setMainTab('berita');
    setMediaFilter('all');
    setBeritaPage(1);
    setCurrentPage(1);
  };

  const handleResetDisasterFilter = () => {
    setSelectedDisaster(null);
    setSearchQuery('');
    setMediaFilter('all');
    setActiveInternalTab('semua');
    setBeritaPage(1);
    setCurrentPage(1);
  };

  const mediaPills = [
    { id: 'all', label: 'Semua', count: mediaCounts.all ?? verifiedArticles.length, color: '#0f766e' },
    { id: 'kompas', label: 'Kompas.com', count: mediaCounts.kompas ?? 0, color: '#005baa' },
    { id: 'detik', label: 'Detik.com', count: mediaCounts.detik ?? 0, color: '#0d47a1' },
    { id: 'tempo', label: 'Tempo.co', count: mediaCounts.tempo ?? 0, color: '#c90000' },
    { id: 'natgeo', label: 'NatGeo ID', count: mediaCounts.natgeo ?? 0, color: '#d97706' },
    { id: 'metrotv', label: 'Metro TV', count: mediaCounts.metrotv ?? 0, color: '#0284c7' },
    { id: 'liputan6', label: 'Liputan6', count: mediaCounts.liputan6 ?? 0, color: '#ea580c' },
  ];

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
                    backgroundColor: isPanelOpen ? '#e53935' : '#0f766e',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)'
                  }}
                  title={isPanelOpen ? "Tutup SideNav Artikel" : "Buka Arsip & Berita Terverifikasi"}
                >
                  {isPanelOpen ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Tutup Arsip</span>
                    </>
                  ) : (
                    <>
                      <Newspaper className="w-4 h-4" />
                      <span>Arsip & Berita</span>
                      {(verifiedArticles.length > 0 || filteredPosts.length > 0) && (
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                          {verifiedArticles.length > 0 ? verifiedArticles.length : filteredPosts.length}
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
                ? 'w-full sm:w-[490px] opacity-100 translate-x-0'
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
                  className="p-4 text-white shrink-0 flex flex-col gap-2 shadow-sm"
                  style={{ backgroundColor: '#0f766e' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-300" />
                      <h3 className="text-sm font-black uppercase tracking-wider">
                        Arsip Dokumen & Berita Terverifikasi
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
                    Indeks liputan berita Google dari media nasional terverifikasi & arsip sejarah kebencanaan Indonesia
                  </p>
                </div>

                {/* 2. Main Tabs Header: Berita Terverifikasi vs Dokumen Internal */}
                <div className="p-3 border-b space-y-2.5 shrink-0" style={{ borderColor: 'var(--border-faint)' }}>
                  
                  {/* Tab Selector */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                      onClick={() => {
                        setMainTab('berita');
                        setBeritaPage(1);
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 ${
                        mainTab === 'berita'
                          ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Media Terverifikasi</span>
                      {verifiedArticles.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold">
                          {verifiedArticles.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setMainTab('internal');
                        setCurrentPage(1);
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-black transition-all text-center flex items-center justify-center gap-1.5 ${
                        mainTab === 'internal'
                          ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Dokumen Kajian ({allGridPosts.length})</span>
                    </button>
                  </div>

                  {/* Selected Map Disaster Indicator Chip */}
                  {selectedDisaster && (
                    <div 
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: '#0f766e' }}
                    >
                      <div className="truncate text-xs font-bold flex items-center gap-1.5">
                        <span className="shrink-0">📍 Fokus Bencana:</span>
                        <span className="font-extrabold text-amber-300 truncate">{selectedDisaster.Nama_Bencana}</span>
                        <span className="opacity-90 font-medium shrink-0">({selectedDisaster.Tahun})</span>
                      </div>
                      <button
                        onClick={handleResetDisasterFilter}
                        className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider ml-2 shrink-0 transition-colors cursor-pointer shadow-xs"
                      >
                        Reset
                      </button>
                    </div>
                  )}

                  {/* Search Input Bar */}
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={
                        mainTab === 'berita'
                          ? "Cari arsip berita Google (mis: Gempa Aceh, Palu, Merapi)..."
                          : "Cari arsip dokumen, tahun, atau kategori..."
                      }
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full pl-9 pr-8 py-2 rounded-xl text-xs outline-none border transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-page)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setBeritaPage(1);
                          setCurrentPage(1);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Verified Media Outlet Filter Chips (Only for Tab 'berita') */}
                  {mainTab === 'berita' && (
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 font-medium px-0.5">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Filter Media Terverifikasi:
                        </span>
                        {googleSearchUrl && (
                          <a
                            href={googleSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                            title="Buka hasil query filter lengkap langsung di Google Search"
                          >
                            <span>Buka di Google</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      {/* Scrollable media filter buttons */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                        {mediaPills.map((pill) => {
                          const isSelected = mediaFilter === pill.id;
                          return (
                            <button
                              key={pill.id}
                              onClick={() => {
                                setMediaFilter(pill.id);
                                setBeritaPage(1);
                              }}
                              className={`shrink-0 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                isSelected
                                  ? 'text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                              style={{
                                backgroundColor: isSelected ? pill.color : undefined
                              }}
                            >
                              <span>{pill.label}</span>
                              {pill.count > 0 && (
                                <span className={`text-[9.5px] px-1 rounded-full font-extrabold ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {pill.count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Internal Subtabs (Only for Tab 'internal') */}
                  {mainTab === 'internal' && (
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                      <button
                        onClick={() => {
                          setActiveInternalTab('semua');
                          setCurrentPage(1);
                        }}
                        className={`py-1 rounded-md text-[11px] font-bold transition-all text-center ${
                          activeInternalTab === 'semua'
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Semua ({allGridPosts.length})
                      </button>
                      <button
                        onClick={() => {
                          setActiveInternalTab('terfilter');
                          setCurrentPage(1);
                        }}
                        className={`py-1 rounded-md text-[11px] font-bold transition-all text-center ${
                          activeInternalTab === 'terfilter'
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Terfilter Peta
                      </button>
                    </div>
                  )}

                </div>

                {/* 3. Article Content List */}
                <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-2.5">
                  
                  {/* VIEW A: Verified Google News Articles */}
                  {mainTab === 'berita' && (
                    <>
                      {isLoadingArticles ? (
                        <div className="flex flex-col items-center justify-center h-56 text-center space-y-3 text-slate-400">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full border-3 border-teal-600 border-t-transparent animate-spin" />
                            <Globe className="w-4 h-4 text-teal-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              Mengindeks Berita dari Google...
                            </div>
                            <div className="text-[11px] text-slate-500 max-w-[260px] mx-auto">
                              Memuat arsip Kompas, Tempo, Detik, NatGeo, Metro TV, dan Liputan6
                            </div>
                          </div>
                        </div>
                      ) : currentBerita.length > 0 ? (
                        currentBerita.map((art) => (
                          <article
                            key={art.id}
                            className="group rounded-2xl border p-3.5 transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-2 relative"
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              borderColor: 'var(--border-faint)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                            }}
                          >
                            {/* Top Metadata: Media Source Badge & Date */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider text-white shadow-2xs"
                                style={{ backgroundColor: art.mediaColor }}
                              >
                                <ShieldCheck className="w-3 h-3 text-white shrink-0" />
                                <span>{art.source}</span>
                              </span>

                              <div className="flex items-center gap-1 text-[10.5px] text-slate-400 font-medium">
                                <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                <span>{art.formattedDate}</span>
                              </div>
                            </div>

                            {/* Article Title with direct external link */}
                            <a
                              href={art.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-[13px] font-black leading-snug line-clamp-2 transition-colors cursor-pointer group-hover:text-teal-600 dark:group-hover:text-teal-400"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {art.title}
                            </a>

                            {/* Article Snippet */}
                            {art.snippet && (
                              <p className="text-[11px] leading-relaxed line-clamp-2 text-slate-500 dark:text-slate-400">
                                {art.snippet}
                              </p>
                            )}

                            {/* Card Action Bar Footer */}
                            <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-faint)' }}>
                              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                                <span className="truncate">{art.sourceDomain}</span>
                              </span>

                              <a
                                href={art.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                              >
                                <span>Buka Berita</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-52 text-center text-xs space-y-2 text-slate-400">
                          <Newspaper className="w-8 h-8 opacity-40 text-teal-600" />
                          <div className="font-bold">Berita Media Tidak Ditemukan</div>
                          <div className="text-[11px] max-w-[280px]">
                            Tidak ada arsip berita yang sesuai dengan filter media ini. Silakan coba pilih filter &quot;Semua&quot; atau gunakan kata kunci lain.
                          </div>
                          {googleSearchUrl && (
                            <a
                              href={googleSearchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-colors"
                            >
                              <span>Cari Langsung di Google</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* VIEW B: Internal BNPB Articles */}
                  {mainTab === 'internal' && (
                    <>
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
                                className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors hover:underline text-teal-700 dark:text-white cursor-pointer"
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
                    </>
                  )}

                </div>

                {/* 4. Pagination Controls Footer */}
                {mainTab === 'berita' && totalBeritaPages > 1 && (
                  <div 
                    className="p-3 border-t shrink-0 flex items-center justify-between"
                    style={{ 
                      borderColor: 'var(--border-faint)',
                      backgroundColor: 'var(--bg-card)'
                    }}
                  >
                    <button
                      onClick={() => setBeritaPage((p) => Math.max(1, p - 1))}
                      disabled={beritaPage === 1}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalBeritaPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalBeritaPages > 5 && beritaPage > 3) {
                          pageNum = beritaPage - 2 + i;
                          if (pageNum > totalBeritaPages) pageNum = totalBeritaPages - (4 - i);
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setBeritaPage(pageNum)}
                            className={`w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              beritaPage === pageNum
                                ? 'bg-teal-700 text-white shadow-sm'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setBeritaPage((p) => Math.min(totalBeritaPages, p + 1))}
                      disabled={beritaPage === totalBeritaPages}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {mainTab === 'internal' && totalInternalPages > 1 && (
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
                      {Array.from({ length: totalInternalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            currentPage === page
                              ? 'bg-teal-700 text-white shadow-sm'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalInternalPages, p + 1))}
                      disabled={currentPage === totalInternalPages}
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
