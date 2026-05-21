const d = require('../src/data/bencana.json');
const byProv = {};
for (const k of d.kejadian) {
  if (!byProv[k.provinsi]) byProv[k.provinsi] = { lat: k.lat, lng: k.lng, kab: [] };
  const exists = byProv[k.provinsi].kab.find(x => x.nama === k.kabupaten);
  if (!exists) byProv[k.provinsi].kab.push({ nama: k.kabupaten, lat: k.lat, lng: k.lng });
}
const makassar = d.kejadian.filter(k => k.kabupaten.toLowerCase().includes('makassar'));
console.log('Makassar records:', makassar.length);
makassar.forEach(k => console.log(' -', k.jenis, k.tanggal, k.korban_jiwa, k.pengungsi));
console.log('\nProvince count:', Object.keys(byProv).length);
Object.entries(byProv).forEach(([p, v]) => console.log(p + ': ' + v.kab.length + ' kab'));
