/* eslint-disable @typescript-eslint/no-explicit-any */
/** Shared ArcGIS → Leaflet tile helpers (MapServer export, ImageServer, VectorTile). */

export function tileToBbox3857(x: number, y: number, z: number): string {
  const R = 20037508.342789244;
  const n = Math.pow(2, z);
  return `${(x / n) * 2 * R - R},${R - ((y + 1) / n) * 2 * R},${((x + 1) / n) * 2 * R - R},${R - (y / n) * 2 * R}`;
}

/** Convert tile XYZ to WGS84 (lon/lat) bounding box — for services that use geographic CRS. */
export function tileToBbox4326(x: number, y: number, z: number): string {
  const n = Math.pow(2, z);
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const north = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const south = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  return `${west},${south},${east},${north}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createVectorTileLayer(
  L: any,
  serviceUrl: string,
  color: string,
  options?: {
    interactive?: boolean;
    attribution?: string;
    maxNativeZoom?: number;
    maxZoom?: number;
    minZoom?: number;
    radius?: number;
  },
): any {
  // Support both direct MVT URL templates (e.g. /tiles/bitung/{z}/{x}/{y}.pbf) and ArcGIS VectorTileServer
  const tileUrl = serviceUrl.includes('{z}')
    ? serviceUrl
    : `${serviceUrl}/tile/{z}/{y}/{x}.pbf`;
  // vectorGrid is injected onto window.L by the non-bundled CDN script
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const VG = (L as any).vectorGrid ?? (window as any).L?.vectorGrid;
  if (!VG) return null;
  return VG.protobuf(tileUrl, {
    // render all sub-layers with a single style so features are visible
    vectorTileLayerStyles: new Proxy(
      {},
      {
        get: () => ({
          radius: options?.radius ?? 4,
          weight: 1,
          color,
          fillColor: color,
          fillOpacity: 0.7,
          opacity: 0.9,
          fill: true,
        }),
      },
    ),
    interactive: options?.interactive ?? true,
    attribution: options?.attribution ?? '© BAPPENAS / MDB Bitung',
    minZoom: options?.minZoom ?? 9,
    maxNativeZoom: options?.maxNativeZoom ?? 16,
    maxZoom: options?.maxZoom ?? 20,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createArcGISExportLayer(
  L: any,
  serviceUrl: string,
  opacity: number,
  isImageServer = false,
  useLngLat = false,
  layersParam = 'show:0',
  token?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  let cleanUrl = serviceUrl;
  let localLayersParam = layersParam;
  const match = serviceUrl.match(/\/MapServer\/(\d+)$/);
  if (match && match.index !== undefined) {
    cleanUrl = serviceUrl.substring(0, match.index + 10);
    localLayersParam = `show:${match[1]}`;
  } else if (!serviceUrl.includes('/export')) {
    cleanUrl = serviceUrl.replace(/\/+$/, '');
  }

  const ArcLayer = L.GridLayer.extend({
    createTile(
      coords: { x: number; y: number; z: number },
      done: (e: Error | null, t: HTMLImageElement) => void,
    ): HTMLImageElement {
      const img = document.createElement('img');
      img.alt = '';
      const bbox = useLngLat
        ? tileToBbox4326(coords.x, coords.y, coords.z)
        : tileToBbox3857(coords.x, coords.y, coords.z);
      const bboxSR = useLngLat ? '4326' : '3857';
      const imgSR = useLngLat ? '4326' : '3857';
      if (isImageServer) {
        const queryParams: Record<string, string> = {
          bbox,
          bboxSR,
          imageSR: imgSR,
          size: '256,256',
          format: 'png',
          transparent: 'true',
          f: 'image',
        };
        if (token) queryParams.token = token;
        const params = new URLSearchParams(queryParams);
        img.src = `${cleanUrl}/exportImage?${params}`;
      } else {
        const queryParams: Record<string, string> = {
          bbox,
          bboxSR,
          imageSR: imgSR,
          size: '256,256',
          layers: localLayersParam,
          format: 'png32',
          transparent: 'true',
          f: 'image',
          ignoreScale: 'true',
        };
        if (token) queryParams.token = token;
        const params = new URLSearchParams(queryParams);
        img.src = `${cleanUrl}/export?${params}`;
      }
      img.onload = () => done(null, img);
      img.onerror = () => done(new Error('err'), img);
      return img;
    },
  });
  return new ArcLayer({ opacity, attribution: '© BIG / BNPB', tileSize: 256 });
}
