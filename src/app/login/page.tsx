'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import LoginBackground from '@/components/three/LoginBackground';

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

      const signInResult = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (signInResult.error) {
        const shouldCreate = signInResult.error.message?.includes('Invalid login credentials') || signInResult.error.status === 400 || signInResult.error.status === 403 || signInResult.error.message?.includes('user not found');
        if (!shouldCreate) {
          throw signInResult.error;
        }

        const signUpResult = await client.auth.signUp({ email, password });
        if (signUpResult.error) {
          throw signUpResult.error;
        }

        if (signUpResult.data.session) {
          router.push('/admin');
          return;
        }

        const retryResult = await client.auth.signInWithPassword({ email, password });
        if (retryResult.error) {
          throw retryResult.error;
        }
      }

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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Three.js Particle Constellation Background */}
      <LoginBackground />

      {/* Glassmorphic Login Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 400,
          padding: '44px 38px',
          background: 'rgba(11, 25, 44, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 24,
          borderLeft: '4px solid #35a7ff',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          margin: '0 16px',
        }}
      >
        {/* Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <img
            src="/logo bappenas.png"
            alt="Logo Bappenas"
            style={{ height: 44, width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>SATUBENCANA</div>
            <div style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 }}>Admin Console</div>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
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
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(0, 0, 0, 0.25)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#35a7ff';
                e.target.style.background = 'rgba(0, 0, 0, 0.35)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.target.style.background = 'rgba(0, 0, 0, 0.25)';
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
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
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(0, 0, 0, 0.25)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#35a7ff';
                e.target.style.background = 'rgba(0, 0, 0, 0.35)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.target.style.background = 'rgba(0, 0, 0, 0.25)';
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#ff9f43', marginBottom: 18, padding: '10px 14px', borderRadius: 10, background: 'rgba(255, 159, 67, 0.12)', border: '1px solid rgba(255, 159, 67, 0.25)' }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isConfigured}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 12,
              background: loading ? 'rgba(53, 167, 255, 0.5)' : 'linear-gradient(135deg, #35A7FF, #38618C)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(53, 167, 255, 0.3)',
            }}
            onMouseEnter={e => {
              if (!loading && isConfigured) {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              if (!loading && isConfigured) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Memverifikasi...' : isConfigured ? 'Masuk' : 'Konfigurasi belum siap'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="/" style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.45)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#35a7ff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)'}>
            ← Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
