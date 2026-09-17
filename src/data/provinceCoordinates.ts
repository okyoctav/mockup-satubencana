// Koordinat dan konfigurasi zoom untuk 38 Provinsi di Indonesia
export interface RegionCoord {
  lat: number;
  lng: number;
  zoom: number;
}

export const PROVINCE_COORDINATES: Record<string, RegionCoord> = {
  'ACEH': { lat: 4.6951, lng: 96.7494, zoom: 8 },
  'SUMATERA UTARA': { lat: 2.1154, lng: 99.5451, zoom: 8 },
  'SUMATERA BARAT': { lat: -0.7399, lng: 100.8000, zoom: 8.5 },
  'RIAU': { lat: 0.2933, lng: 101.7068, zoom: 8 },
  'JAMBI': { lat: -1.6101, lng: 103.6131, zoom: 8 },
  'SUMATERA SELATAN': { lat: -3.3194, lng: 104.9140, zoom: 8 },
  'BENGKULU': { lat: -3.7928, lng: 102.2608, zoom: 8.5 },
  'LAMPUNG': { lat: -4.5586, lng: 105.4068, zoom: 8.5 },
  'KEPULAUAN BANGKA BELITUNG': { lat: -2.7411, lng: 106.4406, zoom: 8 },
  'KEPULAUAN RIAU': { lat: 3.9457, lng: 108.1428, zoom: 7.5 },
  'DKI JAKARTA': { lat: -6.2088, lng: 106.8456, zoom: 11 },
  'JAWA BARAT': { lat: -6.9147, lng: 107.6098, zoom: 8.5 },
  'JAWA TENGAH': { lat: -7.1508, lng: 110.1403, zoom: 8.5 },
  'DI YOGYAKARTA': { lat: -7.7956, lng: 110.3695, zoom: 10.5 },
  'DAERAH ISTIMEWA YOGYAKARTA': { lat: -7.7956, lng: 110.3695, zoom: 10.5 },
  'D.I. YOGYAKARTA': { lat: -7.7956, lng: 110.3695, zoom: 10.5 },
  'JAWA TIMUR': { lat: -7.5361, lng: 112.2384, zoom: 8 },
  'BANTEN': { lat: -6.4058, lng: 106.0640, zoom: 9 },
  'BALI': { lat: -8.3405, lng: 115.0920, zoom: 9.5 },
  'NUSA TENGGARA BARAT': { lat: -8.6529, lng: 117.3616, zoom: 8.5 },
  'NUSA TENGGARA TIMUR': { lat: -8.6574, lng: 121.0794, zoom: 8 },
  'KALIMANTAN BARAT': { lat: -0.1000, lng: 110.5000, zoom: 7.5 },
  'KALIMANTAN TENGAH': { lat: -1.6815, lng: 113.3824, zoom: 7.5 },
  'KALIMANTAN SELATAN': { lat: -3.0926, lng: 115.2838, zoom: 8.5 },
  'KALIMANTAN TIMUR': { lat: 0.4000, lng: 116.4194, zoom: 7.5 },
  'KALIMANTAN UTARA': { lat: 3.0731, lng: 116.0413, zoom: 8 },
  'SULAWESI UTARA': { lat: 0.6247, lng: 123.9750, zoom: 8.5 },
  'SULAWESI TENGAH': { lat: -1.4300, lng: 121.4456, zoom: 7.5 },
  'SULAWESI SELATAN': { lat: -3.6688, lng: 119.9741, zoom: 8 },
  'SULAWESI TENGGARA': { lat: -4.1449, lng: 122.1746, zoom: 8 },
  'GORONTALO': { lat: 0.5435, lng: 123.0568, zoom: 9 },
  'SULAWESI BARAT': { lat: -2.8441, lng: 119.2321, zoom: 8.5 },
  'MALUKU': { lat: -3.2385, lng: 130.1453, zoom: 7.5 },
  'MALUKU UTARA': { lat: 1.5709, lng: 127.8087, zoom: 7.5 },
  'PAPUA BARAT': { lat: -1.3361, lng: 133.1747, zoom: 7.5 },
  'PAPUA': { lat: -4.2699, lng: 138.0804, zoom: 7 },
  'PAPUA TENGAH': { lat: -3.5000, lng: 136.5000, zoom: 7 },
  'PAPUA SELATAN': { lat: -7.0000, lng: 139.5000, zoom: 7 },
  'PAPUA PEGUNUNGAN': { lat: -4.0000, lng: 139.0000, zoom: 7 },
  'PAPUA BARAT DAYA': { lat: -1.0000, lng: 132.0000, zoom: 7.5 }
};

