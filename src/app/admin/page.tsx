'use client';

import type { CSSProperties } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import { SectionCards } from '@/components/section-cards';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import data from './data.json';

export default function AdminPage() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '18rem',
          '--header-height': '3rem',
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="min-h-screen bg-slate-50 p-4 md:p-6">
        <SiteHeader />
        <div className="mt-6 flex flex-1 flex-col gap-6">
          <SectionCards />
          <div className="px-0 lg:px-2">
            <ChartAreaInteractive />
          </div>
          <DataTable data={data} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
