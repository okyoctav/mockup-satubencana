"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { LayoutDashboard as LayoutDashboardIcon, MapPin as MapPinIcon, Users as UsersIcon, Database as DatabaseIcon, LogOut as LogOutIcon, BarChart3 as BarChartIcon, AlertTriangle as AlertTriangleIcon } from "lucide-react"

const navItems = [
  {
    label: "Menu Utama",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboardIcon, exact: true },
      { title: "Simulasi K3", href: "/admin/simulasi-k3", icon: MapPinIcon },
      { title: "Statistik", href: "/admin/statistik", icon: BarChartIcon },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { title: "Management Data", href: "/management", icon: DatabaseIcon },
      { title: "Users & Roles", href: "/admin/roles", icon: UsersIcon },
    ],
  },
]

export function AdminAppSidebar() {
  const pathname = usePathname() || ""
  const router = useRouter()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  const handleLogout = async () => {
    const client = getSupabaseBrowserClient()
    if (client) await client.auth.signOut()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon">
      {/* ── Header / Brand ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="SATUBENCANA Admin" render={<Link href="/admin" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow">
                <AlertTriangleIcon width={16} height={16} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">SATUBENCANA</span>
                <span className="truncate text-xs text-sidebar-foreground/60">Admin Panel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Nav Items ── */}
      <SidebarContent>
        {navItems.map((group, gi) => (
          <React.Fragment key={group.label}>
            {gi > 0 && <SidebarSeparator />}
            <SidebarGroup>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href, item.exact)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={active}
                        render={<Link href={item.href} />}
                      >
                        <Icon width={16} height={16} />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          </React.Fragment>
        ))}
      </SidebarContent>

      {/* ── Footer / Logout ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Keluar"
              onClick={() => void handleLogout()}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOutIcon width={16} height={16} />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
