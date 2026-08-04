# 📚 Dokumentasi Metodologi & Rumus Penghitungan Analisis Kebencanaan (Dashboard K5)

Dokumen ini menyajikan penjelasan komprehensif mengenai **sumber data**, **metode/standar acuan**, **rumus penghitungan matematis**, serta **rasio estimasi demografi** yang digunakan dalam 5 Modul Analisis Kebencanaan Cepat pada **Dashboard K5 (Antigravity Disaster Analytics)**.

---

## 💡 Penjelasan 5 Parameter Input Utama pada Analisis Logistik

### ❓ Pertanyaan:
> *Bagaimana penjelasan mengenai variabel **Durasi Tanggap (Hari)**, **Ibu Hamil (%)**, **Ibu Menyusui (%)**, **Lansia (%)**, dan **Balita (%)**? Dari mana angkanya diperoleh, kenapa bisa muncul persentase tersebut, dan bagaimana rumus kalkulasinya?*

### 💡 Penjelasan Ilmiah, Sumber Data, & Metodologi:

#### 1. ⏱️ Durasi Tanggap (Hari) — *Default: 7 Hari*
* **Sumber & Acuan**: **UU No. 24 Tahun 2007 tentang Penanggulangan Bencana** & **Perka BNPB No. 10 Tahun 2012**.
* **Alasan & Metodologi**:
  Status Tanggap Darurat Bencana pertama kali ditetapkan oleh Kepala Daerah / BNPB untuk masa awal **7 Hari** (Fase *Emergency Relief* Pertama). Angka durasi ini menjadi perkalian linier untuk menghitung pemenuhan konsumsi beras, air minum harian, kebutuhan kantong sampah, serta perlengkapan higiene personal yang terkonsumsi habis harian.
* **Kalkulasi**: 
  $$\text{Total Kebutuhan Beras} = \text{Populasi} \times 0.25\,\text{kg/jiwa/hari} \times \text{Durasi Tanggap (Hari)}$$

---

#### 2. 👶 Balita (%) — *Dinamis Real-Time dari Peta (Default 10%)*
* **Sumber Data**: **Data Spasial Hexbin DTSEN BAPPENAS & Sensus BPS**.
* **Alasan & Metodologi**:
  * **Saat Peta Digambar (Live Auto Sync)**: Sistem membaca langsung field `totalBalita` dari hasil *spatial intersection* polygon peta terhadap data Hexbin DTSEN BAPPENAS. Persentasenya dihitung secara persis:
    $$\% \text{Balita} = \left( \frac{\text{totalBalita}}{\text{totalPopulasi}} \right) \times 100\%$$
  * **Saat Tanpa Polygon Peta (Default)**: Jika pengguna tidak menggambar polygon di peta, digunakan angka acuan demografi nasional BPS yaitu **10% dari total populasi**.
* **Penggunaan Logistik**: Menentukan jumlah popok balita ($4 \text{ pcs/balita/hari}$), kebutuhan makanan pendamping ASI (MP-ASI), serta kebutuhan *School-in-a-Box* PAUD.

---

#### 3. 👴 Lansia (%) — *Dinamis Real-Time dari Peta (Default 8%)*
* **Sumber Data**: **Data Spasial Hexbin DTSEN BAPPENAS & Sensus BPS**.
* **Alasan & Metodologi**:
  * **Saat Peta Digambar (Live Auto Sync)**: Sistem membaca langsung field `totalLansia` (populasi usia $\ge 60$ tahun) hasil irisan polygon peta BAPPENAS:
    $$\% \text{Lansia} = \left( \frac{\text{totalLansia}}{\text{totalPopulasi}} \right) \times 100\%$$
  * **Saat Tanpa Polygon Peta (Default)**: Menggunakan standar persentase lansia nasional Indonesia menurut BPS yaitu **8% dari total populasi**.
* **Penggunaan Logistik**: Menentukan tim pelayanan medis khusus geriatri, popok dewasa, serta tensimeter & pemantau gula darah lansia.

---

#### 4. 🤱 Ibu Hamil (%) — *Rasio Standar Kesehatan PPAM (3%)*
* **Sumber Data**: **Standar Paket Pelayanan Awal Minimum (PPAM) Kesehatan Reproduksi Bencana (Kemenkes RI & UNFPA)**.
* **Alasan & Metodologi**:
  Data spasial kependudukan BAPPENAS/BIG *tidak mencatat status kehamilan wanita*. Oleh karena itu, sesuai standar kesehatan reproduksi darurat bencana WHO/UNFPA dan Kemenkes RI, digunakan **Crude Birth Rate (CBR) & Angka Prevalensi Kehamilan Nasional** sebesar **3% dari total populasi**:
  $$\text{Jumlah Ibu Hamil} = \text{Round}\left( \text{Populasi} \times 3\% \right)$$
