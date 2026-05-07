## Tahap 2: Management Data

- Terdapat button "Management Data" pada UI.
- Jika diklik, akan menampilkan daftar service dari https://gis.bnpb.go.id/server/rest/services/inarisk dalam bentuk tabel (datatable).
- Data awal dapat berupa list geojson hasil fetch dari service Inarisk.
- Tabel dapat menampilkan nama layer, tipe, endpoint, dan aksi (misal: download geojson, lihat detail).

## Tahap 3: Login & Backend Sederhana

- Terdapat button "Login" pada UI.
- Login menggunakan username dan password (hardcode, tanpa database):
   - Username: admin@admin.com
   - Password: admin123@
- Setelah login, user masuk ke halaman backend yang berisi menu:
   - Dashboard
   - Management Data

Catatan: Implementasi login hanya untuk akses backend, tidak ada database, hanya validasi di sisi aplikasi.
## Catatan Perubahan UI Navigasi & Akses

1. Navbar landing/utama:
   - Button paling kanan di navbar diganti dari "Satudata Bencana" menjadi "Dashboard" (menuju /dashboard).

2. Dashboard (halaman utama /dashboard):
   - Button "Keluar" diganti menjadi button group:
     - Management Data
     - Login
     - Kembali (menuju landing page /)

Catatan: Perubahan ini masih dalam tahap diskusi, belum dieksekusi di kode.
# Konsep Model Analisis Kebencanaan

## Sumber Data Utama

- Seluruh analisis dan visualisasi pada dashboard ini menggunakan data tabular hasil konversi dari DIBI BNPB: **public/20260505_072732.json**
- File ini merupakan hasil konversi dari data xlsx tabular terbaru, sehingga seluruh indikator, tren, dan statistik akan selalu sinkron dengan data DIBI.
- Struktur data sudah mencakup: waktu, lokasi, jenis bencana, korban, pengungsi, rumah terdampak, fasilitas rusak, dsb.

---

## Daftar Model Analisis Bencana

1. **Analisis Tren Kejadian Bencana**
   - Melihat pola dan tren kejadian bencana dari waktu ke waktu (tahunan/bulanan)
   - Visualisasi: Bar chart, line chart
   - Data: Jumlah kejadian, lokasi, waktu

2. **Analisis Sebaran Spasial**
   - Pemetaan lokasi bencana untuk mengidentifikasi daerah rawan
   - Visualisasi: Peta sebaran, heatmap
   - Data: Titik kejadian, intensitas, wilayah administratif

3. **Analisis Dampak (Kerugian & Korban)**
   - Estimasi kerugian ekonomi, jumlah korban jiwa, rumah terdampak
   - Visualisasi: Card summary, pie chart, tabel
   - Data: Kerugian, korban, pengungsi, rumah rusak

4. **Analisis Fase Bencana (Pra, Saat, Pasca)**
   - Fokus pada fase: Pra-bencana (kesiapsiagaan), Saat bencana (respon), Pasca-bencana (pemulihan)
   - Visualisasi: Tab/fokus filter, peta, chart
   - Data: Status kejadian, aktivitas mitigasi, bantuan

5. **Analisis Jenis Bencana**
   - Perbandingan antar jenis bencana (banjir, gempa, longsor, dsb)
   - Visualisasi: Pie chart, bar chart
   - Data: Jenis, jumlah kejadian, korban, kerugian

6. **Analisis Kerentanan & Kapasitas**
   - Mengukur tingkat kerentanan wilayah dan kapasitas penanganan
   - Visualisasi: Layer peta, scoring
   - Data: Indeks kerentanan, data sosial-ekonomi, infrastruktur

7. **Analisis Respon & Bantuan**
   - Melacak distribusi bantuan, kecepatan respon, dan kebutuhan
   - Visualisasi: Timeline, tabel, peta
   - Data: Bantuan, waktu respon, kebutuhan

---

## Konsep Integrasi Model Analisis

- **Pilih Model Analisis Bencana**: Komponen UI berupa dropdown/selector di samping pencarian, label bisa: "Pilih Analisis Bencana" atau "Fokus Analisis".
- **Sinkronisasi Komponen**: Ketika model dipilih, seluruh komponen (peta, chart, card, filter) menyesuaikan data dan visualisasi sesuai model.
- **Contoh**: Jika memilih "Analisis Dampak", peta menampilkan layer dampak, chart fokus ke korban & kerugian, filter otomatis ke status pasca-bencana.
- **Pengembangan Lanjut**: Model dapat dikembangkan modular, user dapat menambah/atur model analisis sesuai kebutuhan.

---

## Saran Label UI
- "Pilih Analisis Bencana"
- "Fokus Analisis"
- "Model Analisis"
- "Mode Analisis"

---

> **Catatan:**
> Model analisis ini dapat dikembangkan dinamis, sehingga setiap model bisa mengatur komponen dashboard secara otomatis dan konsisten.
