'use client';

import wabConfig from '@/data/wab_layers.json';

interface Props {
  theme: string;
  activeLayers: string[];
  onToggle: (id: string, visible: boolean) => void;
}

const TYPE_LABEL: Record<string, string> = {
  ImageServer: 'ImageServer',
  MapServer: 'MapServer',
  VectorTileServer: 'VectorTile',
  WebTileLayer: 'WebTile',
  FeatureLayer: 'FeatureLayer',
};

const TYPE_COLOR: Record<string, string> = {
  ImageServer: '#8B5CF6',
  MapServer: '#F97316',
  VectorTileServer: '#10B981',
  WebTileLayer: '#A78BFA',
  FeatureLayer: '#3B82F6',
};

export default function ArcGISLayerPanel({ theme, activeLayers, onToggle }: Props) {
  const isDark = theme === 'dark';

  // Group layers
  const groups = wabConfig.layers.reduce<Record<string, typeof wabConfig.layers>>((acc, l) => {
    (acc[l.group] = acc[l.group] || []).push(l);
    return acc;
  }, {});

  const panelBg = isDark ? '#0d1b2a' : '#f0f7ff';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)';
  const borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,121,193,0.12)';
  const textPrimary = isDark ? '#E2E8F0' : '#1E293B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const groupHeaderBg = isDark ? 'rgba(0,121,193,0.12)' : 'rgba(0,121,193,0.08)';

  // Count active layers
  const activeCount = wabConfig.layers.filter((l) => activeLayers.includes(l.id)).length;

  return (
    <div
      style={{
        background: panelBg,
        border: `1px solid ${isDark ? 'rgba(0,121,193,0.25)' : 'rgba(0,121,193,0.18)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: '10px 14px 8px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(0,121,193,0.2), rgba(0,169,206,0.1))'
            : 'linear-gradient(135deg, rgba(0,121,193,0.12), rgba(0,169,206,0.06))',
          borderBottom: `1px solid ${borderColor}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>🗂</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: textPrimary,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            Layer ArcGIS
          </span>
          <span
            style={{
              marginLeft: 'auto',
              background: 'linear-gradient(135deg, #0079C1, #00A9CE)',
              color: '#fff',
              borderRadius: 20,
              padding: '1px 8px',
              fontSize: 9,
              fontWeight: 800,
            }}
          >
            {activeCount}/{wabConfig.layers.length} aktif
          </span>
        </div>
        <div style={{ fontSize: 9, color: textMuted, marginTop: 3 }}>
          Toggle untuk tampilkan/sembunyikan di peta
        </div>
      </div>

      {/* Layer list — scrollable */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '6px 10px 10px' }}>
        {Object.entries(groups).map(([groupName, layers]) => (
          <div key={groupName} style={{ marginBottom: 8 }}>
            {/* Group header */}
            <div
              style={{
                padding: '4px 8px',
                marginBottom: 4,
                background: groupHeaderBg,
                borderRadius: 6,
                fontSize: 9,
                fontWeight: 800,
                color: '#0079C1',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              {groupName}
            </div>

            {/* Layers in group */}
            {layers.map((layer) => {
              const isActive = activeLayers.includes(layer.id);
              return (
                <div
                  key={layer.id}
                  onClick={() => onToggle(layer.id, !isActive)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 8px',
                    marginBottom: 2,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isActive ? cardBg : 'transparent',
                    border: `1px solid ${isActive ? borderColor : 'transparent'}`,
                    transition: 'all 0.15s',
                    opacity: isActive ? 1 : 0.55,
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: `2px solid ${isActive ? layer.color : textMuted}`,
                      background: isActive ? layer.color : 'transparent',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isActive && (
                      <span style={{ color: '#fff', fontSize: 8, fontWeight: 900, lineHeight: 1 }}>
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Emoji + name */}
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{layer.emoji}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: isActive ? 600 : 400,
                      color: textPrimary,
                      flex: 1,
                      lineHeight: 1.3,
                    }}
                  >
                    {layer.name}
                  </span>

                  {/* Type badge */}
                  <span
                    style={{
                      fontSize: 7,
                      fontWeight: 700,
                      color: TYPE_COLOR[layer.type] ?? '#94A3B8',
                      background: `${TYPE_COLOR[layer.type] ?? '#94A3B8'}18`,
                      borderRadius: 4,
                      padding: '1px 4px',
                      flexShrink: 0,
                      letterSpacing: 0.2,
                    }}
                  >
                    {TYPE_LABEL[layer.type] ?? layer.type}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer — quick actions */}
      <div
        style={{
          padding: '6px 10px',
          borderTop: `1px solid ${borderColor}`,
          display: 'flex',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => wabConfig.layers.forEach((l) => onToggle(l.id, true))}
          style={{
            flex: 1,
            fontSize: 9,
            fontWeight: 700,
            color: '#0079C1',
            background: 'rgba(0,121,193,0.08)',
            border: '1px solid rgba(0,121,193,0.2)',
            borderRadius: 6,
            padding: '4px 0',
            cursor: 'pointer',
          }}
        >
          Tampilkan Semua
        </button>
        <button
          onClick={() => wabConfig.layers.forEach((l) => onToggle(l.id, false))}
          style={{
            flex: 1,
            fontSize: 9,
            fontWeight: 700,
            color: isDark ? '#94A3B8' : '#64748B',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${borderColor}`,
            borderRadius: 6,
            padding: '4px 0',
            cursor: 'pointer',
          }}
        >
          Sembunyikan Semua
        </button>
      </div>
    </div>
  );
}
