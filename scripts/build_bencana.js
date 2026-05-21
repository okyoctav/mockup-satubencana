/**
 * build_bencana.js
 * Generates src/data/bencana.json from public/20260505_072732.json
 * Selects representative records per provinsi, adds lat/lng from lookup table.
 */

const fs = require('fs');
const path = require('path');

// ── Coordinate lookup: kabupaten/kota name → { lat, lng }
const COORDS = {
  // Aceh
  'banda aceh': { lat: 5.5477, lng: 95.3239 },
  'aceh besar': { lat: 5.35, lng: 95.6 },
  'aceh tamiang': { lat: 4.18, lng: 97.9 },
  'aceh utara': { lat: 5.1, lng: 97.15 },
  'pidie': { lat: 4.83, lng: 96.0 },
  // Sumatera Utara
  'kota medan': { lat: 3.595, lng: 98.672 },
  'deli serdang': { lat: 3.39, lng: 98.79 },
  'nias selatan': { lat: 0.6, lng: 97.72 },
  'labuhanbatu': { lat: 2.15, lng: 100.0 },
  // Sumatera Barat
  'padang': { lat: -0.947, lng: 100.417 },
  'kota padang': { lat: -0.947, lng: 100.417 },
  'lima puluh kota': { lat: -0.333, lng: 100.75 },
  'agam': { lat: -0.2, lng: 100.4 },
  'tanah datar': { lat: -0.45, lng: 100.62 },
  'pasaman barat': { lat: 0.1, lng: 99.8 },
  // Riau
  'kota pekanbaru': { lat: 0.507, lng: 101.448 },
  'kampar': { lat: 0.36, lng: 101.1 },
  'pelalawan': { lat: 0.0, lng: 102.2 },
  // Jambi
  'kota jambi': { lat: -1.61, lng: 103.61 },
  'batanghari': { lat: -1.93, lng: 103.0 },
  // Sumatera Selatan
  'kota palembang': { lat: -2.99, lng: 104.75 },
  'musi banyuasin': { lat: -2.6, lng: 103.6 },
  'ogan komering ilir': { lat: -3.5, lng: 105.4 },
  // Lampung
  'kota bandar lampung': { lat: -5.397, lng: 105.267 },
  'bandar lampung': { lat: -5.397, lng: 105.267 },
  'lampung selatan': { lat: -5.536, lng: 105.5 },
  'lampung tengah': { lat: -4.82, lng: 105.3 },
  // Banten
  'kota tangerang': { lat: -6.178, lng: 106.63 },
  'lebak': { lat: -6.56, lng: 106.25 },
  // DKI Jakarta
  'kota jakarta barat': { lat: -6.168, lng: 106.758 },
  'kota jakarta utara': { lat: -6.121, lng: 106.888 },
  'kota jakarta selatan': { lat: -6.262, lng: 106.81 },
  'kota jakarta timur': { lat: -6.225, lng: 106.9 },
  // Jawa Barat
  'kota bandung': { lat: -6.917, lng: 107.619 },
  'bandung': { lat: -7.03, lng: 107.52 },
  'bogor': { lat: -6.595, lng: 106.8 },
  'kota bogor': { lat: -6.595, lng: 106.8 },
  'cianjur': { lat: -6.82, lng: 107.14 },
  'sukabumi': { lat: -6.93, lng: 106.93 },
  'garut': { lat: -7.22, lng: 107.9 },
  'tasikmalaya': { lat: -7.33, lng: 108.22 },
  // Jawa Tengah
  'kota semarang': { lat: -6.993, lng: 110.42 },
  'banjarnegara': { lat: -7.39, lng: 109.69 },
  'banyumas': { lat: -7.52, lng: 109.29 },
  'purbalingga': { lat: -7.39, lng: 109.37 },
  'kebumen': { lat: -7.66, lng: 109.65 },
  'magelang': { lat: -7.47, lng: 110.22 },
  'klaten': { lat: -7.71, lng: 110.6 },
  // DI Yogyakarta
  'sleman': { lat: -7.717, lng: 110.355 },
  'bantul': { lat: -7.889, lng: 110.329 },
  'gunung kidul': { lat: -7.97, lng: 110.6 },
  // Jawa Timur
  'kota surabaya': { lat: -7.257, lng: 112.752 },
  'malang': { lat: -8.0, lng: 112.63 },
  'kota malang': { lat: -7.966, lng: 112.632 },
  'jember': { lat: -8.17, lng: 113.69 },
  'pacitan': { lat: -8.19, lng: 111.1 },
  'ponorogo': { lat: -7.87, lng: 111.47 },
  // Bali
  'kota denpasar': { lat: -8.67, lng: 115.212 },
  'bangli': { lat: -8.46, lng: 115.35 },
  'karangasem': { lat: -8.45, lng: 115.61 },
  // NTB
  'lombok tengah': { lat: -8.653, lng: 116.1 },
  'lombok timur': { lat: -8.56, lng: 116.52 },
  'sumbawa': { lat: -8.49, lng: 117.42 },
  // NTT
  'flores timur': { lat: -8.4, lng: 122.98 },
  'manggarai': { lat: -8.64, lng: 120.47 },
  'kupang': { lat: -9.46, lng: 124.25 },
  'kota kupang': { lat: -10.16, lng: 123.6 },
  // Kalimantan Barat
  'kota pontianak': { lat: -0.026, lng: 109.343 },
  'ketapang': { lat: -1.86, lng: 110.0 },
  // Kalimantan Tengah
  'kota palangka raya': { lat: -2.21, lng: 113.92 },
  'barito selatan': { lat: -1.8, lng: 114.8 },
  // Kalimantan Selatan
  'kota banjarmasin': { lat: -3.319, lng: 114.59 },
  'hulu sungai utara': { lat: -2.06, lng: 115.24 },
  'tapin': { lat: -3.07, lng: 115.0 },
  // Kalimantan Timur
  'kutai kartanegara': { lat: -0.181, lng: 116.976 },
  'kota samarinda': { lat: -0.502, lng: 117.153 },
  'berau': { lat: 2.15, lng: 117.43 },
  // Sulawesi Utara
  'kota manado': { lat: 1.475, lng: 124.842 },
  'minahasa': { lat: 1.25, lng: 124.85 },
  // Sulawesi Tengah
  'kota palu': { lat: -0.892, lng: 119.871 },
  'donggala': { lat: -0.68, lng: 119.75 },
  'sigi': { lat: -1.24, lng: 119.95 },
  // Sulawesi Selatan
  'kota makassar': { lat: -5.148, lng: 119.433 },
  'gowa': { lat: -5.35, lng: 119.8 },
  'luwu': { lat: -2.7, lng: 121.1 },
  'bone': { lat: -4.54, lng: 120.35 },
  'maros': { lat: -4.99, lng: 119.58 },
  // Sulawesi Tenggara
  'kota kendari': { lat: -3.999, lng: 122.513 },
  'kolaka': { lat: -4.05, lng: 121.58 },
  // Gorontalo
  'kota gorontalo': { lat: 0.543, lng: 123.057 },
  'bone bolango': { lat: 0.56, lng: 123.4 },
  // Maluku
  'kota ambon': { lat: -3.656, lng: 128.191 },
  'maluku tengah': { lat: -3.18, lng: 129.41 },
  // Papua
  'kota jayapura': { lat: -2.592, lng: 140.669 },
  'merauke': { lat: -8.5, lng: 140.4 },
};

