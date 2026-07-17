'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AdminLayout } from '@/app/admin/AdminLayout';

type AppRoleRow = {
  id: string;
  role: 'admin' | 'viewer';
  active: boolean;
  created_at: string;
  updated_at: string;
};

export default function AdminRolesPage() {
  const [rows, setRows] = useState<AppRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState<AppRoleRow['role']>('viewer');
  const [newActive, setNewActive] = useState(true);

  const fetchRoles = async () => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setLoading(true);
    const { data, error } = await client.from('app_roles').select('*').order('role', { ascending: true });
    if (!error) {
      setRows((data ?? []) as AppRoleRow[]);
    } else {
      console.error('Error fetching roles:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchRoles();
  }, []);

  const toggleActive = async (row: AppRoleRow) => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('app_roles')
      .update({ active: !row.active })
      .eq('id', row.id);

    if (error) {
      console.error('Error updating role:', error);
      return;
    }

    await fetchRoles();
  };

  const createRole = async () => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setCreating(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (client as any)
        .from('app_roles')
        .insert({ role: newRole, active: newActive });

      if (error) {
        console.error('Error creating role:', error);
        return;
      }

      setNewRole('viewer');
      setNewActive(true);
      await fetchRoles();
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout title="Users & Roles" subtitle="Manajemen role dan status aktif">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-foreground">Daftar role</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => void fetchRoles()} size="sm">
              Refresh
            </Button>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AppRoleRow['role'])}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 12,
              }}
              disabled={creating}
            >
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
                disabled={creating}
              />
              Active
            </label>

            <Button
              variant="default"
              onClick={() => void createRole()}
              disabled={creating}
              size="sm"
            >
              {creating ? 'Membuat...' : 'Tambah role'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <Card key={row.id} className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/20">
                        {row.role === 'admin' ? 'A' : 'V'}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">
                          {row.role === 'admin' ? 'Admin' : 'Viewer'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Role ID: {row.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Switch
                        checked={row.active}
                        onCheckedChange={(checked) => void toggleActive({ ...row, active: checked })}
                        disabled={loading}
                      />
                      <span className={cn(
                        'text-xs font-medium',
                        row.active ? 'text-success' : 'text-muted-foreground'
                      )}>
                        {row.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Diperbarui: {new Date(row.updated_at).toLocaleString('id-ID')}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
