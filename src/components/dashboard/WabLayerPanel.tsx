'use client';

import { useState } from 'react';
import wabConfig from '@/data/wab_layers.json';

interface Props {
  theme: string;
}

type WabLayer = (typeof wabConfig.layers)[number];

const TYPE_LABEL: Record<string, string> = {
  MapServer: 'MS',
  ImageServer: 'IS',
  FeatureServer: 'FS',
  VectorTileServer: 'VT',
};

const TYPE_COLOR: Record<string, string> = {
  MapServer: '#8B5CF6',
  ImageServer: '#0EA5E9',
  FeatureServer: '#22C55E',
  VectorTileServer: '#F59E0B',
};

export default function WabLayerPanel({ theme }: Props) {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const isDark = theme === 'dark';

  const panelBg    = isDark ? 'rgba(5,14,31,0.97)'   : 'rgba(255,255,255,0.97)';
  const panelText  = isDark ? '#F1F5F9'               : '#0F172A';
  const panelMuted = isDark ? '#94A3B8'               : '#64748B';
  const borderCol  = isDark ? 'rgba(30,58,95,0.7)'   : 'rgba(0,0,0,0.09)';
  const hoverBg    = isDark ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.08)';
  const headBg     = isDark ? '#050E1F'              : '#F0F7FF';

  // Group layers by group field
  const groups = wabConfig.layers.reduce<Record<string, WabLayer[]>>((acc, l) => {
    if (!acc[l.group]) acc[l.group] = [];
    acc[l.group].push(l);
    return acc;
  }, {});

  const openInArcGIS = (layer: WabLayer) => {
    const url = new URL(wabConfig.arcgisViewerBase);
    if (layer.type !== 'VectorTileServer') {
      url.searchParams.set('url', layer.url);
      url.searchParams.set('type', layer.type);
    } else {
      // VectorTileServer: just open the service URL
      window.open(layer.url, '_blank', 'noopener,noreferrer');
      return;
    }
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  const groupColors: Record<string, string> = {
    'Bahaya': '#EF4444',
    'Geospasial Dasar (BIG)': '#22C55E',
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: panelBg,
      border: `1px solid ${borderCol}`,
      borderRadius: 14,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px 10px',
        background: headBg,
        borderBottom: `1px solid ${borderCol}`,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: panelText, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          🗂 Daftar Layer
        </div>
        <div style={{ fontSize: 9, color: panelMuted, marginTop: 2 }}>
          Klik layer untuk detail · Buka di ArcGIS
        </div>
      </div>

      {/* WAB App link */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${borderCol}`, flexShrink: 0 }}>
        <a
          href={wabConfig.viewerUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 10px', borderRadius: 8,
            background: 'linear-gradient(135deg, #0079C1, #00A9CE)',
            color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 700,
            boxShadow: '0 2px 8px rgba(0,121,193,0.3)',
          }}
        >
          <span style={{ fontSize: 14 }}>🔗</span>
          <span>Buka Aplikasi WAB</span>
          <span style={{ marginLeft: 'auto', fontSize: 9, opacity: 0.85 }}>↗</span>
        </a>
      </div>

      {/* Layer list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {Object.entries(groups).map(([grpName, layers]) => (
          <div key={grpName}>
            {/* Group header */}
            <div style={{
              padding: '6px 14px 3px',
              fontSize: 9, fontWeight: 800,
              color: groupColors[grpName] ?? '#35a7ff',
              textTransform: 'uppercase', letterSpacing: 0.9,
              position: 'sticky', top: 0,
              background: panelBg, zIndex: 1,
            }}>
              {grpName === 'Bahaya' ? '⚠️ ' : '🌿 '}{grpName}
            </div>

            {layers.map((layer) => {
              const isExpanded = expandedLayer === layer.id;
              const typeLabel = TYPE_LABEL[layer.type] ?? '??';
              const typeColor = TYPE_COLOR[layer.type] ?? '#94A3B8';

              return (
                <div key={layer.id}>
                  <button
                    onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
                    style={{
                      width: '100%', padding: '7px 14px',
                      background: isExpanded ? hoverBg : 'transparent',
                      border: 'none',
                      borderLeft: `3px solid ${isExpanded ? layer.color : 'transparent'}`,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{layer.emoji}</span>
                    <span style={{
                      fontSize: 11, fontWeight: isExpanded ? 700 : 400,
                      color: isExpanded ? panelText : panelMuted,
                      flex: 1, lineHeight: 1.3,
                    }}>
                      {layer.name}
                    </span>
                    <span style={{
                      fontSize: 7, fontWeight: 800,
                      color: typeColor,
                      background: `${typeColor}18`,
                      border: `1px solid ${typeColor}40`,
                      borderRadius: 3, padding: '1px 4px',
                      flexShrink: 0,
                    }}>
                      {typeLabel}
                    </span>
                    <span style={{ fontSize: 9, color: panelMuted, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▶</span>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{
                      margin: '0 8px 6px 8px',
                      padding: '10px 12px',
                      background: isDark ? 'rgba(14,165,233,0.06)' : 'rgba(14,165,233,0.05)',
                      border: `1px solid ${layer.color}30`,
                      borderRadius: 8,
                    }}>
                      <div style={{ fontSize: 10, color: panelText, lineHeight: 1.6, marginBottom: 8 }}>
                        {layer.description}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 9, color: panelMuted, background: isDark ? '#1E3A5F' : '#F1F5F9', borderRadius: 4, padding: '2px 6px' }}>
                          📡 {layer.source}
                        </span>
                        <span style={{ fontSize: 9, color: typeColor, background: `${typeColor}15`, borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>
                          {layer.type}
                        </span>
                      </div>

                      <div style={{
                        fontSize: 8, color: panelMuted,
                        wordBreak: 'break-all', lineHeight: 1.5,
                        background: isDark ? '#050E1F' : '#F8FAFC',
                        border: `1px solid ${borderCol}`,
                        borderRadius: 5, padding: '5px 7px',
                        marginBottom: 8,
                        fontFamily: 'monospace',
                      }}>
                        {layer.url}
                      </div>

                      <button
                        onClick={() => openInArcGIS(layer)}
                        style={{
                          width: '100%', padding: '7px',
                          background: 'linear-gradient(135deg, #0079C1, #00A9CE)',
                          color: '#fff', border: 'none', borderRadius: 7,
                          fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        }}
                      >
                        🗺️ Buka di ArcGIS Map Viewer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '7px 14px',
        borderTop: `1px solid ${borderCol}`,
        fontSize: 8, color: panelMuted,
        display: 'flex', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <span>{wabConfig.layers.length} layers</span>
        <span>© BNPB InARISK · BIG</span>
      </div>
    </div>
  );
}
