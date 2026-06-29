'use client';

import { useEffect, useRef } from 'react';
import type MapView from '@arcgis/core/views/MapView';
import type Layer from '@arcgis/core/layers/Layer';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import wabConfig from '@/data/wab_layers.json';
import bencanaRaw from '@/data/bencana.json';

/* 
 * ArcGIS Maps SDK for JavaScript (npm: @arcgis/core v5)
 * Assets served via unpkg CDN — no need to copy 79 MB to public/
 */

const ARCGIS_VERSION = '5.0.19';
const ASSETS_CDN = `https://unpkg.com/@arcgis/core@${ARCGIS_VERSION}/assets/`;
const BMKG_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json';

// Warna marker per jenis bencana (RGB)
const JENIS_COLOR: Record<string, [number, number, number]> = {
  banjir:                  [14,  165, 233],  // biru
  longsor:                 [249, 115, 22 ],  // oranye
  gempa:                   [239, 68,  68 ],  // merah
  erupsi:                  [234, 88,  12 ],  // oranye-merah
  tsunami:                 [20,  184, 166],  // teal
  kekeringan:              [234, 179, 8  ],  // kuning
  'angin puting beliung':  [6,   182, 212],  // cyan
  kebakaran:               [220, 38,  38 ],  // merah tua
  lainnya:                 [148, 163, 184],  // abu
};

const JENIS_EMOJI: Record<string, string> = {
  banjir: '🌊', longsor: '⛰️', gempa: '📳', erupsi: '🌋',
  tsunami: '🌀', kekeringan: '☀️', 'angin puting beliung': '🌪️',
  kebakaran: '🔥', lainnya: '🔹',
};

interface BmkgGempa {
  Tanggal: string;
  Jam: string;
  Coordinates: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi: string;
}

interface BmkgResponse {
  Infogempa: { gempa: BmkgGempa[] };
}

interface Props {
  theme: string;
  activeLayers: string[];
}

