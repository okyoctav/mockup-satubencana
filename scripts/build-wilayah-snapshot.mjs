#!/usr/bin/env node
/**
 * Build snapshot master wilayah (provinsi + kab/kota) untuk staging/prod.
 *
 * Cara (tanpa hammer boundary):
 * 1) Daftar resmi nama+kode dari wilayah-id-api (list only)
 * 2) Koordinat prioritas: junwatu OSM CSV (akurat utk Papua pemekaran)
 *    → Open Admin Data → wilayah.ts → rata-rata kab se-provinsi
 *
 * Usage: node scripts/build-wilayah-snapshot.mjs
 * Output: src/data/wilayah_snapshot.json
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const WILAYAH_ID = 'https://wilayah-id-api.dhanypedia.com/api/v1';
const OAD_PROV =
  'https://raw.githubusercontent.com/open-admin-data/indonesia-administrative-divisions/main/data/all-province.json';
const OAD_REG =
  'https://raw.githubusercontent.com/open-admin-data/indonesia-administrative-divisions/main/data/all-regency.json';
const JUN_CSV =
  'https://raw.githubusercontent.com/junwatu/geocode-wilayah-indonesia/master/kabupaten-kota-dengan-koordinat.csv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../src/data/wilayah_snapshot.json');
const LOCAL_WILAYAH_TS = path.join(__dirname, '../src/data/wilayah.ts');

const PROV_DISPLAY = {
  'daerah khusus ibukota jakarta': 'DKI Jakarta',
  'daerah istimewa yogyakarta': 'DI Yogyakarta',
};

function titleName(s) {
  const raw = String(s || '').trim().replace(/\s+/g, ' ');
  const alias = PROV_DISPLAY[raw.toLowerCase()];
  if (alias) return alias;
  return raw
    .split(' ')
    .map((w) => {
      if (!w) return w;
      const lower = w.toLowerCase();
      if (['dan', 'di', 'ke', 'yang'].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .replace(/^Kabupaten\s+/i, '')
    .replace(/^Kota\s+Administrasi\s+/i, '')
    .replace(/^Kota\s+Adm\.?\s+/i, '')
    .replace(/^Kota\s+/i, '');
}

function normalizeKey(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^kabupaten\s+|^kota\s+administrasi\s+|^kota\s+adm\.?\s+|^kota\s+/i, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function kodeDotted(kodeKab4, kodeProv) {
  const raw = String(kodeKab4 || '').replace(/\./g, '');
  const p = String(kodeProv || raw.slice(0, 2)).padStart(2, '0');
  const rest = raw.slice(p.length).padStart(2, '0');
  return `${p}.${rest}`;
}

/**
 * Normalisasi id CSV.
 * Catatan: "11.1" / "96.1" di dataset junwatu = X.Y0 (bukan 0Y) — hindari tabrakan 96.1→96.01.
 */
