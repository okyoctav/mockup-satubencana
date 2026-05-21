'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!sessionStorage.getItem('isAdmin')) {
        router.replace('/login');
      } else {
        setReady(true);
      }
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    router.push('/');
  };

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Memverifikasi sesi...</div>
      </div>
    );
  }

  const MENU = [
    {
      icon: '📊',
      label: 'Dashboard',
      desc: 'Lihat executive dashboard data bencana nasional secara real-time.',
      href: '/dashboard',
      accent: '#35a7ff',
    },
    {
      icon: '🗄',
      label: 'Management Data',
      desc: 'Kelola dan lihat daftar layanan geospasial Inarisk BNPB.',
      href: '/management',
      accent: '#38618c',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-faint)',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderLeft: '4px solid #ff7f11',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo bappenas.png" alt="Logo Bappenas" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>SATUBENCANA Admin</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Backend Panel</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', padding: '4px 12px', borderRadius: 20, background: 'rgba(53,167,255,0.08)', border: '1px solid rgba(53,167,255,0.15)' }}>
            🔐 admin@admin.com
          </div>
          <button
            onClick={handleLogout}
            style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,127,17,0.1)', border: '1px solid rgba(255,127,17,0.25)', color: '#ff7f11', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Keluar
          </button>
        </div>
      </header>

      <div style={{ padding: '40px 32px' }}>
        {/* Welcome */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Selamat datang, Admin 👋
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Pilih menu di bawah untuk mengelola dashboard dan data bencana nasional.
          </div>
        </div>

        {/* Menu cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 700 }}>
          {MENU.map(m => (
            <a
              key={m.label}
              href={m.href}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-faint)',
                borderRadius: 18,
                padding: '28px 28px',
                borderLeft: `4px solid ${m.accent}`,
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transition: 'transform 0.18s, box-shadow 0.18s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${m.accent}25`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: 32 }}>{m.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{m.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{m.desc}</div>
              <div style={{ fontSize: 11, color: m.accent, fontWeight: 600, marginTop: 4 }}>
                Buka {m.label} →
              </div>
            </a>
          ))}
        </div>

        {/* Info box */}
        <div style={{ marginTop: 48, padding: '16px 20px', borderRadius: 12, background: 'rgba(53,167,255,0.06)', border: '1px solid rgba(53,167,255,0.15)', maxWidth: 600 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#35a7ff', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
            ℹ Informasi Sesi
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Anda masuk sebagai Administrator. Sesi ini hanya berlaku selama browser ini terbuka.
            Klik <strong style={{ color: '#ff7f11' }}>Keluar</strong> untuk mengakhiri sesi admin.
          </div>
        </div>
      </div>
    </div>
  );
}
