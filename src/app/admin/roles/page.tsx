'use client';

import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Switch, message, Spin, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { AdminLayout } from '@/app/admin/AdminLayout';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type AppRoleRow = {
  id: string;
  role: 'admin' | 'viewer';
  active: boolean;
  created_at: string;
  updated_at: string;
};

const { Title, Text } = Typography;

export default function AdminRolesPage() {
  const [rows, setRows] = useState<AppRoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setLoading(true);
    const { data, error } = await client.from('app_roles').select('*').order('role', { ascending: true });
    if (!error) {
      setRows((data ?? []) as AppRoleRow[]);
    } else {
      message.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchRoles();
  }, []);

  const toggleActive = async (row: AppRoleRow) => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const appRolesClient = client as unknown as {
      from: (table: string) => {
        update: (values: { active: boolean }) => {
          eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };

    const { error } = await appRolesClient.from('app_roles').update({ active: !row.active }).eq('id', row.id);
    if (error) {
      message.error(error.message);
      return;
    }

    message.success('Status role diperbarui');
    await fetchRoles();
  };

  return (
    <AdminLayout title="Users & Roles" subtitle="Kelola peran dan status akses admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Daftar role</Title>
          <Text type="secondary">Kelola status aktif role yang tersedia untuk akses admin.</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchRoles()}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} disabled>
            Tambah role
          </Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
        <Table
          dataSource={rows}
          rowKey="id"
          columns={[
            {
              title: 'Role',
              dataIndex: 'role',
              render: (value: string) => <Tag color={value === 'admin' ? 'blue' : 'default'}>{value}</Tag>,
            },
            {
              title: 'Status',
              dataIndex: 'active',
              render: (value: boolean, row: AppRoleRow) => (
                <Switch checked={value} onChange={() => void toggleActive(row)} />
              ),
            },
            {
              title: 'Diperbarui',
              dataIndex: 'updated_at',
              render: (value: string) => new Date(value).toLocaleString('id-ID'),
            },
          ]}
        />
      )}
    </AdminLayout>
  );
}