// Database koordinat Kabupaten/Kota untuk penandaan spasial
export const KABUPATEN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Kalimantan Selatan (Lengkap 13 Kab/Kota)
  'BANJAR': { lat: -3.3167, lng: 115.0833 },
  'KOTA BANJARBARU': { lat: -3.4400, lng: 114.8300 },
  'BANJARBARU': { lat: -3.4400, lng: 114.8300 },
  'KOTABARU': { lat: -3.0000, lng: 116.0000 },
  'TANAH BUMBU': { lat: -3.4500, lng: 115.7000 },
  'HULU SUNGAI TENGAH': { lat: -2.6000, lng: 115.4167 },
  'TAPIN': { lat: -2.9167, lng: 115.0333 },
  'BARITO KUALA': { lat: -3.0000, lng: 114.6167 },
  'TABALONG': { lat: -1.8833, lng: 115.5000 },
  'HULU SUNGAI SELATAN': { lat: -2.7500, lng: 115.2500 },
  'BALANGAN': { lat: -2.3333, lng: 115.6167 },
  'TANAH LAUT': { lat: -3.8000, lng: 114.8667 },
  'HULU SUNGAI UTARA': { lat: -2.4167, lng: 115.1500 },
  'KOTA BANJARMASIN': { lat: -3.3194, lng: 114.5907 },
  'BANJARMASIN': { lat: -3.3194, lng: 114.5907 },

  // Jawa Barat
  'BOGOR': { lat: -6.5971, lng: 106.8060 },
  'KOTA BOGOR': { lat: -6.5971, lng: 106.8060 },
  'SUKABUMI': { lat: -6.9229, lng: 106.9272 },
  'KOTA SUKABUMI': { lat: -6.9229, lng: 106.9272 },
  'CIANJUR': { lat: -6.8182, lng: 107.1387 },
  'BANDUNG': { lat: -6.9175, lng: 107.6191 },
  'KOTA BANDUNG': { lat: -6.9175, lng: 107.6191 },
  'BANDUNG BARAT': { lat: -6.8433, lng: 107.4947 },
  'GARUT': { lat: -7.2119, lng: 107.9059 },
  'TASIKMALAYA': { lat: -7.3274, lng: 108.2207 },
  'KOTA TASIKMALAYA': { lat: -7.3274, lng: 108.2207 },
  'CIAMIS': { lat: -7.3268, lng: 108.3533 },
  'KUNINGAN': { lat: -6.9769, lng: 108.4802 },
  'CIREBON': { lat: -6.7063, lng: 108.5570 },
  'KOTA CIREBON': { lat: -6.7063, lng: 108.5570 },
  'MAJALENGKA': { lat: -6.8360, lng: 108.2282 },
  'SUMEDANG': { lat: -6.8564, lng: 107.9221 },
  'INDRAMAYU': { lat: -6.3264, lng: 108.3200 },
  'SUBANG': { lat: -6.5583, lng: 107.7583 },
  'PURWAKARTA': { lat: -6.5569, lng: 107.4433 },
  'KARAWANG': { lat: -6.3073, lng: 107.3069 },
  'BEKASI': { lat: -6.2383, lng: 106.9756 },
  'KOTA BEKASI': { lat: -6.2383, lng: 106.9756 },
  'DEPOK': { lat: -6.4025, lng: 106.7942 },
  'KOTA DEPOK': { lat: -6.4025, lng: 106.7942 },
  'KOTA CIMAHI': { lat: -6.8722, lng: 107.5425 },
  'CIMAHI': { lat: -6.8722, lng: 107.5425 },
  'PANGANDARAN': { lat: -7.7011, lng: 108.4947 },

  // Jawa Tengah
  'SEMARANG': { lat: -6.9932, lng: 110.4203 },
  'KOTA SEMARANG': { lat: -6.9932, lng: 110.4203 },
  'SURAKARTA': { lat: -7.5755, lng: 110.8243 },
  'KOTA SURAKARTA': { lat: -7.5755, lng: 110.8243 },
  'MAGELANG': { lat: -7.4797, lng: 110.2177 },
  'KOTA MAGELANG': { lat: -7.4797, lng: 110.2177 },
  'CILACAP': { lat: -7.7298, lng: 109.0132 },
  'BANYUMAS': { lat: -7.5294, lng: 109.2942 },
  'PURBALINGGA': { lat: -7.3889, lng: 109.3639 },
  'BANJARNEGARA': { lat: -7.3986, lng: 109.6972 },
  'KEBUMEN': { lat: -7.6694, lng: 109.6528 },
  'PURWOREJO': { lat: -7.7136, lng: 110.0148 },
  'WONOSOBO': { lat: -7.3628, lng: 109.9005 },
  'BOYOLALI': { lat: -7.5333, lng: 110.6000 },
  'KLATEN': { lat: -7.7059, lng: 110.6065 },
  'SUKOHARJO': { lat: -7.6833, lng: 110.8333 },
  'WONOGIRI': { lat: -7.8167, lng: 110.9167 },
  'KARANGANYAR': { lat: -7.5958, lng: 110.9500 },
  'SRAGEN': { lat: -7.4278, lng: 111.0222 },
  'GROBOGAN': { lat: -7.0333, lng: 110.9167 },
  'BLORA': { lat: -6.9667, lng: 111.4167 },
  'REMBANG': { lat: -6.7111, lng: 111.3417 },
  'PATI': { lat: -6.7417, lng: 111.0381 },
  'KUDUS': { lat: -6.8048, lng: 110.8406 },
  'JEPARA': { lat: -6.5892, lng: 110.6681 },
  'DEMAK': { lat: -6.8944, lng: 110.6389 },
  'TEMANGGUNG': { lat: -7.3195, lng: 110.1745 },
  'KENDAL': { lat: -6.9228, lng: 110.2014 },
  'BATANG': { lat: -6.9083, lng: 109.7333 },
  'PEKALONGAN': { lat: -6.8886, lng: 109.6753 },
  'KOTA PEKALONGAN': { lat: -6.8886, lng: 109.6753 },
  'PEMALANG': { lat: -6.8917, lng: 109.3806 },
  'TEGAL': { lat: -6.8694, lng: 109.1402 },
  'KOTA TEGAL': { lat: -6.8694, lng: 109.1402 },
  'BREBES': { lat: -6.8667, lng: 109.0333 },
  'KOTA SALATIGA': { lat: -7.3305, lng: 110.5084 },

  // Jawa Timur
  'SURABAYA': { lat: -7.2575, lng: 112.7521 },
  'KOTA SURABAYA': { lat: -7.2575, lng: 112.7521 },
  'MALANG': { lat: -7.9666, lng: 112.6326 },
  'KOTA MALANG': { lat: -7.9666, lng: 112.6326 },
  'KOTA BATU': { lat: -7.8712, lng: 112.5273 },
  'SIDOARJO': { lat: -7.4478, lng: 112.7183 },
  'GRESIK': { lat: -7.1566, lng: 112.6555 },
  'MOJOKERTO': { lat: -7.4722, lng: 112.4339 },
  'KOTA MOJOKERTO': { lat: -7.4722, lng: 112.4339 },
  'JOMBANG': { lat: -7.5458, lng: 112.2331 },
  'BOJONEGORO': { lat: -7.1500, lng: 111.8817 },
  'TUBAN': { lat: -6.8976, lng: 112.0649 },
  'LAMONGAN': { lat: -7.1178, lng: 112.4111 },
  'MADIUN': { lat: -7.6298, lng: 111.5239 },
  'KOTA MADIUN': { lat: -7.6298, lng: 111.5239 },
  'NGAWI': { lat: -7.4071, lng: 111.4456 },
  'MAGETAN': { lat: -7.6533, lng: 111.3283 },
  'PONOROGO': { lat: -7.8692, lng: 111.4628 },
  'PACITAN': { lat: -8.1969, lng: 111.1067 },
  'KEDIRI': { lat: -7.8166, lng: 112.0115 },
  'KOTA KEDIRI': { lat: -7.8166, lng: 112.0115 },
  'NGANJUK': { lat: -7.6044, lng: 111.9044 },
  'BLITAR': { lat: -8.0983, lng: 112.1681 },
  'KOTA BLITAR': { lat: -8.0983, lng: 112.1681 },
  'TULUNGAGUNG': { lat: -8.0667, lng: 111.9000 },
  'TRENGGALEK': { lat: -8.0500, lng: 111.7167 },
  'PASURUAN': { lat: -7.6453, lng: 112.9075 },
  'KOTA PASURUAN': { lat: -7.6453, lng: 112.9075 },
  'PROBOLINGGO': { lat: -7.7543, lng: 113.2159 },
  'KOTA PROBOLINGGO': { lat: -7.7543, lng: 113.2159 },
  'LUMAJANG': { lat: -8.1307, lng: 113.2225 },
  'JEMBER': { lat: -8.1697, lng: 113.7019 },
  'BONDOWOSO': { lat: -7.9142, lng: 113.8203 },
  'SITUBONDO': { lat: -7.7071, lng: 114.0088 },
  'BANYUWANGI': { lat: -8.2198, lng: 114.3691 },
  'BANGKALAN': { lat: -7.0306, lng: 112.7483 },
  'SAMPANG': { lat: -7.1878, lng: 113.2394 },
  'PAMEKASAN': { lat: -7.1592, lng: 113.4739 },
  'SUMENEP': { lat: -7.0167, lng: 113.8667 },

  // Aceh
  'BANDA ACEH': { lat: 5.5483, lng: 95.3238 },
  'KOTA BANDA ACEH': { lat: 5.5483, lng: 95.3238 },
  'ACEH BESAR': { lat: 5.3500, lng: 95.6000 },
  'PIDIE': { lat: 4.9419, lng: 96.0893 },
  'PIDIE JAYA': { lat: 5.1500, lng: 96.2167 },
  'BIREUEN': { lat: 5.0833, lng: 96.6000 },
  'ACEH UTARA': { lat: 5.0765, lng: 97.2833 },
  'LHOKSEUMAWE': { lat: 5.1801, lng: 97.1491 },
  'KOTA LHOKSEUMAWE': { lat: 5.1801, lng: 97.1491 },
  'ACEH TIMUR': { lat: 4.6333, lng: 97.6333 },
  'LANGSA': { lat: 4.4717, lng: 97.9683 },
  'KOTA LANGSA': { lat: 4.4717, lng: 97.9683 },
  'ACEH TAMIANG': { lat: 4.1800, lng: 97.9000 },
  'BENER MERIAH': { lat: 4.7500, lng: 96.8667 },
  'ACEH TENGAH': { lat: 4.5333, lng: 96.8500 },
  'GAYO LUES': { lat: 3.9667, lng: 97.3500 },
  'ACEH TENGGARA': { lat: 3.3667, lng: 97.8667 },
  'ACEH JAYA': { lat: 4.7167, lng: 95.6500 },
  'ACEH BARAT': { lat: 4.0994, lng: 96.2498 },
  'NAGAN RAYA': { lat: 4.1667, lng: 96.5333 },
  'ACEH BARAT DAYA': { lat: 3.8333, lng: 96.8833 },
  'ACEH SELATAN': { lat: 3.3498, lng: 97.5451 },
  'SUBULUSSALAM': { lat: 2.7442, lng: 97.9308 },
  'KOTA SUBULUSSALAM': { lat: 2.7442, lng: 97.9308 },
  'ACEH SINGKIL': { lat: 2.3333, lng: 97.8333 },
  'SIMEULUE': { lat: 2.6002, lng: 96.1023 },
  'SABANG': { lat: 5.8933, lng: 95.3211 },
  'KOTA SABANG': { lat: 5.8933, lng: 95.3211 },

  // Sumatera Utara
  'MEDAN': { lat: 3.5950, lng: 98.6720 },
  'KOTA MEDAN': { lat: 3.5950, lng: 98.6720 },
  'DELI SERDANG': { lat: 3.5000, lng: 98.8000 },
  'BINJAI': { lat: 3.6000, lng: 98.4833 },
  'KOTA BINJAI': { lat: 3.6000, lng: 98.4833 },
  'LANGKAT': { lat: 3.8000, lng: 98.3000 },
  'KARO': { lat: 3.1000, lng: 98.4000 },
  'DAIRI': { lat: 2.6000, lng: 98.3000 },
  'SIMALUNGUN': { lat: 2.9000, lng: 99.0000 },
  'PEMATANG SIANTAR': { lat: 2.9595, lng: 99.0687 },
  'KOTA PEMATANGSIANTAR': { lat: 2.9595, lng: 99.0687 },
  'TOBA': { lat: 2.5000, lng: 98.9000 },
  'TAPANULI UTARA': { lat: 2.2000, lng: 98.9000 },
  'ASAHAN': { lat: 2.8000, lng: 99.6000 },
  'LABUHANBATU': { lat: 1.9000, lng: 100.0000 },
  'MANDAILING NATAL': { lat: 0.8667, lng: 99.5833 },
  'NIAS': { lat: 1.0000, lng: 97.5000 },
  'NIAS SELATAN': { lat: 0.6000, lng: 97.7200 }
};

