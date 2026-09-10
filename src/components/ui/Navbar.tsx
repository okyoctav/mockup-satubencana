'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Beranda', href: '/' },
  { label: 'Sejarah Kebencanaan', href: '/sejarah-kebencanaan' },
  { label: 'Analisis Data', href: '/analisis-data' },
  { label: 'Informasi & Mitra', href: '/informasi-mitra' },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark/light mode"
      title={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
      className="flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
      style={{
        width: '40px',
        height: '40px',
        background: 'var(--toggle-bg)',
        border: '1.5px solid var(--toggle-border)',
        fontSize: '18px',
        flexShrink: 0,
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
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-left">
          <img
            src="/logo/logo_mdb.png"
            alt="Logo MDB"
            style={{ height: 36, width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 bg-slate-800/10 p-1.5 rounded-full border border-slate-200/20">
          {NAV_LINKS.map((l) => {
            const isActive = currentPath === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#0EA5E9] text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/10'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA + Toggle + Button Group */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <div className="flex gap-2">
            <a
              href="/login"
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-faint)'
              }}
            >
              Login
            </a>
            <a
              href="/management"
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-faint)'
              }}
            >
              Management Data
            </a>
            <details style={{ position: 'relative' }}>
              <summary
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #35A7FF, #38618C)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  listStyle: 'none',
                }}
              >
                Dashboard ▾
              </summary>
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  minWidth: 180,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-faint)',
                  borderRadius: 14,
                  boxShadow: '0 10px 30px rgba(15,23,42,0.16)',
                  overflow: 'hidden',
                  zIndex: 40,
                }}
              >
                {/* <a
                  href="/dashboard"
                  className="block text-sm transition-colors duration-200 hover:bg-slate-100"
                  style={{ padding: '10px 16px', color: 'var(--text-secondary)', textDecoration: 'none', background: 'transparent' }}
                >
                  Dashboard
                </a>
                <a
                  href="/dashboard_k2"
                  className="block text-sm transition-colors duration-200 hover:bg-slate-100"
                  style={{ padding: '10px 16px', color: 'var(--text-secondary)', textDecoration: 'none', background: 'transparent' }}
                >
                  Dashboard K2
                </a>
                <a
                  href="/dashboard_k3"
                  className="block text-sm transition-colors duration-200 hover:bg-slate-100"
                  style={{ padding: '10px 16px', color: 'var(--text-secondary)', textDecoration: 'none', background: 'transparent' }}
                >
                  Dashboard K3
                </a>
                <a
                  href="/dashboard_k4"
                  className="block text-sm transition-colors duration-200 hover:bg-slate-100"
                  style={{ padding: '10px 16px', color: 'var(--text-secondary)', textDecoration: 'none', background: 'transparent' }}
                >
                  Dashboard K4
                </a> */}
                 <a
                  href="/dashboard_k5"
                  className="block text-sm transition-colors duration-200 hover:bg-slate-100"
                  style={{ padding: '10px 16px', color: 'var(--text-secondary)', textDecoration: 'none', background: 'transparent' }}
                >
                  Dashboard K5
                </a>
              </div>
            </details>
            <a
              href="https://inarisk.bnpb.go.id/databencana/webgis/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                color: '#fff',
                border: 'none'
              }}
            >
              WebGIS
            </a>
          </div>
        </div>

        {/* Mobile: toggle + burger */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-0.5 mb-1 transition-all" style={{ backgroundColor: 'currentColor' }} />
            <div className="w-5 h-0.5 mb-1 transition-all" style={{ backgroundColor: 'currentColor' }} />
            <div className="w-5 h-0.5 transition-all" style={{ backgroundColor: 'currentColor' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-6"
          style={{
            backgroundColor: 'var(--bg-navbar-solid)',
            borderBottom: '1px solid var(--border-faint)',
          }}
        >
          <nav className="flex flex-col gap-4 pt-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm py-2 text-left font-semibold ${
                  currentPath === l.href ? 'text-[#0EA5E9]' : 'text-slate-300 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <a
                href="/login"
                className="px-5 py-3 rounded-full text-sm font-semibold text-center"
                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-faint)' }}
                onClick={() => setMenuOpen(false)}
              >
                Login
              </a>
              <a
                href="/management"
                className="px-5 py-3 rounded-full text-sm font-semibold text-center"
                style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-faint)' }}
                onClick={() => setMenuOpen(false)}
              >
                Management Data
              </a>
              <div className="rounded-3xl border border-slate-200 bg-[var(--bg-card)] p-4 text-sm" style={{ borderColor: 'var(--border-faint)' }}>
                <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-900" style={{ color: 'var(--text-secondary)' }}>
                  <span>Dashboard</span>
                  <span className="text-xs text-slate-500">Pilih</span>
                </div>
                {/* <a
                  href="/dashboard"
                  className="block rounded-2xl px-4 py-3 text-sm transition-colors duration-200 hover:bg-slate-100"
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </a>
                <a
                  href="/dashboard_k2"
                  className="block rounded-2xl px-4 py-3 text-sm transition-colors duration-200 hover:bg-slate-100"
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard K2
                </a>
                <a
                  href="/dashboard_k3"
                  className="block rounded-2xl px-4 py-3 text-sm transition-colors duration-200 hover:bg-slate-100"
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard K3
                </a>
                <a
                  href="/dashboard_k4"
                  className="block rounded-2xl px-4 py-3 text-sm transition-colors duration-200 hover:bg-slate-100"
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard K4
                </a> */}
                <a
                  href="/dashboard_k5"
                  className="block rounded-2xl px-4 py-3 text-sm transition-colors duration-200 hover:bg-slate-100"
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard K5
                </a>
              </div>
              <a
                href="https://inarisk.bnpb.go.id/databencana/webgis/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-full text-sm font-semibold text-white text-center"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                onClick={() => setMenuOpen(false)}
              >
                WebGIS
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
