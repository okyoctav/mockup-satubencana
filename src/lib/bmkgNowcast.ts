/**
 * BMKG Peringatan Dini Cuaca (Nowcast CAP).
 * Sumber publik tanpa API key — RSS + CAP XML.
 */

import { canonicalProvinsiName, normalizeWilayahKey } from '@/lib/sipongiGeo';

export type BmkgNowcastSeverity =
  | 'Extreme'
  | 'Severe'
  | 'Moderate'
  | 'Minor'
  | 'Unknown';

export type BmkgNowcastAlert = {
  id: string;
  headline: string;
  event: string;
  severity: BmkgNowcastSeverity;
  urgency: string;
  certainty: string;
  effective: string | null;
  expires: string | null;
  sent: string | null;
  areaDesc: string;
  /** Nama provinsi dinormalisasi ke master MDB bila memungkinkan */
  provinsi: string;
  kecamatan: string[];
  description: string;
  web: string | null;
  link: string;
  /** Ring lat/lng untuk Leaflet: [ [lat, lng], ... ] */
  polygons: number[][][];
  polygonCount: number;
};

export type BmkgNowcastPayload = {
  ok: boolean;
  source: 'bmkg-nowcast';
  updatedAt: string;
  count: number;
  alerts: BmkgNowcastAlert[];
  note?: string;
};

/** Alias nama di judul/areaDesc CAP → nama master MDB */
const CAP_PROVINCE_ALIASES: Record<string, string> = {
  JAKARTA: 'DKI JAKARTA',
  DKI: 'DKI JAKARTA',
  'KEP BANGKA BELITUNG': 'KEPULAUAN BANGKA BELITUNG',
  'KEPULAUAN BANGKA BELITUNG': 'KEPULAUAN BANGKA BELITUNG',
  'BANGKA BELITUNG': 'KEPULAUAN BANGKA BELITUNG',
  'KEP RIAU': 'KEPULAUAN RIAU',
  'KEPULAUAN RIAU': 'KEPULAUAN RIAU',
  DIY: 'DI YOGYAKARTA',
  YOGYAKARTA: 'DI YOGYAKARTA',
  'DI YOGYAKARTA': 'DI YOGYAKARTA',
};

export function normalizeCapProvinsi(raw: string): string {
  const key = normalizeWilayahKey(raw)
    .replace(/^PROVINSI\s+/, '')
    .replace(/^PROV\s+/, '');
  const aliased = CAP_PROVINCE_ALIASES[key] || key;
  return canonicalProvinsiName(aliased);
}

export function severityRank(sev: BmkgNowcastSeverity): number {
  switch (sev) {
    case 'Extreme':
      return 4;
    case 'Severe':
      return 3;
    case 'Moderate':
      return 2;
    case 'Minor':
      return 1;
    default:
      return 0;
  }
}

export function severityColor(sev: BmkgNowcastSeverity): {
  stroke: string;
  fill: string;
  label: string;
} {
  switch (sev) {
    case 'Extreme':
      return { stroke: '#7F1D1D', fill: '#DC2626', label: 'Ekstrem' };
    case 'Severe':
      return { stroke: '#9A3412', fill: '#EA580C', label: 'Berat' };
    case 'Moderate':
      return { stroke: '#1D4ED8', fill: '#3B82F6', label: 'Sedang' };
    case 'Minor':
      return { stroke: '#0E7490', fill: '#22D3EE', label: 'Ringan' };
    default:
      return { stroke: '#475569', fill: '#94A3B8', label: 'Tidak diketahui' };
  }
}

export function parseSeverity(raw: string | undefined | null): BmkgNowcastSeverity {
  const s = String(raw || '').trim();
  if (s === 'Extreme' || s === 'Severe' || s === 'Moderate' || s === 'Minor') return s;
  return 'Unknown';
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function tagText(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i');
  const m = xml.match(re);
  return m ? decodeXmlEntities(m[1].trim()) : '';
}

function allTagTexts(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    out.push(decodeXmlEntities(m[1].trim()));
  }
  return out;
}

/** CAP polygon: "lat,lng lat,lng …" → Leaflet [lat, lng][] */
export function parseCapPolygon(raw: string): number[][] {
  const pts: number[][] = [];
  const tokens = String(raw || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  for (const tok of tokens) {
    const [a, b] = tok.split(',').map((x) => Number(String(x).trim()));
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    // CAP BMKG: lat,lng
    pts.push([a, b]);
  }
  if (pts.length >= 3) {
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) pts.push([first[0], first[1]]);
  }
  return pts.length >= 4 ? pts : [];
}

/** Ambil daftar kecamatan dari frasa "khususnya di A, B, C." */
export function extractKecamatanFromDescription(description: string): string[] {
  const m = description.match(/khususnya\s+di\s+(.+?)(?:\.\s|Kondisi|$)/i);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 2 && s.length < 80)
    .slice(0, 40);
}

export type RssNowcastItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  guid: string | null;
};

export function parseNowcastRss(xml: string): RssNowcastItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return items
    .map((block) => {
      const title = tagText(block, 'title');
      const link = tagText(block, 'link');
      const description = tagText(block, 'description');
      const pubDate = tagText(block, 'pubDate') || null;
      const guid = tagText(block, 'guid') || null;
      if (!link) return null;
      return { title, link, description, pubDate, guid };
    })
    .filter((x): x is RssNowcastItem => !!x);
}

/** Provinsi dari judul "… di Riau" / areaDesc */
export function provinsiFromHeadline(headline: string): string {
  const m = headline.match(/\bdi\s+(.+)$/i);
  return m ? normalizeCapProvinsi(m[1]) : '';
}

