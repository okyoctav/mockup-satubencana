'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LockOutlined,
  MobileOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProConfigProvider,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, Tabs, message, theme } from 'antd';
import type { CSSProperties } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import LoginBackground from '@/components/three/LoginBackground';

type LoginType = 'phone' | 'account';

export default function LoginPage() {
  const router = useRouter();
  const { token } = theme.useToken();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<LoginType>('account');
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const iconStyles: CSSProperties = {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  };

  const handleAccountLogin = async (values: { email?: string; password?: string }) => {
    const email = values.email ?? '';
    const password = values.password ?? '';

    if (!email || !password) {
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
    <ProConfigProvider hashed={false}>
      <div
        style={{
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: token.colorBgContainer,
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
              maxWidth: 420,
              padding: '36px 30px 28px',
              background: 'rgba(11, 25, 44, 0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 24,
              borderLeft: '4px solid #35a7ff',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
            }}
          >
            <LoginForm
              logo="/logo bappenas.png"
              title="SATUBENCANA"
              subTitle="Admin Console"
              onFinish={async (values) => {
                if (loginType === 'account') {
                  return handleAccountLogin(values as { email?: string; password?: string });
                }
                message.success('Mode login nomor HP siap digunakan.');
                return true;
              }}
              submitter={{
                searchConfig: {
                  submitText: loading
                    ? 'Memverifikasi...'
                    : loginType === 'account'
                      ? (isConfigured ? 'Masuk' : 'Konfigurasi belum siap')
                      : 'Lanjutkan',
                },
                submitButtonProps: {
                  loading,
                  disabled: loading || (loginType === 'account' && !isConfigured),
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
              actions={null}
              style={{
                backgroundColor: 'transparent',
              }}
              message={error ? <Alert type="warning" showIcon message={error} style={{ marginBottom: 12 }} /> : undefined}
            >
              <Tabs
                centered
                activeKey={loginType}
                onChange={(activeKey) => {
                  setError('');
                  setLoginType(activeKey as LoginType);
                }}
                items={[
                  { key: 'account', label: 'Email Login' },
                  { key: 'phone', label: 'No. HP Login' },
                ]}
                style={{ marginBottom: 8 }}
              />

              {loginType === 'account' && (
                <>
                  <ProFormText
                    name="email"
                    fieldProps={{
                      size: 'large',
                      prefix: <UserOutlined style={iconStyles} />,
                      disabled: !isConfigured,
                    }}
                    placeholder="Email"
                    rules={[
                      { required: true, message: 'Email wajib diisi' },
                      { type: 'email', message: 'Format email tidak valid' },
                    ]}
                  />
                  <ProFormText.Password
                    name="password"
                    fieldProps={{
                      size: 'large',
                      prefix: <LockOutlined style={iconStyles} />,
                      disabled: !isConfigured,
                    }}
                    placeholder="Password"
                    rules={[
                      { required: true, message: 'Password wajib diisi' },
                    ]}
                  />
                </>
              )}

              {loginType === 'phone' && (
                <>
                  <ProFormText
                    fieldProps={{
                      size: 'large',
                      prefix: <MobileOutlined style={iconStyles} />,
                    }}
                    name="mobile"
                    placeholder="Nomor HP"
                    rules={[
                      { required: true, message: 'Nomor HP wajib diisi' },
                      { pattern: /^08\d{8,11}$/, message: 'Format nomor HP tidak valid' },
                    ]}
                  />
                  <ProFormCaptcha
                    fieldProps={{
                      size: 'large',
                      prefix: <LockOutlined style={iconStyles} />,
                    }}
                    captchaProps={{
                      size: 'large',
                    }}
                    placeholder="Masukkan kode verifikasi"
                    captchaTextRender={(timing, count) => {
                      if (timing) {
                        return `${count} detik`;
                      }
                      return 'Kirim kode';
                    }}
                    name="captcha"
                    rules={[
                      { required: true, message: 'Kode verifikasi wajib diisi' },
                    ]}
                    onGetCaptcha={async () => {
                      message.success('Kode verifikasi berhasil dikirim (demo: 1234).');
                    }}
                  />
                </>
              )}

              <div style={{ marginBlockEnd: 18, marginTop: 8 }}>
                <ProFormCheckbox noStyle name="autoLogin">
                  Ingat saya
                </ProFormCheckbox>
                <a style={{ float: 'right', color: 'rgba(255,255,255,0.72)' }}>
                  Lupa password?
                </a>
              </div>

              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <Link href="/" style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.72)', textDecoration: 'none' }}>
                  ← Kembali ke Beranda
                </Link>
              </div>
            </LoginForm>
          </div>
        </div>
      </div>
    </ProConfigProvider>
  );
}
