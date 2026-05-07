# Konsep Aplikasi: DataBencana — Landing Page & Dashboard

> Dokumen ini adalah ruang diskusi dan perencanaan konsep sebelum masuk ke implementasi.

---

## Ringkasan Proyek

**Nama Proyek:** DataBencana (Management Data Bencana)
**Stack Utama:** Next.js (App Router) + Vercel
**Tahap Saat Ini:** Tahap 1 — Landing Page

---

## Tahap 1: Landing Page

### Teknologi yang Digunakan

| Teknologi | Peran |
|---|---|
| Next.js 14 (App Router) | Framework utama, SSR/SSG |
| Three.js + React Three Fiber | Partikel animasi di Hero (Opsi A — ringan) |
| Deck.gl | Peta interaktif Indonesia + layer geospasial (WebGL) |
| Framer Motion | Animasi scroll, transisi section |
| GSAP + ScrollTrigger | Trigger zoom peta saat scroll |
| Tailwind CSS | Styling, border-radius, warna, mobile-first responsive |
| Vercel | Deployment |

---

## Desain & Tema

### Identitas Visual
- **Tema:** Teknologi + Data Geospasial Kebencanaan
- **Palet Warna (usulan):**
  - Biru tua `#0A1628` — background utama (kesan teknologi, malam, satelit)
  - Biru elektrik `#0EA5E9` — aksen utama
  - Oranye `#F97316` — peringatan/highlight bencana
  - Hijau `#22C55E` — aman / pra-bencana
  - Merah `#EF4444` — darurat / saat-bencana
  - Abu terang `#CBD5E1` — teks sekunder
- **Shape Language:** `border-radius` konsisten (rounded-2xl, rounded-full) agar tidak kaku dan modern
- **Nuansa:** Glassmorphism ringan pada card, glow effect pada elemen interaktif

---

## Struktur Section Landing Page

```
┌─────────────────────────────────────────┐
│  SECTION 1 — HERO                       │
│  Three.js background                    │
│  Tagline + CTA                          │
├─────────────────────────────────────────┤
│  SECTION 2 — PETA INDONESIA INTERAKTIF  │
│  Scroll → zoom ke Sumatera              │
│  Layer: Aceh, Sumut, Sumbar             │
│  Geotagging batas wilayah bencana       │
├─────────────────────────────────────────┤
│  SECTION 3 — ANALISIS DASHBOARD         │
│  Pra-bencana / Saat-bencana / Pasca     │
│  Ilustrasi animasi tiap fase            │
│  CTA Button → Dashboard                 │
├─────────────────────────────────────────┤
│  SECTION 4 — FOOTER                     │
│  Info, hyperlink, mitra/organisasi      │
└─────────────────────────────────────────┘
```

---

## Detail Per Section

---

### SECTION 1 — Hero

**Tujuan:** Kesan pertama yang kuat, teknologi, kebencanaan nasional.

**Konten:**
- Background: Three.js scene — partikel bergerak membentuk peta / jaringan data, atau globe 3D berputar halus
- Headline besar: misal *"Sistem Analisis Data Bencana Nasional"*
- Sub-headline: deskripsi singkat platform
- CTA Button: `Lihat Dashboard →` dan `Pelajari Lebih Lanjut ↓`
- Navbar di atas: logo + navigasi section

**Catatan Three.js:**
- Bisa gunakan `@react-three/fiber` + `@react-three/drei`
- Alternatif: partikel berbasis `three.js` yang merespons mouse movement
- Gambar ilustrasi bisa dari unDraw, Storyset, atau custom SVG bertema bencana/teknologi

---

### SECTION 2 — Peta Indonesia Interaktif

**Tujuan:** Menampilkan konteks geografis bencana di Indonesia, khususnya Sumatera.

**Alur Interaksi:**
1. User scroll → peta Indonesia muncul (full viewport)
2. GSAP ScrollTrigger mendeteksi posisi scroll
3. Kamera peta zoom-in ke wilayah Sumatera (animasi smooth)
4. Layer muncul secara bertahap: Aceh → Sumatera Utara → Sumatera Barat
5. Setiap layer menampilkan:
   - Batas wilayah administratif (GeoJSON)
   - Geotagging titik kejadian bencana
   - Heatmap atau polygon area terdampak
   - Tooltip/popup info singkat saat hover

**Teknologi Peta:**
- **Mapbox GL JS** (via `react-map-gl`) — paling kaya fitur untuk layer geospasial
- Atau **Leaflet.js** (lebih ringan, cocok jika data GeoJSON lokal)
- Atau **Deck.gl** — untuk visualisasi data besar dengan WebGL

**Data:**
- GeoJSON batas wilayah Indonesia: tersedia open source dari BIG (Badan Informasi Geospasial)
- Data titik bencana: bisa dari BNPB Open Data atau di-hardcode untuk demo
- Contoh bencana yang disorot: banjir Sumatera Barat (terkini)

**Visual Layer yang Bisa Ditampilkan:**
```
Layer 1: Batas provinsi (polygon outline)
Layer 2: Titik kejadian bencana (icon marker)
Layer 3: Zona risiko (heatmap / choropleth)
Layer 4: Jalur evakuasi atau sungai (LineString)
```