export function parseCapAlert(xml: string, fallback: RssNowcastItem): BmkgNowcastAlert | null {
  const infoMatch = xml.match(/<info[\s\S]*?<\/info>/i);
  const info = infoMatch ? infoMatch[0] : xml;

  const headline = tagText(info, 'headline') || fallback.title;
  const event = tagText(info, 'event') || 'Peringatan Dini Cuaca';
  const severity = parseSeverity(tagText(info, 'severity'));
  const urgency = tagText(info, 'urgency') || '';
  const certainty = tagText(info, 'certainty') || '';
  const effective = tagText(info, 'effective') || null;
  const expires = tagText(info, 'expires') || null;
  const sent = tagText(xml, 'sent') || null;
  const description = tagText(info, 'description') || fallback.description;
  const web = tagText(info, 'web') || null;
  const areaDescRaw = tagText(info, 'areaDesc') || provinsiFromHeadline(headline);
  const provinsi = normalizeCapProvinsi(areaDescRaw || provinsiFromHeadline(headline));
  const id =
    tagText(xml, 'identifier') ||
    fallback.guid ||
    fallback.link.split('/').pop() ||
    headline;

  const polygonRaws = allTagTexts(info, 'polygon');
  const polygons = polygonRaws
    .map(parseCapPolygon)
    .filter((ring) => ring.length >= 4)
    // Batasi agar peta tetap ringan di prod
    .slice(0, 48);

  return {
    id,
    headline,
    event,
    severity,
    urgency,
    certainty,
    effective,
    expires,
    sent,
    areaDesc: areaDescRaw || provinsi,
    provinsi: provinsi || normalizeCapProvinsi(areaDescRaw),
    kecamatan: extractKecamatanFromDescription(description),
    description,
    web,
    link: fallback.link,
    polygons,
    polygonCount: polygons.length,
  };
}

/** Alert masih relevan (belum lewat expires, grace 15 menit). */
export function isAlertActive(alert: Pick<BmkgNowcastAlert, 'expires'>, now = Date.now()): boolean {
  if (!alert.expires) return true;
  const t = Date.parse(alert.expires);
  if (Number.isNaN(t)) return true;
  return t + 15 * 60 * 1000 >= now;
}

function alertRecencyScore(alert: BmkgNowcastAlert): number {
  const sent = alert.sent ? Date.parse(alert.sent) : NaN;
  if (!Number.isNaN(sent)) return sent;
  const effective = alert.effective ? Date.parse(alert.effective) : NaN;
  if (!Number.isNaN(effective)) return effective;
  // Fallback: nomor urut di kode CAP (…20005 > …20003)
  const m = String(alert.link || alert.id || '').match(/(\d{2,})(?=_alert\.xml|$)/);
  return m ? Number(m[1]) : 0;
}

/**
 * Gabungkan near-duplicate CAP (update BMKG sering kirim ID baru, isi sama).
 * Key: provinsi + jendela waktu + headline. Sisakan yang paling baru.
 */
export function dedupeNowcastAlerts(alerts: BmkgNowcastAlert[]): BmkgNowcastAlert[] {
  const best = new Map<string, BmkgNowcastAlert>();

  for (const alert of alerts) {
    const key = [
      normalizeCapProvinsi(alert.provinsi || alert.areaDesc),
      alert.effective || '',
      alert.expires || '',
      normalizeWilayahKey(alert.headline),
    ].join('|');

    const prev = best.get(key);
    if (!prev || alertRecencyScore(alert) >= alertRecencyScore(prev)) {
      best.set(key, alert);
    }
  }

  return Array.from(best.values()).sort((a, b) => {
    const ea = a.effective ? Date.parse(a.effective) : 0;
    const eb = b.effective ? Date.parse(b.effective) : 0;
    return eb - ea;
  });
}

export function provinsiKeysMatch(a: string, b: string): boolean {
  const na = normalizeCapProvinsi(a);
  const nb = normalizeCapProvinsi(b);
  if (!na || !nb) return false;
  // Exact only — hindari "RIAU" ⊂ "KEPULAUAN RIAU"
  return na === nb;
}

/** Jenis kejadian BNPB yang relevan dengan nowcast cuaca/hujan. */
export function isKejadianCuacaTerkait(jenis: string | undefined | null): boolean {
  const s = String(jenis || '').toLowerCase();
  if (!s) return false;
  return (
    s.includes('banjir') ||
    s.includes('longsor') ||
    s.includes('cuaca') ||
    s.includes('angin') ||
    s.includes('puting') ||
    s.includes('gelombang')
  );
}

export function filterAlertsByWilayah(
  alerts: BmkgNowcastAlert[],
  opts: { provinsiKey?: string | null; kabKey?: string | null },
): BmkgNowcastAlert[] {
  const prov = opts.provinsiKey ? normalizeCapProvinsi(opts.provinsiKey) : '';
  const kab = opts.kabKey ? normalizeWilayahKey(opts.kabKey) : '';

  return alerts.filter((a) => {
    if (prov && !provinsiKeysMatch(a.provinsi, prov) && !provinsiKeysMatch(a.areaDesc, prov)) {
      return false;
    }
    if (!kab) return true;
    // Kab filter: cocokkan nama kab dengan daftar kecamatan/deskripsi (best-effort)
    if (a.kecamatan.some((k) => normalizeWilayahKey(k) === kab || normalizeWilayahKey(k).includes(kab) || kab.includes(normalizeWilayahKey(k)))) {
      return true;
    }
    const descKey = normalizeWilayahKey(a.description);
    return descKey.includes(kab);
  });
}
