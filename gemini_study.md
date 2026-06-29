# Studi Proyek: DataBencana (Management Data Bencana)

Dokumen ini berisi rangkuman teknis, struktur proyek, alur data, dan detail implementasi aplikasi **DataBencana** (atau *SATUBENCANA*) untuk membantu pemahaman cepat tanpa perlu melakukan analisis ulang dari awal.

---

## 1. Ringkasan Proyek

- **Nama Aplikasi:** DataBencana / SATUBENCANA
- **Tujuan:** Platform visualisasi dan analisis data kebencanaan nasional Indonesia skala eksekutif (Executive Disaster Insights) untuk mendukung pengambilan keputusan.
- **Stack Teknologi:**
  - **Framework Utama:** Next.js 14 (App Router) + TypeScript
  - **Styling:** Tailwind CSS + Custom CSS Variables (mendukung tema Gelap/Terang adaptif)
  - **Peta Interaktif:** Leaflet.js (dengan integrasi WebGIS ArcGIS/Inarisk BNPB & BIG)
  - **Visualisasi Data (Charts):** Apache ECharts (melalui `echarts-for-react`) + Recharts
  - **Efek & Animasi 3D:** Three.js, React Three Fiber (R3F) (untuk latar belakang partikel di Hero)
  - **Animasi UI:** Framer Motion, GSAP (ScrollTrigger)
  - **Ekspor Data:** `xlsx` (SheetJS)

---

## 2. Struktur Direktori Proyek

Berikut adalah sitemap / pohon direktori penting beserta fungsinya:

```text
managementdatabencana/
├── app/ (di dalam src/app)
│   ├── page.tsx              # Landing page utama
│   ├── admin/
│   │   └── page.tsx          # Panel Backend Admin (diarahkan ke /login jika belum login)
│   ├── dashboard/
│   │   └── page.tsx          # Executive Dashboard (Halaman Utama Dashboard)
│   ├── dashboard_k2/
│   │   └── page.tsx          # Alternatif visualisasi / mockup dashboard
│   ├── login/
│   │   └── page.tsx          # Halaman autentikasi admin (hardcoded credentials)
│   ├── management/
│   │   └── page.tsx          # Halaman manajemen data layanan geospasial Inarisk
│   ├── globals.css           # Konfigurasi CSS variables tema gelap/terang & utilities
│   └── layout.tsx            # Root layout Next.js
├── components/ (di dalam src/components)
│   ├── landing/              # Komponen Landing Page (Hero, Map, Analisis, Footer)
│   │   ├── HeroSection.tsx
│   │   ├── MapSection.tsx    # Peta sebaran bencana ringkas
│   │   ├── LeafletMap.tsx    # Peta Leaflet untuk landing page
│   │   ├── AnalysisSection.tsx # Tiga fase kebencanaan (Pra, Saat, Pasca)
│   │   └── FooterSection.tsx
│   ├── dashboard/            # Komponen Executive Dashboard
│   │   ├── DashboardHeader.tsx    # Header dashboard, search bar, & logout/kembali
│   │   ├── SearchDaerah.tsx       # Autocomplete search provinsi & kabupaten/kota
│   │   ├── WilayahDropdown.tsx    # Dropdown pemilihan filter provinsi & kabupaten/kota
│   │   ├── StatCards.tsx          # Card statistik (Kejadian, Korban, Kerugian, Rumah Terdampak)
│   │   ├── AlertTicker.tsx        # Ticker early warning / BMKG gempa terkini
│   │   ├── FilterPanel.tsx        # Panel kontrol filter (Jenis, Status, Level) & daftar kejadian
│   │   ├── DashboardMap.tsx       # Wrapper peta dashboard
│   │   ├── DashboardLeaflet.tsx   # Peta utama Leaflet (Sangat kaya fitur: Layer Inarisk, Draw, dll)
│   │   ├── ChartSection.tsx       # Grafik ECharts (Tren Kejadian, Kerugian, Korban, dsb)
│   │   └── AnalysisModelsSection.tsx # Model Kerentanan, Fase Kebencanaan, & Logistik Respon
│   ├── three/
│   │   └── HeroCanvas.tsx    # Partikel 3D interaktif Three.js menggunakan React Three Fiber
│   └── ui/
│       └── Navbar.tsx        # Header/Navbar Landing Page
├── contexts/ (di dalam src/contexts)
│   └── ThemeContext.tsx      # Manajemen tema (Dark/Light) global
├── data/ (di dalam src/data)
│   ├── bencana.json          # Dataset bencana yang dioptimalkan (dihasilkan oleh skrip kompilasi)
│   ├── dibiStats.ts          # Data statistik statis untuk chart
│   ├── wilayah.ts            # Data referensi koordinat wilayah (Provinsi & Kabupaten/Kota Indonesia)
│   └── wab_layers.json       # Metadata & daftar layer WMS/ArcGIS Inarisk
├── public/
│   ├── 20260505_072732.json  # Data mentah tabular DIBI BNPB (format JSON hasil konversi)
│   ├── 20260505_072732.xlsx  # Data mentah Excel DIBI BNPB
│   ├── geojson/
│   │   └── indonesia.json    # Batas wilayah peta Indonesia
│   └── leaflet.css           # Stylesheet Leaflet
├── scripts/
│   ├── build_bencana.js      # Mengompilasi public/DIBI JSON menjadi src/data/bencana.json + koordinat
│   ├── analyze.js            # Menganalisis ringkasan data di terminal
│   ├── check_bencana.js      # Memvalidasi integrasi koordinat data bencana
│   └── xlsx_to_json.js       # Alat bantu konversi xlsx ke json
├── update.js                 # Skrip otomatis untuk mereset/mengubah CSS variables globals.css
└── package.json              # Daftar ketergantungan (dependencies)
```