function padDottedKode(id) {
  const s = String(id || '').trim();
  if (!s.includes('.')) {
    const raw = s.replace(/\D/g, '');
    if (raw.length >= 4) return `${raw.slice(0, 2)}.${raw.slice(2).padStart(2, '0')}`;
    return s;
  }
  const [a, b] = s.split('.');
  const prov = String(a).padStart(2, '0');
  if (b.length === 1) return `${prov}.${b}0`;
  return `${prov}.${String(b).padStart(2, '0')}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url, attempts = 4) {
  let lastErr;
  for (let a = 1; a <= attempts; a++) {
    try {
      const res = await fetch(url, { headers: { Accept: '*/*' } });
      if (res.status === 429 || res.status === 403) {
        await sleep(600 * a * a);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await sleep(250 * a);
    }
  }
  throw lastErr || new Error(`Gagal fetch ${url}`);
}

async function fetchJson(url, attempts = 4) {
  const text = await fetchText(url, attempts);
  return JSON.parse(text);
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = [];
    let cur = '';
    let q = false;
    for (const ch of lines[i]) {
      if (ch === '"') {
        q = !q;
        continue;
      }
      if (ch === ',' && !q) {
        cols.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    cols.push(cur);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] || '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

async function loadLocalCoordIndex() {
  try {
    const src = await readFile(LOCAL_WILAYAH_TS, 'utf8');
    const re =
      /\{\s*nama:\s*'([^']+)'\s*,\s*tipe:\s*'([^']+)'\s*,\s*provinsi:\s*'([^']+)'\s*,\s*lat:\s*([-\d.]+)\s*,\s*lng:\s*([-\d.]+)/g;
    const byName = new Map();
    let m;
    while ((m = re.exec(src))) {
      const nama = titleName(m[1]);
      const tipe = m[2];
      const provinsi = titleName(m[3]);
      const lat = Number(m[4]);
      const lng = Number(m[5]);
      byName.set(`${tipe}|${normalizeKey(nama)}|${normalizeKey(provinsi)}`, { lat, lng });
      byName.set(`any|${normalizeKey(nama)}|${normalizeKey(provinsi)}`, { lat, lng });
      if (tipe === 'provinsi') byName.set(`provinsi|${normalizeKey(nama)}`, { lat, lng });
    }
    return byName;
  } catch {
    return new Map();
  }
}

function oadLatLon(rec) {
  const lat = Number(rec?.geo?.lat ?? rec?.lat);
  const lon = Number(rec?.geo?.lon ?? rec?.lon ?? rec?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lng: lon };
}

function buildOadIndexes(provinces, regencies) {
  const byKode = new Map();
  const byName = new Map();
  for (const p of provinces) {
    const id = String(p.id || '').padStart(2, '0');
    const c = oadLatLon(p);
    if (!c) continue;
    byKode.set(id, c);
    byName.set(normalizeKey(p.name?.local || p.name_local || p.name), c);
  }
  for (const r of regencies) {
    const id = String(r.id || '').replace(/\./g, '');
    const c = oadLatLon(r);
    if (!c) continue;
    byKode.set(id, c);
    const local = r.name?.local || r.name_local || r.name || '';
    byName.set(normalizeKey(local), c);
    byName.set(normalizeKey(titleName(local)), c);
  }
  return { byKode, byName };
}

function buildJunIndexes(rows) {
  const byKode = new Map();
  const byProvName = new Map();
  for (const r of rows) {
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const c = { lat, lng };
    const kode = padDottedKode(r.id);
    // Jangan overwrite kode yang sudah ada (hindari tabrakan id aneh)
    if (!byKode.has(kode)) byKode.set(kode, c);
    const bare = kode.replace(/\./g, '');
    if (!byKode.has(bare)) byKode.set(bare, c);
    const prov = String(r.province_id || '').padStart(2, '0');
    const rawName = String(r.name || '');
    const isKota = /^kota\b/i.test(rawName);
    const nameKey = normalizeKey(titleName(rawName));
    const tipKey = `${prov}|${isKota ? 'kota' : 'kabupaten'}|${nameKey}`;
    byProvName.set(tipKey, c);
    // Cadangan tanpa tipe — hanya jika belum terisi
    const loose = `${prov}|${nameKey}`;
    if (!byProvName.has(loose)) byProvName.set(loose, c);
  }
  return { byKode, byProvName };
}

async function main() {
  console.log('1/5 Unduh koordinat junwatu (OSM)…');
  const junText = await fetchText(JUN_CSV);
  const junRows = parseCsv(junText);
  const jun = buildJunIndexes(junRows);
  console.log(`   junwatu: ${junRows.length} baris`);

  console.log('2/5 Unduh koordinat bulk Open Admin Data…');
  const [oadProv, oadReg] = await Promise.all([fetchJson(OAD_PROV), fetchJson(OAD_REG)]);
  const oadProvList = Array.isArray(oadProv) ? oadProv : oadProv.entities || [];
  const oadRegList = Array.isArray(oadReg) ? oadReg : oadReg.entities || [];
  const oad = buildOadIndexes(oadProvList, oadRegList);
  console.log(`   OAD: ${oadProvList.length} provinsi, ${oadRegList.length} kab/kota`);

  console.log('3/5 Muat fallback koordinat lokal (wilayah.ts)…');
  const localIdx = await loadLocalCoordIndex();
  console.log(`   lokal: ${localIdx.size} kunci`);

  console.log('4/5 Daftar resmi wilayah-id (tanpa geometry)…');
  const provRes = await fetchJson(`${WILAYAH_ID}/regions/provinces?limit=100`);
  const provinces = provRes.data || [];
  if (provinces.length < 30) throw new Error(`Provinsi terlalu sedikit: ${provinces.length}`);
  await sleep(150);

  const allKab = [];
  for (const p of provinces) {
    const kode = String(p.kode_prov).padStart(2, '0');
    const r = await fetchJson(`${WILAYAH_ID}/regions/regencies?province_code=${kode}&limit=100`);
    const list = r.data || [];
    for (const k of list) allKab.push({ ...k, _provName: p.nama_provinsi, _provKode: kode });
    console.log(`   ${kode} ${p.nama_provinsi}: ${list.length}`);
    await sleep(150);
  }
  console.log(`   Total kab/kota resmi: ${allKab.length}`);

  console.log('5/5 Gabungkan nama resmi + koordinat…');
  const finalCounts = {
    coordFromJunwatu: 0,
    coordFromOad: 0,
    coordFromLocal: 0,
    coordFromProvFallback: 0,
    coordFromKabAverage: 0,
    coordFromDefault: 0,
  };

  const resolveKabCoord = ({ kodeDottedVal, kodeBps, nama, tipe, provinsi, kodeProv }) => {
    // Utama: tipe+nama+prov (kode kab CSV sering tidak 1:1 Kepmendagri, esp. Papua)
    const nameKey = normalizeKey(nama);
    const junHit =
      jun.byProvName.get(`${kodeProv}|${tipe}|${nameKey}`) ||
      jun.byProvName.get(`${kodeProv}|${nameKey}`) ||
      jun.byKode.get(kodeDottedVal) ||
      jun.byKode.get(kodeBps);
    if (junHit) return { ...junHit, coordSource: 'junwatu_osm' };

    const oadHit = oad.byKode.get(kodeBps) || oad.byName.get(normalizeKey(nama));
    if (oadHit) return { ...oadHit, coordSource: 'open_admin_data' };

    const localHit =
      localIdx.get(`${tipe}|${normalizeKey(nama)}|${normalizeKey(provinsi)}`) ||
      localIdx.get(`any|${normalizeKey(nama)}|${normalizeKey(provinsi)}`);
    if (localHit) return { ...localHit, coordSource: 'wilayah_ts' };

    return null;
  };

  const kabByProv = {};
  const kabItems = [];

  for (const k of allKab) {
    const kodeProv = k._provKode;
    const tipe = String(k.tipe || '').toUpperCase().includes('KOTA') ? 'kota' : 'kabupaten';
    const provinsi = titleName(k._provName || k.nama_provinsi);
    const nama = titleName(k.nama_kabupaten);
    const kode = kodeDotted(k.kode_kab, kodeProv);
    const kodeBps = String(k.kode_kab).replace(/\./g, '');
    let c = resolveKabCoord({
      kodeDottedVal: kode,
      kodeBps,
      nama,
      tipe,
      provinsi,
      kodeProv,
    });
    if (!c) {
      c = { lat: -2.5, lng: 118, coordSource: 'default' };
    }
    if (!kabByProv[kodeProv]) kabByProv[kodeProv] = [];
    kabByProv[kodeProv].push({ lat: c.lat, lng: c.lng });
    kabItems.push({
      nama,
      tipe,
      provinsi,
      kode,
      kode_bps: kodeBps,
      lat: Number(Number(c.lat).toFixed(6)),
      lng: Number(Number(c.lng).toFixed(6)),
      zoom: tipe === 'kota' ? 12 : 11,
      coordSource: c.coordSource,
    });
  }

  // Isi fallback pusat: kab tanpa coords bagus → rata-rata saudara se-provinsi
  for (const item of kabItems) {
    if (item.coordSource !== 'default') {
      if (item.coordSource === 'junwatu_osm') finalCounts.coordFromJunwatu++;
      else if (item.coordSource === 'open_admin_data') finalCounts.coordFromOad++;
      else if (item.coordSource === 'wilayah_ts') finalCounts.coordFromLocal++;
      continue;
    }
    const kodeProv = item.kode.split('.')[0];
    const siblings = (kabByProv[kodeProv] || []).filter(
      (s) => !(Math.abs(s.lat + 2.5) < 1e-6 && Math.abs(s.lng - 118) < 1e-6)
    );
    if (siblings.length) {
      item.lat = Number(
        (siblings.reduce((a, s) => a + s.lat, 0) / siblings.length).toFixed(6)
      );
      item.lng = Number(
        (siblings.reduce((a, s) => a + s.lng, 0) / siblings.length).toFixed(6)
      );
      item.coordSource = 'provinsi_fallback';
      finalCounts.coordFromProvFallback++;
    } else {
      finalCounts.coordFromDefault++;
    }
  }

  const provItems = [];
  for (const p of provinces) {
    const kode = String(p.kode_prov).padStart(2, '0');
    const nama = titleName(p.nama_provinsi);
    const kids = kabItems.filter((i) => i.kode.startsWith(`${kode}.`));
    let lat = -2.5;
    let lng = 118;
    let coordSource = 'default';
    if (kids.length) {
      lat = kids.reduce((s, x) => s + x.lat, 0) / kids.length;
      lng = kids.reduce((s, x) => s + x.lng, 0) / kids.length;
      coordSource = 'kab_average';
      finalCounts.coordFromKabAverage++;
    } else {
      finalCounts.coordFromDefault++;
    }
    provItems.push({
      nama,
      tipe: 'provinsi',
      provinsi: nama,
      kode,
      lat: Number(Number(lat).toFixed(6)),
      lng: Number(Number(lng).toFixed(6)),
      zoom: 8,
      coordSource,
    });
  }

  provItems.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  kabItems.sort(
    (a, b) =>
      a.provinsi.localeCompare(b.provinsi, 'id') ||
      a.nama.localeCompare(b.nama, 'id') ||
      a.tipe.localeCompare(b.tipe, 'id')
  );
  const ordered = [...provItems, ...kabItems];

  const payload = {
    asOf: new Date().toISOString().slice(0, 10),
    source:
      'wilayah-id-api (nama+kode) + junwatu OSM (koordinat utama) + open-admin-data + wilayah.ts (fallback)',
    upstreamSnapshot: provRes.meta?.snapshot || null,
    attribution: [
      provRes.meta?.attribution || null,
      'junwatu/geocode-wilayah-indonesia (OSM)',
      'Open Admin Data (CC-BY-4.0)',
    ].filter(Boolean),
    counts: {
      total: ordered.length,
      provinsi: provItems.length,
      kabupaten: kabItems.filter((i) => i.tipe === 'kabupaten').length,
      kota: kabItems.filter((i) => i.tipe === 'kota').length,
      ...finalCounts,
    },
    items: ordered,
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload), 'utf8');
  console.log('Wrote', OUT);
  console.log(payload.counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
