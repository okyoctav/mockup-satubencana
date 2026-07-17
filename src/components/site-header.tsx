"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "Dashboard Admin", subtitle: "Ringkasan data kebencanaan K3 Indonesia" },
  "/admin/simulasi-k3": { title: "Simulasi K3", subtitle: "Peta interaktif simulasi dampak wilayah" },
  "/admin/roles": { title: "Users & Roles", subtitle: "Manajemen pengguna dan hak akses" },
  "/management": { title: "Management Data", subtitle: "Kelola data bencana" },
}

export function SiteHeader() {
  const pathname = usePathname() || "/admin"
  const page = pageTitles[pathname] ?? { title: "Admin Panel", subtitle: "SATUBENCANA" }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <div className="flex flex-1 items-center gap-3">
          <div>
            <h1 className="text-base font-semibold leading-tight">{page.title}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{page.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            Sistem Aktif
          </Badge>
        </div>
      </div>
    </header>
  )
}
