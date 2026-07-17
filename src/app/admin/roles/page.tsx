"use client";

import React, { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ShieldIcon, UserIcon, RefreshCwIcon, PlusIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"
import { toast } from "sonner"

type AppRoleRow = {
  id: string
  role: "admin" | "viewer"
  active: boolean
  created_at: string
  updated_at: string
}

// Mock data fallback jika Supabase tidak tersedia
const mockRoles: AppRoleRow[] = [
  {
    id: "mock-001-admin",
    role: "admin",
    active: true,
    created_at: new Date("2026-01-01").toISOString(),
    updated_at: new Date("2026-07-01").toISOString(),
  },
  {
    id: "mock-002-viewer",
    role: "viewer",
    active: true,
    created_at: new Date("2026-01-15").toISOString(),
    updated_at: new Date("2026-06-15").toISOString(),
  },
]

export default function AdminRolesPage() {
  const [rows, setRows] = useState<AppRoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newRole, setNewRole] = useState<AppRoleRow["role"]>("viewer")
  const [newActive, setNewActive] = useState(true)
  const [isMock, setIsMock] = useState(false)

  const fetchRoles = async () => {
    const client = getSupabaseBrowserClient()
    if (!client) {
      setRows(mockRoles)
      setIsMock(true)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await client
      .from("app_roles")
      .select("*")
      .order("role", { ascending: true })

    if (error) {
      console.error("Error fetching roles:", error)
      setRows(mockRoles)
      setIsMock(true)
    } else {
      setRows((data ?? []) as AppRoleRow[])
      setIsMock(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    void fetchRoles()
  }, [])

  const toggleActive = async (row: AppRoleRow) => {
    if (isMock) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, active: !r.active } : r))
      )
      toast.success("Status role diperbarui (mode demo)")
      return
    }

    const client = getSupabaseBrowserClient()
    if (!client) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from("app_roles")
      .update({ active: !row.active })
      .eq("id", row.id)

    if (error) {
      console.error("Error updating role:", error)
      toast.error("Gagal memperbarui status role")
      return
    }

    toast.success("Status role berhasil diperbarui")
    await fetchRoles()
  }

  const createRole = async () => {
    if (isMock) {
      const newRow: AppRoleRow = {
        id: `mock-${Date.now()}`,
        role: newRole,
        active: newActive,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setRows((prev) => [...prev, newRow])
      toast.success("Role ditambahkan (mode demo)")
      return
    }

    const client = getSupabaseBrowserClient()
    if (!client) return

    setCreating(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (client as any)
        .from("app_roles")
        .insert({ role: newRole, active: newActive })

      if (error) {
        console.error("Error creating role:", error)
        toast.error("Gagal menambahkan role")
        return
      }

      toast.success("Role berhasil ditambahkan")
      setNewRole("viewer")
      setNewActive(true)
      await fetchRoles()
    } finally {
      setCreating(false)
    }
  }

  const adminCount = rows.filter((r) => r.role === "admin" && r.active).length
  const viewerCount = rows.filter((r) => r.role === "viewer" && r.active).length
  const inactiveCount = rows.filter((r) => !r.active).length

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">

              {/* Mock mode banner */}
              {isMock && (
                <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-300">
                  <ShieldIcon className="size-4 shrink-0" />
                  <span>Mode Demo — Data tidak terhubung ke database. Perubahan tidak akan tersimpan permanen.</span>
                </div>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Admin Aktif</CardDescription>
                    <CardTitle className="text-3xl tabular-nums">{adminCount}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldIcon className="size-4 text-blue-500" />
                      Akses penuh ke sistem
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Viewer Aktif</CardDescription>
                    <CardTitle className="text-3xl tabular-nums">{viewerCount}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserIcon className="size-4 text-green-500" />
                      Hanya baca data
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Nonaktif</CardDescription>
                    <CardTitle className="text-3xl tabular-nums">{inactiveCount}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <XCircleIcon className="size-4 text-red-400" />
                      Akses dinonaktifkan
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tambah role */}
              <Card>
                <CardHeader>
                  <CardTitle>Tambah Role Baru</CardTitle>
                  <CardDescription>Tambahkan role pengguna ke sistem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="new-role">Tipe Role</Label>
                      <Select
                        value={newRole}
                        onValueChange={(v) => setNewRole(v as AppRoleRow["role"])}
                        disabled={creating}
                      >
                        <SelectTrigger id="new-role" className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="new-active">Status Aktif</Label>
                      <div className="flex h-10 items-center gap-2">
                        <Switch
                          id="new-active"
                          checked={newActive}
                          onCheckedChange={setNewActive}
                          disabled={creating}
                        />
                        <span className="text-sm text-muted-foreground">
                          {newActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => void createRole()}
                      disabled={creating}
                      className="h-10"
                    >
                      <PlusIcon className="size-4" />
                      {creating ? "Menambahkan..." : "Tambah Role"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Daftar roles */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Daftar Role</CardTitle>
                      <CardDescription>Semua role terdaftar dalam sistem</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void fetchRoles()}
                      disabled={loading}
                    >
                      <RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                      <ShieldIcon className="size-8 opacity-30" />
                      <p>Belum ada role terdaftar</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Dibuat</TableHead>
                          <TableHead>Diperbarui</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex size-8 items-center justify-center rounded-lg text-white text-xs font-bold ${
                                    row.role === "admin"
                                      ? "bg-blue-600"
                                      : "bg-green-600"
                                  }`}
                                >
                                  {row.role === "admin" ? "A" : "V"}
                                </div>
                                <span className="font-medium capitalize">{row.role}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                {row.id.slice(0, 12)}...
                              </code>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(row.created_at).toLocaleDateString("id-ID")}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(row.updated_at).toLocaleDateString("id-ID")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={row.active ? "default" : "secondary"}
                                className="gap-1"
                              >
                                {row.active ? (
                                  <CheckCircleIcon className="size-3" />
                                ) : (
                                  <XCircleIcon className="size-3" />
                                )}
                                {row.active ? "Aktif" : "Nonaktif"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Switch
                                  checked={row.active}
                                  onCheckedChange={() => void toggleActive(row)}
                                  disabled={loading}
                                  aria-label={`Toggle ${row.role} status`}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
