'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { LayoutDashboard, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Beranda', href: '/' },
  { label: 'Sejarah Kebencanaan', href: '/sejarah-kebencanaan' },
  { label: 'Analisis Data', href: '/analisis-data' },
  { label: 'Simulasi Modeling', href: '/simulasi-modeling' },
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
      className="flex items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 shadow-xs"
      style={{
        width: '36px',
        height: '36px',
        background: 'var(--toggle-bg)',
        border: '1px solid var(--toggle-border)',
        fontSize: '16px',
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
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-8">
        {/* Brand Logo (Left) */}
        <Link href="/" className="flex items-center gap-3 text-left shrink-0">
          <img
            src="/logo/logo_mdb.png"
            alt="Logo MDB"
            style={{ height: 38, width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        {/* Clean Horizontal Desktop Navigation Links (Middle / Right) */}
        <nav className="hidden lg:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-extrabold transition-colors whitespace-nowrap py-1 relative"
                style={{
                  color: isActive ? 'rgb(25, 79, 112)' : 'rgb(89, 89, 89)',
                }}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: 'rgb(25, 79, 112)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Primary CTA Button & Theme Toggle (Far Right) */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/dashboard_k5"
            className="px-5 py-2 rounded-xl text-xs font-extrabold text-white transition-all duration-200 hover:scale-105 shadow-md flex items-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, rgb(25, 79, 112), rgb(15, 55, 80))',
            }}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Mobile Hamburger Controls */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 rounded-xl bg-slate-800/20 border border-slate-700/40 text-slate-900 dark:text-slate-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block p-3 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[rgb(25,79,112)]/15 text-[rgb(25,79,112)] dark:text-sky-400'
                    : 'text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-700/40">
            <Link
              href="/dashboard_k5"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full p-3 rounded-xl text-xs font-bold text-white shadow-md"
              style={{
                background: 'linear-gradient(135deg, rgb(25, 79, 112), rgb(15, 55, 80))',
              }}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
