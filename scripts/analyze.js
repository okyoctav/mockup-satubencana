const d = require('../public/20260505_072732.json');
const rows = d.Sheet1.filter(r => r.is_bencana);

const perTahun = {};
rows.forEach(r => { perTahun[r.Tahun] = (perTahun[r.Tahun]||0)+1; });
console.log('Per Tahun:', JSON.stringify(perTahun));

const perJenis = {};
rows.forEach(r => {
  const j = r['Jenis Bencana'];
  if (!perJenis[j]) perJenis[j] = {kejadian:0,meninggal:0,pengungsi:0,rumah_rusak:0};
  perJenis[j].kejadian++;
  perJenis[j].meninggal += r.Meninggal||0;
  perJenis[j].pengungsi += r.menderita_mengungsi||0;
  perJenis[j].rumah_rusak += (r['Rumah Rusak Berat']||0)+(r['Rumah Rusak Sedang']||0)+(r['Rumah Rusak Ringan']||0);
});
console.log('Per Jenis:', JSON.stringify(perJenis));

const rumah = rows.reduce((a,r) => a+(r['Rumah Rusak Berat']||0)+(r['Rumah Rusak Sedang']||0)+(r['Rumah Rusak Ringan']||0)+(r['Rumah Terendam']||0),0);
console.log('Total rumah terdampak:', rumah);

const perBulan = {};
rows.forEach(r => {
  const key = r['Bulan'];
  if (!perBulan[key]) perBulan[key] = {kejadian:0,meninggal:0,pengungsi:0};
  perBulan[key].kejadian++;
  perBulan[key].meninggal += r.Meninggal||0;
  perBulan[key].pengungsi += r.menderita_mengungsi||0;
});
console.log('Per Bulan:', JSON.stringify(perBulan));
