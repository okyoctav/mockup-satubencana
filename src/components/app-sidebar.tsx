"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import HomeIcon from 'nexticons/outline/HomeIcon'
import MapIcon from 'nexticons/outline/MapIcon'
import ClipboardListIcon from 'nexticons/outline/ClipboardListIcon'
import SearchUsersIcon from 'nexticons/outline/SearchUsersIcon'

const navItems = [
  { key: '/admin', label: 'Dashboard', href: '/admin', icon: <HomeIcon width={18} height={18} /> },
  { key: '/admin/simulasi-k3', label: 'Simulasi K3', href: '/admin/simulasi-k3', icon: <MapIcon width={18} height={18} /> },
  { key: '/management', label: 'Management', href: '/management', icon: <ClipboardListIcon width={18} height={18} /> },
  { key: '/admin/roles', label: 'Users & Roles', href: '/admin/roles', icon: <SearchUsersIcon width={18} height={18} /> },
]
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() || ''

     return (
       <Sidebar {...props} variant="inset" collapsible="none" className="border-r border-slate-200 bg-white shadow-sm">
      <div className="flex h-20 items-center border-b border-slate-200 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white">
          <span className="font-semibold">B</span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-semibold text-slate-900">SATUBENCANA</p>
          <p className="text-xs text-slate-500">Admin dashboard</p>
        </div>
      </div>

      <SidebarContent className="flex-1 p-4">
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.key === '/admin' ? pathname === '/admin' : pathname === item.key || pathname.startsWith(item.key)
            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 p-4">
        <div className="text-sm text-slate-500">Versi admin 1.0</div>
      </SidebarFooter>
    </Sidebar>
  )
}
