export interface Wilayah {
  nama: string;
  tipe: 'provinsi' | 'kabupaten' | 'kota';
  provinsi: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const WILAYAH: Wilayah[] = [
  // Provinsi
  { nama: 'Aceh', tipe: 'provinsi', provinsi: 'Aceh', lat: 4.695135, lng: 96.749397, zoom: 8 },
  { nama: 'Sumatera Utara', tipe: 'provinsi', provinsi: 'Sumatera Utara', lat: 2.1154, lng: 99.5451, zoom: 8 },
  { nama: 'Sumatera Barat', tipe: 'provinsi', provinsi: 'Sumatera Barat', lat: -0.7399, lng: 100.8, zoom: 8 },
  { nama: 'Riau', tipe: 'provinsi', provinsi: 'Riau', lat: 0.2933, lng: 101.7068, zoom: 8 },
  { nama: 'Jambi', tipe: 'provinsi', provinsi: 'Jambi', lat: -1.6101, lng: 103.6131, zoom: 8 },
  { nama: 'Sumatera Selatan', tipe: 'provinsi', provinsi: 'Sumatera Selatan', lat: -3.3194, lng: 104.914, zoom: 8 },
  { nama: 'Bengkulu', tipe: 'provinsi', provinsi: 'Bengkulu', lat: -3.7928, lng: 102.2608, zoom: 8 },
  { nama: 'Lampung', tipe: 'provinsi', provinsi: 'Lampung', lat: -4.5586, lng: 105.4068, zoom: 8 },
  { nama: 'Kepulauan Bangka Belitung', tipe: 'provinsi', provinsi: 'Kepulauan Bangka Belitung', lat: -2.7411, lng: 106.4406, zoom: 8 },
  { nama: 'Kepulauan Riau', tipe: 'provinsi', provinsi: 'Kepulauan Riau', lat: 3.9457, lng: 108.1428, zoom: 8 },
  { nama: 'DKI Jakarta', tipe: 'provinsi', provinsi: 'DKI Jakarta', lat: -6.2088, lng: 106.8456, zoom: 11 },
  { nama: 'Jawa Barat', tipe: 'provinsi', provinsi: 'Jawa Barat', lat: -6.9147, lng: 107.6098, zoom: 9 },
  { nama: 'Jawa Tengah', tipe: 'provinsi', provinsi: 'Jawa Tengah', lat: -7.1508, lng: 110.1403, zoom: 9 },
  { nama: 'DI Yogyakarta', tipe: 'provinsi', provinsi: 'DI Yogyakarta', lat: -7.7956, lng: 110.3695, zoom: 11 },
  { nama: 'Jawa Timur', tipe: 'provinsi', provinsi: 'Jawa Timur', lat: -7.5361, lng: 112.2384, zoom: 9 },
  { nama: 'Banten', tipe: 'provinsi', provinsi: 'Banten', lat: -6.4058, lng: 106.0640, zoom: 9 },
  { nama: 'Bali', tipe: 'provinsi', provinsi: 'Bali', lat: -8.3405, lng: 115.092, zoom: 10 },
  { nama: 'Nusa Tenggara Barat', tipe: 'provinsi', provinsi: 'Nusa Tenggara Barat', lat: -8.6529, lng: 117.3616, zoom: 9 },
  { nama: 'Nusa Tenggara Timur', tipe: 'provinsi', provinsi: 'Nusa Tenggara Timur', lat: -8.6574, lng: 121.0794, zoom: 8 },
  { nama: 'Kalimantan Barat', tipe: 'provinsi', provinsi: 'Kalimantan Barat', lat: 0.0, lng: 109.5, zoom: 8 },
  { nama: 'Kalimantan Tengah', tipe: 'provinsi', provinsi: 'Kalimantan Tengah', lat: -1.6815, lng: 113.3824, zoom: 8 },
  { nama: 'Kalimantan Selatan', tipe: 'provinsi', provinsi: 'Kalimantan Selatan', lat: -3.0926, lng: 115.2838, zoom: 9 },
  { nama: 'Kalimantan Timur', tipe: 'provinsi', provinsi: 'Kalimantan Timur', lat: 0.4, lng: 116.4194, zoom: 8 },
  { nama: 'Kalimantan Utara', tipe: 'provinsi', provinsi: 'Kalimantan Utara', lat: 3.0731, lng: 116.0413, zoom: 8 },
  { nama: 'Sulawesi Utara', tipe: 'provinsi', provinsi: 'Sulawesi Utara', lat: 0.6247, lng: 123.9750, zoom: 9 },
  { nama: 'Sulawesi Tengah', tipe: 'provinsi', provinsi: 'Sulawesi Tengah', lat: -1.4300, lng: 121.4456, zoom: 8 },
  { nama: 'Sulawesi Selatan', tipe: 'provinsi', provinsi: 'Sulawesi Selatan', lat: -3.6688, lng: 119.9741, zoom: 8 },
  { nama: 'Sulawesi Tenggara', tipe: 'provinsi', provinsi: 'Sulawesi Tenggara', lat: -4.14491, lng: 122.1746, zoom: 9 },
  { nama: 'Gorontalo', tipe: 'provinsi', provinsi: 'Gorontalo', lat: 0.5435, lng: 123.0568, zoom: 10 },
  { nama: 'Sulawesi Barat', tipe: 'provinsi', provinsi: 'Sulawesi Barat', lat: -2.8441, lng: 119.2321, zoom: 9 },
  { nama: 'Maluku', tipe: 'provinsi', provinsi: 'Maluku', lat: -3.2385, lng: 130.1453, zoom: 8 },
  { nama: 'Maluku Utara', tipe: 'provinsi', provinsi: 'Maluku Utara', lat: 1.5709, lng: 127.8087, zoom: 8 },
  { nama: 'Papua Barat', tipe: 'provinsi', provinsi: 'Papua Barat', lat: -1.3361, lng: 133.1747, zoom: 8 },
  { nama: 'Papua', tipe: 'provinsi', provinsi: 'Papua', lat: -4.2699, lng: 138.0804, zoom: 7 },

  // Lampung kabupaten/kota
  { nama: 'Tulang Bawang', tipe: 'kabupaten', provinsi: 'Lampung', lat: -4.4272, lng: 105.7052, zoom: 11 },
  { nama: 'Tulang Bawang Barat', tipe: 'kabupaten', provinsi: 'Lampung', lat: -4.3619, lng: 105.3204, zoom: 11 },
  { nama: 'Bandar Lampung', tipe: 'kota', provinsi: 'Lampung', lat: -5.3971, lng: 105.2668, zoom: 12 },
  { nama: 'Lampung Selatan', tipe: 'kabupaten', provinsi: 'Lampung', lat: -5.5657, lng: 105.4929, zoom: 11 },
  { nama: 'Lampung Utara', tipe: 'kabupaten', provinsi: 'Lampung', lat: -4.8299, lng: 104.9079, zoom: 11 },
  { nama: 'Lampung Tengah', tipe: 'kabupaten', provinsi: 'Lampung', lat: -4.8152, lng: 105.2698, zoom: 11 },
  { nama: 'Lampung Timur', tipe: 'kabupaten', provinsi: 'Lampung', lat: -5.0648, lng: 105.8253, zoom: 11 },
  { nama: 'Lampung Barat', tipe: 'kabupaten', provinsi: 'Lampung', lat: -5.0025, lng: 104.1684, zoom: 11 },
  { nama: 'Pesawaran', tipe: 'kabupaten', provinsi: 'Lampung', lat: -5.4156, lng: 105.1399, zoom: 11 },
  { nama: 'Pringsewu', tipe: 'kabupaten', provinsi: 'Lampung', lat: -5.3584, lng: 104.9732, zoom: 12 },
  { nama: 'Tanggamus', tipe: 'kabupaten', provinsi: 'Lampung', lat: -5.4678, lng: 104.6247, zoom: 11 },
  { nama: 'Metro', tipe: 'kota', provinsi: 'Lampung', lat: -5.1131, lng: 105.3069, zoom: 13 },
  { nama: 'Way Kanan', tipe: 'kabupaten', provinsi: 'Lampung', lat: -4.3297, lng: 104.4979, zoom: 11 },
  { nama: 'Mesuji', tipe: 'kabupaten', provinsi: 'Lampung', lat: -3.9597, lng: 105.7086, zoom: 11 },
  { nama: 'Pesisir Barat', tipe: 'kabupaten', provinsi: 'Lampung', lat: -4.9673, lng: 103.8715, zoom: 11 },

  // Jawa Barat
  { nama: 'Bandung', tipe: 'kota', provinsi: 'Jawa Barat', lat: -6.9175, lng: 107.6191, zoom: 12 },
  { nama: 'Bekasi', tipe: 'kota', provinsi: 'Jawa Barat', lat: -6.2383, lng: 106.9756, zoom: 12 },
  { nama: 'Bogor', tipe: 'kota', provinsi: 'Jawa Barat', lat: -6.5971, lng: 106.806, zoom: 12 },
  { nama: 'Depok', tipe: 'kota', provinsi: 'Jawa Barat', lat: -6.4025, lng: 106.7942, zoom: 12 },
  { nama: 'Cirebon', tipe: 'kota', provinsi: 'Jawa Barat', lat: -6.7063, lng: 108.557, zoom: 13 },
  { nama: 'Sukabumi', tipe: 'kabupaten', provinsi: 'Jawa Barat', lat: -6.9229, lng: 106.9272, zoom: 11 },
  { nama: 'Cianjur', tipe: 'kabupaten', provinsi: 'Jawa Barat', lat: -6.8182, lng: 107.1387, zoom: 11 },
  { nama: 'Garut', tipe: 'kabupaten', provinsi: 'Jawa Barat', lat: -7.2119, lng: 107.9059, zoom: 11 },
  { nama: 'Tasikmalaya', tipe: 'kabupaten', provinsi: 'Jawa Barat', lat: -7.3274, lng: 108.2207, zoom: 11 },
  { nama: 'Sumedang', tipe: 'kabupaten', provinsi: 'Jawa Barat', lat: -6.8564, lng: 107.9221, zoom: 11 },
  { nama: 'Kuningan', tipe: 'kabupaten', provinsi: 'Jawa Barat', lat: -6.9769, lng: 108.4802, zoom: 12 },
  { nama: 'Majalengka', tipe: 'kabupaten', provinsi: 'Jawa Barat', lat: -6.836, lng: 108.2282, zoom: 12 },

  // Jawa Tengah
  { nama: 'Semarang', tipe: 'kota', provinsi: 'Jawa Tengah', lat: -6.9932, lng: 110.4203, zoom: 12 },
  { nama: 'Surakarta', tipe: 'kota', provinsi: 'Jawa Tengah', lat: -7.5755, lng: 110.8243, zoom: 13 },
  { nama: 'Magelang', tipe: 'kota', provinsi: 'Jawa Tengah', lat: -7.4797, lng: 110.2177, zoom: 13 },
  { nama: 'Klaten', tipe: 'kabupaten', provinsi: 'Jawa Tengah', lat: -7.7059, lng: 110.6065, zoom: 12 },
  { nama: 'Purworejo', tipe: 'kabupaten', provinsi: 'Jawa Tengah', lat: -7.7136, lng: 110.0148, zoom: 12 },
  { nama: 'Banyumas', tipe: 'kabupaten', provinsi: 'Jawa Tengah', lat: -7.5294, lng: 109.2942, zoom: 11 },
  { nama: 'Cilacap', tipe: 'kabupaten', provinsi: 'Jawa Tengah', lat: -7.7298, lng: 109.0132, zoom: 11 },
  { nama: 'Wonosobo', tipe: 'kabupaten', provinsi: 'Jawa Tengah', lat: -7.3628, lng: 109.9005, zoom: 12 },
  { nama: 'Temanggung', tipe: 'kabupaten', provinsi: 'Jawa Tengah', lat: -7.3195, lng: 110.1745, zoom: 12 },
  { nama: 'Kendal', tipe: 'kabupaten', provinsi: 'Jawa Tengah', lat: -6.9228, lng: 110.2014, zoom: 12 },
  { nama: 'Pati', tipe: 'kabupaten', provinsi: 'Jawa Tengah', lat: -6.7417, lng: 111.0381, zoom: 12 },

  // Jawa Timur
  { nama: 'Surabaya', tipe: 'kota', provinsi: 'Jawa Timur', lat: -7.2575, lng: 112.7521, zoom: 12 },
  { nama: 'Malang', tipe: 'kota', provinsi: 'Jawa Timur', lat: -7.9666, lng: 112.6326, zoom: 12 },
  { nama: 'Kediri', tipe: 'kota', provinsi: 'Jawa Timur', lat: -7.8166, lng: 112.0115, zoom: 12 },
  { nama: 'Probolinggo', tipe: 'kota', provinsi: 'Jawa Timur', lat: -7.7543, lng: 113.2159, zoom: 13 },
  { nama: 'Lumajang', tipe: 'kabupaten', provinsi: 'Jawa Timur', lat: -8.1307, lng: 113.2225, zoom: 12 },
  { nama: 'Banyuwangi', tipe: 'kabupaten', provinsi: 'Jawa Timur', lat: -8.2198, lng: 114.3691, zoom: 11 },
  { nama: 'Jember', tipe: 'kabupaten', provinsi: 'Jawa Timur', lat: -8.1697, lng: 113.7019, zoom: 11 },
  { nama: 'Situbondo', tipe: 'kabupaten', provinsi: 'Jawa Timur', lat: -7.7071, lng: 114.0088, zoom: 12 },
  { nama: 'Bondowoso', tipe: 'kabupaten', provinsi: 'Jawa Timur', lat: -7.9142, lng: 113.8203, zoom: 12 },
  { nama: 'Ngawi', tipe: 'kabupaten', provinsi: 'Jawa Timur', lat: -7.4071, lng: 111.4456, zoom: 12 },
  { nama: 'Lamongan', tipe: 'kabupaten', provinsi: 'Jawa Timur', lat: -7.1178, lng: 112.4111, zoom: 12 },

  // Sumatera Barat
  { nama: 'Padang', tipe: 'kota', provinsi: 'Sumatera Barat', lat: -0.9471, lng: 100.4172, zoom: 12 },
  { nama: 'Bukittinggi', tipe: 'kota', provinsi: 'Sumatera Barat', lat: -0.3055, lng: 100.3695, zoom: 13 },
  { nama: 'Lima Puluh Kota', tipe: 'kabupaten', provinsi: 'Sumatera Barat', lat: -0.3333, lng: 100.75, zoom: 11 },
  { nama: 'Agam', tipe: 'kabupaten', provinsi: 'Sumatera Barat', lat: -0.2, lng: 100.4, zoom: 11 },
  { nama: 'Tanah Datar', tipe: 'kabupaten', provinsi: 'Sumatera Barat', lat: -0.45, lng: 100.62, zoom: 11 },
  { nama: 'Pasaman Barat', tipe: 'kabupaten', provinsi: 'Sumatera Barat', lat: 0.1, lng: 99.8, zoom: 11 },
  { nama: 'Pasaman', tipe: 'kabupaten', provinsi: 'Sumatera Barat', lat: 0.4522, lng: 100.0049, zoom: 11 },
  { nama: 'Solok', tipe: 'kabupaten', provinsi: 'Sumatera Barat', lat: -0.7888, lng: 100.6566, zoom: 11 },
  { nama: 'Sijunjung', tipe: 'kabupaten', provinsi: 'Sumatera Barat', lat: -0.6920, lng: 100.9635, zoom: 11 },
  { nama: 'Dharmasraya', tipe: 'kabupaten', provinsi: 'Sumatera Barat', lat: -1.2042, lng: 101.6161, zoom: 11 },
  { nama: 'Pesisir Selatan', tipe: 'kabupaten', provinsi: 'Sumatera Barat', lat: -1.6437, lng: 100.6093, zoom: 11 },

  // Sulawesi
  { nama: 'Makassar', tipe: 'kota', provinsi: 'Sulawesi Selatan', lat: -5.1477, lng: 119.4327, zoom: 12 },
  { nama: 'Palu', tipe: 'kota', provinsi: 'Sulawesi Tengah', lat: -0.8917, lng: 119.8707, zoom: 12 },
  { nama: 'Manado', tipe: 'kota', provinsi: 'Sulawesi Utara', lat: 1.4748, lng: 124.8421, zoom: 12 },
  // Sulawesi Utara kabupaten/kota
  { nama: 'Bitung', tipe: 'kota', provinsi: 'Sulawesi Utara', lat: 1.4451, lng: 125.1895, zoom: 12 },
  { nama: 'Minahasa Utara', tipe: 'kabupaten', provinsi: 'Sulawesi Utara', lat: 1.4285, lng: 124.9754, zoom: 11 },
  { nama: 'Minahasa', tipe: 'kabupaten', provinsi: 'Sulawesi Utara', lat: 1.2589, lng: 124.8761, zoom: 11 },
  { nama: 'Tomohon', tipe: 'kota', provinsi: 'Sulawesi Utara', lat: 1.3283, lng: 124.8398, zoom: 12 },
  { nama: 'Kotamobagu', tipe: 'kota', provinsi: 'Sulawesi Utara', lat: 0.7225, lng: 124.3168, zoom: 12 },
  { nama: 'Kendari', tipe: 'kota', provinsi: 'Sulawesi Tenggara', lat: -3.9985, lng: 122.5127, zoom: 12 },
  { nama: 'Donggala', tipe: 'kabupaten', provinsi: 'Sulawesi Tengah', lat: -0.5437, lng: 119.7422, zoom: 11 },
  { nama: 'Sigi', tipe: 'kabupaten', provinsi: 'Sulawesi Tengah', lat: -1.1325, lng: 120.0014, zoom: 11 },

  // Kalimantan
  { nama: 'Samarinda', tipe: 'kota', provinsi: 'Kalimantan Timur', lat: -0.5022, lng: 117.1536, zoom: 12 },
  { nama: 'Balikpapan', tipe: 'kota', provinsi: 'Kalimantan Timur', lat: -1.2654, lng: 116.8312, zoom: 12 },
  { nama: 'Banjarmasin', tipe: 'kota', provinsi: 'Kalimantan Selatan', lat: -3.3194, lng: 114.5907, zoom: 12 },
  { nama: 'Pontianak', tipe: 'kota', provinsi: 'Kalimantan Barat', lat: -0.0263, lng: 109.3425, zoom: 12 },
  { nama: 'Kutai Kartanegara', tipe: 'kabupaten', provinsi: 'Kalimantan Timur', lat: -0.4453, lng: 117.0217, zoom: 10 },
  { nama: 'Berau', tipe: 'kabupaten', provinsi: 'Kalimantan Timur', lat: 1.9829, lng: 117.5028, zoom: 10 },

  // NTT/NTB
  { nama: 'Mataram', tipe: 'kota', provinsi: 'Nusa Tenggara Barat', lat: -8.5833, lng: 116.1167, zoom: 12 },
  { nama: 'Kupang', tipe: 'kota', provinsi: 'Nusa Tenggara Timur', lat: -10.1771, lng: 123.6070, zoom: 12 },
  { nama: 'Manggarai', tipe: 'kabupaten', provinsi: 'Nusa Tenggara Timur', lat: -8.6275, lng: 120.4755, zoom: 11 },
  { nama: 'Ende', tipe: 'kabupaten', provinsi: 'Nusa Tenggara Timur', lat: -8.8462, lng: 121.6625, zoom: 12 },
  { nama: 'Flores Timur', tipe: 'kabupaten', provinsi: 'Nusa Tenggara Timur', lat: -8.4073, lng: 122.9764, zoom: 11 },

  // Papua
  { nama: 'Jayapura', tipe: 'kota', provinsi: 'Papua', lat: -2.5916, lng: 140.6690, zoom: 12 },
  { nama: 'Sorong', tipe: 'kota', provinsi: 'Papua Barat', lat: -0.8728, lng: 131.2552, zoom: 12 },
  { nama: 'Fakfak', tipe: 'kabupaten', provinsi: 'Papua Barat', lat: -2.9212, lng: 132.2774, zoom: 11 },

  // Aceh kabupaten
  { nama: 'Aceh Tamiang', tipe: 'kabupaten', provinsi: 'Aceh', lat: 4.18, lng: 97.9, zoom: 11 },
  { nama: 'Aceh Besar', tipe: 'kabupaten', provinsi: 'Aceh', lat: 5.35, lng: 95.6, zoom: 11 },
  { nama: 'Banda Aceh', tipe: 'kota', provinsi: 'Aceh', lat: 5.5483, lng: 95.3238, zoom: 13 },
  { nama: 'Lhokseumawe', tipe: 'kota', provinsi: 'Aceh', lat: 5.1801, lng: 97.1491, zoom: 13 },
  { nama: 'Aceh Utara', tipe: 'kabupaten', provinsi: 'Aceh', lat: 5.0765, lng: 97.2833, zoom: 11 },
  { nama: 'Pidie', tipe: 'kabupaten', provinsi: 'Aceh', lat: 4.9419, lng: 96.0893, zoom: 11 },
  { nama: 'Aceh Barat', tipe: 'kabupaten', provinsi: 'Aceh', lat: 4.0994, lng: 96.2498, zoom: 11 },
  { nama: 'Aceh Selatan', tipe: 'kabupaten', provinsi: 'Aceh', lat: 3.3498, lng: 97.5451, zoom: 11 },
  { nama: 'Simeulue', tipe: 'kabupaten', provinsi: 'Aceh', lat: 2.6002, lng: 96.1023, zoom: 11 },
  { nama: 'Meulaboh', tipe: 'kota', provinsi: 'Aceh', lat: 4.1405, lng: 96.1301, zoom: 13 },

  // Sumatera Utara
  { nama: 'Medan', tipe: 'kota', provinsi: 'Sumatera Utara', lat: 3.595, lng: 98.672, zoom: 12 },
  { nama: 'Nias Selatan', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 0.6, lng: 97.72, zoom: 11 },
  { nama: 'Nias', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 1.0, lng: 97.5, zoom: 11 },
  { nama: 'Karo', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 3.1, lng: 98.4, zoom: 11 },
  { nama: 'Deli Serdang', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 3.5, lng: 98.8, zoom: 11 },
  { nama: 'Langkat', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 3.8, lng: 98.3, zoom: 11 },
  { nama: 'Simalungun', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 2.9, lng: 99.0, zoom: 11 },
  { nama: 'Tapanuli Utara', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 2.2, lng: 98.9, zoom: 11 },
  { nama: 'Tapanuli Selatan', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 1.8, lng: 99.1, zoom: 11 },
  { nama: 'Dairi', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 2.6, lng: 98.3, zoom: 11 },
  { nama: 'Pematangsiantar', tipe: 'kota', provinsi: 'Sumatera Utara', lat: 2.9595, lng: 99.0687, zoom: 13 },
  { nama: 'Toba', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 2.5, lng: 98.9, zoom: 11 },
  { nama: 'Asahan', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 2.8, lng: 99.6, zoom: 11 },
  { nama: 'Labuhanbatu', tipe: 'kabupaten', provinsi: 'Sumatera Utara', lat: 1.9, lng: 100.0, zoom: 11 },

  // Bali
  { nama: 'Denpasar', tipe: 'kota', provinsi: 'Bali', lat: -8.6705, lng: 115.2126, zoom: 13 },
  { nama: 'Badung', tipe: 'kabupaten', provinsi: 'Bali', lat: -8.5666, lng: 115.1765, zoom: 12 },
  { nama: 'Gianyar', tipe: 'kabupaten', provinsi: 'Bali', lat: -8.5357, lng: 115.3266, zoom: 12 },
  { nama: 'Karangasem', tipe: 'kabupaten', provinsi: 'Bali', lat: -8.4506, lng: 115.6087, zoom: 11 },
  { nama: 'Klungkung', tipe: 'kabupaten', provinsi: 'Bali', lat: -8.5379, lng: 115.4027, zoom: 12 },
  { nama: 'Bangli', tipe: 'kabupaten', provinsi: 'Bali', lat: -8.4558, lng: 115.3547, zoom: 12 },
  { nama: 'Buleleng', tipe: 'kabupaten', provinsi: 'Bali', lat: -8.1097, lng: 115.0881, zoom: 11 },
  { nama: 'Jembrana', tipe: 'kabupaten', provinsi: 'Bali', lat: -8.3732, lng: 114.6226, zoom: 12 },
  { nama: 'Tabanan', tipe: 'kabupaten', provinsi: 'Bali', lat: -8.5421, lng: 115.1261, zoom: 12 },

  // Sulawesi Selatan
  { nama: 'Gowa', tipe: 'kabupaten', provinsi: 'Sulawesi Selatan', lat: -5.2784, lng: 119.9001, zoom: 11 },
  { nama: 'Maros', tipe: 'kabupaten', provinsi: 'Sulawesi Selatan', lat: -5.0054, lng: 119.6983, zoom: 11 },
  { nama: 'Bone', tipe: 'kabupaten', provinsi: 'Sulawesi Selatan', lat: -4.7360, lng: 120.3268, zoom: 11 },
  { nama: 'Luwu', tipe: 'kabupaten', provinsi: 'Sulawesi Selatan', lat: -3.0068, lng: 120.5345, zoom: 11 },
  { nama: 'Palopo', tipe: 'kota', provinsi: 'Sulawesi Selatan', lat: -2.9925, lng: 120.1967, zoom: 13 },
  { nama: 'Pare-Pare', tipe: 'kota', provinsi: 'Sulawesi Selatan', lat: -4.0135, lng: 119.6213, zoom: 13 },
];
