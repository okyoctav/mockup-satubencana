'use client';

import { AdminLayout } from '@/app/admin/AdminLayout';

export default function AdminPage() {
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
    <AdminLayout title="Admin Dashboard" subtitle="Pilih modul admin yang ingin dikelola">
      <div style={{ padding: '8px 0' }}>
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
            Anda masuk sebagai Administrator. Sesi ini dikendalikan oleh Supabase Auth dan akan tetap aktif selama token valid.
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
