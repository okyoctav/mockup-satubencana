'use client';

import { useState, useEffect } from 'react';
import type { BmkgAlertItem } from '@/types/bmkgAlert';
import { useTheme } from '@/contexts/ThemeContext';
interface Props {
  onAlertClick: (lat: number, lng: number) => void;
}

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

/** Latar solid (tidak tembus) supaya konten di bawah tidak nyaru saat sticky. */
function solidTint(hex: string, isDark: boolean, strength: number): string {
  // strength 0–1: seberapa kuat warna alert dicampur ke base
  const base = isDark ? [10, 22, 40] : [255, 255, 255]; // #0A1628 / #FFFFFF
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return isDark ? '#0A1628' : '#FFFFFF';
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const mix = (c: number, i: number) => Math.round(c * strength + base[i] * (1 - strength));
  return `rgb(${mix(r, 0)}, ${mix(g, 1)}, ${mix(b, 2)})`;
}

/**
 * Banner early warning di dalam aplikasi (bukan SMS/WA).
 * Banner early warning: feed BMKG via /api/bmkg-alerts.
 */
export default function AlertTicker({ onAlertClick }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [alerts, setAlerts] = useState<BmkgAlertItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/bmkg-alerts', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const list = Array.isArray(data.alerts) ? (data.alerts as BmkgAlertItem[]) : [];
        setAlerts(list);
        setFetchedAt(typeof data.fetchedAt === 'string' ? data.fetchedAt : null);
        setLoadState(list.length > 0 ? 'ready' : 'empty');
        setCurrent(0);
      } catch {
        if (cancelled) return;
        setAlerts([]);
        setLoadState('error');
      }
    };

    load();
    // Refresh berkala ~2 menit (BMKG rate limit ~60/menit; kita jauh di bawah itu)
    const refresh = setInterval(load, 120_000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, []);

  useEffect(() => {
    if (alerts.length <= 1) return;
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(t);
  }, [alerts.length]);

  if (dismissed) return null;

  if (loadState === 'loading') {
    return (
      <div
        style={{
          background: solidTint('#0EA5E9', isDark, 0.12),
          borderBottom: '1px solid rgba(14,165,233,0.35)',
          padding: '0 24px',
          height: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <Badge color="#0EA5E9" label="BMKG" />
        <span>Memuat peringatan gempa…</span>
      </div>
    );
  }

  if (loadState === 'error' || loadState === 'empty') {
    return (
      <div
        style={{
          background: solidTint('#64748B', isDark, 0.12),
          borderBottom: '1px solid rgba(100,116,139,0.35)',
          padding: '0 24px',
          height: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <Badge color="#64748B" label="BMKG" />
        <span>
          {loadState === 'error'
            ? 'Gagal memuat data gempa BMKG. Coba refresh halaman.'
            : 'Tidak ada data gempa BMKG saat ini.'}
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}
        >
          ×
        </button>
      </div>
    );
  }

  const alert = alerts[Math.min(current, alerts.length - 1)];
  if (!alert) return null;

  return (
    <div
      style={{
        // Latar solid — jangan pakai alpha hex (…18 / …08) supaya tidak tembus konten saat sticky
        background: `linear-gradient(90deg, ${solidTint(alert.color, isDark, 0.22)} 0%, ${solidTint(alert.color, isDark, 0.1)} 100%)`,
        borderBottom: `1px solid ${alert.color}55`,
        padding: '0 24px',
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: alert.color,
          borderRadius: 6,
          padding: '2px 10px',
          flexShrink: 0,
        }}
        title="Peringatan dini gempa di dalam aplikasi (sumber BMKG)"
      >
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
          ⚠ GEMPA BMKG
        </span>
      </div>

      {(alert.pinned || alert.source === 'autogempa') && (
        <span
          title="Ini gempa terbaru dari BMKG (autogempa) — dipin di slot pertama"
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 0.4,
            color: '#9A3412',
            background: '#FED7AA',
            borderRadius: 4,
            padding: '2px 6px',
            flexShrink: 0,
          }}
        >
          TERBARU
        </span>
      )}

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {alerts.map((_, i) => (
          <button
            key={alerts[i].id}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`Alert ${i + 1}`}
            title={alerts[i].pinned ? 'Gempa terbaru (dipin)' : alerts[i].waktu}
            style={{
              width: i === current ? 16 : 6,
              height: 6,
              borderRadius: 3,
              border: 'none',
              cursor: 'pointer',
              background: i === current ? alert.color : 'rgba(255,255,255,0.2)',
              transition: 'all 0.3s',
              padding: 0,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAlertClick(alert.lat, alert.lng)}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
        }}
      >
        <span style={{ fontSize: 14 }}>{alert.icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: alert.color,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {alert.pesan}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>— {alert.waktu}</span>
        <span
          style={{
            fontSize: 10,
            color: alert.color,
            border: `1px solid ${alert.color}50`,
            borderRadius: 4,
            padding: '1px 6px',
            flexShrink: 0,
          }}
        >
          Lihat di Peta →
        </span>
      </button>

      {fetchedAt && (
        <span
          title={fetchedAt}
          style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}
        >
          {new Date(fetchedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}

      <button
        type="button"
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: 18,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 0.6,
        color: '#fff',
        background: color,
        borderRadius: 4,
        padding: '2px 6px',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
