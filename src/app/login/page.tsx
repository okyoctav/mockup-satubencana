'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isConfigured) {
        throw new Error('Supabase belum dikonfigurasi di Vercel. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        throw new Error('Supabase client belum siap. Coba refresh halaman atau cek konfigurasi environment.');
      }

      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal masuk. Coba lagi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          padding: '40px 36px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-faint)',
          borderRadius: 20,
          borderLeft: '4px solid #35a7ff',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <img
            src="/logo bappenas.png"
            alt="Logo Bappenas"
            style={{ height: 48, width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Admin Login</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@admin.com"
              required
              disabled={!isConfigured}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={!isConfigured}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#ff7f11', marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,127,17,0.08)', border: '1px solid rgba(255,127,17,0.2)' }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isConfigured}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 10,
              background: loading ? '#38618c' : 'linear-gradient(135deg, #35A7FF, #38618C)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Memverifikasi...' : isConfigured ? 'Masuk' : 'Konfigurasi belum siap'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <a href="/" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
