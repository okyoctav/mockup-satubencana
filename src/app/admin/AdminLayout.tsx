'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Button, Space, Typography, Spin } from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  TeamOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getUserRole } from '@/lib/auth/getUserRole';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

type AdminLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const verifyAccess = async () => {
      const client = getSupabaseBrowserClient();
      if (!client) {
        if (active) {
          router.replace('/login');
        }
        return;
      }

      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session) {
        if (active) router.replace('/login');
        return;
      }

      const { role, error } = await getUserRole(client);
      if (!active) return;

      if (error || role !== 'admin') {
        router.replace('/login');
        return;
      }

      const {
        data: { user },
      } = await client.auth.getUser();

      if (active) {
        setUserEmail(user?.email ?? null);
        setReady(true);
      }
    };

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = async () => {
    const client = getSupabaseBrowserClient();
    if (client) {
      await client.auth.signOut();
    }
    router.push('/login');
  };

  const menuItems = useMemo(
    () => [
      {
        key: '/admin',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => router.push('/admin'),
      },
      {
        key: '/management',
        icon: <DatabaseOutlined />,
        label: 'Management Data',
        onClick: () => router.push('/management'),
      },
      {
        key: '/admin/roles',
        icon: <TeamOutlined />,
        label: 'Users & Roles',
        onClick: () => router.push('/admin/roles'),
      },
    ],
    [router],
  );

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-page)',
          color: 'var(--text-muted)',
        }}
      >
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>Memverifikasi akses admin...</Text>
        </Space>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sider
        width={240}
        breakpoint="lg"
        collapsedWidth={0}
        style={{
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-faint)',
        }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-faint)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #35a7ff, #38618c)',
                color: '#fff',
                fontWeight: 800,
              }}
            >
              SB
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>SATUBENCANA</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin Console</div>
            </div>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={menuItems.map((item) => item.key).filter((key) => pathname === key)}
          items={menuItems}
          style={{ borderInlineEnd: 0, paddingTop: 12 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-faint)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 72,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>
              {title}
            </Title>
            {subtitle ? <Text style={{ color: 'var(--text-muted)' }}>{subtitle}</Text> : null}
          </div>

          <Space align="center">
            <div
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(53,167,255,0.08)',
                border: '1px solid rgba(53,167,255,0.15)',
                color: 'var(--text-secondary)',
                fontSize: 12,
              }}
            >
              {userEmail ?? 'Admin'}
            </div>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Keluar
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: 24, background: 'var(--bg-page)' }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
