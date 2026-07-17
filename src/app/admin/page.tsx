"use client"

import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertTriangle, Users, MapPin, Activity, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import Link from "next/link"

// ── Mock data ──────────────────────────────────────────────
const statsCards = [
  {
    title: "Total Kejadian Bencana",
    value: "1.247",
    change: "+8.3%",
    trend: "up" as const,
    note: "Dibanding bulan lalu",
    icon: AlertTriangle,
    iconBg: "bg-red-100 dark:bg-red-950",
    iconColor: "text-red-600 dark:text-red-400",
    badgeClass: "border-red-200 text-red-700 dark:text-red-400",
  },
  {
    title: "Total Pengungsi",
    value: "48.320",
    change: "-12.1%",
    trend: "down" as const,
    note: "Penurunan penanganan",
    icon: Users,
    iconBg: "bg-orange-100 dark:bg-orange-950",
    iconColor: "text-orange-600 dark:text-orange-400",
    badgeClass: "border-green-200 text-green-700 dark:text-green-400",
  },
  {
    title: "Wilayah Terdampak",
    value: "217",
    change: "+6",
    trend: "up" as const,
    note: "Kabupaten/kota baru",
    icon: MapPin,
    iconBg: "bg-blue-100 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeClass: "border-red-200 text-red-700 dark:text-red-400",
  },
  {
    title: "Level Siaga Tinggi",
    value: "127",
    change: "+4.5%",
    trend: "up" as const,
    note: "Peningkatan signifikan",
    icon: Activity,
    iconBg: "bg-yellow-100 dark:bg-yellow-950",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    badgeClass: "border-red-200 text-red-700 dark:text-red-400",
  },
]

const chartData = [
  { bulan: "Agt '25", banjir: 62, gempa: 8, longsor: 21 },
  { bulan: "Sep '25", banjir: 71, gempa: 15, longsor: 18 },
  { bulan: "Okt '25", banjir: 89, gempa: 9, longsor: 31 },
  { bulan: "Nov '25", banjir: 103, gempa: 21, longsor: 28 },
  { bulan: "Des '25", banjir: 128, gempa: 17, longsor: 42 },
  { bulan: "Jan '26", banjir: 145, gempa: 11, longsor: 38 },
  { bulan: "Feb '26", banjir: 132, gempa: 24, longsor: 29 },
  { bulan: "Mar '26", banjir: 97, gempa: 19, longsor: 22 },
  { bulan: "Apr '26", banjir: 84, gempa: 13, longsor: 17 },
  { bulan: "Mei '26", banjir: 73, gempa: 16, longsor: 25 },
  { bulan: "Jun '26", banjir: 61, gempa: 22, longsor: 19 },
  { bulan: "Jul '26", banjir: 55, gempa: 18, longsor: 14 },
]

const recentEvents = [
  { wilayah: "Jawa Barat", jenis: "Banjir", status: "Tinggi", kejadian: 12, pengungsi: 4200, tanggal: "2026-07-17" },
  { wilayah: "Sulawesi Tengah", jenis: "Tsunami", status: "Kritis", kejadian: 11, pengungsi: 5100, tanggal: "2026-07-17" },
  { wilayah: "Kalimantan Timur", jenis: "Karhutla", status: "Tinggi", kejadian: 9, pengungsi: 2100, tanggal: "2026-07-16" },
  { wilayah: "Sulawesi Selatan", jenis: "Longsor", status: "Sedang", kejadian: 8, pengungsi: 1850, tanggal: "2026-07-16" },
  { wilayah: "Sumatera Utara", jenis: "Banjir", status: "Sedang", kejadian: 6, pengungsi: 1430, tanggal: "2026-07-15" },
  { wilayah: "Papua", jenis: "Gempa", status: "Waspada", kejadian: 5, pengungsi: 920, tanggal: "2026-07-15" },
]

const statusColors: Record<string, string> = {
  Kritis: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  Tinggi: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  Sedang: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  Waspada: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
}

// ── Component ──────────────────────────────────────────────
export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((card) => {
          const Icon = card.icon
          const Trend = card.trend === "up" ? TrendingUp : TrendingDown
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-xs font-medium">{card.title}</CardDescription>
                <div className={`flex size-8 items-center justify-center rounded-lg ${card.iconBg}`}>
                  <Icon width={16} height={16} className={card.iconColor} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{card.value}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className={`gap-1 text-[10px] ${card.badgeClass}`}>
                    <Trend width={10} height={10} />
                    {card.change}
                  </Badge>
                  <span>{card.note}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Chart + Summary ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Area chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Tren Kejadian Bencana</CardTitle>
                <CardDescription className="text-xs">Distribusi banjir, gempa & longsor — 12 bulan terakhir</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-sky-500" />Banjir</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-orange-500" />Gempa</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" />Longsor</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gBanjir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gGempa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLongsor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                <XAxis dataKey="bulan" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="banjir" stroke="#0ea5e9" fill="url(#gBanjir)" strokeWidth={2} name="Banjir" />
                <Area type="monotone" dataKey="gempa" stroke="#f97316" fill="url(#gGempa)" strokeWidth={2} name="Gempa" />
                <Area type="monotone" dataKey="longsor" stroke="#10b981" fill="url(#gLongsor)" strokeWidth={2} name="Longsor" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Ringkasan Cepat</CardTitle>
            <CardDescription className="text-xs">Status penanganan saat ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Bencana aktif ditangani", value: "89", color: "text-red-500" },
              { label: "Tim SAR terkerahkan", value: "342", color: "text-blue-500" },
              { label: "Logistik terkirim (ton)", value: "124,5", color: "text-green-500" },
              { label: "Estimasi kerugian (M)", value: "Rp 2.847", color: "text-orange-500" },
              { label: "Pengungsi tertangani", value: "92%", color: "text-emerald-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-semibold tabular-nums ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Link href="/admin/statistik" className="w-full">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                Lihat laporan lengkap
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* ── Recent Events Table ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Kejadian Terbaru</CardTitle>
              <CardDescription className="text-xs">Laporan bencana 7 hari terakhir</CardDescription>
            </div>
            <Link href="/management">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                Lihat semua
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 text-xs">Wilayah</TableHead>
                <TableHead className="text-xs">Jenis Bencana</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Kejadian</TableHead>
                <TableHead className="text-right text-xs">Pengungsi</TableHead>
                <TableHead className="pr-6 text-right text-xs">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.map((ev) => (
                <TableRow key={`${ev.wilayah}-${ev.tanggal}`}>
                  <TableCell className="pl-6 text-sm font-medium">{ev.wilayah}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ev.jenis}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[ev.status] ?? "bg-muted text-muted-foreground"}`}>
                      {ev.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{ev.kejadian}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{ev.pengungsi.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="pr-6 text-right text-xs text-muted-foreground">{ev.tanggal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}
