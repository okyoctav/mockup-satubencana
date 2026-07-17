"use client";

import React from "react"
import { useState } from "react"
import dynamic from "next/dynamic"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useTheme } from "@/contexts/ThemeContext"
import bencanaData from "@/data/bencana.json"

const AdminLeafletK3 = dynamic(
  () => import("@/components/dashboard/AdminLeafletK3"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[640px] items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p>Memuat peta simulasi K3...</p>
        </div>
      </div>
    ),
  }
)

type Kejadian = {
  id: number
  nama: string
  provinsi: string
  kabupaten: string
  lat: number
  lng: number
  jenis: string
  tanggal: string
  korban_jiwa: number
  pengungsi: number
  rumah_terdampak?: number
  status: string
  level: string
}

const allData = bencanaData.kejadian as Kejadian[]

export default function SimulasiK3Page() {
  const { theme } = useTheme()
  const [flyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 p-4 lg:p-6">
            <div className="relative h-full min-h-[calc(100vh-10rem)] overflow-hidden rounded-xl border bg-muted/20">
              <AdminLeafletK3 data={allData} flyTo={flyTo} theme={theme} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
