'use client';

import { useState, useEffect } from 'react';

const ALERTS = [
  { id: 1, jenis: 'gempa', level: 'tinggi', pesan: 'Gempa M5.6 — Lampung Barat, kedalaman 10 km', waktu: '2 menit lalu', lat: -5.0, lng: 104.1, color: '#EF4444', icon: '🔴' },
  { id: 2, jenis: 'tsunami', level: 'sedang', pesan: 'Peringatan Dini Tsunami — Pantai Barat Aceh, pergerakan laut abnormal', waktu: '15 menit lalu', lat: 4.2, lng: 95.8, color: '#F97316', icon: '🟠' },
  { id: 3, jenis: 'banjir', level: 'tinggi', pesan: 'Banjir Bandang Aktif — Tulang Bawang, Lampung, 4.200 warga terancam', waktu: '1 jam lalu', lat: -4.4, lng: 105.7, color: '#EF4444', icon: '🔴' },
  { id: 4, jenis: 'longsor', level: 'sedang', pesan: 'Longsor Kritis — Karo, Sumatera Utara, akses jalan terputus', waktu: '2 jam lalu', lat: 3.1, lng: 98.4, color: '#F97316', icon: '🟠' },
  { id: 5, jenis: 'erupsi', level: 'tinggi', pesan: 'Erupsi Gunung Semeru — Level AWAS, radius 8 km zona bahaya', waktu: '3 jam lalu', lat: -8.1, lng: 112.9, color: '#EF4444', icon: '🔴' },
];

interface Props {
  onAlertClick: (lat: number, lng: number) => void;
}

export default function AlertTicker({ onAlertClick }: Props) {
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % ALERTS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  if (dismissed) return null;

  const alert = ALERTS[current];

  return (
    <div
      style={{
        background: `linear-gradient(90deg, ${alert.color}18 0%, ${alert.color}08 100%)`,
        borderBottom: `1px solid ${alert.color}40`,
        padding: '0 24px',
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Badge */}
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
      >
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
          ⚠ EARLY WARNING
        </span>
      </div>

      {/* Ticker dot nav */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {ALERTS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
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

      {/* Message */}
      <button
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

      {/* Dismiss */}
      <button
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
      >×</button>
    </div>
  );
}
