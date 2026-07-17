"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell as BellIcon, Search as SearchIcon, User as UserCircleIcon, LogOut as LogOutIcon, ShieldAlert as ShieldCheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/admin": { title: "Dashboard", description: "Ringkasan data kebencanaan K3 Indonesia" },
  "/admin/simulasi-k3": { title: "Simulasi K3", description: "Peta interaktif dampak wilayah bencana" },
  "/admin/roles": { title: "Users & Roles", description: "Manajemen pengguna dan hak akses sistem" },
  "/admin/statistik": { title: "Statistik", description: "Analisis dan laporan data bencana" },
  "/management": { title: "Management Data", description: "Pengelolaan data bencana" },
}

interface AdminHeaderProps {
  userEmail?: string
  isDemoMode?: boolean
}

export function AdminHeader({ userEmail = "admin@satubencana.id", isDemoMode = false }: AdminHeaderProps) {
  const pathname = usePathname() || "/admin"
  const router = useRouter()
  const meta = PAGE_META[pathname] ?? { title: "Admin", description: "SATUBENCANA" }

  const handleLogout = async () => {
    const client = getSupabaseBrowserClient()
    if (client) await client.auth.signOut()
    router.push("/login")
  }

  const initials = (userEmail.charAt(0) ?? "A").toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2">
        {/* Sidebar trigger + separator */}
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 data-vertical:self-auto" />

        {/* Page title */}
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-sm font-semibold leading-tight">{meta.title}</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">{meta.description}</p>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">

          {/* Demo mode badge */}
          {isDemoMode && (
            <Badge variant="secondary" className="hidden gap-1 text-xs sm:flex">
              <ShieldCheckIcon width={12} height={12} />
              Mode Demo
            </Badge>
          )}

          {/* System status */}
          <Badge variant="outline" className="hidden gap-1.5 text-xs sm:flex">
            <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
            Sistem Aktif
          </Badge>

          {/* Search trigger */}
          <Button variant="ghost" size="icon" className="size-8" aria-label="Cari">
            <SearchIcon width={16} height={16} />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative size-8" aria-label="Notifikasi">
            <BellIcon width={16} height={16} />
            <span className="absolute right-1 top-1 flex size-3 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              3
            </span>
          </Button>

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-xs font-semibold text-white cursor-pointer hover:opacity-90">
              {initials}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Administrator</span>
                  <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-sm">
                <UserCircleIcon width={14} height={14} />
                Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-sm text-destructive focus:text-destructive"
                onClick={() => void handleLogout()}
              >
                <LogOutIcon width={14} height={14} />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
