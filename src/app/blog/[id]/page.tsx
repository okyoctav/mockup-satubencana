"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, ArrowLeft, Share2, Check, ChevronRight } from 'lucide-react';

import blogData from '@/data/blog.json';

export default function BlogDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '1';
  const post = (blogData as Array<{ id: string; title: string; category: string; tagColor: string; date: string; readTime: string; author: string; authorRole: string; image: string; summary?: string; excerpt?: string; sections: Array<{ id: string; title: string; content: string }> }>).find((b) => b.id === id) || blogData[0];

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
            {post.excerpt}
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
                {post.sections.map((sec: { id: string; title: string; content: string }) => {
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
              {post.sections.map((sec: { id: string; title: string; content: string }) => (
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