---

## 3. Alur Data & Model Analisis

### A. Sumber Data Utama
Data bencana utama bersumber dari **DIBI (Data Informasi Bencana Indonesia) BNPB** yang disimpan dalam file:
- File Tabular Mentah: `public/20260505_072732.json` (dan file Excel `.xlsx` yang bersangkutan).

### B. Kompilasi Data (`scripts/build_bencana.js`)
Karena data mentah DIBI sangat besar (40+ MB), skrip ini bertugas:
1. Mengelompokkan data berdasarkan kabupaten/kota.
2. Memilih maksimal 5 rekaman bencana per kabupaten untuk menjaga keseimbangan visual data.
3. Mencocokkan nama kabupaten/kota dengan pustaka koordinat internal (`COORDS`) menggunakan pencarian fuzzy.
4. Menghitung status bencana secara otomatis berdasarkan jarak waktu (mock date `2025-02-01`):
   - **Pra-bencana:** Sebelum kejadian
   - **Saat-bencana:** Kejadian dalam rentang 30 hari terakhir
   - **Pasca-bencana:** Kejadian lebih dari 30 hari yang lalu
5. Mengategorikan tingkat bahaya (level):
   - **Tinggi:** Korban jiwa $\ge 10$ atau pengungsi $\ge 10.000$
   - **Sedang:** Korban jiwa $\ge 3$ atau pengungsi $\ge 1.000$
   - **Rendah:** Lainnya
6. Memetakan jenis bencana ke dalam 8 kategori standar: `banjir`, `longsor`, `gempa`, `kebakaran`, `tsunami`, `erupsi`, `kekeringan`, `lainnya`.
7. Menghasilkan file output yang ringan: `src/data/bencana.json` (digunakan langsung oleh komponen peta dan analitik di dashboard).

---

## 4. Rincian Fitur Halaman & Rute

### A. Halaman Utama / Landing Page (`/`)
- **Hero Section:** Menampilkan visualisasi latar belakang 3D yang dibuat menggunakan Three.js (`HeroCanvas.tsx`). Partikel dan garis jaringan berputar dinamis mengikuti interaksi mouse.
- **Peta Interaktif:** Peta Leaflet sederhana menampilkan sebaran titik bencana yang dapat difilter berdasarkan jenis bencana.
- **Fase Kebencanaan:** Bagian informasi edukatif (Pra, Saat, Pasca) dengan ilustrasi SVG animasi interaktif.

### B. Executive Dashboard (`/dashboard`)
Dashboard eksekutif dirancang untuk simulasi ruang kendali menteri:
1. **Pencarian Autocomplete (`SearchDaerah.tsx`):**
   - Input pencarian dinamis untuk Provinsi atau Kabupaten/Kota di seluruh Indonesia.
   - Peta akan otomatis melakukan zoom (`flyTo`) dan memfilter grafik secara real-time ke daerah terpilih.
2. **Filter Wilayah Dropdown (`WilayahDropdown.tsx`):**
   - Pilihan hirarkis provinsi dan kota yang terintegrasi dengan data koordinat wilayah.
3. **Statistik Kunci (`StatCards.tsx`):**
   - Menampilkan total kejadian, estimasi kerugian (Rp Miliar), korban jiwa, dan rumah terdampak. Responsif terhadap filter wilayah aktif.
4. **Early Warning Ticker (`AlertTicker.tsx`):**
   - Berisi banner/ticker berjalan real-time untuk bencana besar (mocked/API). Bila diklik, peta akan langsung memfokuskan kamera ke titik koordinat bencana tersebut.
5. **Peta Utama Leaflet (`DashboardLeaflet.tsx`):**
   - **Basemap Switcher:** Satelit Esri, OpenStreetMap, RBI Indonesia (BIG), Topografi, Dark, dan Light.
   - **Layer ArcGIS Inarisk & BIG:** Pengguna dapat mengaktifkan overlay layer geospasial real-time, seperti Indeks Bahaya Banjir, Longsor, Gempa, Tsunami, Gunungapi, Kebakaran, Cuaca Ekstrim, hingga Penutup Lahan dari BIG.
   - **Drawing Tools:** Fitur menggambar interaktif (garis, poligon, persegi, lingkaran, penanda lokasi) langsung di atas peta untuk keperluan perencanaan evakuasi.
