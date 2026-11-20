/**
 * Puncak yang sering punya footprint zona bahaya InaRISK,
 * tetapi tidak (atau jarang) muncul di feed status live crater/MAGMA.
 *
 * Dipakai agar peta tidak menampilkan “dampak tanpa gunung”.
 * alertLevel = 0 → Tanpa status live (bukan Normal).
 *
 * Koordinat: perkiraan puncak (GVP / gazeteer), ±1–2 km.
 */
export type InariskPeakWithoutStatus = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  province: string;
  regency?: string;
  elevation?: number | null;
  note?: string;
};

export const INARISK_PEAKS_WITHOUT_STATUS: InariskPeakWithoutStatus[] = [
  // Jawa — sering overlap visual dengan gunung berstatus
  {
    slug: 'merbabu',
    name: 'Merbabu',
    lat: -7.455,
    lng: 110.44,
    province: 'Jawa Tengah',
    regency: 'Magelang / Boyolali / Semarang',
    elevation: 3145,
    note: 'Zona InaRISK utara Merapi — gunung terpisah',
  },
  {
    slug: 'ungaran',
    name: 'Ungaran',
    lat: -7.18,
    lng: 110.33,
    province: 'Jawa Tengah',
    elevation: 2050,
  },
  {
    slug: 'lawu',
    name: 'Lawu',
    lat: -7.625,
    lng: 111.192,
    province: 'Jawa Tengah / Jawa Timur',
    elevation: 3265,
  },
  {
    slug: 'penanggungan',
    name: 'Penanggungan',
    lat: -7.615,
    lng: 112.62,
    province: 'Jawa Timur',
    elevation: 1653,
  },
  {
    slug: 'kawi',
    name: 'Kawi',
    lat: -7.92,
    lng: 112.45,
    province: 'Jawa Timur',
    elevation: 2551,
  },
  {
    slug: 'butak',
    name: 'Butak',
    lat: -7.925,
    lng: 112.458,
    province: 'Jawa Timur',
    elevation: 2868,
  },
  {
    slug: 'argopuro',
    name: 'Argopuro',
    lat: -7.97,
    lng: 113.55,
    province: 'Jawa Timur',
    elevation: 3088,
  },
  {
    slug: 'lurus',
    name: 'Lurus',
    lat: -7.733,
    lng: 113.58,
    province: 'Jawa Timur',
    elevation: 539,
  },
  {
    slug: 'tampomas',
    name: 'Tampomas',
    lat: -6.77,
    lng: 107.95,
    province: 'Jawa Barat',
    elevation: 1684,
  },
  {
    slug: 'malabar',
    name: 'Malabar',
    lat: -7.135,
    lng: 107.635,
    province: 'Jawa Barat',
    elevation: 2321,
  },
  {
    slug: 'patuha',
    name: 'Patuha',
    lat: -7.16,
    lng: 107.4,
    province: 'Jawa Barat',
    elevation: 2434,
  },
  {
    slug: 'wayang-windu',
    name: 'Wayang-Windu',
    lat: -7.208,
    lng: 107.63,
    province: 'Jawa Barat',
    elevation: 2182,
  },
  {
    slug: 'kendang',
    name: 'Kendang',
    lat: -7.23,
    lng: 107.72,
    province: 'Jawa Barat',
    elevation: 2608,
  },
  {
    slug: 'pulosari',
    name: 'Pulosari',
    lat: -6.34,
    lng: 105.975,
    province: 'Banten',
    elevation: 1346,
  },
  {
    slug: 'karang',
    name: 'Karang',
    lat: -6.27,
    lng: 106.05,
    province: 'Banten',
    elevation: 1778,
  },
  {
    slug: 'rajabasa',
    name: 'Rajabasa',
    lat: -5.78,
    lng: 105.625,
    province: 'Lampung',
    elevation: 1281,
  },
  // Sumatra — sering dekat gunung berstatus
  {
    slug: 'singgalang',
    name: 'Singgalang',
    lat: -0.39,
    lng: 100.33,
    province: 'Sumatera Barat',
    elevation: 2877,
    note: 'Berdekatan Tandikat',
  },
  {
    slug: 'sago',
    name: 'Sago',
    lat: -0.33,
    lng: 100.47,
    province: 'Sumatera Barat',
    elevation: 2271,
  },
  {
    slug: 'sibayak',
    name: 'Sibayak',
    lat: 3.2,
    lng: 98.5,
    province: 'Sumatera Utara',
    elevation: 2212,
    note: 'Berdekatan Sinabung',
  },
  {
    slug: 'sibualbuali',
    name: 'Sibualbuali',
    lat: 1.556,
    lng: 99.255,
    province: 'Sumatera Utara',
    elevation: 1819,
  },
];
