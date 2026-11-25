'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import LoginBackground from '@/components/three/LoginBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEFAULT_DASHBOARD_PATH } from '@/lib/routes';

type AuthMode = 'local' | 'supabase';

function resolveClientAuthMode(): AuthMode {
  const raw = (process.env.NEXT_PUBLIC_AUTH_MODE || '').toLowerCase();
  if (raw === 'local' || raw === 'supabase') return raw;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_DEV || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnon) {
    return 'supabase';
  }
  return 'local';
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const authMode = resolveClientAuthMode();

  useEffect(() => {
    const nextUrl =
      new URLSearchParams(window.location.search).get('next') || DEFAULT_DASHBOARD_PATH;

    if (authMode === 'local') {
      fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.ok && data?.user) router.replace(nextUrl);
        })
        .catch(() => {});
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) return;
    client.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = nextUrl;
    });
  }, [router, authMode]);

  const handleLocalLogin = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || 'Gagal masuk.');
    }
    const nextUrl =
      new URLSearchParams(window.location.search).get('next') || DEFAULT_DASHBOARD_PATH;
    window.location.href = nextUrl;
  };

  const handleSupabaseLogin = async (email: string, password: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      throw new Error('Supabase belum dikonfigurasi. Set env Vercel atau pakai AUTH_MODE=local.');
    }
    const signInResult = await client.auth.signInWithPassword({ email, password });
    if (signInResult.error) {
      throw signInResult.error;
    }
    const nextUrl =
      new URLSearchParams(window.location.search).get('next') || DEFAULT_DASHBOARD_PATH;
    window.location.href = nextUrl;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement | null;
    const passwordInput = form.elements.namedItem('password') as HTMLInputElement | null;

    if (!emailInput || !passwordInput) {
      setError('Form login tidak lengkap.');
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (authMode === 'local') {
        await handleLocalLogin(email, password);
      } else {
        await handleSupabaseLogin(email, password);
      }
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : 'Gagal masuk. Coba lagi.';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <div className="relative hidden flex-1 overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_45%)]" />
          <LoginBackground />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <div>
              <img
                src="/logo/logo_mdb_alone.png"
                alt="Logo MDB"
                className="w-[300px] h-auto object-contain brightness-0 invert"
              />
            </div>
          </div>
        </div>

        <div className="flex w-full flex-1 items-center justify-center bg-white px-6 py-10 lg:w-[42%] lg:px-8 xl:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex justify-center lg:hidden">
              <img
                src="/logo/logo_mdb_alone.png"
                alt="Logo MDB"
                className="h-12 w-auto object-contain"
              />
            </div>

            <h1 className="text-2xl font-semibold text-slate-900">Masuk</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Masuk dengan akun MDB / SatuBencana.
              {authMode === 'local' ? (
                <span className="mt-1 block text-xs text-emerald-700">
                  Mode lokal (Postgres) — seed: superadmin@satubencana.id / admin123
                </span>
              ) : (
                <span className="mt-1 block text-xs text-slate-400">Mode Supabase (Vercel)</span>
              )}
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  name="email"
                  placeholder="superadmin@satubencana.id"
                  required
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 px-4"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm"
                disabled={loading}
              >
                {loading ? 'Memverifikasi...' : 'Masuk'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              <Link href="/" className="font-medium text-slate-700 transition hover:text-slate-900">
                ← Kembali ke beranda
              </Link>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs leading-6 text-slate-400">
              Direktorat Tata Ruang, Perkotaan, Pertanahan, dan Penanggulangan Bencana
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