* **Penggunaan Logistik**: Kebutuhan *Maternity Kit*, biskuit makanan tambahan ibu hamil (PMT), serta bidan pendamping posko.

---

#### 5. 🍼 Ibu Menyusui (%) — *Rasio Standar Kesehatan PPAM (4%)*
* **Sumber Data**: **Standar Paket Pelayanan Awal Minimum (PPAM) Kesehatan Reproduksi Bencana (Kemenkes RI & UNFPA)**.
* **Alasan & Metodologi**:
  Variabel ini *tidak tersedia di data sensus kependudukan statis*. Mengacu pada standar PPAM Kemenkes RI, ibu menyusui dihitung dari estimasi jumlah ibu yang memiliki bayi usia 0–24 bulan (ASI Eksklusif & Pendamping) yang bernilai rata-rata **4% dari total populasi**:
  $$\text{Jumlah Ibu Menyusui} = \text{Round}\left( \text{Populasi} \times 4\% \right)$$
* **Penggunaan Logistik**: Penyediaan ruang menyusui (*Laktasi Kit*), suplemen gizi ibu menyusui, serta tempat penyimpanan ASI perah di lokasi pengungsian.

---

## 🏥 1. Analisis Estimasi Kebutuhan Medis & Faskes Darurat (*Emergency Medical Impact*)

### 📌 A. Sumber Data & Input
* **Data Spasial Input**: Polygon area terdampak (BAPPENAS DTSEN & BIG).
* **Variabel Input Utama**: Total Populasi ($P$), Estimasi Korban Luka ($\%L$, default $5\%$).

### 📜 B. Acuan Standar & Metode
* **Standar WHO / Sphere Project**: *Minimum Standards in Health Action*.
* **Permenkes RI No. 75 Tahun 2019**: Standar Pelayanan Kesehatan Masa Tanggap Darurat Bencana.
* **PPAM Kesehatan Reproduksi Bencana**: Kemenkes RI & UNFPA.

### 📐 C. Rumus Penghitungan & Formulasi

#### 1. Klasifikasi Korban Luka & Rentan:
* $\text{Total Korban Luka} = P \times \%L$
* $\text{Luka Berat (Rawat Inap/Rujukan)} = \text{Total Korban Luka} \times 30\%$
* $\text{Luka Ringan (Rawat Jalan)} = \text{Total Korban Luka} \times 70\%$

#### 2. Kebutuhan Tenaga Kesehatan (SDM Medis):
* $\text{Dokter Umum} = \left\lceil \frac{P}{1.000} \right\rceil$ *(1 Dokter per 1.000 jiwa)*
* $\text{Dokter Spesialis Anak} = \left\lceil \frac{\text{Balita}}{500} \right\rceil$ *(1 Dokter Anak per 500 Balita)*
* $\text{Perawat Medis} = \left\lceil \frac{P}{200} \right\rceil$ *(1 Perawat per 200 jiwa)*
* $\text{Bidan Desa/Posko} = \left\lceil \frac{P}{500} \right\rceil$ *(1 Bidan per 500 jiwa)*
* $\text{Tim Konselor Psikososial (PFA)} = \left\lceil \frac{\text{Balita} + \text{Lansia} + \text{Disabilitas}}{10} \right\rceil$

#### 3. Kebutuhan Obat Esensial & BMHP:
* $\text{Interagency Emergency Health Kit (IEHK 1000)} = \left\lceil \frac{P}{1.000} \right\rceil$ *(1 Kit per 1.000 jiwa / 3 bulan)*
* $\text{Cairan Infus (Kolf)} = (\text{Luka Berat} \times 4) + (\text{Luka Ringan} \times 1)$
* $\text{Serum Tetanus (ATS/TT)} = \text{Luka Berat}$
* $\text{Kit Resusitasi & Oksigen} = \left\lceil \frac{P}{2.000} \right\rceil$

#### 4. Kebutuhan Fasilitas & Posko Medis Field:
* $\text{Ambulans Emergency Gawat Darurat} = \max\left(1, \left\lceil \frac{\text{Total Korban Luka}}{25} \right\rceil\right)$
* $\text{Posko Kesehatan Tenda Field} = \left\lceil \frac{P}{2.000} \right\rceil$
* $\text{Tempat Tidur Medis (Velbed Medical)} = \left\lceil \text{Total Korban Luka} \times 0.5 \right\rceil$

---

## 🏫 2. Analisis Dampak Fasilitas Umum & Infrastruktur Kritis

### 📌 A. Sumber Data & Input
* **Data Spasial Input**: Data Pendidikan Dapodik BAPPENAS (SD, SMP, SMA, SLB, SPK) & Peta Dasar BIG.
* **Variabel Input Utama**: Total Populasi ($P$), Estimasi Kerusakan Infrastruktur ($\%K$, default $15\%$).

