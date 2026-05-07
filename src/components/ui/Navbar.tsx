'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const NAV_LINKS = [
  { label: 'Beranda', href: '#' },
  { label: 'Analisis', href: '#dashboard-info' },
  { label: 'Tentang', href: '#footer' },
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

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'var(--bg-navbar)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-faint)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #22C55E)' }}
          >
            🌋
          </div>
          <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            DataBencana
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm transition-colors duration-200 hover:text-sky-400"
              style={{ color: 'var(--text-secondary)' }}
            >
              {l.label}
            </a>
          ))}
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
            <a
              href="/dashboard"
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #35A7FF, #38618C)',
                color: '#fff',
                border: 'none'
              }}
            >
              Dashboard
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
              <a
                key={l.label}
                href={l.href}
                className="text-sm py-2"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
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
              <a
                href="/dashboard"
                className="px-5 py-3 rounded-full text-sm font-semibold text-white text-center"
                style={{ background: 'linear-gradient(135deg, #35A7FF, #38618C)' }}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
