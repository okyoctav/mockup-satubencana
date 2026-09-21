-- ==============================================================================
-- Migration: Create dashboard_layers table for SatuBencana GIS & Layer Management
-- Created: 2026-09-21
-- Description: Stores map layers displayed on /dashboard_k5 with full CRUD support.
-- ==============================================================================

-- 1. Create the dashboard_layers table
CREATE TABLE IF NOT EXISTS public.dashboard_layers (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#0284C7',
    emoji TEXT NOT NULL DEFAULT '🗺️',
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'MapServer' CHECK (type IN ('ImageServer', 'MapServer', 'VectorTileServer', 'WMS', 'Dapodik', 'GeoJSON')),
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

-- 2. Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_dashboard_layers_group ON public.dashboard_layers(group_name);
CREATE INDEX IF NOT EXISTS idx_dashboard_layers_is_active ON public.dashboard_layers(is_active);
CREATE INDEX IF NOT EXISTS idx_dashboard_layers_sort_order ON public.dashboard_layers(sort_order);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.dashboard_layers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow anyone (public/authenticated) to read layers
DROP POLICY IF EXISTS "Allow public read active layers" ON public.dashboard_layers;
CREATE POLICY "Allow public read active layers"
ON public.dashboard_layers FOR SELECT
USING (true);

-- Allow authenticated users full CRUD
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.dashboard_layers;
CREATE POLICY "Allow authenticated insert"
ON public.dashboard_layers FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON public.dashboard_layers;
CREATE POLICY "Allow authenticated update"
ON public.dashboard_layers FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON public.dashboard_layers;
CREATE POLICY "Allow authenticated delete"
ON public.dashboard_layers FOR DELETE
TO authenticated
USING (true);

-- Allow anon role full access for local development / testing
DROP POLICY IF EXISTS "Allow anon all in dev" ON public.dashboard_layers;
CREATE POLICY "Allow anon all in dev"
ON public.dashboard_layers FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- 5. Seed default 38 layers from BNPB_LAYERS
INSERT INTO public.dashboard_layers (
    id, label, color, emoji, url, type, group_name, use_lng_lat, layers_param, extent, requires_filter, ignore_scale, requires_token, is_active, sort_order
) VALUES
-- BNPB
('gempa_ntt_2026_v2', 'Layer Dampak Gempa NTT 2026 (Layer 29)', '#EF4444', '📳', 'https://gis.bnpb.go.id/server/rest/services/2026_gempabumi_ntt/mv_gempa_ntt_2026_v2/MapServer/29', 'MapServer', 'BNPB', true, 'show:29', NULL, false, false, false, true, 1),
('foto_geotag_ntt', 'Foto Geotag Terdampak (Gempa NTT 2026)', '#F59E0B', '📸', 'https://gis.bnpb.go.id/server/rest/services/2026_gempabumi_ntt/Foto_Geotag_Terdampak/MapServer/0', 'MapServer', 'BNPB', true, 'show:0', NULL, false, false, false, true, 2),
('banjir_wms', 'Banjir WMS', '#0EA5E9', '🌊', 'https://inarisk1.bnpb.go.id:8443/geoserver/raster/wms', 'WMS', 'BNPB', false, 'raster:INDEKS_BAHAYA_BANJIR1', NULL, false, false, false, true, 3),
('longsor_wms', 'Longsor WMS', '#F97316', '⛰️', 'https://inarisk1.bnpb.go.id:8443/geoserver/raster/wms', 'WMS', 'BNPB', false, 'raster:INDEKS_BAHAYA_TANAHLONGSOR1', NULL, false, false, false, true, 4),
('cuacaekstrim_wms', 'Cuaca Ekstrim WMS', '#F97316', '⛰️', 'https://inarisk1.bnpb.go.id:8443/geoserver/raster/wms', 'WMS', 'BNPB', false, 'raster:INDEKS_BAHAYA_CUACAEKSTRIM1', NULL, false, false, false, true, 5),
('Faults_new', 'Sesar', '#0EA5E9', '🌐', 'https://gis.bnpb.go.id/server/rest/services/inarisk/Faults_new/MapServer', 'MapServer', 'BNPB', true, 'show:all', NULL, false, false, false, true, 6),
('sesar_wms', 'Sesar WMS', '#EF4444', '⚡', 'https://inarisk1.bnpb.go.id:8443/geoserver/wms', 'WMS', 'BNPB', false, 'Faults_Indonesia', NULL, false, false, false, true, 7),
('cuaca_ekstrim_img', 'Cuaca Ekstrim', '#06B6D4', '🌪️', 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_cuaca_ekstrim/ImageServer', 'ImageServer', 'BNPB', false, NULL, NULL, false, false, false, true, 8),
('banjir', 'Bahaya Banjir', '#0EA5E9', '🌊', 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIR/ImageServer', 'ImageServer', 'BNPB', false, NULL, NULL, false, false, false, true, 9),
('banjir_bandang', 'Banjir Bandang', '#0369A1', '💧', 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIRBANDANG/ImageServer', 'ImageServer', 'BNPB', false, NULL, NULL, false, false, false, true, 10),
('longsor', 'Tanah Longsor', '#F97316', '⛰️', 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_tanah_longsor_30/MapServer', 'MapServer', 'BNPB', false, NULL, NULL, false, false, false, true, 11),
('gempa', 'Gempa Bumi', '#EF4444', '📳', 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_gempabumi_30/MapServer', 'MapServer', 'BNPB', false, NULL, NULL, false, false, false, true, 12),
('tsunami', 'Tsunami', '#EC4899', '🌊', 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_tsunami_30/MapServer', 'MapServer', 'BNPB', false, NULL, NULL, false, false, false, true, 13),
('gunungapi', 'Letusan Gunung Api', '#8B5CF6', '🌋', 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_letusan_gunungapi/MapServer', 'MapServer', 'BNPB', false, NULL, NULL, false, false, false, true, 14),
('karhutla', 'Kebakaran Hutan', '#F59E0B', '🔥', 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_kebakaran_hutan_dan_lahan_30/MapServer', 'MapServer', 'BNPB', false, NULL, NULL, false, false, false, true, 15),
('kekeringan', 'Kekeringan', '#D97706', '☀️', 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_kekeringan_30/MapServer', 'MapServer', 'BNPB', false, NULL, NULL, false, false, false, true, 16),
('cuaca_ekstrim', 'Cuaca Ekstrim (MS)', '#0891B2', '⛅', 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_cuaca_ekstrim_30/MapServer', 'MapServer', 'BNPB', false, NULL, NULL, false, false, false, true, 17),

-- BAPPENAS
('kjs_individu', 'Data KJS Individu (SEPAKAT PK Page 1-5)', '#8B5CF6', '🟣', '/datakjs/page_1.json', 'Dapodik', 'BAPPENAS', false, NULL, NULL, false, false, false, true, 18),
('satupeta_geotagging', 'Satupeta Geotagging (BAPPENAS DTSEN)', '#059669', '📍', '/api/satupeta-geotagging', 'Dapodik', 'BAPPENAS', false, NULL, NULL, false, false, false, true, 19),
('monev_sadana_bappenas', 'Monev SADANA Geotagging (BAPPENAS)', '#0284C7', '📊', '/api/monev-sadana', 'GeoJSON', 'BAPPENAS', false, NULL, '[95.0, 3.0, 99.8, 5.5]'::jsonb, false, false, false, true, 20),
('hexbin_res9', 'Penduduk DTSEN', '#1AA7ED', '👥', 'https://geospasial.bappenas.go.id/server/rest/services/Produksi/hexbin_agg9/MapServer/0', 'MapServer', 'BAPPENAS', false, NULL, NULL, false, false, false, true, 21),
('bappenas_batas_desakel', 'Batas Kelurahan/Desa (BAPPENAS)', '#0284C7', '🏛️', 'https://mandata.bappenas.go.id/geoserver/ows', 'WMS', 'BAPPENAS', false, 'BATAS_WILAYAH:ADMINISTRASI_AR_KELDESA_10K_2023', NULL, false, false, false, true, 22),
('dapodik_sd', 'Sekolah Dasar (Dapodik)', '#EF4444', '🏠', '/data/dapodik/sd', 'Dapodik', 'BAPPENAS', false, NULL, NULL, true, false, false, true, 23),
('dapodik_smp', 'Sekolah Menengah Pertama (Dapodik)', '#3B82F6', '🏠', '/data/dapodik/smp', 'Dapodik', 'BAPPENAS', false, NULL, NULL, true, false, false, true, 24),
('dapodik_sma', 'Sekolah Menengah Atas (Dapodik)', '#10B981', '🏠', '/data/dapodik/sma', 'Dapodik', 'BAPPENAS', false, NULL, NULL, true, false, false, true, 25),
('dapodik_slb', 'Sekolah Luar Biasa (Dapodik)', '#8B5CF6', '🏠', '/data/dapodik/slb', 'Dapodik', 'BAPPENAS', false, NULL, NULL, true, false, false, true, 26),
('dapodik_spk', 'Sekolah SPK (Dapodik)', '#F59E0B', '🏠', '/data/dapodik/spk', 'Dapodik', 'BAPPENAS', false, NULL, NULL, true, false, false, true, 27),
('trpppb_zrb_bansor_sumatras', 'Wilayah Terdampak BANSOR Sumatera', '#EF4444', '🌋', 'https://geospasial.bappenas.go.id/server/rest/services/Produksi/TRPPPB_ZRB_Aceh_Sumut_Sumbar/MapServer/0', 'MapServer', 'BAPPENAS', true, 'show:0', NULL, false, true, false, true, 28),
('penutup_lahan_2024', 'Penutup Lahan 2024 (Semua Layer)', '#0EA5E9', '🌐', 'https://geoportal.planologi.kehutanan.go.id/server/rest/services/Peta_Interaktif_2026/PL_AR_250K/mapserver', 'MapServer', 'BAPPENAS', true, 'show:all', NULL, false, false, false, true, 29),
('rtrwn_pp_2017', 'RTRWN PP 2017 (Semua Layer)', '#0EA5E9', '🌐', 'https://geospasial.bappenas.go.id/portal/sharing/servers/2f6ae8da06ea4fd5bc2beb32ee008884/rest/services/000_RTRWN/_RTRWN_PP_2017/MapServer', 'MapServer', 'BAPPENAS', true, 'show:all', NULL, false, false, false, true, 30),

-- BIG
('big_batas_desakel', 'Batas Desa/Kelurahan (BIG)', '#3B82F6', '🗺️', 'https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/BATAS_DESAKEL_AR/MapServer', 'MapServer', 'BIG', false, NULL, NULL, false, false, false, true, 31),
('big_rbi_sulawesi_lot1', 'RBI Sulawesi 2024 Lot 1', '#A855F7', '🗺️', 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI_5K_Sulawesi_2024_Lot_1_Jul/VectorTileServer', 'VectorTileServer', 'BIG', false, NULL, NULL, false, false, false, true, 32),
('big_penutup_lahan_sulawesi', 'Penutup Lahan Sulawesi 2024', '#22C55E', '🌿', 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI5K_PENUTUP_LAHAN_SULAWESI_2024/VectorTileServer', 'VectorTileServer', 'BIG', false, NULL, NULL, false, false, false, true, 33),
('big_bangunan_fasum_sulawesi', 'Bangunan Fasum Sulawesi 2024', '#F59E0B', '🏛️', 'https://geoservices.big.go.id/rbi/rest/services/Hosted/RBI5K_BANGUNAN_FASUM_SULAWESI_2024/VectorTileServer', 'VectorTileServer', 'BIG', false, NULL, NULL, false, false, false, true, 34),
('petadasar_bitung', 'Peta Dasar Bitung 2024', '#F472B6', '🏢', 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/PETADASAR_SULAWESI_BITUNG_2024_5K/MapServer/18', 'MapServer', 'BIG', true, 'show:18', '[125.088, 1.375, 125.229, 1.476]'::jsonb, false, false, false, true, 35),
('rbi5k_sulawesi_2024', 'Peta Dasar RBI 5K Sulawesi 2024 (Token BIG Required)', '#EC4899', '🗺️', 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/RBI5K_SULAWESI_2024/MapServer', 'MapServer', 'BIG', true, 'show:all', NULL, false, false, true, true, 36),
('rbi5k_sulawesi_layer36', 'Penutup Lahan RBI 5K Sulawesi 2024 (Layer 36)', '#10B981', '🌿', 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/RBI5K_SULAWESI_2024/MapServer/36', 'MapServer', 'BIG', true, 'show:36', NULL, false, false, true, true, 37),
('rbi5k_sulawesi_layer4', 'Batas Desa/Kelurahan RBI 5K Sulawesi (Layer 4)', '#3B82F6', '🏛️', 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/RBI5K_SULAWESI_2024/MapServer/4', 'MapServer', 'BIG', true, 'show:4', NULL, false, false, true, true, 38),
('rbi5k_sulawesi_layer6', 'Bangunan & Fasum RBI 5K Sulawesi (Layer 6)', '#F59E0B', '🏢', 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/RBI5K_SULAWESI_2024/MapServer/6', 'MapServer', 'BIG', true, 'show:6', NULL, false, false, true, true, 39),
('rbi5k_sulawesi_layer23', 'Jaringan Jalan RBI 5K Sulawesi (Layer 23)', '#EF4444', '🛣️', 'https://geoservices.big.go.id/rbi/rest/services/BASEMAP/RBI5K_SULAWESI_2024/MapServer/23', 'MapServer', 'BIG', true, 'show:23', NULL, false, false, true, true, 40),

-- ATR/BPN
('atr_bpn_aht_sulawesi', 'Hak Atas Tanah (ATR/BPN Sulawesi)', '#8B5CF6', '📜', 'https://geospasial.bappenas.go.id/server/rest/services/Produksi/test_hat_sul/MapServer/0', 'MapServer', 'ATR/BPN', false, 'show:0', NULL, false, true, false, true, 41),
('rpjpn_rtrwn_semua', 'RPJPN Sarana & Prasarana RTRWN (Semua Layer)', '#0EA5E9', '🌐', 'https://geospasial.bappenas.go.id/server/rest/services/Produksi/RPJPN_Sarana_Prasarana_RTRWN_Struktur/MapServer', 'MapServer', 'ATR/BPN', true, 'show:all', NULL, false, false, false, true, 42),

-- BMKG
('Peta_Curah_Hujan_dan_Hari_Hujan', 'Curah Hujan', '#3B82F6', '👥', 'https://gis.bmkg.go.id/arcgis/rest/services/Peta_Curah_Hujan_dan_Hari_Hujan/MapServer/0', 'MapServer', 'BMKG', false, NULL, NULL, false, false, false, true, 43),
('Peta_Curah_Hujan_dan_Hari_Hujan_sebaran', 'Curah Hujan Sebaran', '#3B82F6', '👥', 'https://gis.bmkg.go.id/arcgis/rest/services/Peta_Curah_Hujan_dan_Hari_Hujan/MapServer/1570', 'MapServer', 'BMKG', false, NULL, NULL, false, false, false, true, 44),
('bmkg_sifat_hujan_bulanan', 'Prakiraan Sifat Hujan Bulanan (BMKG)', '#0EA5E9', '🌧️', 'https://gis.bmkg.go.id/arcgis/rest/services/prakiraan_hujan_bulanan/Prakiraan_Sifat_Hujan_Bulanan/MapServer', 'MapServer', 'BMKG', false, 'show:all', NULL, false, false, false, true, 45),
('bmkg_curah_hujan_bulanan', 'Prakiraan Curah Hujan Bulanan (BMKG)', '#0284C7', '☔', 'https://gis.bmkg.go.id/arcgis/rest/services/prakiraan_hujan_bulanan/Prakiraan_Curah_Hujan_Bulanan/MapServer', 'MapServer', 'BMKG', false, 'show:all', NULL, false, false, false, true, 46),
('bmkg_curah_hujan_10hari', 'Prakiraan Curah Hujan 10 Hari Kedepan (BMKG)', '#0369A1', '🌦️', 'https://gis.bmkg.go.id/arcgis/rest/services/prakicu10days/MapServer', 'MapServer', 'BMKG', false, 'show:all', NULL, false, false, false, true, 47),
('bmkg_seismisitas_dangkal', 'Peta Seismisitas Indonesia - Dangkal (BMKG)', '#EF4444', '📳', 'https://gis.bmkg.go.id/arcgis/rest/services/Hosted/Peta_Seismisitas_Indonesia/MapServer/30', 'MapServer', 'BMKG', false, 'show:30', NULL, false, false, false, true, 48),
('bmkg_seismisitas_menengah', 'Peta Seismisitas Indonesia - Menengah (BMKG)', '#F59E0B', '📳', 'https://gis.bmkg.go.id/arcgis/rest/services/Hosted/Peta_Seismisitas_Indonesia/MapServer/31', 'MapServer', 'BMKG', false, 'show:31', NULL, false, false, false, true, 49),

-- NASA
('nasa_gibs_fire_viirs', 'Titik Panas Kebakaran Hutan (NASA GIBS VIIRS 375m)', '#EF4444', '🔥', 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi', 'WMS', 'NASA', false, 'VIIRS_SNPP_Thermal_Anomalies_375m_All', NULL, false, false, false, true, 50),
('nasa_gibs_fire_modis', 'Anomali Termal Kebakaran (NASA GIBS MODIS)', '#F97316', '🔥', 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi', 'WMS', 'NASA', false, 'MODIS_Terra_Thermal_Anomalies_All', NULL, false, false, false, true, 51),
('nasa_firms_active_fires', 'Kebakaran Hutan & Lahan Realtime (NASA FIRMS / GIBS NOAA-20)', '#DC2626', '🔥', 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi', 'WMS', 'NASA', false, 'VIIRS_NOAA20_Thermal_Anomalies_375m_All', NULL, false, false, false, true, 52),

-- ESDM / PVMBG
('magma_volcanoes', 'Status Gunung Api Aktif Siaga (PVMBG MAGMA Indonesia)', '#DC2626', '🌋', '/api/volcanoes', 'Dapodik', 'ESDM', false, NULL, NULL, false, false, false, true, 53),
('magma_volcanoes_v2', 'Status Gunung Api 2 (PVMBG MAGMA 69 Gunung)', '#F59E0B', '🌋', '/api/volcanoes-v2', 'Dapodik', 'ESDM', false, NULL, NULL, false, false, false, true, 54),

-- KEMENDAGRI
('dukcapil_kel_fix', 'Kependudukan Kelurahan', '#3B82F6', '👥', 'https://gis.dukcapil.kemendagri.go.id/arcgis/rest/services/AGR_VISUAL_KEL_FIX/MapServer/0', 'MapServer', 'KEMENDAGRI', false, NULL, NULL, false, false, false, true, 55)

ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    color = EXCLUDED.color,
    emoji = EXCLUDED.emoji,
    url = EXCLUDED.url,
    type = EXCLUDED.type,
    group_name = EXCLUDED.group_name,
    layers_param = EXCLUDED.layers_param,
    use_lng_lat = EXCLUDED.use_lng_lat,
    ignore_scale = EXCLUDED.ignore_scale,
    requires_filter = EXCLUDED.requires_filter,
    requires_token = EXCLUDED.requires_token,
    extent = EXCLUDED.extent,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