export default function ArcGISMapView({ theme, activeLayers }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const layerMapRef = useRef<Record<string, Layer>>({});
  const bencanaLayerRef = useRef<GraphicsLayer | null>(null);
  const bmkgLayerRef = useRef<GraphicsLayer | null>(null);
  const activeLayersRef = useRef<string[]>(activeLayers);

  // Keep ref in sync so the init closure can read latest activeLayers
  useEffect(() => {
    activeLayersRef.current = activeLayers;
  });

  /* ---- Init map (runs once) ---- */
  useEffect(() => {
    if (!mapDivRef.current) return;
    let mounted = true;

    // Inject ArcGIS CSS from CDN (theme-aware UI widgets)
    const cssHref = `${ASSETS_CDN}esri/themes/${theme === 'dark' ? 'dark' : 'light'}/main.css`;
    let link = document.getElementById('arcgis-main-css') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = 'arcgis-main-css';
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    } else {
      link.href = cssHref;
    }

    const init = async () => {
      // Dynamic imports — all ArcGIS code stays client-side only
      const [
        { default: esriConfig },
        { default: Map },
        { default: MapView },
        { default: MapImageLayer },
        { default: FeatureLayer },
        { default: ImageryLayer },
        { default: VectorTileLayer },
        { default: WebTileLayer },
        { default: GraphicsLayer },
        { default: Graphic },
        { default: Point },
        { default: SimpleMarkerSymbol },
        { default: Legend },
        { default: LayerList },
        { default: Expand },
        { default: Search },
        { default: BasemapGallery },
      ] = await Promise.all([
        import('@arcgis/core/config'),
        import('@arcgis/core/Map'),
        import('@arcgis/core/views/MapView'),
        import('@arcgis/core/layers/MapImageLayer'),
        import('@arcgis/core/layers/FeatureLayer'),
        import('@arcgis/core/layers/ImageryLayer'),
        import('@arcgis/core/layers/VectorTileLayer'),
        import('@arcgis/core/layers/WebTileLayer'),
        import('@arcgis/core/layers/GraphicsLayer'),
        import('@arcgis/core/Graphic'),
        import('@arcgis/core/geometry/Point'),
        import('@arcgis/core/symbols/SimpleMarkerSymbol'),
        import('@arcgis/core/widgets/Legend'),
        import('@arcgis/core/widgets/LayerList'),
        import('@arcgis/core/widgets/Expand'),
        import('@arcgis/core/widgets/Search'),
        import('@arcgis/core/widgets/BasemapGallery'),
      ]);

      if (!mounted || !mapDivRef.current) return;

      esriConfig.assetsPath = ASSETS_CDN;

      /* ---- BNPB / BIG layers dari wab_layers.json ---- */
      const currentActive = activeLayersRef.current;
      const layerInstances: Layer[] = [];

      for (const cfg of [...wabConfig.layers].reverse()) {
        let layer: Layer;
        const opts = {
          url: cfg.url,
          title: cfg.name,
          opacity: 0.8,
          visible: currentActive.includes(cfg.id),
        };

        if (cfg.type === 'ImageServer') {
          layer = new ImageryLayer(opts);
        } else if (cfg.type === 'VectorTileServer') {
          layer = new VectorTileLayer(opts);
        } else if (cfg.type === 'FeatureLayer') {
          layer = new FeatureLayer(opts);
        } else if (cfg.type === 'WebTileLayer') {
          // XYZ/WMTS tiles — gunakan urlTemplate dengan {level}/{col}/{row}
          layer = new WebTileLayer({
            urlTemplate: cfg.url,
            title: cfg.name,
            opacity: 0.75,
            visible: currentActive.includes(cfg.id),
          });
        } else {
          layer = new MapImageLayer(opts);
        }

        layerInstances.push(layer);
        layerMapRef.current[cfg.id] = layer;
      }

      /* ---- Layer: Sebaran Bencana DIBI 2011–2026 ---- */
      const bencanaLayer = new GraphicsLayer({
        title: '🔴 Sebaran Bencana DIBI (336 Kejadian)',
        listMode: 'show',
      });

      const kejadian = bencanaRaw.kejadian as {
        id: number; nama: string; provinsi: string; kabupaten: string;
        lat: number; lng: number; jenis: string; tanggal: string;
        korban_jiwa: number; pengungsi: number; rumah_terdampak?: number;
        status: string; level: string;
      }[];

      kejadian.forEach((k) => {
        const color = JENIS_COLOR[k.jenis] ?? [148, 163, 184];
        const emoji = JENIS_EMOJI[k.jenis] ?? '🔹';
        const g = new Graphic({
          geometry: new Point({ longitude: k.lng, latitude: k.lat, spatialReference: { wkid: 4326 } }),
          symbol: new SimpleMarkerSymbol({
            style: 'circle',
            color: [...color, 200] as [number, number, number, number],
            outline: { color: [255, 255, 255, 180] as [number, number, number, number], width: 0.8 },
            size: k.level === 'tinggi' ? 10 : k.level === 'sedang' ? 7 : 5,
          }),
          attributes: k,
          popupTemplate: {
            title: `${emoji} {nama}`,
            content: [
              {
                type: 'fields',
                fieldInfos: [
                  { fieldName: 'jenis', label: 'Jenis Bencana' },
                  { fieldName: 'tanggal', label: 'Tanggal' },
                  { fieldName: 'provinsi', label: 'Provinsi' },
                  { fieldName: 'kabupaten', label: 'Kabupaten/Kota' },
                  { fieldName: 'status', label: 'Status' },
                  { fieldName: 'level', label: 'Level' },
                  { fieldName: 'korban_jiwa', label: 'Korban Jiwa' },
                  { fieldName: 'pengungsi', label: 'Pengungsi' },
                ],
              },
            ],
          },
        });
        bencanaLayer.add(g);
      });

      bencanaLayerRef.current = bencanaLayer;

      /* ---- Layer: Gempa Terkini BMKG ---- */
      const bmkgLayer = new GraphicsLayer({
        title: '⚡ Gempa Terkini (BMKG)',
        listMode: 'show',
      });
      bmkgLayerRef.current = bmkgLayer;

      // Fetch BMKG async, non-blocking
      fetch(BMKG_URL)
        .then((r) => r.json())
        .then((data: BmkgResponse) => {
          if (!mounted) return;
          const gempaList = data?.Infogempa?.gempa ?? [];
          gempaList.forEach((g: BmkgGempa) => {
            const parts = g.Coordinates.split(',').map((s) => parseFloat(s.trim()));
            if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return;
            const [lat, lng] = parts;
            const mag = parseFloat(g.Magnitude);
            const size = isNaN(mag) ? 8 : Math.max(8, Math.min(24, mag * 3.5));
            const alpha = isNaN(mag) ? 200 : Math.max(160, Math.min(240, 160 + mag * 12));

            bmkgLayer.add(new Graphic({
              geometry: new Point({ longitude: lng, latitude: lat, spatialReference: { wkid: 4326 } }),
              symbol: new SimpleMarkerSymbol({
                style: 'circle',
                color: [255, 80, 30, alpha] as [number, number, number, number],
                outline: { color: [255, 220, 0, 220] as [number, number, number, number], width: 1.5 },
                size,
              }),
              attributes: g,
              popupTemplate: {
                title: '⚡ Gempa M{Magnitude} — {Wilayah}',
                content: [
                  {
                    type: 'fields',
                    fieldInfos: [
                      { fieldName: 'Tanggal', label: 'Tanggal' },
                      { fieldName: 'Jam', label: 'Waktu (WIB)' },
                      { fieldName: 'Magnitude', label: 'Magnitudo (SR)' },
                      { fieldName: 'Kedalaman', label: 'Kedalaman' },
                      { fieldName: 'Wilayah', label: 'Wilayah' },
                      { fieldName: 'Potensi', label: 'Potensi Tsunami' },
                    ],
                  },
                ],
              },
            }));
          });
        })
        .catch(() => {
          // BMKG tidak tersedia — lanjut tanpa layer gempa
        });

      /* ---- Buat Map + View ---- */
      const map = new Map({
        basemap: 'hybrid', // Citra satelit + label
        layers: [...layerInstances, bencanaLayer, bmkgLayer],
      });

      const view = new MapView({
        container: mapDivRef.current,
        map,
        center: [118.0, -2.5],   // Tengah Indonesia
        zoom: 5,
      });

      /* ---- Widgets ---- */
      const search = new Search({ view });
      view.ui.add(search, { position: 'top-left', index: 2 });

      const layerListExpand = new Expand({
        view,
        content: new LayerList({ view }),
        expandIcon: 'layers',
        expandTooltip: 'Daftar Layer',
        expanded: false,
      });
      view.ui.add(layerListExpand, 'top-right');

      const legendExpand = new Expand({
        view,
        content: new Legend({ view }),
        expandIcon: 'legend',
        expandTooltip: 'Legenda',
        expanded: false,
      });
      view.ui.add(legendExpand, 'bottom-left');

      const bgExpand = new Expand({
        view,
        content: new BasemapGallery({ view }),
        expandIcon: 'basemap',
        expandTooltip: 'Pilih Basemap',
        expanded: false,
      });
      view.ui.add(bgExpand, 'bottom-right');

      viewRef.current = view;
    };

    init().catch(console.error);

    return () => {
      mounted = false;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      layerMapRef.current = {};
      bencanaLayerRef.current = null;
      bmkgLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Sync layer visibility when activeLayers prop changes ---- */
  useEffect(() => {
    for (const [id, layer] of Object.entries(layerMapRef.current)) {
      layer.visible = activeLayers.includes(id);
    }
  }, [activeLayers]);

  return (
    <div
      ref={mapDivRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#0d1b2a',
      }}
    />
  );
}
