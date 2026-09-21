export type LayerType = 'MapServer' | 'ImageServer' | 'VectorTileServer' | 'WMS' | 'Dapodik' | 'GeoJSON';

export type LayerGroup = 
  | 'BNPB'
  | 'BAPPENAS'
  | 'BIG'
  | 'BMKG'
  | 'NASA'
  | 'ESDM'
  | 'ATR/BPN'
  | 'KEMENDAGRI'
  | string;

export interface DashboardLayer {
  id: string;
  label: string;
  color: string;
  emoji: string;
  url: string;
  type?: LayerType;
  group?: LayerGroup;
  group_name?: string; // alias from DB
  layersParam?: string;
  layers_param?: string; // alias from DB
  useLngLat?: boolean;
  use_lng_lat?: boolean; // alias from DB
  ignoreScale?: boolean;
  ignore_scale?: boolean; // alias from DB
  requiresFilter?: boolean;
  requires_filter?: boolean; // alias from DB
  requiresToken?: boolean;
  requires_token?: boolean; // alias from DB
  disasterTypes?: string[];
  disaster_types?: string[]; // alias from DB
  extent?: [number, number, number, number] | null;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export type DisasterType = 
  | 'banjir'
  | 'gempa'
  | 'longsor'
  | 'kebakaran'
  | 'erupsi'
  | 'tsunami'
  | 'kekeringan'
  | 'angin puting beliung';

export interface DisasterCategoryConfig {
  id: string;
  label: string;
  emoji: string;
  color: string;
  solidBg: string;
  solidText: string;
  solidBorder: string;
}

export const DISASTER_CATEGORIES: DisasterCategoryConfig[] = [
  { id: 'banjir', label: 'Banjir', emoji: '💧', color: '#0284c7', solidBg: 'bg-sky-100', solidText: 'text-sky-900', solidBorder: 'border-sky-300' },
  { id: 'gempa', label: 'Gempa Bumi', emoji: '🏚️', color: '#ef4444', solidBg: 'bg-rose-100', solidText: 'text-rose-900', solidBorder: 'border-rose-300' },
  { id: 'longsor', label: 'Tanah Longsor', emoji: '⛰️', color: '#d97706', solidBg: 'bg-amber-100', solidText: 'text-amber-900', solidBorder: 'border-amber-300' },
  { id: 'kebakaran', label: 'Kebakaran Hutan', emoji: '🔥', color: '#ea580c', solidBg: 'bg-orange-100', solidText: 'text-orange-900', solidBorder: 'border-orange-300' },
  { id: 'erupsi', label: 'Erupsi Gunung Api', emoji: '🌋', color: '#8b5cf6', solidBg: 'bg-purple-100', solidText: 'text-purple-900', solidBorder: 'border-purple-300' },
  { id: 'tsunami', label: 'Tsunami', emoji: '🌊', color: '#06b6d4', solidBg: 'bg-cyan-100', solidText: 'text-cyan-900', solidBorder: 'border-cyan-300' },
  { id: 'kekeringan', label: 'Kekeringan', emoji: '☀️', color: '#ca8a04', solidBg: 'bg-yellow-100', solidText: 'text-yellow-900', solidBorder: 'border-yellow-300' },
  { id: 'angin puting beliung', label: 'Cuaca Ekstrem', emoji: '🌪️', color: '#4f46e5', solidBg: 'bg-indigo-100', solidText: 'text-indigo-900', solidBorder: 'border-indigo-300' },
];

export const LAYER_GROUPS = [
  'BNPB',
  'BAPPENAS',
  'BIG',
  'BMKG',
  'NASA',
  'ESDM',
  'ATR/BPN',
  'KEMENDAGRI',
] as const;

export const LAYER_TYPES: LayerType[] = [
  'MapServer',
  'ImageServer',
  'VectorTileServer',
  'WMS',
  'Dapodik',
  'GeoJSON',
];

export const GROUP_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  BNPB: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
  BAPPENAS: { bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-300' },
  BIG: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
  BMKG: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
  NASA: { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300' },
  ESDM: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  'ATR/BPN': { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  KEMENDAGRI: { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300' },
};
