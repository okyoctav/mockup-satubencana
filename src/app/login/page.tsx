'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import LoginBackground from '@/components/three/LoginBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    client.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const nextUrl = new URLSearchParams(window.location.search).get('next') || '/dashboard_k5'; localStorage.setItem('is_logged_in', 'true'); router.replace(nextUrl);
      }
    });
  }, [router]);

  const handleAccountLogin = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.');
      return false;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      if (!isConfigured) {
        setNotice('Mode demo aktif. Anda akan diarahkan ke dashboard admin.');
        const nextUrl = new URLSearchParams(window.location.search).get('next') || '/dashboard_k5'; localStorage.setItem('is_logged_in', 'true'); router.push(nextUrl);
        return true;
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
          const nextUrl = new URLSearchParams(window.location.search).get('next') || '/dashboard_k5'; localStorage.setItem('is_logged_in', 'true'); router.push(nextUrl);
          return true;
        }

        const retryResult = await client.auth.signInWithPassword({ email, password });
        if (retryResult.error) {
          throw retryResult.error;
        }
      }

      const nextUrl = new URLSearchParams(window.location.search).get('next') || '/dashboard_k5'; localStorage.setItem('is_logged_in', 'true'); router.push(nextUrl);
      return true;
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : 'Gagal masuk. Coba lagi.';
      setError(messageText);
      return false;
    } finally {
      setLoading(false);
    }
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

    await handleAccountLogin(emailInput.value, passwordInput.value);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
          <div className="relative hidden flex-1 overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_45%)]" />
          <LoginBackground />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
                <img src="/LogoSDB.png" alt="Logo SDB" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">Satu Bencana</p>
                <p className="text-lg font-semibold">Admin Console</p>
              </div>
            </div>

          </div>
        </div>

        <div className="flex w-full flex-1 items-center justify-center bg-white px-6 py-10 lg:w-[42%] lg:px-8 xl:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-1)] text-lg font-semibold text-white">
                <img src="/LogoSDB.png" alt="Logo SDB" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <p className="text-xl font-semibold text-[var(--brand-1)]">Manajemen Satu Bencana</p>
                <p className="text-sm text-slate-500">Portal admin terintegrasi</p>
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-slate-900">Masuk ke akun admin</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kelola dashboard, data bencana, dan pemetaan dengan antarmuka yang sederhana dan cepat.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  name="email"
                  placeholder="admin@admin.com"
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

              {notice && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                  {notice}
                </div>
              )}

              <Button type="submit" className="h-11 w-full rounded-xl bg-[var(--brand-1)] text-white hover:bg-[var(--brand-2)]" disabled={loading}>
                {loading ? 'Memverifikasi...' : isConfigured ? 'Masuk' : 'Masuk ke mode demo'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              <Link href="/" className="font-medium text-slate-700 transition hover:text-slate-900">
                ← Kembali ke beranda
              </Link>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs leading-6 text-slate-400">
              By Direktorat Tata Ruang, Perkotaan, Pertanahan, dan Penanggulangan Bencana
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}