### 📜 B. Acuan Standar & Metode
* **Standar UNICEF & Kemendikbudristek**: *School-in-a-Box & Emergency Education Standard*.
* **Perka BNPB No. 07 Tahun 2008**: Pedoman Penyediaan Sarana & Prasarana Pengungsian.

### 📐 C. Rumus Penghitungan & Formulasi

#### 1. Estimasi Demografi Siswa Terdampak:
* $\text{Siswa PAUD/Balita} = \text{Balita}$ ($10\% \times P$)
* $\text{Siswa SD} = 14\% \times P$
* $\text{Siswa SMP} = 7\% \times P$
* $\text{Siswa SMA} = 6\% \times P$
* $\text{Total Siswa} = \text{PAUD} + \text{SD} + \text{SMP} + \text{SMA}$

#### 2. Kebutuhan Pembelajaran Darurat (*Emergency Education*):
* $\text{Tenda Kelas Darurat} = \left\lceil \frac{\text{Total Siswa}}{60} \right\rceil$ *(Kap. 60 siswa per tenda 2 shift)*
* $\text{Paket School-in-a-Box (UNICEF)} = \left\lceil \frac{\text{Total Siswa}}{40} \right\rceil$ *(1 Box per 40 siswa)*
* $\text{Paket Recreation & Psychosocial Kit} = \left\lceil \frac{\text{Total Siswa}}{80} \right\rceil$
* $\text{Guru Pendamping Darurat} = \left\lceil \frac{\text{Total Siswa}}{30} \right\rceil$

#### 3. Pemetaan Fasum Evakuasi Sekunder & Sanitasi:
* $\text{Gedung Evakuasi (Balai Desa/GOR)} = \left\lceil \frac{\text{Total KK}}{50} \right\rceil$ *(1 Gedung per 50 KK)*
* $\text{Bangunan Rumah Ibadah Evakuasi} = \left\lceil \frac{\text{Total KK}}{30} \right\rceil$
* $\text{Toilet / MCK Portable Mobile} = \left\lceil \frac{P}{50} \right\rceil$ *(1 Bilik MCK per 50 jiwa)*

---

## 🌾 3. Analisis Kerugian Ekonomi & Lahan Produktif

### 📌 A. Sumber Data & Input
* **Data Spasial Input**: Penutup Lahan Produktif BIG & BAPPENAS Hexbin.
* **Variabel Input Utama**: Total Populasi ($P$), Estimasi Luas Area Terdampak ($A_{\text{ha}}$), $\% Lahan Pertanian$.

### 📜 B. Acuan Standar & Metode
* **Standar DINA (Damage and Needs Assessment) BNPB & Bappenas**: Pedoman Penilaian Kerusakan & Kerugian Pasca Bencana.
* **Standar Kementerian Pertanian RI**: Nilai Indikatif Produktivitas Padi/Hektar.
* **Standar Bantuan Stimulan Rumah Rusak BNPB**: Perka BNPB No. 4 Tahun 2020 (RB: Rp 50 Jt, RS: Rp 25 Jt, RR: Rp 10 Jt).

### 📐 C. Rumus Penghitungan & Formulasi

#### 1. Kerugian Sektor Pertanian & Pangan:
* $\text{Luas Lahan Pertanian (Ha)} = A_{\text{ha}} \times \%Lahan$
* $\text{Kerugian Hasil Panen Padi (Rp)} = \text{Luas Lahan (Ha)} \times 5\,\text{Ton/Ha} \times \text{Rp } 6.500/\text{kg} \times 1.000$
* $\text{Kerugian Bibit & Pupuk Rusak (Rp)} = \text{Luas Lahan (Ha)} \times \text{Rp } 4.500.000/\text{Ha}$
* $\text{Kelompok Tani Terdampak} = \left\lceil \frac{\text{Luas Lahan (Ha)}}{15} \right\rceil$

#### 2. Kerugian Pemukiman & Aset Rumah Warga:
* $\text{Rumah Rusak Berat (RB)} = \text{Total KK} \times 15\%$
* $\text{Rumah Rusak Sedang (RS)} = \text{Total KK} \times 25\%$
* $\text{Rumah Rusak Ringan (RR)} = \text{Total KK} \times 35\%$
* $\text{Kerugian Rumah (Rp)} = (\text{RB} \times 50.000.000) + (\text{RS} \times 25.000.000) + (\text{RR} \times 10.000.000)$

