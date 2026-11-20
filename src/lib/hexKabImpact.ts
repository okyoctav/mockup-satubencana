import L from 'leaflet';

export type HexKabFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>;

export type HexKabImpactTotals = {
  totalLakiLaki: number;
  totalPerempuan: number;
  totalLansia: number;
  totalBalita: number;
  totalKeluarga: number;
  selectedCount: number;
};

export function parseHexNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    return Number(value.replace(/[^0-9.-]/g, '')) || 0;
  }
  return 0;
}

function flattenLatLngs(latlngs: unknown): L.LatLng[] {
  const result: L.LatLng[] = [];
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node && typeof node === 'object' && 'lat' in node && 'lng' in node) {
      const maybeLatLng = node as { lat?: unknown; lng?: unknown };
      if (typeof maybeLatLng.lat === 'number' && typeof maybeLatLng.lng === 'number') {
        result.push(L.latLng(maybeLatLng.lat, maybeLatLng.lng));
      }
    }
  };
  visit(latlngs);
  return result;
}

function isPointInsideLayer(layer: L.Layer, point: L.LatLng): boolean {
  if (layer instanceof L.Circle) {
    return layer.getLatLng().distanceTo(point) <= layer.getRadius();
  }
  if (layer instanceof L.Polygon) {
    const latlngs = layer.getLatLngs();
    if (!Array.isArray(latlngs) || latlngs.length === 0) return false;
    const ring = Array.isArray(latlngs[0]) ? (latlngs[0] as L.LatLng[]) : (latlngs as L.LatLng[]);
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i].lng;
      const yi = ring[i].lat;
      const xj = ring[j].lng;
      const yj = ring[j].lat;
      const intersect =
        yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
  return false;
}

function anyPointInsideLayer(layer: L.Layer, points: L.LatLng[]): boolean {
  return points.some((point) => isPointInsideLayer(layer, point));
}

function getPolygonLayersFromFeature(feature: HexKabFeature): L.Polygon[] {
  if (!feature?.geometry) return [];
  try {
    const geoLayer = L.geoJSON(feature);
    const polygons: L.Polygon[] = [];
    geoLayer.eachLayer((subLayer) => {
      if (subLayer instanceof L.Polygon) polygons.push(subLayer);
    });
    return polygons;
  } catch {
    return [];
  }
}

function doesPolygonLayerIntersectDraw(polygon: L.Polygon, drawLayer: L.Layer): boolean {
  const polygonPoints = flattenLatLngs(polygon.getLatLngs());
  if (polygonPoints.length > 0 && anyPointInsideLayer(drawLayer, polygonPoints)) {
    return true;
  }

  if (drawLayer instanceof L.Polygon) {
    const drawPoints = flattenLatLngs(drawLayer.getLatLngs());
    if (drawPoints.length > 0 && anyPointInsideLayer(polygon, drawPoints)) {
      return true;
    }
  }

  if (drawLayer instanceof L.Circle) {
    const bounds = drawLayer.getBounds();
    if (polygon.getBounds().intersects(bounds)) {
      const circleCenter = drawLayer.getLatLng();
      if (anyPointInsideLayer(polygon, [circleCenter])) return true;
      if (anyPointInsideLayer(drawLayer, polygonPoints)) return true;
    }
  }

  const drawBounds = (drawLayer as L.Layer & { getBounds?: () => L.LatLngBounds }).getBounds?.();
  if (drawBounds) return polygon.getBounds().intersects(drawBounds);
  return false;
}

export function isHexFeatureSelected(feature: HexKabFeature, drawLayer: L.Layer): boolean {
  return getPolygonLayersFromFeature(feature).some((polygon) =>
    doesPolygonLayerIntersectDraw(polygon, drawLayer)
  );
}

