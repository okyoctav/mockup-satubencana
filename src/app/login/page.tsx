'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginFormPage, ProFormText } from '@ant-design/pro-components';
import { Alert } from 'antd';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import LoginBackground from '@/components/three/LoginBackground';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const handleLogin = async (values: { email: string; password: string }) => {
    const { email, password } = values;
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <LoginBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
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
          }}
        >
        <LoginFormPage
          title="SATUBENCANA"
          subTitle="Admin Console"
          backgroundImageUrl=""
          logo="/logo bappenas.png"
          submitter={{
            searchConfig: {
              submitText: loading ? 'Memverifikasi...' : (isConfigured ? 'Masuk' : 'Konfigurasi belum siap'),
            },
            submitButtonProps: {
              loading,
              disabled: loading || !isConfigured,
              style: {
                width: '100%',
                borderRadius: 12,
                height: 44,
                background: loading ? 'rgba(53, 167, 255, 0.5)' : 'linear-gradient(135deg, #35A7FF, #38618C)',
                border: 'none',
                boxShadow: '0 4px 15px rgba(53, 167, 255, 0.3)',
                fontWeight: 700,
              },
            },
          }}
          onFinish={handleLogin}
          containerStyle={{
            backgroundColor: 'transparent',
            backdropFilter: 'none',
          }}
          style={{
            backgroundColor: 'transparent',
          }}
          message={error ? <Alert type="warning" showIcon message={error} style={{ marginBottom: 12 }} /> : undefined}
          activityConfig={{
            style: {
              display: 'none',
            },
          }}
        >
          <ProFormText
            name="email"
            fieldProps={{
              size: 'large',
              placeholder: 'admin@admin.com',
              disabled: !isConfigured,
            }}
            label="Email"
            rules={[
              { required: true, message: 'Email wajib diisi' },
              { type: 'email', message: 'Format email tidak valid' },
            ]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              placeholder: '••••••••',
              disabled: !isConfigured,
            }}
            label="Password"
            rules={[
              { required: true, message: 'Password wajib diisi' },
            ]}
          />

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Link href="/" style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)', textDecoration: 'none' }}>
              ← Kembali ke Beranda
            </Link>
          </div>
        </LoginFormPage>
        </div>
      </div>
    </div>
  );
}
