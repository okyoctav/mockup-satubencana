"use client"

import * as React from "react"
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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  MapIcon,
  UsersIcon,
  DatabaseIcon,
  LogOutIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const navMain = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    title: "Simulasi K3",
    href: "/admin/simulasi-k3",
    icon: MapIcon,
  },
  {
    title: "Management Data",
    href: "/management",
    icon: DatabaseIcon,
  },
]

const navAdmin = [
  {
    title: "Users & Roles",
    href: "/admin/roles",
    icon: UsersIcon,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() || ""
  const router = useRouter()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  const handleLogout = async () => {
    const client = getSupabaseBrowserClient()
    if (client) {
      await client.auth.signOut()
    }
    router.push("/login")
  }

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link href="/admin" />
              }
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-600 to-indigo-600 text-white shadow-sm">
                <AlertTriangleIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">SATUBENCANA</span>
                <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive(item.href, item.exact)}
                  tooltip={item.title}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Administrasi</SidebarGroupLabel>
          <SidebarMenu>
            {navAdmin.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  tooltip={item.title}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Keluar"
              onClick={() => void handleLogout()}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOutIcon />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
