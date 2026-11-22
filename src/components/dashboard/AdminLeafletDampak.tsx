'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useState, useEffect, useRef } from 'react';
import { Layers, Map, BarChart2, Activity, Pencil, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet-draw';
import {
  aggregateHexKabImpact,
  buildHexKabImpactHtml,
  type HexKabFeature,
} from '@/lib/hexKabImpact';
import {
  ADMIN_BASEMAPS,
  ADMIN_BNPB_LAYERS,
  ADMIN_DRAW_TOOLS,
  ADMIN_JENIS_COLOR,
  ADMIN_LEGEND_ITEMS,
} from '@/lib/adminSimulasiMapConfig';
import {
  createArcGISExportLayer,
  createVectorTileLayer,
} from '@/lib/arcgisLeafletLayers';

interface WindowWithLeafletDraw extends Window {
  __leafletDrawLoaded?: boolean;
}

interface Kejadian {
  id: number;
  nama: string;
  provinsi: string;
  kabupaten: string;
  lat: number;
  lng: number;
  jenis: string;
  tanggal: string;
  korban_jiwa: number;
  pengungsi: number;
  status: string;
  level: string;
}

interface Props {
  data: Kejadian[];
  flyTo: { lat: number; lng: number; zoom: number } | null;
  theme: string;
}

interface MapServerLegendItem {
  label: string;
  imageData: string; // base64 PNG from MapServer legend endpoint
  layerName: string;
}

interface BmkgGempa {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string; // "lat,lng"
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi?: string;
}

const BASEMAPS = ADMIN_BASEMAPS;
const BNPB_LAYERS = ADMIN_BNPB_LAYERS;
const JENIS_COLOR = ADMIN_JENIS_COLOR;
const LEGEND_ITEMS = ADMIN_LEGEND_ITEMS;
const DRAW_TOOLS = ADMIN_DRAW_TOOLS;

interface ImpactDataDampak {
  loading: boolean;
  totalPenduduk: number;
  totalPria: number;
  totalWanita: number;
  totalKK: number;
  kelurahans: string[];
  area: string;
  layerType: string;
  history?: Kejadian[];
}

function pointInPolygon(point: L.LatLng, polygon: L.LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersect = ((yi > point.lat) !== (yj > point.lat))
      && (point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInsideLayer(layer: L.Layer | { getBounds?: () => L.LatLngBounds } | null, point: L.LatLng): boolean {
  if (!layer || !point) return false;
  if (layer instanceof L.Circle) {
    return layer.getLatLng().distanceTo(point) <= layer.getRadius();
  }
  if (layer instanceof L.Polygon) {
    // Polygon and rectangle both inherit from L.Polygon.
    const latlngs = layer.getLatLngs();
    if (!Array.isArray(latlngs) || !latlngs[0]) return false;
    const ring = Array.isArray(latlngs[0]) ? latlngs[0] as L.LatLng[] : latlngs as L.LatLng[];
    return pointInPolygon(point, ring as L.LatLng[]);
  }
  if ('getBounds' in layer && typeof layer.getBounds === 'function') {
    return layer.getBounds().contains(point);
  }
  return false;
}

function isLeafletDrawReady(): boolean {
  if (typeof window === 'undefined') return false;
  const leafletWindow = window as WindowWithLeafletDraw & { L?: typeof L & { Draw?: unknown } };
  return Boolean(leafletWindow.L?.Draw); 
}

function buildImpactHtmlDampak(d: ImpactDataDampak): string {
  const loading = d.loading;
  const historyItems = d.history ?? [];
  const hasHistory = !loading && historyItems.length > 0;
  return `<div style="width:280px;font-family:system-ui,sans-serif;color:#0F172A">
    <div style="margin-bottom:8px;padding-bottom:7px;border-bottom:1.5px solid #E2E8F0">
      <div style="font-size:11px;color:#0EA5E9;font-weight:700;text-transform:uppercase;letter-spacing:.8px">📐 Estimasi Demografi Terdampak</div>
      ${d.area !== '—' ? `<div style="font-size:10px;color:#64748B;margin-top:3px">Estimasi luas ≈ <strong style="color:#0F172A">${d.area} km²</strong></div>` : ''}
    </div>
    
    ${loading ? `
      <div style="padding:16px 0;text-align:center;color:#64748B;font-size:12px">
        <span style="display:inline-block;animation:spin 1s linear infinite;margin-bottom:8px;font-size:16px">⏳</span>
        <div>Menghubungi Dukcapil GIS Service...</div>
      </div>
    ` : `
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
        <tbody>
          <tr style="border-bottom:1px solid #F1F5F9">
            <td style="padding:6px 4px 6px 0;color:#475569;font-size:11px;white-space:nowrap">👥 Total Penduduk</td>
            <td style="padding:6px 0 6px 8px;text-align:right;white-space:nowrap">
              <span style="font-size:13px;font-weight:700;color:#EF4444">${d.totalPenduduk.toLocaleString('id')}</span>
              <span style="font-size:9px;color:#94A3B8;margin-left:2px">jiwa</span>
            </td>
          </tr>
          <tr style="border-bottom:1px solid #F1F5F9">
            <td style="padding:6px 4px 6px 0;color:#475569;font-size:11px;white-space:nowrap">👨 Pria</td>
            <td style="padding:6px 0 6px 8px;text-align:right;white-space:nowrap">
              <span style="font-size:12px;font-weight:600;color:#35A7FF">${d.totalPria.toLocaleString('id')}</span>
              <span style="font-size:9px;color:#94A3B8;margin-left:2px">jiwa</span>
            </td>
          </tr>
          <tr style="border-bottom:1px solid #F1F5F9">
            <td style="padding:6px 4px 6px 0;color:#475569;font-size:11px;white-space:nowrap">👩 Wanita</td>
            <td style="padding:6px 0 6px 8px;text-align:right;white-space:nowrap">
              <span style="font-size:12px;font-weight:600;color:#EC4899">${d.totalWanita.toLocaleString('id')}</span>
              <span style="font-size:9px;color:#94A3B8;margin-left:2px">jiwa</span>
            </td>
          </tr>
          <tr style="border-bottom:1px solid #F1F5F9">
            <td style="padding:6px 4px 6px 0;color:#475569;font-size:11px;white-space:nowrap">🏠 Jumlah KK</td>
            <td style="padding:6px 0 6px 8px;text-align:right;white-space:nowrap">
              <span style="font-size:12px;font-weight:600;color:#F97316">${d.totalKK.toLocaleString('id')}</span>
              <span style="font-size:9px;color:#94A3B8;margin-left:2px">kk</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div style="margin-top:6px;max-height:80px;overflow-y:auto;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:6px 8px">
        <div style="font-size:9px;font-weight:700;color:#475569;margin-bottom:3px">🚩 Kelurahan Terdampak (${d.kelurahans.length}):</div>
        <div style="font-size:10px;color:#0F172A;line-height:1.4">
          ${d.kelurahans.length > 0 ? d.kelurahans.join(', ') : '<span style="color:#94A3B8">Tidak ada kelurahan terdeteksi</span>'}
        </div>
      </div>
      ${hasHistory ? `
        <div style="margin-top:8px;padding:10px 10px 6px;border-radius:10px;background:#F8F8FF;border:1px solid #E2E8F0;max-height:130px;overflow-y:auto">
          <div style="font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px">📰 Riwayat Bencana di Area Ini (${historyItems.length})</div>
          ${historyItems.slice(0, 3).map((item) => `
            <div style="margin-bottom:8px">
              <div style="font-size:11px;font-weight:700;color:#0F172A">${item.nama}</div>
              <div style="font-size:10px;color:#475569;margin-top:2px">${item.provinsi}, ${item.kabupaten} · ${new Date(item.tanggal).toLocaleDateString('id-ID')}</div>
            </div>
          `).join('')}
          ${historyItems.length > 3 ? `<div style="font-size:10px;color:#64748B;padding-top:4px;border-top:1px solid #E2E8F0">Menampilkan 3 kejadian pertama. Gunakan data internal untuk riwayat bencana lokal.</div>` : ''}
        </div>
      ` : `
        <div style="margin-top:8px;padding:10px;background:#F8FAFC;border:1px solid #E2E8F0;font-size:10px;color:#64748B">
          Tidak ada riwayat bencana tercatat di area ini dalam dataset lokal.
        </div>
      `}
    `}
    
    <div style="margin-top:8px;padding-top:6px;border-top:1px solid #E2E8F0;font-size:8.5px;color:#94A3B8;line-height:1.4">
      Data kependudukan dari Dukcapil ArcGIS MapServer. Riwayat bencana dari dataset lokal aplikasi.
    </div>
  </div>`;
}

function buildFailureHtmlDampak(area: string, errorMsg?: string): string {
  return `<div style="width:280px;font-family:system-ui,sans-serif;color:#0F172A">
    <div style="margin-bottom:8px;padding-bottom:7px;border-bottom:1.5px solid #E2E8F0">
      <div style="font-size:11px;color:#0EA5E9;font-weight:700;text-transform:uppercase;letter-spacing:.8px">📐 Estimasi Demografi Terdampak</div>
      ${area !== '—' ? `<div style="font-size:10px;color:#64748B;margin-top:3px">Estimasi luas ≈ <strong style="color:#0F172A">${area} km²</strong></div>` : ''}
    </div>
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px 12px;margin-bottom:6px">
      <div style="font-size:13px;font-weight:700;color:#DC2626;margin-bottom:4px">⚠️ Gagal Mengambil Data</div>
      <div style="font-size:11px;color:#7F1D1D;line-height:1.5">${errorMsg || 'Layanan GIS Dukcapil tidak merespon saat ini. Pastikan Anda terhubung ke internet dan coba lagi.'}</div>
    </div>
    <div style="font-size:9px;color:#94A3B8;line-height:1.5">Dukcapil MapServer Query Error</div>
  </div>`;
}

type ActivePanel = 'basemap' | 'layers' | 'legend' | 'draw' | 'bmkg' | null;

export default function AdminLeafletDampak({ data, flyTo, theme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseTileRefs = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bnpbLayersRef = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeDrawRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildingLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bmkgMarkersRef = useRef<any[]>([]);

  const [activeBasemap, setActiveBasemap] = useState('esri_imagery');
  const [activeOverlays, setActiveOverlays] = useState<string[]>(['cuaca_ekstrim_img']);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [activeDraw, setActiveDraw] = useState<string | null>(null);
  const [bmkgData, setBmkgData] = useState<BmkgGempa[]>([]);
  const [showBmkg, setShowBmkg] = useState(true);
  // Default: do not show local bencana.json on admin map unless user enables it
  const [showBencanaData, setShowBencanaData] = useState(false);
  const [showHexKabLayer, setShowHexKabLayer] = useState(true);
  /** Dukcapil online vs agregasi atribut HexKab lokal. */
  const [impactSource, setImpactSource] = useState<'dukcapil' | 'hexkab'>('dukcapil');
  const [hexFeatures, setHexFeatures] = useState<HexKabFeature[]>([]);
  const [bmkgLastUpdate, setBmkgLastUpdate] = useState<Date | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hexKabLayerRef = useRef<any>(null);
  const impactSourceRef = useRef(impactSource);
  impactSourceRef.current = impactSource;
  const hexFeaturesRef = useRef(hexFeatures);
  hexFeaturesRef.current = hexFeatures;
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapserverLegends, setMapserverLegends] = useState<Record<string, MapServerLegendItem[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const fetchedLegendsRef = useRef<Set<string>>(new Set());

  // Fetch MapServer legends dynamically when a MapServer layer is activated
  useEffect(() => {
    const msLayers = BNPB_LAYERS.filter(
      (l) => l.type === 'MapServer' && activeOverlays.includes(l.id)
    );
    msLayers.forEach((layer) => {
      if (fetchedLegendsRef.current.has(layer.id)) return;
      fetchedLegendsRef.current.add(layer.id);

      const fetchLegendWithToken = (tok?: string) => {
        let cleanLegendUrl = layer.url;
        let targetLayerId: number | null = null;
        const match = layer.url.match(/\/MapServer\/(\d+)$/);
        if (match && match.index !== undefined) {
          cleanLegendUrl = layer.url.substring(0, match.index + 10);
          targetLayerId = parseInt(match[1], 10);
        }

        const tokenParam = tok ? `&token=${tok}` : '';
        fetch(`${cleanLegendUrl}/legend?f=pjson${tokenParam}`)
          .then((r) => r.json())
          .then((json) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items: MapServerLegendItem[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (json?.layers ?? []).forEach((lyr: any) => {
              if (targetLayerId !== null && lyr.layerId !== targetLayerId) return;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (lyr.legend ?? []).forEach((item: any) => {
                if (item.imageData) {
                  items.push({
                    label: item.label || lyr.layerName || '—',
                    imageData: item.imageData,
                    layerName: lyr.layerName ?? '',
                  });
                }
              });
            });
            setMapserverLegends((p) => ({ ...p, [layer.id]: items }));
          })
          .catch(() => {
            // allow retry on next activation
            fetchedLegendsRef.current.delete(layer.id);
          });
      };

      const needsToken = layer.requiresToken || layer.url.includes('geoservices.big.go.id');
      if (needsToken) {
        fetch('/api/big-token')
          .then((r) => r.json())
          .then((res) => fetchLegendWithToken(res?.token))
          .catch(() => fetchLegendWithToken());
      } else {
        fetchLegendWithToken();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOverlays]);

  // Inject BMKG ripple animation CSS once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('bmkg-anim-css')) return;
    const style = document.createElement('style');
    style.id = 'bmkg-anim-css';
    style.textContent = `
      @keyframes bmkgRipple {
        0%   { transform: translate(-50%,-50%) scale(0.6); opacity: 0.9; }
        100% { transform: translate(-50%,-50%) scale(3.6); opacity: 0; }
      }
      @keyframes bmkgGlow {
        0%,100% { box-shadow: 0 0 0 0 rgba(var(--bmkg-rgb),0.7); }
        50%      { box-shadow: 0 0 0 5px rgba(var(--bmkg-rgb),0); }
      }
      .bmkg-wrap { position:relative; display:inline-block; cursor:pointer; }
      .bmkg-ring {
        position:absolute; top:50%; left:50%;
        border-radius:50%; border:2px solid;
        animation: bmkgRipple 2.2s ease-out infinite;
        pointer-events:none;
      }
      .bmkg-ring:nth-child(2) { animation-delay:0.75s; }
      .bmkg-ring:nth-child(3) { animation-delay:1.5s; }
      .bmkg-dot {
        position:absolute; top:50%; left:50%;
        transform:translate(-50%,-50%);
        border-radius:50%;
        border:2px solid rgba(255,255,255,0.9);
        z-index:3;
        animation: bmkgGlow 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Fetch BMKG gempa terkini (refresh every 5 min)
  useEffect(() => {
    const fetchBmkg = async () => {
      try {
        const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', {
          cache: 'no-store',
        });
        const json = await res.json();
        const gempa: BmkgGempa[] = json?.Infogempa?.gempa ?? [];
        setBmkgData(gempa);
        setBmkgLastUpdate(new Date());
      } catch {
        // silent — network/CORS may fail; markers stay empty
      }
    };
    fetchBmkg();
    const timer = setInterval(fetchBmkg, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Render BMKG animated markers
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // Remove previous BMKG markers
    bmkgMarkersRef.current.forEach((m) => map.removeLayer(m));
    bmkgMarkersRef.current = [];
    if (!showBmkg || bmkgData.length === 0) return;

    bmkgData.forEach((g) => {
      const parts = g.Coordinates.split(',');
      if (parts.length < 2) return;
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) return;

      const mag = parseFloat(g.Magnitude);
      const dotPx  = Math.max(8, Math.min(20, mag * 3));
      const ringPx = dotPx * 2.4;
      const wrapPx = Math.ceil(ringPx * 3.8);

      // Color by magnitude
      let color = '#22C55E'; let rgb = '34,197,94';
      if (mag >= 6)   { color = '#DC2626'; rgb = '220,38,38'; }
      else if (mag >= 5) { color = '#F97316'; rgb = '249,115,22'; }
      else if (mag >= 4) { color = '#FBBF24'; rgb = '251,191,36'; }

      const half = wrapPx / 2;
      const icon = L.divIcon({
        className: '',
        html: `<div class="bmkg-wrap" style="width:${wrapPx}px;height:${wrapPx}px;--bmkg-rgb:${rgb}">
          <div class="bmkg-ring" style="width:${ringPx}px;height:${ringPx}px;border-color:${color};"></div>
          <div class="bmkg-ring" style="width:${ringPx}px;height:${ringPx}px;border-color:${color};"></div>
          <div class="bmkg-ring" style="width:${ringPx}px;height:${ringPx}px;border-color:${color};"></div>
          <div class="bmkg-dot" style="width:${dotPx}px;height:${dotPx}px;background:${color};"></div>
        </div>`,
        iconSize: [wrapPx, wrapPx],
        iconAnchor: [half, half],
      });

      const isDarkM = theme === 'dark';
      const popupBg   = isDarkM ? '#0D1F3C' : '#FFFFFF';
      const popupText = isDarkM ? '#F1F5F9' : '#0F172A';
      const popupMuted= isDarkM ? '#94A3B8' : '#475569';
      const potensi   = g.Potensi ?? '';
      const tsunamiRisk = potensi.toLowerCase().includes('berpotensi tsunami') && !potensi.toLowerCase().includes('tidak');

      const marker = L.marker([lat, lng], { icon, zIndexOffset: 2000 });
      marker.bindPopup(
        `<div style="min-width:230px;font-family:system-ui,sans-serif;border-radius:10px;overflow:hidden">
          <div style="background:${color}20;padding:10px 14px;border-bottom:1.5px solid ${color}40">
            <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">📳 GEMPA TERKINI · BMKG</div>
            <div style="font-size:17px;font-weight:800;color:${popupText}">M ${g.Magnitude}</div>
            <div style="font-size:11px;color:${popupMuted};margin-top:2px;line-height:1.4">${g.Wilayah}</div>
          </div>
          <div style="padding:10px 14px;background:${popupBg}">
            <div style="display:flex;gap:12px;margin-bottom:8px;flex-wrap:wrap">
              <div><div style="font-size:9px;color:${popupMuted};text-transform:uppercase;letter-spacing:.5px">Kedalaman</div><div style="font-size:13px;font-weight:700;color:#0EA5E9">${g.Kedalaman}</div></div>
              <div><div style="font-size:9px;color:${popupMuted};text-transform:uppercase;letter-spacing:.5px">Lintang</div><div style="font-size:12px;font-weight:600;color:${popupText}">${g.Lintang}</div></div>
              <div><div style="font-size:9px;color:${popupMuted};text-transform:uppercase;letter-spacing:.5px">Bujur</div><div style="font-size:12px;font-weight:600;color:${popupText}">${g.Bujur}</div></div>
            </div>
            ${potensi ? `<div style="background:${tsunamiRisk ? '#FEF2F2' : '#F0FDF4'};border:1px solid ${tsunamiRisk ? '#FECACA' : '#BBF7D0'};border-radius:6px;padding:6px 8px;font-size:10px;color:${tsunamiRisk ? '#DC2626' : '#16A34A'};font-weight:600;margin-bottom:8px">${tsunamiRisk ? '⚠️' : '✅'} ${potensi}</div>` : ''}
            <div style="font-size:10px;color:${popupMuted};border-top:1px solid ${isDarkM ? '#1E3A5F' : '#E2E8F0'};padding-top:6px">📅 ${g.Tanggal} · ${g.Jam}</div>
          </div>
        </div>`,
        { maxWidth: 300 }
      );
      marker.addTo(map);
      bmkgMarkersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bmkgData, showBmkg, theme, mapReady]);

  // Load Leaflet.draw CSS+JS once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.getElementById('leaflet-draw-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-draw-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.id = 'leaflet-draw-js';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js';
      document.head.appendChild(script);
    }
  }, []);

  // Init map
  useEffect(() => {
    let mounted = true;
    setMapError(null);
    if (!mounted || !containerRef.current || mapRef.current) return;
    leafletRef.current = L;
    // Expose our imported L as window.L so non-bundled vectorgrid CDN can extend it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).L = L;
    // Load non-bundled vectorgrid AFTER window.L is set so it extends our instance
    if (!document.getElementById('leaflet-vectorgrid-js')) {
      const vgScript = document.createElement('script');
      vgScript.id = 'leaflet-vectorgrid-js';
      vgScript.src = 'https://unpkg.com/leaflet.vectorgrid@1.3.0/dist/Leaflet.VectorGrid.min.js';
      document.head.appendChild(vgScript);
    }

    const map = L.map(containerRef.current, {
        center: [-2.5, 118.0], zoom: 5,
        zoomControl: false, attributionControl: true,
      });
      const handleResize = () => map.invalidateSize();
      requestAnimationFrame(handleResize);
      window.addEventListener('resize', handleResize);
      (map as unknown as { __resizeHandler?: () => void }).__resizeHandler = handleResize;
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.scale({ position: 'bottomleft', maxWidth: 140 }).addTo(map);
      const compassControl = L.Control.extend({
        options: { position: 'bottomright' },
        onAdd: () => {
          const div = L.DomUtil.create('div');
          div.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:999px;background:${theme === 'dark' ? 'rgba(8,18,36,0.94)' : 'rgba(255,255,255,0.95)'};border:1px solid ${theme === 'dark' ? 'rgba(30,58,95,0.8)' : 'rgba(0,0,0,0.12)'};box-shadow:0 4px 12px rgba(0,0,0,0.22);color:${theme === 'dark' ? '#f8fafc' : '#0f172a'};font-weight:800;font-size:16px;">
              N
            </div>
          `;
          return div;
        },
      });
      new compassControl().addTo(map);
      mapRef.current = map;
      setMapReady(true);

      // Draw feature group
      const drawnItems = L.featureGroup().addTo(map);
      drawLayerRef.current = drawnItems;

      // Initial basemap
      const bm = BASEMAPS[0];
      baseTileRefs.current = bm.layers.map((l) =>
        L.tileLayer(l.url, { attribution: l.attr, maxZoom: 20 }).addTo(map)
      );

      // Markers
      data.forEach((k) => {
        const color = JENIS_COLOR[k.jenis] ?? '#94A3B8';
        const radius = Math.min(8 + k.korban_jiwa * 0.3 + k.pengungsi * 0.001, 22);
        const isActive = k.status === 'saat';
        const isDarkM = theme === 'dark';
        const popupBg = isDarkM ? '#0D1F3C' : '#FFFFFF';
        const popupText = isDarkM ? '#F1F5F9' : '#0F172A';
        const popupMuted = isDarkM ? '#94A3B8' : '#475569';
        const tanggal = new Date(k.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const circle = L.circleMarker([k.lat, k.lng], {
          radius, color: isActive ? '#EF4444' : color, fillColor: color,
          fillOpacity: isActive ? 0.9 : 0.65, weight: isActive ? 2.5 : 1.5,
        });
        circle.bindPopup(`
          <div style="min-width:200px;font-family:system-ui,sans-serif;border-radius:10px;overflow:hidden">
            <div style="background:${color}20;padding:10px 14px;border-bottom:1px solid ${color}30">
              <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">${k.jenis} · ${isActive ? '🔴 AKTIF' : '⚫ Selesai'}</div>
              <div style="font-size:14px;font-weight:700;color:${popupText}">${k.nama}</div>
              <div style="font-size:11px;color:${popupMuted};margin-top:2px">${k.kabupaten}, ${k.provinsi}</div>
            </div>
            <div style="padding:10px 14px;background:${popupBg}">
              <div style="display:flex;gap:14px;margin-bottom:6px">
                <div><div style="font-size:10px;color:${popupMuted}">Korban Jiwa</div><div style="font-size:16px;font-weight:700;color:#EF4444">${k.korban_jiwa}</div></div>
                <div><div style="font-size:10px;color:${popupMuted}">Pengungsi</div><div style="font-size:16px;font-weight:700;color:#0EA5E9">${k.pengungsi.toLocaleString('id')}</div></div>
                <div><div style="font-size:10px;color:${popupMuted}">Level</div><div style="font-size:13px;font-weight:700;color:${k.level==='tinggi'?'#EF4444':k.level==='sedang'?'#F97316':'#22C55E'}">${k.level.toUpperCase()}</div></div>
              </div>
              <div style="font-size:10px;color:${popupMuted};border-top:1px solid ${isDarkM?'#1E3A5F':'#E2E8F0'};padding-top:6px;margin-top:4px">📅 ${tanggal}</div>
            </div>
          </div>
        `, { maxWidth: 240 });
        circle.addTo(map);
        markersRef.current.push(circle);
      });
    if (!mapRef.current) {
      setMapError('Leaflet gagal dimuat. Coba refresh halaman atau cek koneksi jaringan.');
    }

    return () => {
      mounted = false;
      if (mapRef.current) {
        const handleResize = (mapRef.current as unknown as { __resizeHandler?: () => void }).__resizeHandler;
        if (handleResize) {
          window.removeEventListener('resize', handleResize);
        }
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
        bnpbLayersRef.current = {};
        baseTileRefs.current = [];
        drawLayerRef.current = null;
        activeDrawRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch basemap
  useEffect(() => {
    const L = leafletRef.current; const map = mapRef.current;
    if (!L || !map) return;
    baseTileRefs.current.forEach((t) => map.removeLayer(t));
    const bm = BASEMAPS.find((b) => b.id === activeBasemap);
    if (!bm) return;
    baseTileRefs.current = bm.layers.map((l) =>
      L.tileLayer(l.url, { attribution: l.attr, maxZoom: 20 }).addTo(map)
    );
    markersRef.current.forEach((m) => m.bringToFront?.());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBasemap]);

  // BNPB overlays
  useEffect(() => {
    const L = leafletRef.current; const map = mapRef.current;
    if (!L || !map) return;
    Object.keys(bnpbLayersRef.current).forEach((id) => {
      if (!activeOverlays.includes(id)) { map.removeLayer(bnpbLayersRef.current[id]); delete bnpbLayersRef.current[id]; }
    });
    activeOverlays.forEach((id) => {
      if (bnpbLayersRef.current[id]) return;
      const def = BNPB_LAYERS.find((l) => l.id === id);
      if (!def) return;
      if (def.type === 'VectorTileServer') {
        const tryAddVector = () => {
          if (!mapRef.current || bnpbLayersRef.current[id]) return;
          const vl = createVectorTileLayer(L, def.url, def.color);
          if (!vl) {
            // vectorgrid not loaded yet — wait for script load event
            const existing = document.getElementById('leaflet-vectorgrid-js');
            if (existing) existing.addEventListener('load', tryAddVector, { once: true });
            return;
          }
          bnpbLayersRef.current[id] = vl;
          vl.addTo(mapRef.current);
        };
        tryAddVector();
      } else {
        const addLayer = (tok?: string) => {
          if (!mapRef.current || bnpbLayersRef.current[id]) return;
          bnpbLayersRef.current[id] = createArcGISExportLayer(
            L, def.url, 0.72,
            def.type === 'ImageServer',
            def.useLngLat ?? false,
            def.layersParam ?? 'show:0',
            tok
          );
          bnpbLayersRef.current[id].addTo(map);
          // Auto-fly to extent when layer first activated and extent is defined
          if (def.extent && mapRef.current) {
            const [minLng, minLat, maxLng, maxLat] = def.extent;
            mapRef.current.flyToBounds([[minLat, minLng], [maxLat, maxLng]], { duration: 1.5, padding: [20, 20] });
          }
        };

        const needsToken = def.requiresToken || def.url.includes('geoservices.big.go.id');
        if (needsToken) {
          fetch('/api/big-token')
            .then((r) => r.json())
            .then((res) => {
              if (res?.token) {
                addLayer(res.token);
              } else {
                addLayer();
              }
            })
            .catch(() => addLayer());
        } else {
          addLayer();
        }
      }
    });
  }, [activeOverlays]);

  // FlyTo
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, { duration: 1.5 });
  }, [flyTo]);

  // Toggle bencana.json markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => {
      if (showBencanaData) {
        if (!map.hasLayer(m)) m.addTo(map);
      } else {
        if (map.hasLayer(m)) map.removeLayer(m);
      }
    });
  }, [showBencanaData, mapReady]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (!showHexKabLayer) {
      if (hexKabLayerRef.current && map.hasLayer(hexKabLayerRef.current)) {
        map.removeLayer(hexKabLayerRef.current);
      }
      return;
    }

    if (hexKabLayerRef.current) {
      if (!map.hasLayer(hexKabLayerRef.current)) {
        hexKabLayerRef.current.addTo(map);
      }
      return;
    }

    fetch('/geojson/gj_hexkab_reso9v1.geojson')
      .then((response) => response.json())
      .then((geojson) => {
        const features = (geojson.features || []) as HexKabFeature[];
        setHexFeatures(features);
        const layer = L.geoJSON(geojson, {
          style: () => ({
            color: '#165176',
            weight: 1.4,
            opacity: 0.9,
            fillColor: '#1a8284',
            fillOpacity: 0.12,
          }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onEachFeature: (feature: any, layer: any) => {
            const props = feature.properties || {};
            const label =
              props.nama_kab ||
              props.nama_kabupaten ||
              props.nama_prop ||
              props.nama ||
              props.Name ||
              props.NAMA ||
              props.KABKOT ||
              'Hex Kabupaten';
            if (label) {
              layer.bindTooltip(`${label}`, { sticky: true, direction: 'center', className: 'hexkab-tooltip' });
            }
          },
        });
        layer.addTo(map);
        hexKabLayerRef.current = layer;
      })
      .catch((error) => {
        console.error('Gagal memuat GeoJSON layer:', error);
      });

    return () => {
      if (hexKabLayerRef.current && map.hasLayer(hexKabLayerRef.current)) {
        map.removeLayer(hexKabLayerRef.current);
      }
    };
  }, [mapReady, showHexKabLayer]);

  // Draw tools
  useEffect(() => {
    const L = leafletRef.current; const map = mapRef.current;
    if (!L || !map) return;
    // cancel any active draw handler
    if (activeDrawRef.current) {
      try { activeDrawRef.current.disable(); } catch { /* */ }
      activeDrawRef.current = null;
    }
    if (!activeDraw || !drawLayerRef.current) return;

    const activateDrawTool = () => {
      if (!isLeafletDrawReady()) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const D = (L as any).Draw;
      if (!D) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let handler: any;
      const opts = { shapeOptions: { color: '#0EA5E9', weight: 2, fillOpacity: 0.15 } };
      if (activeDraw === 'polyline')     handler = new D.Polyline(map, { ...opts, shapeOptions: { color: '#0EA5E9', weight: 2 } });
      if (activeDraw === 'polygon')      handler = new D.Polygon(map, opts);
      if (activeDraw === 'rectangle')    handler = new D.Rectangle(map, opts);
      if (activeDraw === 'circle')       handler = new D.Circle(map, opts);
      if (activeDraw === 'marker')       handler = new D.Marker(map, {});
      if (activeDraw === 'circlemarker') handler = new D.CircleMarker(map, opts);
      if (!handler) return;

      handler.enable();
      activeDrawRef.current = handler;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.once('draw:created', (e: any) => {
        const layer = e.layer;
        drawLayerRef.current.addLayer(layer);
        setActiveDraw(null);
        activeDrawRef.current = null;

        // Skip impact for point types
        if (e.layerType === 'marker' || e.layerType === 'circlemarker' || e.layerType === 'polyline') return;

        // --- Estimate area ---
        let area = '—';
        try {
          if (e.layerType === 'circle') {
            const r = layer.getRadius(); // meters
            const areaKm2 = Math.PI * (r / 1000) * (r / 1000);
            area = areaKm2 < 0.01 ? areaKm2.toFixed(3) : areaKm2.toFixed(2);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pts: any[] = layer.getLatLngs()[0];
            if (Array.isArray(pts) && pts.length >= 3) {
              const n = pts.length;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const avgLat = pts.reduce((s: number, p: any) => s + p.lat, 0) / n;
              const mPerDegLat = 111320;
              const mPerDegLng = 111320 * Math.cos(avgLat * Math.PI / 180);
              let A = 0;
              for (let i = 0; i < n; i++) {
                const j = (i + 1) % n;
                A += (pts[i].lng * mPerDegLng) * (pts[j].lat * mPerDegLat);
                A -= (pts[j].lng * mPerDegLng) * (pts[i].lat * mPerDegLat);
              }
              const areaKm2 = Math.abs(A) / 2 / 1e6;
              area = areaKm2 < 0.01 ? areaKm2.toFixed(3) : areaKm2.toFixed(2);
            }
          }
        } catch { /* */ }

        // --- Build Esri JSON Geometry ---
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let esriGeometry: any = null;
        try {
          if (e.layerType === 'circle') {
            const center = layer.getLatLng();
            const r = layer.getRadius(); // meters
            const rings: number[][] = [];
            for (let i = 0; i <= 32; i++) {
              const angle = (i / 32) * 2 * Math.PI;
              const lat = center.lat + (r / 111320) * Math.cos(angle);
              const lng = center.lng + (r / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
              rings.push([lng, lat]);
            }
            esriGeometry = {
              rings: [rings],
              spatialReference: { wkid: 4326 }
            };
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pts: any[] = layer.getLatLngs()[0];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rings = pts.map((p: any) => [p.lng, p.lat]);
            if (rings.length > 0) {
              const first = rings[0];
              const last = rings[rings.length - 1];
              if (first[0] !== last[0] || first[1] !== last[1]) {
                rings.push([first[0], first[1]]);
              }
            }
            esriGeometry = {
              rings: [rings],
              spatialReference: { wkid: 4326 }
            };
          }
        } catch (err) {
          console.error("Error building Esri geometry:", err);
        }

        // Clear previous building footprint layer
        if (buildingLayerRef.current) { map.removeLayer(buildingLayerRef.current); buildingLayerRef.current = null; }

        const popupCenter = layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng();
        const searchHistory = data.filter((item) => {
          const point = L.latLng(item.lat, item.lng);
          return isPointInsideLayer(layer, point);
        });
        const useHexKab = impactSourceRef.current === 'hexkab';

        const popup = L.popup({ maxWidth: 360, minWidth: 300, className: 'impact-popup', closeButton: true, autoClose: false })
          .setLatLng(popupCenter)
          .setContent(
            useHexKab
              ? buildHexKabImpactHtml({ loading: true, area })
              : buildImpactHtmlDampak({
                  loading: true,
                  totalPenduduk: 0,
                  totalPria: 0,
                  totalWanita: 0,
                  totalKK: 0,
                  kelurahans: [],
                  area,
                  layerType: e.layerType,
                  history: searchHistory,
                })
          )
          .openOn(map);
        popupRef.current = popup;
        popup.on('remove', () => {
          popupRef.current = null;
          if (buildingLayerRef.current) { map.removeLayer(buildingLayerRef.current); buildingLayerRef.current = null; }
        });
        layer.bindPopup(popup);
        layer.on('click', () => {
          if (!popupRef.current) {
            popupRef.current = popup;
          }
          layer.openPopup();
        });

        // Mode HexKab lokal: agregasi atribut GeoJSON
        if (useHexKab) {
          try {
            const totals = aggregateHexKabImpact(hexFeaturesRef.current, layer);
            if (popupRef.current) {
              popupRef.current.setContent(buildHexKabImpactHtml({ loading: false, area, totals }));
            }
          } catch (err) {
            console.error('Error agregasi HexKab:', err);
            if (popupRef.current) {
              popupRef.current.setContent(
                buildFailureHtmlDampak(area, 'Gagal menghitung agregasi HexKab lokal. Pastikan layer HexKab sudah termuat.')
              );
            }
          }
          return;
        }

        if (!esriGeometry) {
          popup.setContent(buildFailureHtmlDampak(area, "Gagal membuat geometri untuk query."));
          return;
        }

        const queryUrl = 'https://gis.dukcapil.kemendagri.go.id/arcgis/rest/services/AGR_VISUAL_KEL_FIX/MapServer/0/query';
        const params = new URLSearchParams();
        params.append('where', '1=1');
        params.append('geometryType', 'esriGeometryPolygon');
        params.append('spatialRel', 'esriSpatialRelIntersects');
        params.append('outFields', 'JUMLAH_PENDUDUK,JUMLAH_KK,PRIA,WANITA,NAMA_KEL');
        params.append('inSR', '4326');
        params.append('outSR', '4326');
        params.append('f', 'json');
        params.append('returnGeometry', 'true');
        params.append('geometry', JSON.stringify(esriGeometry));

        // Case-insensitive helpers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getAttrVal = (attrs: any, fieldName: string) => {
          if (!attrs) return 0;
          const key = Object.keys(attrs).find(k => k.toLowerCase() === fieldName.toLowerCase());
          return key ? (parseInt(attrs[key], 10) || 0) : 0;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getAttrStr = (attrs: any, fieldName: string) => {
          if (!attrs) return '';
          const key = Object.keys(attrs).find(k => k.toLowerCase() === fieldName.toLowerCase());
          return key ? (attrs[key] ?? '') : '';
        };

        fetch(queryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString(),
          signal: AbortSignal.timeout(30000)
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            return res.json();
          })
          .then((data) => {
            const features = data?.features ?? [];
            
            // Calculate sums
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalPenduduk = features.reduce((sum: number, f: any) => sum + getAttrVal(f.attributes, 'JUMLAH_PENDUDUK'), 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalKK = features.reduce((sum: number, f: any) => sum + getAttrVal(f.attributes, 'JUMLAH_KK'), 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalPria = features.reduce((sum: number, f: any) => sum + getAttrVal(f.attributes, 'PRIA'), 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalWanita = features.reduce((sum: number, f: any) => sum + getAttrVal(f.attributes, 'WANITA'), 0);
            
            // Collect unique kelurahan names
            const kelList: string[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            features.forEach((f: any) => {
              const name = getAttrStr(f.attributes, 'NAMA_KEL');
              if (name && !kelList.includes(name)) {
                kelList.push(name);
              }
            });
            kelList.sort();

            // Render Kelurahan boundary highlights
            if (features.length > 0 && !buildingLayerRef.current) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const geojsonFeatures: any[] = [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              features.forEach((f: any) => {
                if (f.geometry && Array.isArray(f.geometry.rings)) {
                  geojsonFeatures.push({
                    type: 'Feature',
                    geometry: {
                      type: 'Polygon',
                      coordinates: f.geometry.rings
                    },
                    properties: f.attributes
                  });
                }
              });

              if (geojsonFeatures.length > 0) {
                const bldLayer = L.geoJSON(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  { type: 'FeatureCollection', features: geojsonFeatures } as any,
                  {
                    style: () => ({
                      color: '#0EA5E9',
                      weight: 2,
                      fillColor: '#35A7FF',
                      fillOpacity: 0.2,
                      dashArray: '4, 4',
                      opacity: 0.85
                    }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onEachFeature: (feature: any, layer: any) => {
                      const kelName = getAttrStr(feature.properties, 'NAMA_KEL');
                      const pop = getAttrVal(feature.properties, 'JUMLAH_PENDUDUK');
                      layer.bindTooltip(`<strong>Kel. ${kelName}</strong><br/>Penduduk: ${pop.toLocaleString('id')} jiwa`, {
                        sticky: true,
                        className: 'kel-tooltip'
                      });
                    }
                  }
                );
                bldLayer.addTo(map);
                buildingLayerRef.current = bldLayer;
              }
            }

            const finalState: ImpactDataDampak = {
              loading: false,
              totalPenduduk,
              totalPria,
              totalWanita,
              totalKK,
              kelurahans: kelList,
              area,
              layerType: e.layerType,
              history: searchHistory,
            };
            if (popupRef.current) popup.setContent(buildImpactHtmlDampak(finalState));
          })
          .catch((err) => {
            console.error("Dukcapil Service error:", err);
            // Fallback otomatis ke HexKab lokal jika fitur sudah termuat
            if (hexFeaturesRef.current.length > 0) {
              try {
                const totals = aggregateHexKabImpact(hexFeaturesRef.current, layer);
                if (popupRef.current) {
                  popupRef.current.setContent(
                    buildHexKabImpactHtml({ loading: false, area, totals }) +
                      `<div style="width:280px;font-family:system-ui,sans-serif;margin-top:-4px;padding:0 14px 10px;font-size:9px;color:#B45309">Dukcapil gagal — menampilkan agregasi HexKab lokal.</div>`
                  );
                }
                return;
              } catch {
                // fall through
              }
            }
            if (popupRef.current) popup.setContent(buildFailureHtmlDampak(area, "Tidak dapat menghubungi Dukcapil GIS Service atau query gagal. Silakan coba beberapa saat lagi."));
          });
      });
    };

    activateDrawTool();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDraw]);

  const togglePanel = (panel: ActivePanel) =>
    setActivePanel((prev) => (prev === panel ? null : panel));

  const handleSearchLocation = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchStatus('Ketik lokasi yang ingin dicari.');
      return;
    }

    try {
      setSearchStatus('Mencari lokasi...');
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`);
      const results = (await response.json()) as Array<{ display_name: string; lat: string; lon: string }>;

      if (!results.length) {
        setSearchResults([]);
        setSearchStatus('Lokasi tidak ditemukan.');
        return;
      }

      setSearchResults(results);
      const [first] = results;
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon) && mapRef.current) {
        mapRef.current.flyTo([lat, lon], 13, { duration: 1.5 });
        setSearchStatus(`Memfokuskan ke ${first.display_name}`);
      }
    } catch {
      setSearchStatus('Gagal mencari lokasi. Coba lagi.');
    }
  };

  const isDark = theme === 'dark';
  const panelBg    = isDark ? 'rgba(8,18,36,0.97)'     : 'rgba(255,255,255,0.97)';
  const panelText  = isDark ? '#F1F5F9'                 : '#0F172A';
  const panelBorder= isDark ? 'rgba(30,58,95,0.8)'     : 'rgba(0,0,0,0.1)';
  const panelMuted = isDark ? '#94A3B8'                 : '#64748B';
  const btnBg      = isDark ? 'rgba(8,18,36,0.92)'     : 'rgba(255,255,255,0.92)';

  const toolBtn = (isActive: boolean): React.CSSProperties => ({
    width: 34, height: 34,
    background: isActive ? '#0EA5E9' : btnBg,
    border: `1.5px solid ${isActive ? '#0EA5E9' : panelBorder}`,
    borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, color: isActive ? '#fff' : panelText,
    boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
    transition: 'all 0.15s', flexShrink: 0,
  });

  const panel: React.CSSProperties = {
    position: 'absolute', top: 0, right: 42,
    background: panelBg, border: `1.5px solid ${panelBorder}`,
    borderRadius: 10, width: 220,
    boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
    backdropFilter: 'blur(14px)', maxHeight: 360, overflowY: 'auto',
  };

  const pHead: React.CSSProperties = {
    padding: '9px 12px 7px', borderBottom: `1px solid ${panelBorder}`,
    fontSize: 11, fontWeight: 700, color: panelText,
    position: 'sticky', top: 0, background: panelBg, zIndex: 1,
  };

  const rowBtn = (isOn: boolean, color: string): React.CSSProperties => ({
    width: '100%', padding: '6px 12px',
    background: isOn ? `${color}18` : 'transparent',
    border: 'none', borderLeft: `3px solid ${isOn ? color : 'transparent'}`,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    textAlign: 'left', transition: 'background 0.15s',
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, width: 280, maxWidth: 'calc(100% - 24px)' }}>
        <div style={{ display: 'flex', gap: 8, background: isDark ? 'rgba(8,18,36,0.92)' : 'rgba(255,255,255,0.95)', border: `1px solid ${isDark ? 'rgba(30,58,95,0.8)' : 'rgba(0,0,0,0.12)'}`, borderRadius: 14, padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' }}>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleSearchLocation();
              }
            }}
            placeholder="Cari lokasi, contoh: Ciomas Bogor"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: panelText, fontSize: 12 }}
          />
          <button
            type="button"
            onClick={() => void handleSearchLocation()}
            style={{ border: 'none', borderRadius: 10, background: '#0EA5E9', color: '#fff', padding: '8px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            Cari
          </button>
        </div>
        {searchStatus ? (
          <div style={{ marginTop: 6, fontSize: 11, color: isDark ? '#cbd5e1' : '#475569', paddingLeft: 2 }}>{searchStatus}</div>
        ) : null}
        {searchResults.length > 0 ? (
          <div style={{ marginTop: 8, borderRadius: 12, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(30,58,95,0.8)' : 'rgba(0,0,0,0.12)'}`, background: isDark ? 'rgba(8,18,36,0.92)' : 'rgba(255,255,255,0.95)' }}>
            {searchResults.map((item) => (
              <button
                key={`${item.display_name}-${item.lat}-${item.lon}`}
                type="button"
                onClick={() => {
                  const lat = parseFloat(item.lat);
                  const lon = parseFloat(item.lon);
                  if (!Number.isNaN(lat) && !Number.isNaN(lon) && mapRef.current) {
                    mapRef.current.flyTo([lat, lon], 13, { duration: 1.5 });
                    setSearchStatus(`Memfokuskan ke ${item.display_name}`);
                  }
                }}
                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: 'transparent', color: panelText, cursor: 'pointer', fontSize: 11 }}
              >
                {item.display_name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 0, overflow: 'hidden' }} />
      {mapError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.85)', color: '#f8fafc', fontSize: 12, padding: 20, textAlign: 'center', zIndex: 1500 }}>
          {mapError}
        </div>
      )}

      {/* Right toolbar */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 800, display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Basemap selector */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activePanel === 'basemap')} onClick={() => togglePanel('basemap')} title="Pilih Basemap">
            <Layers size={16} />
          </button>
          {activePanel === 'basemap' && (
            <div style={panel}>
              <div style={pHead}>Pilih Basemap</div>
              <div style={{ padding: '4px 0' }}>
                {BASEMAPS.map((bm) => {
                  const isOn = activeBasemap === bm.id;
                  return (
                    <button key={bm.id} onClick={() => { setActiveBasemap(bm.id); setActivePanel(null); }} style={rowBtn(isOn, '#0EA5E9')}>
                      <span style={{ width: 13, height: 13, borderRadius: '50%', flexShrink: 0, background: isOn ? '#0EA5E9' : 'transparent', border: `2px solid ${isOn ? '#0EA5E9' : panelMuted}` }} />
                      <span style={{ fontSize: 12, color: panelText, fontWeight: isOn ? 700 : 400 }}>{bm.emoji} {bm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* BNPB Layers */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activePanel === 'layers')} onClick={() => togglePanel('layers')} title="Layer Bahaya InARISK">
            <Map size={16} />
          </button>
          {activePanel === 'layers' && (
            <div style={panel}>
              <div style={pHead}>Layer Peta <span style={{ fontSize: 9, fontWeight: 400, color: panelMuted }}>© BNPB · BIG</span></div>
              {/* Group by source */}
              {['BIG', 'BNPB', 'KEMENDAGRI'].map((grp) => {
                const grpLayers = BNPB_LAYERS.filter((l) => l.group === grp);
                const grpColor: Record<string, string> = { BIG: '#22C55E', BNPB: '#35a7ff', KEMENDAGRI: '#3B82F6' };
                return (
                  <div key={grp}>
                    <div style={{ padding: '5px 12px 3px', fontSize: 9, fontWeight: 700, color: grpColor[grp] ?? panelMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {grp === 'BIG' ? '🌿 BIG — Geospasial' : grp === 'BNPB' ? '⚠️ BNPB — InARISK' : '👥 KEMENDAGRI — Dukcapil'}
                    </div>
                    {grpLayers.map((layer) => {
                      const isOn = activeOverlays.includes(layer.id);
                      const badge = layer.type === 'VectorTileServer' ? 'VT' : layer.type === 'ImageServer' ? 'IS' : 'MS';
                      return (
                        <button key={layer.id} onClick={() => setActiveOverlays((p) => isOn ? p.filter((x) => x !== layer.id) : [...p, layer.id])} style={rowBtn(isOn, layer.color)}>
                          <span style={{ width: 13, height: 13, borderRadius: 3, flexShrink: 0, background: isOn ? layer.color : 'transparent', border: `2px solid ${layer.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isOn && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </span>
                          <span style={{ fontSize: 11, color: panelText, fontWeight: isOn ? 600 : 400, flex: 1 }}>{layer.emoji} {layer.label}</span>
                          <span style={{ fontSize: 8, color: panelMuted, flexShrink: 0 }}>{badge}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              {activeOverlays.length > 0 && (
                <div style={{ padding: '6px 12px 8px', borderTop: `1px solid ${panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: panelMuted }}>{activeOverlays.length} aktif</span>
                  <button onClick={() => setActiveOverlays([])} style={{ fontSize: 9, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Reset</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activePanel === 'legend')} onClick={() => togglePanel('legend')} title="Legenda">
            <BarChart2 size={16} />
          </button>
          {activePanel === 'legend' && (
            <div style={{ ...panel, width: 186 }}>
              <div style={pHead}>Legenda</div>
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: panelMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Jenis Bencana</div>
                {LEGEND_ITEMS.map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', flexShrink: 0, background: item.color, boxShadow: `0 0 4px ${item.color}80` }} />
                    <span style={{ fontSize: 11, color: panelText }}>{item.label}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${panelBorder}`, marginTop: 6, paddingTop: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: panelMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: panelText }}>Aktif (saat ini)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'transparent', border: `1.5px solid ${panelMuted}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: panelText }}>Selesai / Pasca</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 9, color: panelMuted }}>Ukuran ∝ skala dampak</div>
                </div>
                <div style={{ borderTop: `1px solid ${panelBorder}`, marginTop: 6, paddingTop: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: panelMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>📳 Gempa Terkini (BMKG)</div>
                  {[{ label: '≥ M6.0', color: '#DC2626' }, { label: 'M5.0 – 5.9', color: '#F97316' }, { label: 'M4.0 – 4.9', color: '#FBBF24' }, { label: '< M4.0', color: '#22C55E' }].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ position: 'relative', width: 14, height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${item.color}`, position: 'absolute', opacity: 0.5 }} />
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, position: 'absolute' }} />
                      </span>
                      <span style={{ fontSize: 10, color: panelText }}>{item.label}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 4, fontSize: 9, color: panelMuted }}>Animasi sinyal = gempa aktif · Klik untuk detail</div>
                </div>
                {/* Dynamic MapServer Layer Legends */}
                {BNPB_LAYERS.filter((l) => l.type === 'MapServer' && activeOverlays.includes(l.id)).map((layer) => {
                  const items = mapserverLegends[layer.id];
                  if (items === undefined) {
                    return (
                      <div key={layer.id} style={{ borderTop: `1px solid ${panelBorder}`, marginTop: 6, paddingTop: 6 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: layer.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {layer.emoji} {layer.label}
                        </div>
                        <div style={{ fontSize: 10, color: panelMuted }}>⏳ Memuat legenda…</div>
                      </div>
                    );
                  }
                  if (items.length === 0) return null;
                  const grouped: Record<string, MapServerLegendItem[]> = {};
                  items.forEach((item) => {
                    if (!grouped[item.layerName]) grouped[item.layerName] = [];
                    grouped[item.layerName].push(item);
                  });
                  return (
                    <div key={layer.id} style={{ borderTop: `1px solid ${panelBorder}`, marginTop: 6, paddingTop: 6 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: layer.color, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {layer.emoji} {layer.label}
                      </div>
                      {Object.entries(grouped).map(([grpName, grpItems]) => (
                        <div key={grpName} style={{ marginBottom: 4 }}>
                          {grpName && (
                            <div style={{ fontSize: 9, color: panelMuted, marginBottom: 3, fontStyle: 'italic' }}>{grpName}</div>
                          )}
                          {grpItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`data:image/png;base64,${item.imageData}`}
                                alt={item.label}
                                style={{ width: 20, height: 20, flexShrink: 0, objectFit: 'contain', imageRendering: 'pixelated' }}
                              />
                              <span style={{ fontSize: 10, color: panelText }}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* BMKG Live Earthquakes */}
        <div style={{ position: 'relative' }}>
          <button
            style={toolBtn(showBmkg)}
            onClick={() => setShowBmkg((v) => !v)}
            title={showBmkg ? `Sembunyikan gempa BMKG (${bmkgData.length} titik)` : 'Tampilkan gempa terkini BMKG'}
          >
            <Activity size={16} />
          </button>
          {showBmkg && bmkgData.length > 0 && (
            <div style={{
              position: 'absolute', top: 0, right: 40,
              background: '#DC2626', color: '#fff',
              borderRadius: 10, padding: '2px 6px',
              fontSize: 9, fontWeight: 700,
              whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }}>
              BMKG {bmkgData.length}
              {bmkgLastUpdate && (
                <span style={{ fontWeight: 400, marginLeft: 4, opacity: 0.85 }}>
                  {bmkgLastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Toggle Bencana Data */}
        <div style={{ position: 'relative' }}>
          <button
            style={toolBtn(showBencanaData)}
            onClick={() => setShowBencanaData((v) => !v)}
            title={showBencanaData ? 'Sembunyikan data bencana.json' : 'Tampilkan data bencana.json'}
          >
            <MapPin size={16} />
          </button>
          {showBencanaData && (
            <div style={{
              position: 'absolute', top: 0, right: 40,
              background: '#0EA5E9', color: '#fff',
              borderRadius: 10, padding: '2px 6px',
              fontSize: 9, fontWeight: 700,
              whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }}>
              {data.length} Kejadian
            </div>
          )}
        </div>

        {/* HexKab GeoJSON layer */}
        <div style={{ position: 'relative' }}>
          <button
            style={toolBtn(showHexKabLayer)}
            onClick={() => setShowHexKabLayer((v) => !v)}
            title={showHexKabLayer ? 'Sembunyikan layer GeoJSON HexKab' : 'Tampilkan layer GeoJSON HexKab'}
          >
            <Map size={16} />
          </button>
          {showHexKabLayer && (
            <div style={{
              position: 'absolute', top: 0, right: 40,
              background: '#165176', color: '#fff',
              borderRadius: 10, padding: '2px 6px',
              fontSize: 9, fontWeight: 700,
              whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
            }}>
              GeoJSON HexKab Aktif
            </div>
          )}
        </div>

        {/* Draw tools */}
        <div style={{ position: 'relative' }}>
          <button style={toolBtn(activePanel === 'draw' || activeDraw !== null)} onClick={() => { togglePanel('draw'); if (activeDraw) { if (activeDrawRef.current) { try { activeDrawRef.current.disable(); } catch{/**/ } activeDrawRef.current=null; } setActiveDraw(null); } }} title="Alat Gambar">
            <Pencil size={16} />
          </button>
          {activePanel === 'draw' && (
            <div style={{ ...panel, width: 220 }}>
              <div style={pHead}>
                Alat Gambar
                {activeDraw && <span style={{ fontSize: 9, color: '#0EA5E9', marginLeft: 6 }}>{DRAW_TOOLS.find((t) => t.id === activeDraw)?.label} aktif</span>}
              </div>
              <div style={{ padding: '8px 10px 6px', borderBottom: `1px solid ${panelBorder}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: panelMuted, marginBottom: 6, letterSpacing: 0.4 }}>SUMBER DAMPAK</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setImpactSource('dukcapil')}
                    style={{
                      flex: 1, padding: '6px 4px', borderRadius: 7, cursor: 'pointer', fontSize: 10, fontWeight: 600,
                      background: impactSource === 'dukcapil' ? 'rgba(14,165,233,0.2)' : 'transparent',
                      border: `1.5px solid ${impactSource === 'dukcapil' ? '#0EA5E9' : panelBorder}`,
                      color: impactSource === 'dukcapil' ? '#0EA5E9' : panelMuted,
                    }}
                    title="Query Dukcapil online"
                  >
                    Dukcapil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImpactSource('hexkab');
                      setShowHexKabLayer(true);
                    }}
                    style={{
                      flex: 1, padding: '6px 4px', borderRadius: 7, cursor: 'pointer', fontSize: 10, fontWeight: 600,
                      background: impactSource === 'hexkab' ? 'rgba(22,81,118,0.25)' : 'transparent',
                      border: `1.5px solid ${impactSource === 'hexkab' ? '#165176' : panelBorder}`,
                      color: impactSource === 'hexkab' ? (isDark ? '#7DD3FC' : '#165176') : panelMuted,
                    }}
                    title="Agregasi GeoJSON HexKab lokal"
                  >
                    HexKab lokal
                  </button>
                </div>
                <div style={{ fontSize: 8.5, color: panelMuted, marginTop: 6, lineHeight: 1.35 }}>
                  {impactSource === 'hexkab'
                    ? `${hexFeatures.length.toLocaleString('id')} hex siap · offline`
                    : 'Query kelurahan via Dukcapil GIS'}
                </div>
              </div>
              <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {DRAW_TOOLS.map((tool) => {
                  const isOn = activeDraw === tool.id;
                  return (
                    <button key={tool.id} onClick={() => setActiveDraw(isOn ? null : tool.id)} title={tool.label}
                      style={{ padding: '7px 4px', background: isOn ? 'rgba(14,165,233,0.2)' : 'transparent', border: `1.5px solid ${isOn ? '#0EA5E9' : panelBorder}`, borderRadius: 7, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.15s' }}>
                      <span style={{ fontSize: 16 }}>{tool.icon}</span>
                      <span style={{ fontSize: 8.5, color: isOn ? '#0EA5E9' : panelMuted, fontWeight: isOn ? 700 : 400 }}>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ padding: '4px 10px 8px', borderTop: `1px solid ${panelBorder}` }}>
                <button onClick={() => { drawLayerRef.current?.clearLayers(); }} style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Hapus semua gambar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
