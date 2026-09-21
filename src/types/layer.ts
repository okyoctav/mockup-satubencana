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
  extent?: [number, number, number, number] | null;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

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
  BNPB: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  BAPPENAS: { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  BIG: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  BMKG: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  NASA: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  ESDM: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'ATR/BPN': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  KEMENDAGRI: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
};