---

### SECTION 3 — Penjelasan Dashboard (Analisis Kebencanaan)

**Tujuan:** Edukasi pengguna tentang bagaimana platform menganalisis data per fase bencana.

**Tiga Fase:**

| Fase | Warna | Fokus Analisis |
|---|---|---|
| Pra-Bencana | Hijau `#22C55E` | Mitigasi, pemetaan risiko, early warning |
| Saat Bencana | Oranye `#F97316` | Distribusi bantuan, evakuasi, tracking |
| Pasca Bencana | Biru `#0EA5E9` | Pemulihan, analisis kerugian, rekonstruksi |

**Animasi per Fase:**
- Masing-masing fase memiliki card/panel dengan ilustrasi animasi (Lottie JSON atau SVG animasi Framer Motion)
- Scroll-triggered: card muncul satu per satu dari kiri/kanan
- Ilustrasi bisa dari LottieFiles (free) bertema disaster, map, data chart

**CTA:**
- Button besar `Buka Dashboard →` di tengah setelah ketiga fase
- Desain: gradient warna, rounded-full, efek hover glow

---

### SECTION 4 — Footer

**Konten:**
- Logo + deskripsi singkat
- Navigasi cepat (link ke section)
- Organisasi/Mitra yang terlibat (logo grid): BNPB, BPBD, BMKG, BIG, dll
- Hyperlink: Dokumentasi, API, GitHub (opsional), Kontak
- Copyright & versi

---

## Pertanyaan Diskusi & Keputusan yang Perlu Dibuat

### A. Tentang Peta
> **Q1:** Pilih Mapbox atau Leaflet?
- ✅ **KEPUTUSAN: Deck.gl (WebGL)** — cocok untuk data besar, performa tinggi, layer geospasial kaya

> **Q2:** Data bencana — hardcoded untuk demo atau koneksi ke API/database nyata di tahap 1?
- ✅ **KEPUTUSAN:** Hardcoded JSON untuk tahap 1, sambungkan ke API di tahap dashboard

> **Q3:** Animasi zoom peta — dipicu oleh GSAP ScrollTrigger → `deck.gl` viewState update (flyTo)

### B. Tentang Three.js
> **Q4:** Seberapa kompleks Three.js di hero?
- ✅ **KEPUTUSAN: Opsi A** — Partikel bergerak (PointCloud) + warna gradient → performa ringan, mobile-friendly

> **Q5:** Three.js hanya di hero — section lain pakai Framer Motion + CSS

### C. Tentang Performa & Responsif
> **Q6:** Target device
- ✅ **KEPUTUSAN:** Mobile-first dari awal — responsive di semua breakpoint
- Three.js: cap `devicePixelRatio` agar tidak berat di mobile
- Deck.gl: simplified view atau static map fallback di layar kecil jika perlu

---

## Struktur Folder Proyek (Rencana Awal)

```
managementdatabencana/
├── app/
│   ├── page.tsx              ← Landing page
│   ├── dashboard/
│   │   └── page.tsx          ← Dashboard (tahap 2)
│   └── layout.tsx
├── components/
│   ├── landing/
│   │   ├── HeroSection.tsx
│   │   ├── MapSection.tsx
│   │   ├── AnalysisSection.tsx
│   │   └── FooterSection.tsx
│   ├── three/
│   │   └── HeroCanvas.tsx    ← Three.js scene
│   └── ui/
│       └── Button.tsx
├── data/
│   └── bencana.json          ← Data demo hardcoded
├── public/
│   └── geojson/
│       ├── indonesia.geojson
│       ├── aceh.geojson
│       ├── sumatera-utara.geojson
│       └── sumatera-barat.geojson
└── ...config files
```

---

## Roadmap Pengerjaan Tahap 1

```
[ ] Setup project Next.js 14 + Tailwind + ESLint
[ ] Setup deployment Vercel (connect repo)
[ ] Section 1: Hero + Three.js canvas
[ ] Section 2: Peta Indonesia + scroll zoom
[ ] Section 2: Layer Aceh, Sumut, Sumbar + GeoJSON
[ ] Section 3: Kartu fase bencana + animasi
[ ] Section 3: CTA Button Dashboard
[ ] Section 4: Footer + logo mitra
[ ] Responsif mobile
[ ] Optimasi performa (lazy load, code split)
[ ] Deploy & review
```

---

## Catatan Tambahan

- Nama domain sementara bisa: `databencana.vercel.app`
- Bahasa antarmuka: **Indonesia** (dengan kemungkinan toggle Inggris di versi berikutnya)
- Aksesibilitas: pertimbangkan warna kontras untuk data peta
- Sumber ilustrasi gratis: [unDraw](https://undraw.co), [Storyset](https://storyset.com), [LottieFiles](https://lottiefiles.com)
- GeoJSON Indonesia open source: [github.com/eppofahmi/geojson-indonesia](https://github.com/eppofahmi/geojson-indonesia)

---

*Dokumen ini akan diperbarui seiring perkembangan diskusi dan implementasi.*
