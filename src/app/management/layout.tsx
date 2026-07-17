import React from 'react';
import AdminLayout from '@/app/admin/layout';

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
