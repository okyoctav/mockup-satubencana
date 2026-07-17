"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { useTheme } from "@/contexts/ThemeContext"
import bencanaData from "@/data/bencana.json"

const AdminLeafletK3 = dynamic(
  () => import("@/components/dashboard/AdminLeafletK3"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">
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
    // Negative margin & calc override to fill available space under the header
    // The layout adds p-4 md:p-6 padding, so we cancel it here for fullsize map
    <div className="-m-4 -mb-4 md:-m-6 md:-mb-6">
      <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
        <AdminLeafletK3 data={allData} flyTo={flyTo} theme={theme} />
      </div>
    </div>
  )
}