function getCoords(kabupaten) {
  const key = kabupaten.toLowerCase().trim();
  if (COORDS[key]) return COORDS[key];
  // fuzzy: check if any known key is contained in the kabupaten name or vice versa
  for (const [k, v] of Object.entries(COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

function excelDateToStr(serial) {
  // Excel serial to JS Date (Excel bug: serial 60 = 1900-02-29 doesn't exist)
  const d = new Date((serial - 25569) * 86400 * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function deriveStatus(tanggal) {
  const today = new Date('2025-02-01'); // approximate "now" for this dataset
  const d = new Date(tanggal);
  const diffDays = (today - d) / (1000 * 86400);
  if (diffDays > 30) return 'pasca';
  if (diffDays > -7) return 'saat';
  return 'pra';
}

function deriveLevel(meninggal, pengungsi) {
  if (meninggal >= 10 || pengungsi >= 10000) return 'tinggi';
  if (meninggal >= 3 || pengungsi >= 1000) return 'sedang';
  return 'rendah';
}

function mapJenis(raw) {
  const r = (raw || '').toLowerCase();
  if (r.includes('banjir')) return 'banjir';
  if (r.includes('longsor')) return 'longsor';
  if (r.includes('gempa') || r.includes('gempabumi')) return 'gempa';
  if (r.includes('kebakaran')) return 'kebakaran';
  if (r.includes('cuaca')) return 'angin puting beliung';
  if (r.includes('tsunami')) return 'tsunami';
  if (r.includes('erupsi') || r.includes('gunung api')) return 'erupsi';
  if (r.includes('kekeringan')) return 'kekeringan';
  return 'lainnya';
}

// ── Main ─────────────────────────────────────────────────────────────────────
const srcPath = path.join(__dirname, '../public/20260505_072732.json');
const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const rows = raw.Sheet1;

// Group by kabupaten, pick up to MAX_PER_KAB records (different jenis bencana preferred)
const MAX_PER_KAB = 5;
const byKab = {};
for (const r of rows) {
  if (!r.Kabupaten || !r.Provinsi) continue;
  if (!byKab[r.Kabupaten]) byKab[r.Kabupaten] = [];
  byKab[r.Kabupaten].push(r);
}

// For each kabupaten: sort by impact desc, take diverse jenis (max 1 per jenis, up to MAX_PER_KAB)
function pickBest(records) {
  const byJenis = {};
  for (const r of records) {
    const j = r['Jenis Bencana'] || 'Lainnya';
    const imp = (r.Meninggal || 0) * 100 + (r.menderita_mengungsi || 0);
    if (!byJenis[j] || imp > byJenis[j].impact) {
      byJenis[j] = { ...r, impact: imp };
    }
  }
  return Object.values(byJenis)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, MAX_PER_KAB);
}

// Filter to kabupaten that have coords and sort by impact desc
const candidates = Object.entries(byKab)
  .map(([kab, recs]) => ({ kab, coords: getCoords(kab), recs: pickBest(recs) }))
  .filter(x => x.coords !== null)
  .sort((a, b) => b.recs[0].impact - a.recs[0].impact);

// Pick up to 3 per provinsi to spread coverage (max ~90 total)
const perProv = {};
const selected = [];
for (const { kab, coords, recs } of candidates) {
  const prov = recs[0].Provinsi;
  if (!perProv[prov]) perProv[prov] = 0;
  if (perProv[prov] >= 3) continue;
  perProv[prov]++;
  for (const r of recs) {
    selected.push({ r, coords });
  }
}

// Build kejadian array
const kejadian = selected.map((x, i) => {
  const r = x.r;
  const coords = x.coords;
  const tanggalRaw = r['Tanggal / Waktu Kejadian'];
  const tanggal = typeof tanggalRaw === 'number'
    ? excelDateToStr(tanggalRaw)
    : `${r.Tahun}-${String(r.Bulan).padStart(2, '0')}-01`;
  const meninggal = r.Meninggal || 0;
  const pengungsi = r.menderita_mengungsi || 0;
  const jenis = mapJenis(r['Jenis Bencana'] || r['Nama Kejadian'] || '');
  const level = deriveLevel(meninggal, pengungsi);
  const status = tanggal ? deriveStatus(tanggal) : 'pasca';
  const nama = `${r['Jenis Bencana'] || 'Bencana'} ${r.Kabupaten}`;

  return {
    id: i + 1,
    nama,
    provinsi: r.Provinsi,
    kabupaten: r.Kabupaten,
    lat: coords.lat,
    lng: coords.lng,
    jenis,
    tanggal: tanggal || `${r.Tahun}-${String(r.Bulan).padStart(2, '0')}-01`,
    korban_jiwa: meninggal,
    pengungsi,
    rumah_terdampak: (r['Rumah Rusak Berat'] || 0) + (r['Rumah Rusak Sedang'] || 0) + (r['Rumah Rusak Ringan'] || 0) + (r['Rumah Terendam'] || 0),
    status,
    level,
  };
});

// Compute statistik from kejadian
const statistik = {
  total_kejadian: kejadian.length,
  total_korban: kejadian.reduce((s, k) => s + k.korban_jiwa, 0),
  total_pengungsi: kejadian.reduce((s, k) => s + k.pengungsi, 0),
  provinsi_terdampak: new Set(kejadian.map(k => k.provinsi)).size,
  jenis_bencana: {},
};
for (const k of kejadian) {
  statistik.jenis_bencana[k.jenis] = (statistik.jenis_bencana[k.jenis] || 0) + 1;
}

const output = { kejadian, statistik };
const outPath = path.join(__dirname, '../src/data/bencana.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

console.log(`Generated ${kejadian.length} records across ${statistik.provinsi_terdampak} provinsi.`);
const makassar = kejadian.filter(k => k.kabupaten.toLowerCase().includes('makassar'));
console.log(`Makassar records: ${makassar.length}`);
console.log('Sample provinces:', [...new Set(kejadian.map(k => k.provinsi))].slice(0, 8).join(', '));