6. **Grafik Analitik (`ChartSection.tsx`):**
   - Grafik garis tren tahunan dengan Moving Average menggunakan Apache ECharts.
   - Grafik donat interaktif untuk visualisasi proporsi korban jiwa, kerusakan rumah (berat, sedang, ringan), dan kerugian ekonomi per kategori bencana.
7. **Model Analisis Lanjutan (`AnalysisModelsSection.tsx`):**
   - Panel terpisah yang membagi data ke dalam 3 model strategis:
     - **Model 4 (Pra, Saat, Pasca):** Alokasi kegiatan mitigasi dan monitoring status tanggap darurat.
     - **Model 6 (Indeks Kerentanan):** Visualisasi scoring kerentanan sosial, ekonomi, fisik, dan ekologi.
     - **Model 7 (Logistik & Respon):** Status distribusi logistik (makanan, tenda, obat-obatan) per wilayah terdampak.

### C. Manajemen Data (`/management`)
- Berisi direktori lengkap layanan WebGIS ArcGIS/Inarisk (MapServer & ImageServer) milik BNPB.
- Menampilkan data dalam bentuk datatable dengan fitur filter kategori (Geologi, Administrasi, Banjir, dll) serta tipe server.
- Menyediakan aksi cepat seperti menyalin URL endpoint, melihat format JSON layanan, dan pratinjau layer.

### D. Panel Admin & Autentikasi (`/admin`, `/login`)
- Pengamanan berbasis `sessionStorage` (`isAdmin`).
- Kredensial login bersifat hardcoded (tanpa database):
  - **Email:** `admin@admin.com`
  - **Password:** `admin123@`
- Menyediakan pintu masuk terpadu ke Dashboard eksekutif dan modul Manajemen Data.

---

## 5. Sistem Desain & Antarmuka (`src/app/globals.css`)

Sistem desain diimplementasikan menggunakan variabel CSS dalam `:root` untuk tema gelap (`dark`) dan terang (`light`), yang berganti melalui atribut `data-theme` pada tag `html`.

### A. Palet Warna Utama (Tema Gelap)
- **Background Utama:** `#061a24` (Biru dongker gelap/satelit)
- **Background Card & Navbar:** `rgba(0, 50, 73, 0.85)` dengan efek blur glassmorphism
- **Teks Utama:** `#ccdbdc` (Abu-abu terang)
- **Teks Aksen:** `#35a7ff` (Biru elektrik satelit)
- **Warna Peringatan Bencana:** `#ff7f11` (Oranye darurat)

### B. Palet Warna Utama (Tema Terang)
- **Background Utama:** `#f0f5f7`
- **Background Card & Navbar:** `rgba(255, 255, 255, 0.95)`
- **Teks Utama:** `#003249`
- **Teks Aksen:** `#38618c`

### C. Utility Styles
- `.glass`: Memberikan efek glassmorphism modern (`backdrop-filter: blur(12px)`).
- `.glow-blue` & `.glow-orange`: Memberikan bayangan cahaya (glow effect) neon pada tombol/card.
- `.text-gradient`: Gradasi warna teks dari biru elektrik ke abu terang.

---

## 6. Cara Menjalankan & Mengembangkan Proyek

### Kebutuhan Awal
Pastikan Node.js telah terinstal pada mesin pengembangan.

### Perintah Utama
```bash
# 1. Install dependensi
npm install

# 2. Jalankan server pengembangan lokal (http://localhost:3000)
npm run dev

# 3. Compile data DIBI mentah jika ada pembaruan excel
node scripts/build_bencana.js

# 4. Melakukan kompilasi produksi (production build)
npm run build

# 5. Menjalankan production server
npm run start
```

---

## 7. Catatan untuk Pengembangan Selanjutnya

1. **Pembaruan Data DIBI:**
   Jika ingin memperbarui data bencana nasional, ganti file `20260505_072732.json` di direktori `public/` dengan data JSON baru, kemudian jalankan kembali perintah `node scripts/build_bencana.js` untuk meregenerasi data ringkas.
2. **Koneksi Live API BMKG / BNPB:**
   Sekarang data BMKG di `AlertTicker.tsx` dikelola menggunakan data statis/mock. Pengembangan selanjutnya dapat menghubungkan secara langsung ke API BMKG (`https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json`) menggunakan `fetch`.
3. **Optimasi Layer ArcGIS:**
   Jika koneksi ArcGIS Server BNPB lambat, pastikan parameter filter spasial (`bbox`) dikonfigurasi dengan tepat di `DashboardLeaflet.tsx` agar memuat data dalam luasan viewport peta saja, bukan nasional.
