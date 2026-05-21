'use client';

import { useState, useEffect } from 'react';
import wabConfig from '@/data/wab_layers.json';

interface Props {
  theme: string;
}

export default function WabMap({ theme }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const isDark = theme === 'dark';

  // If iframe doesn't fire onLoad within 8s, show fallback
  useEffect(() => {
    const t = setTimeout(() => {
      if (!loaded) setTimedOut(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [loaded]);

  // Inject loading bar CSS once
  useEffect(() => {
    if (typeof window === 'undefined' || document.getElementById('wab-anim-css')) return;
    const style = document.createElement('style');
    style.id = 'wab-anim-css';
    style.textContent = `
      @keyframes wabBar {
        0%   { transform: translateX(-100%); }
        50%  { transform: translateX(0%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const panelBg   = isDark ? 'rgba(5,14,31,0.96)'    : 'rgba(236,245,255,0.97)';
  const textMain  = isDark ? '#F1F5F9'                : '#0F172A';
  const textMuted = isDark ? '#94A3B8'                : '#64748B';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: isDark ? '#0A1628' : '#EEF4FF', borderRadius: 14, overflow: 'hidden' }}>

      {/* WAB iframe — always rendered so onLoad fires */}
      <iframe
        src={wabConfig.viewerUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        onLoad={() => { setLoaded(true); setTimedOut(false); }}
        allow="geolocation; fullscreen; clipboard-write"
        title="ArcGIS Web AppBuilder"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
      />

      {/* Loading / Fallback overlay */}
      {(!loaded || timedOut) && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: panelBg, gap: 16,
          pointerEvents: timedOut ? 'auto' : 'none',
        }}>
          {/* Esri logo-style icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #0079C1, #00A9CE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 4px 24px rgba(0,121,193,0.4)',
          }}>
            🗺️
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: textMain, marginBottom: 4 }}>
              {timedOut ? 'Tidak dapat memuat WAB' : 'Memuat ArcGIS Web AppBuilder…'}
            </div>
            <div style={{ fontSize: 11, color: textMuted, maxWidth: 280, lineHeight: 1.6 }}>
              {timedOut
                ? 'Aplikasi WAB mungkin memblokir embedding iframe. Gunakan tombol di bawah untuk membuka di tab baru.'
                : `Menghubungkan ke ${wabConfig.viewerUrl}`}
            </div>
          </div>

          {/* Loading bar (hidden when timed out) */}
          {!timedOut && (
            <div style={{ width: 200, height: 3, background: isDark ? '#1E3A5F' : '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: '60%',
                background: 'linear-gradient(90deg, transparent, #0EA5E9, transparent)',
                animation: 'wabBar 1.6s ease-in-out infinite',
                borderRadius: 4,
              }} />
            </div>
          )}

          {/* Fallback buttons */}
          {timedOut && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <a
                href={wabConfig.viewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '9px 20px', borderRadius: 8,
                  background: 'linear-gradient(135deg, #0079C1, #00A9CE)',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 2px 10px rgba(0,121,193,0.35)',
                }}
              >
                🔗 Buka WAB di Tab Baru
              </a>
              <a
                href={wabConfig.arcgisViewerBase}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '7px 16px', borderRadius: 8,
                  background: 'transparent',
                  color: textMuted, fontSize: 11,
                  textDecoration: 'none', border: `1px solid ${isDark ? '#1E3A5F' : '#E2E8F0'}`,
                }}
              >
                🌐 Buka ArcGIS Map Viewer
              </a>
            </div>
          )}
        </div>
      )}

      {/* Top-right badge */}
      {loaded && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,121,193,0.92)', color: '#fff',
          borderRadius: 8, padding: '4px 10px',
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          backdropFilter: 'blur(8px)', pointerEvents: 'none',
        }}>
          ⚡ ArcGIS WAB
        </div>
      )}
    </div>
  );
}
