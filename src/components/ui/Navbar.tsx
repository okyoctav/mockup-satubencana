'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { Info, Menu, X, Sun, Moon } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Beranda', href: '/' },
  { label: 'Sejarah Kebencanaan', href: '/sejarah-kebencanaan' },
  { label: 'Data Kebencanaan', href: '/analisis-data' },
  { label: 'Dashboard Asesmen Dampak', href: '/dashboard_k5' },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
      title={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
      className="relative flex items-center w-16 h-8 p-1 rounded-full border transition-all duration-300 focus:outline-hidden cursor-pointer shadow-2xs select-none shrink-0"
      style={{
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(241, 245, 249, 0.95)',
        borderColor: isDark ? 'rgba(71, 85, 105, 0.7)' : 'rgba(203, 213, 225, 0.9)',
      }}
    >
      {/* Background Icons: Sun (left) & Moon (right) */}
      <div className="flex items-center justify-between w-full px-1.5 text-xs pointer-events-none">
        <Sun
          className={`w-3.5 h-3.5 transition-all duration-300 ${
            isDark ? 'text-slate-400 opacity-60' : 'text-amber-500 opacity-0'
          }`}
        />
        <Moon
          className={`w-3.5 h-3.5 transition-all duration-300 ${
            isDark ? 'text-sky-300 opacity-0' : 'text-slate-400 opacity-60'
          }`}
        />
      </div>

      {/* Sliding Knob */}
      <div
        className="absolute top-1 w-6 h-6 rounded-full transition-all duration-300 shadow-md flex items-center justify-center pointer-events-none"
        style={{
          left: isDark ? 'calc(100% - 28px)' : '4px',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          border: isDark ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(226, 232, 240, 0.9)',
        }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-sky-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
      </div>
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
  const isHome = currentPath === '/';

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
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
        {/* Brand Logo (Left) */}
        <Link href="/" className="flex items-center gap-3 text-left shrink-0">
          <img
            src="/logo/logo_mdb.png"
            alt="Logo MDB"
            style={{ height: 38, width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        {/* Clean Modern Capsule Desktop Navigation Links (Middle) - Hidden on Beranda, visible on other pages */}
        {!isHome && (
          <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 select-none ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200/90 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/80 hover:shadow-2xs active:scale-98'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Far Right: Informasi Pill Button + Theme Mode Switch */}
        <div className="hidden lg:flex items-center gap-3.5 shrink-0">
          <Link
            href="/informasi-mitra"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 shadow-2xs hover:scale-102 ${
              currentPath === '/informasi-mitra'
                ? 'border-rose-500 text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950 dark:border-rose-500'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>INFORMASI</span>
          </Link>

          <ThemeToggle />
        </div>

        {/* Mobile Controls (Far Right) */}
        <div className="lg:hidden flex items-center gap-2">
          <Link
            href="/informasi-mitra"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-200 shadow-2xs ${
              currentPath === '/informasi-mitra'
                ? 'border-rose-500 text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950 dark:border-rose-500'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>INFORMASI</span>
          </Link>

          <ThemeToggle />

          {!isHome && (
            <button
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu - Only on other pages */}
      {!isHome && menuOpen && (
        <div
          className="lg:hidden px-6 pb-6 pt-3 space-y-2 max-h-[85vh] overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg-navbar-solid)',
            borderBottom: '1px solid var(--border-faint)',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block p-3 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                    : 'text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
