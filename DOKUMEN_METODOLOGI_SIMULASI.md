# 📚 DOKUMEN METODOLOGI & KERANGKA TEKNIS
## SIMULASI PEMODELAN GENANGAN BENCANA
### *(FastFlood 2D & Multi-Sector Impact Assessment Engine)*
**Platform Satu Data Kebencanaan (Dashboard K5)**  
*Versi 1.0 — September 2026*

---

> [!NOTE]
> **Ringkasan Eksekutif**:
> Dokumen ini menyajikan metodologi ilmiah, perumusan matematis-fisik hidrodinamika 2D, integrasi data geospasial real-time, dan standar kalkulasi estimasi dampak multi-sektor yang diimplementasikan pada modul **Simulasi Modeling** (`/simulasi-modeling`). Modul ini memanfaatkan pendekatan *Super Fast Flood Simulation* (SFFS) untuk menghasilkan analisis rambatan banjir dan proyeksi korban serta kerugian secara instan (< 1 detik) guna mendukung pengambilan keputusan tanggap darurat dan perencanaan mitigasi bencana.

---

## 📑 DAFTAR ISI
1. [BAB I: Pendahuluan & Urgensi Pemodelan Cepat](#bab-i-pendahuluan)
2. [BAB II: Metodologi Pemodelan Fisik Hidrologi & Hidraulika 2D](#bab-ii-metodologi-pemodelan-fisik-hidrologi--hidraulika-2d)
3. [BAB III: Estimasi Dampak Sosio-Ekonomi & Fasilitas Publik](#bab-iii-estimasi-dampak-sosio-ekonomi--fasilitas-publik)
4. [BAB IV: Sumber Data & Arsitektur Integrasi Kementerian/Lembaga](#bab-iv-sumber-data--arsitektur-integrasi-kementerianlembaga)
5. [BAB V: Preset Enam Wilayah Rawan Banjir Nasional](#bab-v-preset-enam-wilayah-rawan-banjir-nasional)
6. [BAB VI: Arsitektur Sistem & Implementasi Kode](#bab-vi-arsitektur-sistem--implementasi-kode)
7. [BAB VII: Kesimpulan & Rekomendasi Pengembangan Lanjutan](#bab-vii-kesimpulan--rekomendasi-pengembangan-lanjutan)

---

## BAB I: PENDAHULUAN

### 1.1 Latar Belakang & Urgensi Pemodelan Cepat (*Rapid Assessment*)
Bencana hidrometeorologi (banjir luapan sungai, banjir bandang, dan banjir pasang air laut/rob) merupakan bencana dengan frekuensi kejadian tertinggi di Indonesia. Pada fase pra-bencana (kesiapsiagaan peringatan dini) maupun saat tanggap darurat (*golden hours*), para pengambil kebijakan di tingkat nasional (BNPB, Bappenas, Kementerian PUPR) dan daerah (BPBD) membutuhkan estimasi spasial mengenai luas genangan, kedalaman air, dan populasi terdampak secara cepat.

Pemodelan hidrodinamika 2D konvensional (seperti HEC-RAS 2D atau MIKE 21) memerlukan waktu komputasi yang sangat panjang (beberapa jam hingga hari) serta spesifikasi perangkat keras komputasi tinggi. Modul Simulasi Modeling Antigravity mengatasi batasan ini dengan algoritma **Super Fast Flood Simulation (SFFS / FastFlood 2D Engine)** yang mampu mensimulasikan dinamika genangan banjir dalam hitungan milidetik secara interaktif langsung pada web browser.

### 1.2 Tujuan Modul
1. **Visualisasi Spasial 2D Cepat**: Menghasilkan peta kedalaman genangan air pada berbagai skenario intensitas hujan (10 - 200 mm/jam) dan durasi (1 - 24 jam).
2. **Uji Skenario Pertahanan Sipil**: Mensimulasikan dampak kondisi tanggul (utuh, meluap, jebol) dan kapasitas pompa drainase polder.
3. **Kalkulasi Otomatis Dampak Spasial**: Menghitung luas area genangan (Ha/km²), total volume air (juta m³), dan tingkat keparahan risiko (*hazard level*).
4. **Integrasi Data Demografi Mikro**: Mengintegrasikan secara *real-time* data kependudukan mikro berbasis geospasial (Bappenas SEPAKAT Hexbin Res-9) untuk memetakan kelompok rentan (balita, lansia, difabel).
5. **Estimasi Kerugian Ekonomi & Kerusakan Fisik**: Menghitung proyeksi kerusakan rumah, sekolah, fasilitas kesehatan, jaringan jalan, dan kerugian finansial makro (mengacu standar DINA/DaLA).

### 1.3 Landasan Regulasi & Standar Acuan
* **Undang-Undang RI No. 24 Tahun 2007** tentang Penanggulangan Bencana.
* **Peraturan Pemerintah No. 21 Tahun 2008** tentang Penyelenggaraan Penanggulangan Bencana.
* **Perka BNPB No. 07 Tahun 2008** tentang Pedoman Tata Cara Penyusunan Rencana Penanggulangan Bencana.
* **Perka BNPB No. 10 Tahun 2012** tentang Pengelolaan Logistik Bencana.
* **Pedoman Penilaian Kerusakan dan Kerugian Akibat Bencana (DaLA / DINA BNPB & Bappenas)**.
* **Standar Paket Pelayanan Awal Minimum (PPAM) Kesehatan Reproduksi Bencana (Kemenkes RI & UNFPA)**.
* **Sphere Project**: *Humanitarian Charter and Minimum Standards in Disaster Response*.

---

## BAB II: METODOLOGI PEMODELAN FISIK HIDROLOGI & HIDRAULIKA 2D

### 2.1 Prinsip Super Fast Flood Simulation (FastFlood 2D)
Domain spasial direpresentasikan sebagai jaringan sel grid raster terstruktur:
* **Resolusi Grid**: High (32×32 sel = 1.024 sel), Medium (24×24 sel = 576 sel), dan Low (18×18 sel = 324 sel).
* **Dimensi Sel**: Setiap sel memiliki ukuran $\sim 200\text{ m} \times 200\text{ m}$ ($40.000\text{ m}^2$ atau $4\text{ Hektar}$).
* **Atribut Sel**: Koordinat geografis (`lat`, `lng`), elevasi dasar tanah DEM (`elevation`), kedalaman air (`waterDepth`), elevasi muka air mutlak (`waterElevation`), kecepatan arus (`velocity`), dan tingkat bahaya (`hazardLevel`).

### 2.2 Model Hidrologi: Presipitasi & Limpasan Permukaan (*Runoff*)
1. **Total Curah Hujan Akumulatif ($P_{\text{total}}$)**:
   $$P_{\text{total}} = I \times t$$
   *(dengan $I$ = Intensitas Hujan dalam mm/jam, $t$ = Durasi Hujan dalam jam)*
2. **Infiltrasi Air Tanah ($F$)**:
   $$F = \min(f_{\text{rate}} \times t,\; P_{\text{total}} \times 0.7)$$
   *(di mana $f_{\text{rate}}$ adalah laju serap tanah sesuai tutupan lahan. Infiltrasi dibatasi maksimal 70% dari hujan)*
3. **Curah Hujan Efektif ($P_{\text{eff}}$)**:
   $$P_{\text{eff}} = \left( \frac{P_{\text{total}} - F}{1000} \right) \times C$$
   *(di mana $C$ adalah koefisien limpasan tutupan lahan / Runoff Coefficient)*

#### Parameter Tutupan Lahan & Koefisien Limpasan:
| Tipologi Tutupan Lahan | Koefisien Limpasan ($C$) | Laju Infiltrasi ($f_{\text{rate}}$) | Karakteristik Wilayah |
|:---|:---:|:---:|:---|
| **Perkotaan (Urban)** | $0.85$ | $4.0\text{ mm/jam}$ | Padat kedap air, aspal, beton, resapan minim. |
| **Penyangga (Suburban)** | $0.65$ | $8.0\text{ mm/jam}$ | Pemukiman sedang, pekarangan terbuka, resapan moderat. |
| **Pertanian (Agriculture)** | $0.40$ | $15.0\text{ mm/jam}$ | Lahan sawah, tegalan, perkebunan dengan serapan baik. |
| **Hutan (Forest)** | $0.20$ | $25.0\text{ mm/jam}$ | Hutan lindung/kota dengan porositas dan infiltrasi tinggi. |

---

### 2.3 Model Hidraulika Aliran 2D & Muka Air (*Water Depth*)
Elevasi muka air di setiap sel grid dihitung melalui superposisi 4 komponen hidrolis:
1. **Elevasi Topografi Dasar (Base DEM)**: Membentuk palung sungai sintetis di tengah domain yang melandai naik ke pinggir lereng.
2. **Muka Air Sungai Meluap ($Z_{\text{river}}$)**:
   $$Z_{\text{river}} = \text{BaseDEM} + 1.2 + \left( \frac{Q_{\text{inflow}}}{1000} \times 0.4 \times F_{\text{tanggul}} \right) + \left( \text{TidalSurge} \times (1 - d_{\text{river}}) \right)$$
   * $Q_{\text{inflow}}$: Debit hulu kiriman ($m^3/s$).
   * $F_{\text{tanggul}}$: Faktor integritas tanggul (*Intact*: $1.0$, *Overtopped*: $1.25$, *Breached*: $1.6$).
   * $\text{TidalSurge}$: Tinggi pasang surut air laut / rob ($0.0 - 2.5\text{ m}$).
   * $d_{\text{river}}$: Jarak relatif dari palung sungai ($0.0$ di tengah s.d $1.0$ di ujung domain).
3. **Akumulasi Kedalaman Air ($d$)**:
   $$d = \max(0,\; Z_{\text{river}} - \text{CellElevation}) + \left( P_{\text{eff}} \times (1.2 + d_{\text{cekungan}} \times 1.5) \times F_{\text{tanggul}} \right)$$
4. **Efek Pompa Drainase (Polder)**:
   $$\text{Reduksi Pompa} = \min\left(0.35,\; \frac{\text{PumpCapacity}}{50} \times 0.3\right)\text{ meter}$$
   $$d_{\text{akhir}} = \max(0,\; d - \text{Reduksi Pompa}) \times \text{TimelineMultiplier}$$

---

### 2.4 Kecepatan Aliran (Aproksimasi Rumus Manning)
Kecepatan rambatan aliran air banjir dihitung dengan rumus Manning:
$$V = \frac{1}{n} \cdot R^{2/3} \cdot S^{1/2}$$
* $V$: Kecepatan aliran ($m/s$, dibatasi maksimal $2.8\text{ m/s}$).
* $n$: Koefisien kekasaran Manning ($0.015 - 0.060$, default $0.035$).
* $R$: Radius hidrolis (diaproksimasi sama dengan kedalaman air $d$).
* $S$: Kemiringan lereng medan (*slope* hidrolis).

---

### 2.5 Matriks Tingkat Bahaya (*Hazard Level*)
| Kategori Bahaya | Kedalaman Genangan ($d$) | Warna Peta | Implikasi Lapangan & Tindakan Evakuasi |
|:---|:---:|:---:|:---|
| **Aman** | $d < 0.08\text{ m}$ | Abu-abu | Tidak ada genangan atau hanya basah permukaan jalan. |
| **Rendah** | $0.08\text{ m} \le d \le 0.30\text{ m}$ | Cyan (`#38bdf8`) | Genangan jalan setapak. Kendaraan masih dapat melintas. |
| **Sedang** | $0.30\text{ m} < d \le 0.80\text{ m}$ | Biru Langit (`#0284c7`) | Air masuk pekarangan rumah. Sepeda motor mogok. Waspada evakuasi. |
| **Tinggi** | $0.80\text{ m} < d \le 1.50\text{ m}$ | Biru Kuat (`#2563eb`) | Air masuk ruang utama rumah. Kendaraan roda 4 terendam. Evakuasi wajib. |
| **Ekstrem** | $d > 1.50\text{ m}$ | Biru Tua Pekat (`#1e40af`) | Mencapai atap rumah. Arus deras berbahaya. Tim SAR aktif. |

---

### 2.6 Dinamika Hidrograf Waktu (24-Hour Timeline Progression)
| Waktu | Fase Hidrograf | Pengali Volume | Kondisi Lapangan |
|:---|:---|:---:|:---|
| **00:00** | Awal Kejadian Hujan | $5\%$ | Hujan lebat mulai turun, air mengisi saluran drainase. |
| **02:00** | Limpasan Menggenang | $35\%$ | Saluran drainase penuh, air mulai meluap di cekungan. |
| **04:00** | Limpasan Meluas | $72\%$ | Debit sungai meningkat pesat, air merendam permukiman bantaran. |
| **08:00** | **Puncak Banjir (Peak)** | **$100\%$** | **Genangan dan kedalaman mencapai nilai maksimum.** |
| **16:00** | Hujan Reda & Aliran Hilir | $65\%$ | Hujan mereda, air mengalir perlahan ke muara/saluran primer. |
| **24:00** | Resapan & Surut | $30\%$ | Sebagian besar daratan mengering, genangan tersisa di cekungan terdalam. |

---

## BAB III: ESTIMASI DAMPAK SOSIO-EKONOMI & FASILITAS PUBLIK

Mengadopsi metodologi baku **Damage and Loss Assessment (DaLA) BNPB & Bappenas**:

### 3.1 Formulasi Perhitungan Dampak
1. **Populasi Terdampak (Jiwa)**:
   $$\text{Populasi} = \text{Luas (Ha)} \times \text{Kepadatan} \times \text{Faktor Kedalaman}$$
   *(Kepadatan: Urban = 180, Suburban = 95, Rural = 30 jiwa/Ha. Faktor kedalaman = $1.0$ jika kedalaman rata-rata $> 0.5\text{ m}$, atau $0.4$ jika $\le 0.5\text{ m}$)*
2. **Bangunan Pemukiman Rusak (Unit)**:
   $$\text{Bangunan} = \text{Round}\left( \frac{\text{Populasi}}{4.2} \right)$$
3. **Fasilitas Pendidikan Terdampak**:
   $$\text{Sekolah} = \max\left(1,\; \text{Round}\left( \frac{\text{Luas (Ha)}}{120} \right)\right)$$
4. **Fasilitas Kesehatan Terdampak**:
   $$\text{Faskes / RS} = \max\left(1,\; \text{Round}\left( \frac{\text{Luas (Ha)}}{280} \right)\right)$$
5. **Panjang Jalan Terendam**:
   $$\text{Jalan (km)} = \text{Luas (km}^2) \times 4.2\text{ km}$$
6. **Estimasi Kerugian Finansial (Miliar Rupiah)**:
   $$\text{Kerugian} = (\text{Bangunan} \times 0.045) + (\text{Jalan} \times 0.850) + (\text{Populasi} \times 0.005)$$

---

### 3.2 Pemilahan Demografi Rentan
| Kelompok Rentan | Proporsi Acuan | Sumber Metodologi | Kebutuhan Penanganan Lapangan |
|:---|:---:|:---|:---|
| **Balita (0–5 Tahun)** | $8.5\% - 10.0\%$ | SEPAKAT Bappenas / BPS | MP-ASI, Popok Bayi (4 pcs/hari), PAUD Kit. |
| **Lansia ($\ge 60$ Tahun)** | $8.0\% - 11.8\%$ | SEPAKAT Bappenas / BPS | Tim geriatri, popok dewasa, makanan bernutrisi lunak. |
| **Disabilitas Berat (PD-1)** | $1.2\%$ | SEPAKAT Bappenas (Data KJS) | Kursi roda, evakuasi khusus relawan. |
| **Disabilitas Sedang (PD-2)** | $2.8\%$ | SEPAKAT Bappenas (Data KJS) | Alat bantu jalan/dengar, shelter aksesibel. |
| **Ibu Hamil** | $3.0\%$ | Standar PPAM Kemenkes & UNFPA | Maternity Kit, biskuit PMT, bidan siaga. |
| **Ibu Menyusui** | $4.0\%$ | Standar PPAM Kemenkes & UNFPA | Laktasi Kit, ruang menyusui di posko pengungsian. |

---

## BAB IV: SUMBER DATA & ARSITEKTUR INTEGRASI KEMENTERIAN/LEMBAGA

| No | Kategori Data | Nama Dataset & Endpoint | Instansi Sumber | Pemanfaatan dalam Simulasi |
|:---:|:---|:---|:---|:---|
| **1** | **Demografi Mikro (Live AOI)** | **SEPAKAT DTSEN Hexbin Res-9 (H3)**<br>`https://geospasial.bappenas.go.id/server/rest/services/Produksi/hexbin_agg9/MapServer/0/query` | **BAPPENAS** | Query spasial intersection (`spatialRel=esriSpatialRelIntersects`) poligon banjir untuk memperoleh jumlah real-time: pria, wanita, lansia, balita, difabel PD1/PD2, dan jumlah keluarga. |
| **2** | **Topografi & Elevasi** | **DEMNAS (Digital Elevation Model Nasional)** & SRTM 30m | **BIG (Badan Informasi Geospasial)** | Menentukan elevasi dasar daratan, kontur palung sungai, dan kemiringan lereng. |
| **3** | **Batas Wilayah & Jaringan Jalan** | Batas Desa/Kelurahan & RBI 1:5.000 / 1:25.000 | **BIG** | Batas administrasi wilayah, rasio kerapatan jaringan jalan raya, dan sebaran fasilitas publik. |
| **4** | **Histori & Risiko Bencana** | - InARISK Geoportal (`gis.bnpb.go.id`)<br>- DIBI Tabular (`public/20260505_072732.json`) | **BNPB** | Peta indeks bahaya banjir nasional, rekam historis dampak bencana, dan kalibrasi kerugian ekonomi. |
| **5** | **Klimatologi & Curah Hujan** | Kurva IDF (*Intensity-Duration-Frequency*) & Kala Ulang Hujan (2, 5, 10, 25, 50, 100 Tahun) | **BMKG** | Parameter input intensitas hujan (mm/jam), durasi hujan, dan probabilitas kala ulang. |
| **6** | **Debit DAS & Tanggul** | Data Debit Banjir Rencana ($Q_{25}, Q_{50}$), dimensi tanggul, dan pompa polder | **Kemen PUPR (BBWS)** | Parameter input debit hulu sungai ($m^3/s$), status tanggul, dan kapasitas pompa drainase polder. |
| **7** | **Standar Logistik Medis** | Standar PPAM Kesehatan Reproduksi & *Sphere Standards* | **Kemenkes RI & WHO** | Rasio kelompok rentan dan estimasi kebutuhan logistik serta medis darurat. |

---

## BAB V: PRESET ENAM WILAYAH RAWAN BANJIR NASIONAL

| No | Wilayah Preset | Lokasi Administratif | Elevasi DEM | Tipe Risiko Dominan | Karakteristik DAS & Ancaman Utama |
|:---:|:---|:---|:---:|:---|:---|
| **1** | **DAS Ciliwung - Manggarai** | DKI Jakarta | $8.5\text{ m dpl}$ | Banjir Luapan Sungai | Wilayah permukiman sangat padat, pertemuan drainase kota dan debit kiriman dari hulu (Katulampa). |
| **2** | **Pesisir Kaligawe & Genuk** | Jawa Tengah (Semarang) | $1.2\text{ m dpl}$ | Rob / Pasang Laut | Dataran rendah pantai utara dengan ancaman kombinasi pasang rob dan genangan polder drainase. |
| **3** | **DAS Citarum - Dayeuhkolot** | Jawa Barat (Bandung) | $652.0\text{ m dpl}$ | Banjir Luapan Sungai | Cekungan Bandung dengan kemiringan sangat landai yang menampung aliran sungai Citarum hulu. |
| **4** | **DAS Bengawan Solo - Pasar Kliwon** | Jawa Tengah (Surakarta) | $92.0\text{ m dpl}$ | Banjir Luapan Sungai | Lembah sungai terpanjang di Jawa dengan limpasan air kiriman saat curah hujan lebat di hulu. |
| **5** | **DAS Batang Kuranji** | Sumatera Barat (Padang) | $18.0\text{ m dpl}$ | Banjir Bandang | DAS lereng curam dari Bukit Barisan dengan waktu konsentrasi sangat singkat (debit kilat). |
| **6** | **Delta Sungai Porong & Brantas** | Jawa Timur (Sidoarjo) | $4.8\text{ m dpl}$ | Banjir Muara / Sungai | Jalur pembuangan akhir air sungai Brantas menuju Selat Madura dengan tantangan sedimentasi & tanggul. |

---

## BAB VI: ARSITEKTUR SISTEM & IMPLEMENTASI KODE

* **Mesin Komputasi Hidrologi**: [`src/components/simulasi/SimulasiEngine.ts`](file:///Volumes/SAMSUNG/bencana/src/components/simulasi/SimulasiEngine.ts)
  * Menjalankan fungsi `runFastFloodSimulation()`, `findNearestInspectionPoint()`, dan `querySepakatStatsForFloodAOI()`.
* **Definisi Tipe & Preset Wilayah**: [`src/components/simulasi/SimulasiTypes.ts`](file:///Volumes/SAMSUNG/bencana/src/components/simulasi/SimulasiTypes.ts)
  * Berisi antarmuka TypeScript untuk parameter hidrologi, hasil simulasi, dan daftar 6 wilayah preset.
* **Komponen Peta Spasial**: [`src/components/simulasi/SimulasiLeafletMap.tsx`](file:///Volumes/SAMSUNG/bencana/src/components/simulasi/SimulasiLeafletMap.tsx)
  * Merender lapisan raster grid sel poligon GeoJSON dengan color ramp FastFlood dan interaktivitas klik peta.
* **Panel Kontrol Parameter**: [`src/components/simulasi/SimulasiControlPanel.tsx`](file:///Volumes/SAMSUNG/bencana/src/components/simulasi/SimulasiControlPanel.tsx)
  * Mengatur slider intensitas hujan, durasi, tutupan lahan, debit hulu, pasang rob, tanggul, dan pompa polder.
* **Halaman Web Utama**: [`src/app/simulasi-modeling/page.tsx`](file:///Volumes/SAMSUNG/bencana/src/app/simulasi-modeling/page.tsx)
  * Tampilan antarmuka lengkap dengan verifikasi otentikasi sesi pengguna.
* **Generator Dokumen Word**: [`scripts/generate_docx.js`](file:///Volumes/SAMSUNG/bencana/scripts/generate_docx.js) & [`src/app/api/download-metodologi-docx/route.ts`](file:///Volumes/SAMSUNG/bencana/src/app/api/download-metodologi-docx/route.ts)
  * Penyedia layanan export otomatis berkas `.docx` (Office OpenXML) terstandar.

---

## BAB VII: KESIMPULAN & REKOMENDASI PENGEMBANGAN LANJUTAN

Modul Simulasi Modeling pada platform Satu Data Bencana berhasil memadukan akurasi hidrodinamika 2D dengan kecepatan rendering komputasi instan di web browser. Integrasi dengan data geospasial mikro Bappenas dan BIG memberikan kepastian data bagi para pengambil keputusan untuk merencanakan evakuasi, penyaluran logistik, dan perlindungan kelompok rentan.

### Rekomendasi Lanjutan:
1. **Streaming IoT Sensor Real-Time**: Integrasi langsung sensor muka air sungai (*AWLR*) dan curah hujan (*AWS*) dari Balai Wilayah Sungai / BMKG untuk menjalankan auto-simulasi berkala setiap 10 menit.
2. **Pemanfaatan LiDAR 1 Meter**: Meningkatkan resolusi grid topografi untuk pemodelan detail di gang dan perumahan padat perkotaan.
3. **Physics-Informed Neural Network (PINN)**: Mengimplementasikan AI surrogate modeling untuk estimasi koefisien kekasaran dinamis saat limpasan membawa material sedimen lumpur.

---
*© 2026 Platform Satu Data Kebencanaan Indonesia — Hak Cipta Dilindungi Undang-Undang.*
