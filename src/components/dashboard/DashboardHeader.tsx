'use client';

import dynamic from 'next/dynamic';
import { useTheme } from '@/contexts/ThemeContext';
import { Wilayah } from '@/data/wilayah';
import { Database, Lock, ArrowLeft, Map, Sun, Moon } from 'lucide-react';

const SearchDaerah = dynamic(() => import('./SearchDaerah'), { ssr: false });

interface Props {
  onSearch: (w: Wilayah) => void;
}

export default function DashboardHeader({ onSearch }: Props) {
  const { theme, toggle } = useTheme();

  return (
    <header
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #050E1F 0%, #0A1628 100%)'
          : 'linear-gradient(135deg, #EEF4FF 0%, #DCE9FA 100%)',
        borderBottom: '1px solid var(--border-faint)',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <img
          src="/logo/logo_mdb.png"
          alt="Logo MDB"
          style={{ height: 40, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
        />
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 420 }}>
        <SearchDaerah onSelect={onSearch} />
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Live indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.25)',
            fontSize: 11,
            color: '#22C55E',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#22C55E',
              animation: 'pulse-dot 1.5s infinite',
              display: 'inline-block',
            }}
          />
          LIVE
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1.5px solid var(--toggle-border)',
            background: 'var(--toggle-bg)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            color: 'var(--text-secondary)',
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Button group: Management Data, Login, Kembali */}
        <div style={{ display: 'flex', gap: 6 }}>
          <a
            href="/management"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-faint)',
              color: 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'background 0.2s',
            }}
          >
            <Database size={13} /> Management Data
          </a>
          <a
            href="/login"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-faint)',
              color: 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'background 0.2s',
            }}
          >
            <Lock size={13} /> Login
          </a>
          <a
            href="/"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(53,167,255,0.1)',
              border: '1px solid rgba(53,167,255,0.25)',
              color: '#35a7ff',
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'background 0.2s',
            }}
          >
            <ArrowLeft size={13} /> Kembali
          </a>
          <a
            href="https://inarisk.bnpb.go.id/databencana/webgis/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              border: 'none',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'opacity 0.2s',
            }}
          >
            <Map size={13} /> WebGIS
          </a>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </header>
  );
}
