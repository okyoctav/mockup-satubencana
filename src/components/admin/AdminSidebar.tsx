import Link from 'next/link';
import { FC } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, Map, Users, Database } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type MenuItem = { key: string; label: string; href: string; icon?: React.ReactNode };

interface Props {
  menuItems: MenuItem[];
  pathname: string;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mockMode: boolean;
  handleLogout: () => Promise<void>;
}

const IconFor = (key: string) => {
  if (key.includes('simulasi')) return <Map size={16} />;
  if (key.includes('management')) return <Database size={16} />;
  if (key.includes('roles')) return <Users size={16} />;
  return <Home size={16} />;
};

const AdminSidebar: FC<Props> = ({ menuItems, pathname, sidebarCollapsed, setSidebarCollapsed, mockMode, handleLogout }) => {
  return (
    <SidebarProvider defaultOpen={!sidebarCollapsed} open={!sidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
      <Sidebar variant="sidebar" collapsible={sidebarCollapsed ? 'icon' : 'offcanvas'}>
        <div className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 px-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="2" fill="white" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">SATUBENCANA</p>
              <p className="truncate text-xs text-slate-500">Admin Console</p>
            </div>
          </div>
          <SidebarTrigger />
        </div>

        <SidebarContent>
          <div className="flex-1 px-3 py-6">
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {mockMode ? 'Mode demo aktif' : 'Mode terhubung'}
            </div>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = item.key === '/admin' ? pathname === '/admin' : pathname === item.key || pathname.startsWith(item.key);
                return (
                  <SidebarMenuItem key={item.key}>
                    <Link href={item.href} className={cn('group/menu-item')}> 
                      <SidebarMenuButton isActive={isActive}>
                        <span className="text-base mr-2">{item.icon ?? IconFor(item.key)}</span>
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
          <SidebarFooter>
            <div className="p-3">
              <Button variant="outline" className="w-full" onClick={handleLogout}>Keluar</Button>
            </div>
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
};

export default AdminSidebar;
