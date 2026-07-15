'use client';

import { useState } from 'react';
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
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const handleAccountLogin = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.');
      return false;
    }

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
          return true;
        }

        const retryResult = await client.auth.signInWithPassword({ email, password });
        if (retryResult.error) {
          throw retryResult.error;
        }
      }

      router.push('/admin');
      return true;
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : 'Gagal masuk. Coba lagi.';
      setError(messageText);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-background"
    >
      <LoginBackground />

      <div
        className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      >
        <div
          className="w-full max-w-sm space-y-6 bg-card/80 backdrop-blur-sm rounded-xl border border-border p-8 shadow-lg"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              SATUBENCANA
            </h2>
            <p className="text-sm text-muted-foreground">
              Admin Console
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (true) { // Always use account mode for now
                const form = e.target as HTMLFormElement;
                const emailInput = form.elements.namedItem('email') as HTMLInputElement;
                const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
                handleAccountLogin(emailInput.value, passwordInput.value);
              } else {
                // phone mode: just show success toast for now
                alert('Mode login nomor HP siap digunakan (demo).');
              }
            }}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Email Login
              </p>
              <>
                <Input
                  type="email"
                  name="email"
                  placeholder="admin@admin.com"
                  required
                  disabled={!isConfigured}
                  className="w-full"
                />
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  disabled={!isConfigured}
                  className="w-full"
                />
              </>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isConfigured}
            >
              {loading ? 'Memverifikasi...' : isConfigured ? 'Masuk' : 'Konfigurasi belum siap'}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            <Link href="/" className="underline underline-offset-4 hover:text-primary">
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}