// Helper untuk mengambil koordinat kabupaten dengan fallback radius cerdas di sekitar provinsi
export function getKabupatenCoord(provinsi: string, kabupaten: string, index: number = 0, total: number = 1): { lat: number; lng: number } {
  const kabClean = kabupaten.toUpperCase().trim();
  if (KABUPATEN_COORDINATES[kabClean]) {
    return KABUPATEN_COORDINATES[kabClean];
  }

  // Coba cari substring jika nama memiliki prefiks "KABUPATEN " atau "KOTA "
  const stripped = kabClean.replace(/^(KABUPATEN|KOTA)\s+/, '');
  if (KABUPATEN_COORDINATES[stripped]) {
    return KABUPATEN_COORDINATES[stripped];
  }

  // Fallback: Distribusikan di sekitar titik pusat provinsi dengan radius radial teratur
  const provClean = provinsi.toUpperCase().trim();
  const provCoord = PROVINCE_COORDINATES[provClean] || { lat: -2.5, lng: 118.0, zoom: 5 };
  
  if (total <= 1) {
    return { lat: provCoord.lat, lng: provCoord.lng };
  }

  const angle = (index / total) * 2 * Math.PI;
  const radius = 0.35 + (index % 3) * 0.15; // Jarak derajat ~ 35 - 65 km
  return {
    lat: provCoord.lat + Math.sin(angle) * radius,
    lng: provCoord.lng + Math.cos(angle) * radius * 1.2
  };
}
