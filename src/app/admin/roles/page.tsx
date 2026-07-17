"use client"

import React, { useEffect, useState } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Shield as ShieldIcon, Users as UsersIcon, Plus as PlusIcon, RefreshCw as RefreshIcon, CheckCircle2 as CheckCircleIcon, XCircle as XCircleIcon } from "lucide-react"

type AppRoleRow = {
  id: string
  role: "admin" | "viewer"
  active: boolean
  created_at: string
  updated_at: string
}

const MOCK_ROLES: AppRoleRow[] = [
  { id: "demo-001-a", role: "admin", active: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-07-01T00:00:00Z" },
  { id: "demo-002-v", role: "viewer", active: true, created_at: "2026-02-01T00:00:00Z", updated_at: "2026-06-15T00:00:00Z" },
  { id: "demo-003-v", role: "viewer", active: false, created_at: "2026-03-01T00:00:00Z", updated_at: "2026-05-01T00:00:00Z" },
]

export default function AdminRolesPage() {
  const [rows, setRows] = useState<AppRoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer")
  const [newActive, setNewActive] = useState(true)

  const fetchRoles = async () => {
    const client = getSupabaseBrowserClient()
    if (!client) {
      setRows(MOCK_ROLES)
      setIsMock(true)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await client.from("app_roles").select("*").order("role")
    if (error) {
      setRows(MOCK_ROLES)
      setIsMock(true)
    } else {
      setRows((data ?? []) as AppRoleRow[])
      setIsMock(false)
    }
    setLoading(false)
  }

  useEffect(() => { void fetchRoles() }, [])

  const toggleActive = async (row: AppRoleRow) => {
    if (isMock) {
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, active: !r.active } : r))
      toast.success("Status diperbarui (mode demo)")
      return
    }
    const client = getSupabaseBrowserClient()
    if (!client) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any).from("app_roles").update({ active: !row.active }).eq("id", row.id)
    if (error) { toast.error("Gagal memperbarui"); return }
    toast.success("Status berhasil diperbarui")
    await fetchRoles()
  }

  const createRole = async () => {
    if (isMock) {
      setRows((prev) => [...prev, {
        id: `demo-${Date.now()}`, role: newRole, active: newActive,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }])
      toast.success("Role ditambahkan (mode demo)")
      return
    }
    const client = getSupabaseBrowserClient()
    if (!client) return
    setCreating(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (client as any).from("app_roles").insert({ role: newRole, active: newActive })
      if (error) { toast.error("Gagal menambahkan role"); return }
      toast.success("Role berhasil ditambahkan")
      setNewRole("viewer"); setNewActive(true)
      await fetchRoles()
    } finally { setCreating(false) }
  }

  const adminCount = rows.filter((r) => r.role === "admin" && r.active).length
  const viewerCount = rows.filter((r) => r.role === "viewer" && r.active).length
  const inactiveCount = rows.filter((r) => !r.active).length

  return (
    <div className="flex flex-col gap-6">

      {/* Demo banner */}
      {isMock && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300">
          <ShieldIcon width={16} height={16} className="shrink-0" />
          Mode Demo — Tidak terhubung ke database. Perubahan tidak tersimpan permanen.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Admin Aktif</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{adminCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldIcon width={14} height={14} className="text-blue-500" />Akses penuh ke sistem
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Viewer Aktif</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{viewerCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UsersIcon width={14} height={14} className="text-green-500" />Hanya baca data
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Nonaktif</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{inactiveCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <XCircleIcon width={14} height={14} className="text-muted-foreground" />Akses dinonaktifkan
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Tambah Role Baru</CardTitle>
          <CardDescription className="text-xs">Tambahkan role pengguna ke sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-role" className="text-xs">Tipe Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "viewer")} disabled={creating}>
                <SelectTrigger id="new-role" className="w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Status Aktif</Label>
              <div className="flex h-9 items-center gap-2">
                <Switch checked={newActive} onCheckedChange={setNewActive} disabled={creating} />
                <span className="text-xs text-muted-foreground">{newActive ? "Aktif" : "Nonaktif"}</span>
              </div>
            </div>
            <Button onClick={() => void createRole()} disabled={creating} size="sm" className="gap-1.5">
              <PlusIcon width={14} height={14} />
              {creating ? "Menambahkan..." : "Tambah Role"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Roles table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Daftar Role</CardTitle>
              <CardDescription className="text-xs">Semua role terdaftar dalam sistem</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => void fetchRoles()} disabled={loading}>
              <RefreshIcon width={13} height={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 text-xs">Role</TableHead>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Dibuat</TableHead>
                  <TableHead className="text-xs">Diperbarui</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="pr-6 text-right text-xs">Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <div className={`flex size-7 items-center justify-center rounded-md text-[11px] font-bold text-white ${row.role === "admin" ? "bg-blue-600" : "bg-green-600"}`}>
                          {row.role === "admin" ? "A" : "V"}
                        </div>
                        <span className="text-sm font-medium capitalize">{row.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.id.slice(0, 12)}…</code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(row.updated_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.active ? "default" : "secondary"} className="gap-1 text-[10px]">
                        {row.active
                          ? <CheckCircleIcon width={10} height={10} />
                          : <XCircleIcon width={10} height={10} />}
                        {row.active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Switch
                        checked={row.active}
                        onCheckedChange={() => void toggleActive(row)}
                        disabled={loading}
                        aria-label={`Toggle ${row.role}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
