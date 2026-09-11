'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { ExternalLink, Lock, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Beranda', href: '/' },
  { label: 'Sejarah Kebencanaan', href: '/sejarah-kebencanaan' },
  { label: 'Analisis Data', href: '/analisis-data' },
  { label: 'Informasi & Mitra', href: '/informasi-mitra' },
  { label: 'Management Data', href: '/management' },
  { label: 'Dashboard K5', href: '/dashboard_k5' },
  { label: 'WebGIS', href: 'https://inarisk.bnpb.go.id/databencana/webgis/', external: true },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark/light mode"
      title={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
      className="flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm shrink-0"
      style={{
        width: '38px',
        height: '38px',
        background: 'var(--toggle-bg)',
        border: '1.5px solid var(--toggle-border)',
        fontSize: '17px',
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

interface NavbarProps {
  activePath?: string;
}

export default function Navbar({ activePath }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const currentPath = activePath || pathname || '/';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'var(--bg-navbar)' : 'var(--bg-navbar-solid)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-faint)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 text-left shrink-0">
          <img
            src="/logo/logo_mdb.png"
            alt="Logo MDB"
            style={{ height: 36, width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        {/* Unified Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/40 dark:bg-slate-900/60 bg-white/50 p-1.5 rounded-full border border-white/20 dark:border-slate-700/50 backdrop-blur-md shadow-lg">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.href;
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] hover:bg-slate-800/20 dark:hover:bg-slate-800/60 transition-all flex items-center gap-1"
                >
                  <span>{item.label}</span>
                  <ExternalLink className="w-3 h-3 text-[#0EA5E9] opacity-80" />
                </a>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0EA5E9] text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Theme Toggle & Login CTA */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 flex items-center gap-1.5 shadow-sm"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-faint)'
            }}
          >
            <Lock className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span>Login</span>
          </Link>
        </div>

        {/* Mobile Hamburger Controls */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 rounded-xl bg-slate-800/20 border border-slate-700/40 text-slate-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div
          className="lg:hidden px-6 pb-6 pt-3 space-y-2 max-h-[85vh] overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg-navbar-solid)',
            borderBottom: '1px solid var(--border-faint)',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.href;
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50"
                >
                  <span>{item.label}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#0EA5E9]" />
                </a>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block p-3 rounded-2xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#0EA5E9] text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-700/40">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl text-xs font-bold text-white bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>Login Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