export function aggregateHexKabImpact(
  features: HexKabFeature[],
  drawLayer: L.Layer
): HexKabImpactTotals {
  const matching = features.filter((feature) => isHexFeatureSelected(feature, drawLayer));
  const totals = matching.reduce(
    (sum, feature) => {
      const props = feature.properties || {};
      sum.totalLakiLaki += parseHexNumber(props.agg_trp3b_reso9_jml_lakilaki);
      sum.totalPerempuan += parseHexNumber(props.agg_trp3b_reso9_jml_perempuan);
      sum.totalLansia += parseHexNumber(props.agg_trp3b_reso9_jml_lansia);
      sum.totalBalita += parseHexNumber(props.agg_trp3b_reso9_jml_balita);
      sum.totalKeluarga += parseHexNumber(props.agg_trp3b_reso9_jml_klg);
      return sum;
    },
    {
      totalLakiLaki: 0,
      totalPerempuan: 0,
      totalLansia: 0,
      totalBalita: 0,
      totalKeluarga: 0,
    }
  );
  return { ...totals, selectedCount: matching.length };
}

export function buildHexKabImpactHtml(opts: {
  loading: boolean;
  area: string;
  totals?: HexKabImpactTotals;
}): string {
  if (opts.loading) {
    return (
      `<div style="width:280px;font-family:system-ui,sans-serif;color:#0F172A;padding:14px;">` +
      `<div style="font-size:11px;font-weight:700;color:#0EA5E9;letter-spacing:.8px;margin-bottom:8px">HexKab lokal</div>` +
      `<div style="font-size:12px;color:#64748B">Menghitung data dari GeoJSON lokal...</div>` +
      `</div>`
    );
  }

  const t = opts.totals || {
    totalLakiLaki: 0,
    totalPerempuan: 0,
    totalLansia: 0,
    totalBalita: 0,
    totalKeluarga: 0,
    selectedCount: 0,
  };

  return (
    `<div style="width:280px;font-family:system-ui,sans-serif;color:#0F172A">` +
    `<div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1.5px solid #E2E8F0">` +
    `<div style="font-size:11px;font-weight:700;color:#0EA5E9;letter-spacing:.8px">HexKab lokal</div>` +
    `<div style="font-size:10px;color:#64748B;margin-top:3px">` +
    `Luas terpilih ≈ <strong style="color:#0F172A">${opts.area} km²</strong> · ${t.selectedCount} hex` +
    `</div>` +
    `</div>` +
    `<table style="width:100%;border-collapse:collapse;line-height:1.5">` +
    `<tr><td style="font-size:11px;color:#475569">Laki-laki</td><td style="text-align:right;font-size:13px;font-weight:700;color:#0EA5E9">${t.totalLakiLaki.toLocaleString('id')}</td></tr>` +
    `<tr><td style="font-size:11px;color:#475569">Perempuan</td><td style="text-align:right;font-size:13px;font-weight:700;color:#EC4899">${t.totalPerempuan.toLocaleString('id')}</td></tr>` +
    `<tr><td style="font-size:11px;color:#475569">Lansia</td><td style="text-align:right;font-size:13px;font-weight:700;color:#F59E0B">${t.totalLansia.toLocaleString('id')}</td></tr>` +
    `<tr><td style="font-size:11px;color:#475569">Balita</td><td style="text-align:right;font-size:13px;font-weight:700;color:#22C55E">${t.totalBalita.toLocaleString('id')}</td></tr>` +
    `<tr><td style="font-size:11px;color:#475569">Keluarga</td><td style="text-align:right;font-size:13px;font-weight:700;color:#0F172A">${t.totalKeluarga.toLocaleString('id')}</td></tr>` +
    `</table>` +
    `<div style="margin-top:8px;padding-top:6px;border-top:1px solid #E2E8F0;font-size:8.5px;color:#94A3B8;line-height:1.4">` +
    `Agregasi dari atribut GeoJSON HexKab lokal (tanpa layanan Dukcapil).` +
    `</div>` +
    `</div>`
  );
}
