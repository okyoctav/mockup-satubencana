'use client';

import { Card, Row, Col, Typography, Space, Alert, Button } from 'antd';
import { 
  DashboardOutlined, 
  DatabaseOutlined, 
  ArrowRightOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/app/admin/AdminLayout';

const { Title, Paragraph, Text } = Typography;

export default function AdminPage() {
  const router = useRouter();

  const MENU = [
    {
      icon: <DashboardOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
      label: 'Dashboard Bencana',
      desc: 'Lihat executive dashboard data bencana nasional secara real-time dan analisis spasial.',
      href: '/dashboard',
      accent: '#1677ff',
    },
    {
      icon: <DatabaseOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
      label: 'Management Data',
      desc: 'Kelola dan lihat daftar layanan geospasial Inarisk BNPB, parameter bencana, dan metadata.',
      href: '/management',
      accent: '#722ed1',
    },
  ];

  return (
    <AdminLayout title="Admin Console" subtitle="Pilih modul admin yang ingin dikelola">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 0' }}>
        
        {/* Welcome Section */}
        <div style={{ marginBottom: 32 }}>
          <Space direction="vertical" size={4}>
            <Title level={2} style={{ margin: 0 }}>
              Selamat datang, Admin 👋
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Gunakan panel kontrol ini untuk mengarahkan manajemen dan visibilitas data bencana nasional.
            </Text>
          </Space>
        </div>

        {/* Menu Cards */}
        <Row gutter={[20, 20]} style={{ marginBottom: 40 }}>
          {MENU.map(m => (
            <Col xs={24} sm={12} key={m.label}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: 16,
                  borderLeft: `4px solid ${m.accent}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                }}
                styles={{ body: { padding: 24, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' } }}
                onClick={() => router.push(m.href)}
              >
                <div>
                  <div style={{ marginBottom: 16 }}>{m.icon}</div>
                  <Title level={4} style={{ margin: '0 0 8px 0' }}>{m.label}</Title>
                  <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.6, minHeight: 48, marginBottom: 0 }}>
                    {m.desc}
                  </Paragraph>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Button 
                    type="link" 
                    icon={<ArrowRightOutlined />} 
                    style={{ padding: 0, color: m.accent, fontWeight: 600 }}
                  >
                    Buka Modul
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Info Box */}
        <Alert
          message="Informasi Sesi Administrator"
          description="Sesi Anda dikendalikan menggunakan Supabase Auth dan ACL (Access Control List). Hak akses administrator Anda diverifikasi di server untuk menjamin keamanan operasional data."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ borderRadius: 12, padding: '16px 20px' }}
        />
      </div>
    </AdminLayout>
  );
}