#### 3. Kerugian Sektor Usaha Mikro / UMKM:
* $\text{UMKM Terdampak} = \left\lceil \text{Total KK} \times 20\% \right\rceil$
* $\text{Kerugian Aset Usaha (Rp)} = \text{UMKM Terdampak} \times \text{Rp } 7.500.000$
* $\mathbf{\text{Total Kerugian Ekonomi Makro}} = \text{Kerugian Padi} + \text{Kerugian Bibit} + \text{Kerugian Rumah} + \text{Kerugian UMKM}$

---

## ⚡ 4. Analisis Kebutuhan Energi, Utilitas, & Telekomunikasi

### 📌 A. Sumber Data & Input
* **Data Spasial Input**: Data Terintegrasi Polygon Peta.
* **Variabel Input Utama**: Total Populasi ($P$), Estimasi Durasi Pemadaman / Blackout ($D_{\text{hari}}$).

### 📜 B. Acuan Standar & Metode
* **Standar ESDM & PLN Tanggap Darurat**: Daya Penerangan Lapangan & Sarana Fasum.
* **Standar Klaster Telekomunikasi Bencana (Kemenkominfo & ORARI/RAPI)**.

### 📐 C. Rumus Penghitungan & Formulasi

#### 1. Daya Listrik Genset & Bahan Bakar Solar:
* $\text{Kebutuhan Genset (KVA)} = \left\lceil \frac{P}{400} \right\rceil \times 20\,\text{KVA}$ *(20 KVA per 400 jiwa)*
* $\text{Konsumsi Solar Harian (Liter)} = \text{Total KVA} \times 4\,\text{Liter/KVA/24jam}$
* $\text{Total Kebutuhan Solar (Liter)} = \text{Konsumsi Harian} \times D_{\text{hari}}$

#### 2. Peralatan Penerangan & Utilitas Lapangan:
* $\text{Lampu Sorot Tower (Floodlight)} = \left\lceil \frac{P}{500} \right\rceil \times 2\,\text{Unit}$
* $\text{Kabel Roll Listrik Heavy Duty} = \left\lceil \frac{P}{200} \right\rceil \times 3\,\text{Roll}$
* $\text{Stasiun Charging Daya Mobile} = \left\lceil \frac{P}{300} \right\rceil$

#### 3. Peralatan Radio & Internet Darurat:
* $\text{Radio Handy Talky (HT)} = \max\left(4, \left\lceil \frac{P}{250} \right\rceil\right)$
* $\text{Radio RIG Base Station (VHF/UHF)} = \max\left(1, \left\lceil \frac{P}{2.000} \right\rceil\right)$
* $\text{V-SAT Internet Portable Mobile} = \max\left(1, \left\lceil \frac{P}{1.500} \right\rceil\right)$

---

## 🚚 5. Analisis Aksesibilitas & Rute Evakuasi / Logistik

### 📌 A. Sumber Data & Input
* **Data Spasial Input**: Jaringan Jalan & BBOX Geospasial.
* **Variabel Input Utama**: Total Populasi ($P$), Jarak ke Gudang Logistik / Posko Utama ($K_{\text{km}}$).

### 📜 B. Acuan Standar & Metode
* **Standar Manajemen Logistik BNPB**: *Penyaluran & Transportasi Bantuan Logistik*.
* **Standar Basarnas & TNI/POLRI**: *Search & Rescue Access Route Clearing*.

### 📐 C. Rumus Penghitungan & Formulasi

#### 1. Armada Transportasi & Logistik:
* $\text{Truk Logistik 6 Roda (Kapasitas 6 Ton)} = \left\lceil \frac{P}{1.000} \right\rceil$ *(1 Truk per 1.000 jiwa)*
* $\text{Mobil Operasional 4x4 Double Cabin} = \max\left(2, \left\lceil \frac{P}{1.500} \right\rceil\right)$
* $\text{Motor Trail Evakuasi Medis} = \max\left(4, \left\lceil \frac{P}{500} \right\rceil\right)$

#### 2. Alat Berat Pembersih Jalur (*Route Clearing*):
* $\text{Excavator Heavy Duty} = \max\left(1, \left\lceil \frac{P}{2.500} \right\rceil\right)$
* $\text{Wheel Loader / Bulldozer} = \max\left(1, \left\lceil \frac{P}{3.500} \right\rceil\right)$
* $\text{Dump Truk Puing} = \text{Excavator} \times 2$

#### 3. Waktu Tempuh & Konsumsi BBM Distribusi:
* $\text{Kategori Akses} = \begin{cases} \text{Jalur Terisolasi}, & \text{jika } K_{\text{km}} > 50 \\ \text{Jalur Terjangkau}, & \text{jika } K_{\text{km}} \le 50 \end{cases}$
* $\text{BBM Solar Truk per Trip (Liter)} = \text{Round}\left(\frac{K_{\text{km}}}{4}\right) \times \text{Jumlah Truk}$ *(Konsumsi rata-rata 1 Liter / 4 Km)*
