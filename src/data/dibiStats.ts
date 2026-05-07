// Pre-computed aggregates dari DIBI BNPB — public/20260505_072732.json
// Data 2011-2026, 50.000 kejadian bencana

export const DIBI_TOTAL = {
  kejadian: 50000,
  meninggal: 13249,
  hilang: 1803,
  luka: 85031,
  pengungsi: 82724126,
  rumah_terdampak: 11838142, // rusak berat+sedang+ringan+terendam
};

export const DIBI_PER_TAHUN = [
  { tahun: '2011', kejadian: 1601 },
  { tahun: '2012', kejadian: 1799 },
  { tahun: '2013', kejadian: 1737 },
  { tahun: '2014', kejadian: 1987 },
  { tahun: '2015', kejadian: 1703 },
  { tahun: '2016', kejadian: 2313 },
  { tahun: '2017', kejadian: 2898 },
  { tahun: '2018', kejadian: 3514 },
  { tahun: '2019', kejadian: 3874 },
  { tahun: '2020', kejadian: 4949 },
  { tahun: '2021', kejadian: 6233 },
  { tahun: '2022', kejadian: 3728 },
  { tahun: '2023', kejadian: 5615 },
  { tahun: '2024', kejadian: 3719 },
  { tahun: '2025', kejadian: 3443 },
  { tahun: '2026', kejadian: 887 },
];

export const DIBI_PER_JENIS = [
  { jenis: 'Banjir',        kejadian: 16524, meninggal: 3770,  pengungsi: 55132387, rumah_rusak: 670116, color: '#35A7FF' },
  { jenis: 'Cuaca Ekstrem', kejadian: 14317, meninggal: 511,   pengungsi: 716665,   rumah_rusak: 322148, color: '#38618C' },
  { jenis: 'Longsor',       kejadian: 9503,  meninggal: 2529,  pengungsi: 529097,   rumah_rusak: 59586,  color: '#FF7F11' },
  { jenis: 'Kebakaran',     kejadian: 7198,  meninggal: 54,    pengungsi: 518730,   rumah_rusak: 159,    color: '#F59E0B' },
  { jenis: 'Kekeringan',    kejadian: 1201,  meninggal: 6,     pengungsi: 23234389, rumah_rusak: 0,      color: '#78716C' },
  { jenis: 'Gempabumi',     kejadian: 609,   meninggal: 5716,  pengungsi: 1816777,  rumah_rusak: 552525, color: '#EF4444' },
  { jenis: 'Abrasi',        kejadian: 466,   meninggal: 39,    pengungsi: 82558,    rumah_rusak: 6470,   color: '#06B6D4' },
  { jenis: 'Erupsi',        kejadian: 161,   meninggal: 175,   pengungsi: 650703,   rumah_rusak: 21888,  color: '#8B5CF6' },
  { jenis: 'Tsunami',       kejadian: 21,    meninggal: 449,   pengungsi: 42820,    rumah_rusak: 2791,   color: '#EC4899' },
];

export const DIBI_TOP_PROVINSI = [
  { provinsi: 'Jawa Barat',     kejadian: 9293 },
  { provinsi: 'Jawa Tengah',    kejadian: 8557 },
  { provinsi: 'Jawa Timur',     kejadian: 5288 },
  { provinsi: 'Aceh',           kejadian: 2303 },
  { provinsi: 'Sumatera Utara', kejadian: 1870 },
  { provinsi: 'NTT',            kejadian: 1642 },
  { provinsi: 'Sulawesi Sel.',  kejadian: 1538 },
  { provinsi: 'Sumatera Sel.',  kejadian: 1422 },
  { provinsi: 'Kalimantan Sel.',kejadian: 1318 },
  { provinsi: 'NTB',            kejadian: 1204 },
];

export const DIBI_PER_BULAN = [
  { bulan: 'Jan', label: 'Januari',   kejadian: 6452,  meninggal: 1171 },
  { bulan: 'Feb', label: 'Februari',  kejadian: 6231,  meninggal: 574  },
  { bulan: 'Mar', label: 'Maret',     kejadian: 5471,  meninggal: 647  },
  { bulan: 'Apr', label: 'April',     kejadian: 3987,  meninggal: 669  },
  { bulan: 'Mei', label: 'Mei',       kejadian: 2965,  meninggal: 459  },
  { bulan: 'Jun', label: 'Juni',      kejadian: 2525,  meninggal: 359  },
  { bulan: 'Jul', label: 'Juli',      kejadian: 3042,  meninggal: 371  },
  { bulan: 'Agu', label: 'Agustus',   kejadian: 3205,  meninggal: 752  },
  { bulan: 'Sep', label: 'September', kejadian: 3567,  meninggal: 4433 },
  { bulan: 'Okt', label: 'Oktober',   kejadian: 3805,  meninggal: 309  },
  { bulan: 'Nov', label: 'November',  kejadian: 4361,  meninggal: 2318 },
  { bulan: 'Des', label: 'Desember',  kejadian: 4389,  meninggal: 1187 },
];

// Distribusi korban (%) per jenis untuk pie chart
export const KORBAN_DIST = DIBI_PER_JENIS.map(j => ({
  name: j.jenis,
  value: Math.round((j.meninggal / DIBI_TOTAL.meninggal) * 100),
  color: j.color,
})).filter(j => j.value > 0);

// Distribusi pengungsi (%) per jenis untuk pie chart
export const PENGUNGSI_DIST = DIBI_PER_JENIS.map(j => ({
  name: j.jenis,
  value: Math.round((j.pengungsi / DIBI_TOTAL.pengungsi) * 100),
  color: j.color,
})).filter(j => j.value > 0);
