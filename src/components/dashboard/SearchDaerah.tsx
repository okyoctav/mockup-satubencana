'use client';

import { useState, useRef, useEffect } from 'react';
import { WILAYAH, Wilayah } from '@/data/wilayah';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  onSelect: (w: Wilayah) => void;
}

export default function SearchDaerah({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Wilayah[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const q = val.toLowerCase();
    const filtered = WILAYAH.filter(
      (w) =>
        w.nama.toLowerCase().includes(q) ||
        w.provinsi.toLowerCase().includes(q)
    ).slice(0, 8);
    setResults(filtered);
    setOpen(true);
  };

  const handleSelect = (w: Wilayah) => {
    setQuery(`${w.nama}${w.tipe !== 'provinsi' ? `, ${w.provinsi}` : ''}`);
    setOpen(false);
    onSelect(w);
  };

  const tipeLabel: Record<string, string> = {
    provinsi: 'Provinsi',
    kabupaten: 'Kab.',
    kota: 'Kota',
  };
  const tipeBadgeColor: Record<string, string> = {
    provinsi: '#0EA5E9',
    kabupaten: '#22C55E',
    kota: '#F97316',
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-card)',
          border: `1.5px solid ${focused ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
          borderRadius: 12,
          padding: '6px 14px',
          transition: 'border-color 0.2s',
          boxShadow: focused ? '0 0 0 3px rgba(14,165,233,0.15)' : 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Cari daerah... (provinsi / kab / kota)"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true); }}
          onBlur={() => setFocused(false)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 13,
            width: '100%',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}
          >×</button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            background: theme === 'dark' ? '#0D1F3C' : '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {results.map((w) => (
            <button
              key={`${w.tipe}-${w.nama}`}
              onClick={() => handleSelect(w)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                borderBottom: '1px solid var(--border-faint)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  background: tipeBadgeColor[w.tipe],
                  borderRadius: 6,
                  padding: '2px 6px',
                  minWidth: 36,
                  textAlign: 'center',
                }}
              >
                {tipeLabel[w.tipe]}
              </span>
              <span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{w.nama}</span>
                {w.tipe !== 'provinsi' && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{w.provinsi}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
