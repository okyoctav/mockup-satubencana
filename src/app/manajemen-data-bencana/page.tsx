'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  DashboardLayer,
  LAYER_GROUPS,
  LAYER_TYPES,
  GROUP_COLOR_MAP,
  LayerType,
} from '@/types/layer';
import { DEFAULT_DASHBOARD_LAYERS } from '@/data/defaultLayers';
import {
  Database,
  Plus,
  Search,
  Check,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Terminal,
  RefreshCw,
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'satubencana_dashboard_layers_v1';

export default function ManajemenDataBencanaPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [layers, setLayers] = useState<DashboardLayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [dbNotice, setDbNotice] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('Semua');
  const [selectedType, setSelectedType] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Non-Aktif'>('Semua');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [editingLayer, setEditingLayer] = useState<DashboardLayer | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<DashboardLayer>>({
    id: '',
    label: '',
    color: '#0284C7',
    emoji: '🗺️',
    url: '',
    type: 'MapServer',
    group: 'BNPB',
    layersParam: '',
    useLngLat: false,
    ignoreScale: false,
    requiresFilter: false,
    requiresToken: false,
    description: '',
    is_active: true,
  });

  // Load layers from Supabase or Fallback to LocalStorage / Default
  const loadLayers = async () => {
    setLoading(true);
    const client = getSupabaseBrowserClient();

    if (client) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (client as any)
          .from('dashboard_layers')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          // Normalize Supabase snake_case to camelCase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const normalized: DashboardLayer[] = (data as any[]).map((d: any) => ({
            id: d.id,
            label: d.label,
            color: d.color,
            emoji: d.emoji,
            url: d.url,
            type: d.type as LayerType,
            group: d.group_name || d.group || 'BNPB',
            group_name: d.group_name,
            layersParam: d.layers_param || d.layersParam || undefined,
            layers_param: d.layers_param,
            useLngLat: d.use_lng_lat ?? d.useLngLat ?? false,
            use_lng_lat: d.use_lng_lat,
            ignoreScale: d.ignore_scale ?? d.ignoreScale ?? false,
            ignore_scale: d.ignore_scale,
            requiresFilter: d.requires_filter ?? d.requiresFilter ?? false,
            requires_filter: d.requires_filter,
            requiresToken: d.requires_token ?? d.requiresToken ?? false,
            requires_token: d.requires_token,
            extent: d.extent,
            description: d.description,
            is_active: d.is_active ?? true,
            sort_order: d.sort_order ?? 0,
            created_at: d.created_at,
            updated_at: d.updated_at,
          }));

          setLayers(normalized);
          setIsSupabaseConnected(true);
          setDbNotice(null);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
          setLoading(false);
          return;
        } else if (error) {
          // Table doesn't exist yet or connection error
          console.warn('Supabase dashboard_layers notice:', error.message);
          setDbNotice(error.message);
        }
      } catch (err) {
        console.warn('Supabase query exception:', err);
      }
    }

    // Fallback: Check LocalStorage or use default 38 layers
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLayers(parsed);
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }

    // Default layers
    setLayers(DEFAULT_DASHBOARD_LAYERS);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DASHBOARD_LAYERS));
    setLoading(false);
  };

  useEffect(() => {
    loadLayers();
  }, []);

  // Save changes to Supabase (and LocalStorage)
  const saveLayerToStorage = async (layer: DashboardLayer, isNew: boolean) => {
    // 1. Update in Supabase if client is ready
    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        const payload = {
          id: layer.id,
          label: layer.label,
          color: layer.color,
          emoji: layer.emoji,
          url: layer.url,
          type: layer.type,
          group_name: layer.group,
          layers_param: layer.layersParam,
          use_lng_lat: layer.useLngLat,
          ignore_scale: layer.ignoreScale,
          requires_filter: layer.requiresFilter,
          requires_token: layer.requiresToken,
          extent: layer.extent ? JSON.stringify(layer.extent) : null,
          description: layer.description,
          is_active: layer.is_active,
          sort_order: layer.sort_order ?? 999,
          updated_at: new Date().toISOString(),
        };

        if (isNew) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (client as any).from('dashboard_layers').insert([payload]);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (client as any).from('dashboard_layers').update(payload).eq('id', layer.id);
        }
      } catch (e) {
        console.warn('Could not sync to Supabase table:', e);
      }
    }

    // 2. Update Local State & LocalStorage
    let updatedList: DashboardLayer[];
    if (isNew) {
      updatedList = [layer, ...layers];
    } else {
      updatedList = layers.map((l) => (l.id === layer.id ? layer : l));
    }

    setLayers(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  };

  // Toggle active status
  const handleToggleActive = async (layer: DashboardLayer) => {
    const updated: DashboardLayer = {
      ...layer,
      is_active: !layer.is_active,
    };
    await saveLayerToStorage(updated, false);
  };

  // Delete layer
  const handleDeleteLayer = async (id: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus layer "${id}"?`)) return;

    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any).from('dashboard_layers').delete().eq('id', id);
      } catch (e) {
        console.warn('Could not delete from Supabase:', e);
      }
    }

    const updated = layers.filter((l) => l.id !== id);
    setLayers(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingLayer(null);
    setFormData({
      id: '',
      label: '',
      color: '#0284C7',
      emoji: '🗺️',
      url: '',
      type: 'MapServer',
      group: 'BNPB',
      layersParam: '',
      useLngLat: false,
      ignoreScale: false,
      requiresFilter: false,
      requiresToken: false,
      description: '',
      is_active: true,
      sort_order: layers.length + 1,
    });
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (layer: DashboardLayer) => {
    setEditingLayer(layer);
    setFormData({
      ...layer,
      group: layer.group || layer.group_name || 'BNPB',
      layersParam: layer.layersParam || layer.layers_param || '',
      useLngLat: layer.useLngLat ?? layer.use_lng_lat ?? false,
      ignoreScale: layer.ignoreScale ?? layer.ignore_scale ?? false,
      requiresFilter: layer.requiresFilter ?? layer.requires_filter ?? false,
      requiresToken: layer.requiresToken ?? layer.requires_token ?? false,
    });
    setIsFormOpen(true);
  };

  // Submit Form (Create or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id?.trim() || !formData.label?.trim() || !formData.url?.trim()) {
      alert('Mohon lengkapi ID Layer, Nama Layer, dan URL Layanan.');
      return;
    }

    const cleanId = formData.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const layerToSave: DashboardLayer = {
      id: cleanId,
      label: formData.label.trim(),
      color: formData.color || '#0284C7',
      emoji: formData.emoji || '🗺️',
      url: formData.url.trim(),
      type: formData.type || 'MapServer',
      group: formData.group || 'BNPB',
      group_name: formData.group || 'BNPB',
      layersParam: formData.layersParam?.trim() || undefined,
      layers_param: formData.layersParam?.trim() || undefined,
      useLngLat: !!formData.useLngLat,
      use_lng_lat: !!formData.useLngLat,
      ignoreScale: !!formData.ignoreScale,
      ignore_scale: !!formData.ignoreScale,
      requiresFilter: !!formData.requiresFilter,
      requires_filter: !!formData.requiresFilter,
      requiresToken: !!formData.requiresToken,
      requires_token: !!formData.requiresToken,
      description: formData.description?.trim() || undefined,
      is_active: formData.is_active ?? true,
      sort_order: formData.sort_order ?? layers.length + 1,
    };

    await saveLayerToStorage(layerToSave, !editingLayer);
    setIsFormOpen(false);
  };

  // Reset to default 38 layers
  const handleResetToDefault = () => {
    if (confirm('Kembalikan seluruh layer ke konfigurasi standar default 38 layer BNPB?')) {
      setLayers(DEFAULT_DASHBOARD_LAYERS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DASHBOARD_LAYERS));
    }
  };

  // Copy URL Helper
  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  // Filtered Layers
  const filteredLayers = useMemo(() => {
    return layers.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        l.label.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        (l.group && l.group.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q));

      const matchGroup = selectedGroup === 'Semua' || l.group === selectedGroup;
      const matchType = selectedType === 'Semua' || l.type === selectedType;
      const matchStatus =
        statusFilter === 'Semua' ||
        (statusFilter === 'Aktif' && l.is_active) ||
        (statusFilter === 'Non-Aktif' && !l.is_active);

      return matchSearch && matchGroup && matchType && matchStatus;
    });
  }, [layers, searchQuery, selectedGroup, selectedType, statusFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = layers.length;
    const active = layers.filter((l) => l.is_active).length;
    const inactive = total - active;
    const groups = new Set(layers.map((l) => l.group || 'BNPB')).size;
    return { total, active, inactive, groups };
  }, [layers]);

  // SQL Script Text
  const sqlScript = `-- 1. Buat Tabel dashboard_layers di Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.dashboard_layers (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#0284C7',
    emoji TEXT NOT NULL DEFAULT '🗺️',
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'MapServer',
    group_name TEXT NOT NULL DEFAULT 'BNPB',
    layers_param TEXT,
    use_lng_lat BOOLEAN DEFAULT false,
    ignore_scale BOOLEAN DEFAULT false,
    requires_filter BOOLEAN DEFAULT false,
    requires_token BOOLEAN DEFAULT false,
    extent JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS):
ALTER TABLE public.dashboard_layers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read active layers" ON public.dashboard_layers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.dashboard_layers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.dashboard_layers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON public.dashboard_layers FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow anon all in dev" ON public.dashboard_layers FOR ALL TO anon USING (true) WITH CHECK (true);

-- (File migrasi lengkap dengan seed 38 layer tersedia di: supabase/migrations/20260921_create_dashboard_layers.sql)`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased relative">
      {/* 1. REUSABLE LEFT SIDEBAR */}
      <AdminSidebar isSidebarOpen={isSidebarOpen} activePathOverride="/manajemen-data-bencana" />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* HEADER NAVBAR */}
        <AdminHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          title="Manajemen Data Bencana"
          badge="Layer Manager / GIS Catalog"
          icon={<Database className="w-4 h-4" />}
          rightActions={
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 transition-all text-xs font-bold cursor-pointer shadow-xs"
              title="Lihat Script Migrasi Supabase"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Script SQL Supabase</span>
            </button>
          }
        />

        {/* WORKSPACE CONTENT (SCROLLABLE) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SUPABASE STATUS BANNER */}
          {dbNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200">
                    Tabel Supabase Belum Dibuat atau Belum Dijalankan
                  </h4>
                  <p className="text-amber-700 dark:text-amber-300/90 mt-0.5">
                    Modul saat ini berjalan dalam mode <b>Local Sync (38 layer siap pakai)</b>. Agar data tersimpan permanen di cloud Supabase Anda, jalankan script SQL migrasi yang telah kami siapkan di Supabase SQL Editor.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition-colors shadow-xs"
              >
                Buka Script SQL
              </button>
            </div>
          )}

          {isSupabaseConnected && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Terhubung langsung dengan database Supabase (`dashboard_layers`). Perubahan langsung tersinkronisasi.</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold">
                LIVE DB
              </span>
            </div>
          )}

          {/* 3. KPI STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Total Layer Terdaftar</span>
                <Layers className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {stats.total}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Katalog layer geospasial</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Layer Aktif di Peta</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {stats.active}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Muncul di menu Dashboard K5</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Layer Non-Aktif</span>
                <X className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {stats.inactive}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Disimpan sebagai arsip</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span>Instansi Sumber</span>
                <Database className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
                {stats.groups}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">BNPB, BAPPENAS, BIG, dll</div>
            </div>
          </div>

          {/* 4. ACTION BAR & FILTER CONTROLS */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari layer berdasarkan ID, label, instansi, atau URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleResetToDefault}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  title="Sinkronkan / kembalikan ke layer standar default"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Default (38 Layer)</span>
                </button>

                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1f8080] hover:bg-[#1f8080]/90 text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-102"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Layer Baru</span>
                </button>
              </div>
            </div>

            {/* Filter Pills & Dropdowns */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/60">
              {/* Group filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Instansi:</span>
                {['Semua', ...LAYER_GROUPS].map((grp) => (
                  <button
                    key={grp}
                    onClick={() => setSelectedGroup(grp)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedGroup === grp
                        ? 'bg-[#1f8080] text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>

              {/* Type & Status Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="Semua">Semua Tipe Layanan</option>
                  {LAYER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'Semua' | 'Aktif' | 'Non-Aktif')}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif">Hanya Aktif</option>
                  <option value="Non-Aktif">Hanya Non-Aktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. DATA TABLE / LIST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>Daftar Layer GIS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                  {filteredLayers.length} ditemukan
                </span>
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-500" />
                <span>Memuat data katalog layer...</span>
              </div>
            ) : filteredLayers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Database className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">Tidak ada layer yang sesuai dengan filter.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGroup('Semua');
                    setSelectedType('Semua');
                    setStatusFilter('Semua');
                  }}
                  className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">Aktif</th>
                      <th className="py-3 px-4">Layer / Label</th>
                      <th className="py-3 px-4">Instansi</th>
                      <th className="py-3 px-4">Tipe Service</th>
                      <th className="py-3 px-4">Endpoint URL & Parameter</th>
                      <th className="py-3 px-4 w-28 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLayers.map((layer) => {
                      const groupStyle =
                        GROUP_COLOR_MAP[layer.group || 'BNPB'] || {
                          bg: 'bg-slate-100 dark:bg-slate-800',
                          text: 'text-slate-700 dark:text-slate-300',
                          border: 'border-slate-200 dark:border-slate-700',
                        };

                      return (
                        <tr
                          key={layer.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Toggle Active */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleActive(layer)}
                              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                                layer.is_active
                                  ? 'bg-[#1f8080]'
                                  : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                              title={layer.is_active ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  layer.is_active ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Layer Label & ID */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2.5">
                              <span className="text-lg leading-none shrink-0 mt-0.5">
                                {layer.emoji || '🗺️'}
                              </span>
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  <span>{layer.label}</span>
                                  {layer.color && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0 border border-black/10"
                                      style={{ backgroundColor: layer.color }}
                                      title={`Warna: ${layer.color}`}
                                    />
                                  )}
                                </div>
                                <div className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                                  id: {layer.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Group / Agency Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border ${groupStyle.bg} ${groupStyle.text} ${groupStyle.border}`}
                            >
                              {layer.group || 'BNPB'}
                            </span>
                          </td>

                          {/* Service Type */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {layer.type || 'MapServer'}
                            </span>
                          </td>

                          {/* URL & Params */}
                          <td className="py-3 px-4 max-w-xs sm:max-w-md">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[260px] sm:max-w-[340px]">
                                {layer.url}
                              </span>
                              <button
                                onClick={() => handleCopyUrl(layer.id, layer.url)}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                                title="Salin URL Layanan"
                              >
                                {copiedUrlId === layer.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {layer.url.startsWith('http') && (
                                <a
                                  href={layer.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-sky-500 transition-colors cursor-pointer shrink-0"
                                  title="Buka Endpoint di Tab Baru"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>

                            {/* Additional Flag badges */}
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {layer.layersParam && (
                                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                  param: {layer.layersParam}
                                </span>
                              )}
                              {layer.requiresToken && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  Token BIG
                                </span>
                              )}
                              {layer.requiresFilter && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  Filter Req
                                </span>
                              )}
                              {layer.useLngLat && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  LngLat
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(layer)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                                title="Edit Layer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLayer(layer.id)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                title="Hapus Layer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 6. MODAL: TAMBAH / EDIT LAYER */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[800] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingLayer ? 'Edit Konfigurasi Layer' : 'Tambah Layer Geospasial Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* ID & Emoji */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Emoji</label>
                  <input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    className="w-full text-center text-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 outline-none"
                    placeholder="🗺️"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    ID Unik (Slug) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!!editingLayer}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none focus:border-teal-500 disabled:opacity-60"
                    placeholder="contoh: banjirdki_2026"
                    required
                  />
                </div>
              </div>

              {/* Label */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nama / Label Layer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                  placeholder="contoh: Peta Risiko Banjir Wilayah DKI"
                  required
                />
              </div>

              {/* Group & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Instansi / Grup</label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                  >
                    {LAYER_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Tipe Layanan</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as LayerType })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                  >
                    {LAYER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  URL Service / Endpoint <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-[11px] outline-none focus:border-teal-500"
                  placeholder="https://gis.bnpb.go.id/server/rest/services/..."
                  required
                />
              </div>

              {/* Param & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Parameter Layer (Opsional)</label>
                  <input
                    type="text"
                    value={formData.layersParam || ''}
                    onChange={(e) => setFormData({ ...formData, layersParam: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                    placeholder="contoh: show:0 atau raster:NAME"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Warna Aksen</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color || '#0284C7'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-9 h-8 p-0 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.color || '#0284C7'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Aktif di Dashboard</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.useLngLat}
                    onChange={(e) => setFormData({ ...formData, useLngLat: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Gunakan Format Lng/Lat</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresToken}
                    onChange={(e) => setFormData({ ...formData, requiresToken: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Butuh Token BIG</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ignoreScale}
                    onChange={(e) => setFormData({ ...formData, ignoreScale: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Abaikan Batasan Skala</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1f8080] hover:bg-[#1f8080]/90 text-white font-bold transition-colors cursor-pointer shadow-sm"
                >
                  {editingLayer ? 'Simpan Perubahan' : 'Tambahkan Layer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: SCRIPT SQL SUPABASE */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-[800] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Script Migrasi Database Supabase (`dashboard_layers`)
                </h3>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <p>
                Silakan salin script SQL ini dan jalankan langsung di <b>Supabase Dashboard &gt; SQL Editor</b>.
              </p>
              <p className="text-[11px] text-slate-500">
                Script ini akan membuat tabel <code className="text-teal-600 font-bold font-mono">public.dashboard_layers</code>, menyiapkan kebijakan keamanan RLS, dan otomatis mengisi seluruh 38 layer default BNPB, Bappenas, BIG, BMKG, NASA, ESDM, dan ATR/BPN.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-emerald-400 border border-slate-800 leading-relaxed select-all">
              <pre>{sqlScript}</pre>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                File tersimpan di: <code className="font-mono text-slate-600 dark:text-slate-300">supabase/migrations/20260921_create_dashboard_layers.sql</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1f8080] hover:bg-[#1f8080]/90 text-white font-bold transition-all shadow-sm cursor-pointer"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Script SQL'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
