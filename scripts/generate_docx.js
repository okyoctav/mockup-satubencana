const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Helper to build Word XML Paragraph
 */
function p(text, options = {}) {
  const { style, bold, italic, color, size, align, spaceBefore, spaceAfter } = options;
  let pPr = '<w:pPr>';
  if (style) pPr += `<w:pStyle w:val="${style}"/>`;
  if (align) pPr += `<w:jc w:val="${align}"/>`;
  if (spaceBefore !== undefined || spaceAfter !== undefined) {
    pPr += `<w:spacing w:before="${spaceBefore || 0}" w:after="${spaceAfter || 120}"/>`;
  }
  pPr += '</w:pPr>';

  let rPr = '<w:rPr>';
  if (bold) rPr += '<w:b/>';
  if (italic) rPr += '<w:i/>';
  if (color) rPr += `<w:color w:val="${color}"/>`;
  if (size) rPr += `<w:sz w:val="${size}"/>`;
  rPr += '</w:rPr>';

  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

/**
 * Helper to build Heading 1
 */
function h1(text) {
  return p(text, { style: 'Heading1', bold: true, color: '0B3C5D', size: 30, spaceBefore: 300, spaceAfter: 140 });
}

/**
 * Helper to build Heading 2
 */
function h2(text) {
  return p(text, { style: 'Heading2', bold: true, color: '1F8080', size: 24, spaceBefore: 200, spaceAfter: 100 });
}

/**
 * Helper to build Heading 3
 */
function h3(text) {
  return p(text, { style: 'Heading3', bold: true, color: '333333', size: 22, spaceBefore: 140, spaceAfter: 60 });
}

/**
 * Helper to build Callout Box (single cell shaded table)
 */
function callout(title, text) {
  return `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>
        <w:top w:val="none"/>
        <w:left w:val="single" w:sz="24" w:space="0" w:color="1F8080"/>
        <w:bottom w:val="none"/>
        <w:right w:val="none"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="120" w:type="dxa"/>
        <w:left w:w="200" w:type="dxa"/>
        <w:bottom w:w="120" w:type="dxa"/>
        <w:right w:w="200" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tr>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="5000" w:type="pct"/>
          <w:shd w:val="clear" w:color="auto" w:fill="F0F9F9"/>
        </w:tcPr>
        ${p(title, { bold: true, color: '1F8080', size: 22, spaceAfter: 60 })}
        ${p(text, { italic: true, color: '222222', size: 20, spaceAfter: 60 })}
      </w:tc>
    </w:tr>
  </w:tbl>
  <w:p><w:pPr><w:spacing w:after="140"/></w:pPr></w:p>`;
}

/**
 * Helper to build Formula Box
 */
function formulaBox(formulaName, formulaText, description) {
  return `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>
        <w:left w:val="single" w:sz="18" w:space="0" w:color="0B3C5D"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="140" w:type="dxa"/>
        <w:left w:w="200" w:type="dxa"/>
        <w:bottom w:w="140" w:type="dxa"/>
        <w:right w:w="200" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tr>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="5000" w:type="pct"/>
          <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
        </w:tcPr>
        ${p(`📐 FORMULA: ${formulaName}`, { bold: true, color: '0B3C5D', size: 20, spaceAfter: 60 })}
        ${p(formulaText, { bold: true, color: '0F172A', size: 24, align: 'center', spaceBefore: 60, spaceAfter: 80 })}
        ${description ? p(description, { italic: true, color: '475569', size: 18, spaceAfter: 40 }) : ''}
      </w:tc>
    </w:tr>
  </w:tbl>
  <w:p><w:pPr><w:spacing w:after="140"/></w:pPr></w:p>`;
}

/**
 * Helper to build Table
 */
function table(headers, rows) {
  let xml = `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="120" w:type="dxa"/>
        <w:left w:w="140" w:type="dxa"/>
        <w:bottom w:w="120" w:type="dxa"/>
        <w:right w:w="140" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>`;

  // Header Row
  xml += '<w:tr>';
  headers.forEach(h => {
    xml += `
    <w:tc>
      <w:tcPr>
        <w:shd w:val="clear" w:color="auto" w:fill="0B3C5D"/>
      </w:tcPr>
      ${p(h, { bold: true, color: 'FFFFFF', size: 19, align: 'center', spaceBefore: 40, spaceAfter: 40 })}
    </w:tc>`;
  });
  xml += '</w:tr>';

  // Data Rows
  rows.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
    xml += '<w:tr>';
    row.forEach((cell, cellIdx) => {
      const align = cellIdx === 0 ? 'center' : 'left';
      xml += `
      <w:tc>
        <w:tcPr>
          <w:shd w:val="clear" w:color="auto" w:fill="${bgColor}"/>
        </w:tcPr>
        ${p(cell, { size: 19, align, color: '1E293B', spaceBefore: 30, spaceAfter: 30 })}
      </w:tc>`;
    });
    xml += '</w:tr>';
  });

  xml += '</w:tbl><w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>';
  return xml;
}

function generateDocxXml() {
  let doc = '';

  // HEADER / COVER TITLE
  doc += p('DOKUMEN METODOLOGI & KERANGKA TEKNIS', { align: 'center', bold: true, color: '1F8080', size: 24, spaceBefore: 400, spaceAfter: 80 });
  doc += p('SIMULASI PEMODELAN GENANGAN BENCANA', { align: 'center', bold: true, color: '0B3C5D', size: 36, spaceBefore: 60, spaceAfter: 60 });
  doc += p('(FASTFLOOD 2D & MULTI-SECTOR IMPACT ASSESSMENT ENGINE)', { align: 'center', bold: true, color: '0B3C5D', size: 22, spaceBefore: 40, spaceAfter: 180 });
  
  doc += p('Sistem Platform Terpadu Satu Data Kebencanaan (Dashboard K5)', { align: 'center', italic: true, color: '64748B', size: 20, spaceAfter: 60 });
  doc += p('Versi 1.0 — Tahun 2026', { align: 'center', bold: true, color: '334155', size: 20, spaceAfter: 400 });

  doc += callout(
    'RINGKASAN EKSEKUTIF MODEL',
    'Dokumen ini menyajikan metodologi ilmiah, perumusan matematis-fisik hidrodinamika 2D, integrasi data geospasial real-time, dan standar kalkulasi estimasi dampak multi-sektor yang diimplementasikan pada modul Simulasi Modeling (/simulasi-modeling). Modul ini memanfaatkan pendekatan Super Fast Flood Simulation (SFFS) untuk menghasilkan analisis rambatan banjir dan proyeksi korban serta kerugian secara instan (< 1 detik).'
  );

  // BAB 1
  doc += h1('BAB I. PENDAHULUAN');
  doc += h2('1.1 Latar Belakang & Urgensi Pemodelan Cepat (Rapid Assessment)');
  doc += p('Bencana hidrometeorologi, khususnya banjir luapan sungai, banjir bandang, dan banjir pasang air laut (rob), merupakan bencana dengan frekuensi kejadian tertinggi di Indonesia. Pada masa pra-bencana (kesiapsiagaan peringatan dini) maupun saat tanggap darurat (golden hours), pengambil kebijakan di tingkat nasional (BNPB, Bappenas, Kementerian PUPR) dan daerah (BPBD) membutuhkan estimasi spasial mengenai luas genangan, kedalaman air, dan populasi terdampak secara cepat.');
  doc += p('Pemodelan hidrodinamika 2D konvensional (seperti HEC-RAS 2D atau MIKE 21) memerlukan waktu komputasi yang sangat panjang (beberapa jam hingga hari) serta spesifikasi perangkat keras komputasi tinggi. Oleh karena itu, modul ini mengimplementasikan algoritma Super Fast Flood Simulation (SFFS / FastFlood 2D Engine) yang mampu mensimulasikan dinamika genangan banjir dalam hitungan milidetik secara interaktif langsung pada web browser.');

  doc += h2('1.2 Tujuan Modul Simulasi-Modeling');
  doc += p('1. Memberikan visualisasi spasial rambatan banjir 2D interaktif pada berbagai skenario intensitas hujan (10 - 200 mm/jam) dan durasi (1 - 24 jam).');
  doc += p('2. Mensimulasikan pengaruh kondisi tanggul (intact, overtopped, breached) dan kapasitas operasional pompa drainase.');
  doc += p('3. Menghitung secara otomatis luas area terdampak (Ha/km²), volume akumulasi air (juta m³), dan tingkat keparahan risiko (hazard level).');
  doc += p('4. Mengintegrasikan secara real-time data kependudukan mikro berbasis geospasial (Bappenas SEPAKAT Hexbin Res-9) untuk memetakan populasi rentan (balita, lansia, disabilitas).');
  doc += p('5. Menghitung estimasi dampak kerusakan fisik (rumah, sekolah, faskes, jalan) dan estimasi kerugian ekonomi makro (Damage and Loss Assessment).');

  doc += h2('1.3 Landasan Regulasi & Standar Acuan');
  doc += p('• Undang-Undang Republik Indonesia No. 24 Tahun 2007 tentang Penanggulangan Bencana.');
  doc += p('• Peraturan Pemerintah No. 21 Tahun 2008 tentang Penyelenggaraan Penanggulangan Bencana.');
  doc += p('• Peraturan Kepala BNPB No. 07 Tahun 2008 tentang Pedoman Tata Cara Penyusunan Rencana Penanggulangan Bencana.');
  doc += p('• Peraturan Kepala BNPB No. 10 Tahun 2012 tentang Pengelolaan Logistik Bencana.');
  doc += p('• Pedoman Penilaian Kerusakan dan Kerugian Akibat Bencana (DaLA / DINA BNPB & Bappenas).');
  doc += p('• Standar Paket Pelayanan Awal Minimum (PPAM) Kesehatan Reproduksi Bencana (Kemenkes RI & UNFPA).');
  doc += p('• Sphere Project: Humanitarian Charter and Minimum Standards in Disaster Response.');

  // BAB 2
  doc += h1('BAB II. METODOLOGI PEMODELAN FISIK HIDROLOGI & HIDRAULIKA');
  doc += h2('2.1 Prinsip Super Fast Flood Simulation (FastFlood 2D)');
  doc += p('Engine simulasi dibangun dengan sistem diskritisasi domain ruang menjadi jaringan sel grid raster terstruktur. Ukuran sel grid dikonfigurasi ke dalam 3 tingkat resolusi: High (32x32 sel), Medium (24x24 sel), dan Low (18x18 sel). Setiap sel merepresentasikan luas permukaan ~200 m x 200 m (40.000 m² atau 4 Hektar).');
  doc += p('Setiap sel grid menyimpan atribut hidrodinamika: koordinat geografis (lat, lng), elevasi dasar tanah DEM (elevation, m dpl), kedalaman genangan air (waterDepth, m), elevasi muka air mutlak (waterElevation, m dpl), kecepatan aliran (velocity, m/s), dan tingkat bahaya (hazardLevel).');

  doc += h2('2.2 Model Hidrologi: Presipitasi & Limpasan Permukaan (Runoff)');
  doc += p('Presipitasi dihitung menggunakan adaptasi Metode Rasional yang dikombinasikan dengan fungsi penyerapan air tanah (infiltrasi). Persamaan yang digunakan adalah:');

  doc += formulaBox('Total Curah Hujan Akumulatif (Rainfall Depth)', 'P_total = I × t', 'di mana P_total = kedalaman hujan (mm), I = intensitas hujan (mm/jam), t = durasi hujan (jam).');
  doc += formulaBox('Infiltrasi Air ke Dalam Tanah', 'F = min( f_rate × t, P_total × 0.7 )', 'di mana F = total peresapan tanah (mm), f_rate = laju infiltrasi jenis tanah (mm/jam). Laju infiltrasi dibatasi maksimal 70% dari curah hujan.');
  doc += formulaBox('Curah Hujan Efektif (Effective Surface Runoff)', 'P_eff = ((P_total - F) / 1000) × C', 'di mana P_eff = limpasan efektif (meter), C = koefisien limpasan tutupan lahan (Runoff Coefficient).');

  doc += p('Koefisien limpasan (C) dan laju infiltrasi permukaan ditentukan berdasarkan tipologi tutupan lahan (land cover):');
  doc += table(
    ['Tipologi Tutupan Lahan', 'Koefisien Limpasan (C)', 'Laju Infiltrasi Default (f_rate)', 'Deskripsi Karakteristik Wilayah'],
    [
      ['Perkotaan (Urban)', '0.85', '4.0 mm/jam', 'Wilayah padat kedap air, aspal, atap beton, drainase terbatas.'],
      ['Penyangga (Suburban)', '0.65', '8.0 mm/jam', 'Pemukiman sedang, pekarangan terbuka, resapan moderat.'],
      ['Pertanian / Ladang (Agriculture)', '0.40', '15.0 mm/jam', 'Lahan sawah, tegalan, perkebunan dengan daya serap baik.'],
      ['Hutan / Vegetasi Alami (Forest)', '0.20', '25.0 mm/jam', 'Hutan lindung/hutan kota dengan porositas dan infiltrasi tinggi.']
    ]
  );

  doc += h2('2.3 Model Hidraulika Aliran 2D & Elevasi Muka Air (Water Depth)');
  doc += p('Elevasi muka air di setiap sel grid dihitung melalui superposisi 4 komponen dinamis:');
  doc += p('1. Elevasi Topografi Dasar (Base DEM) yang membentuk lembah sungai sintetis di bagian tengah domain dan naik secara melandai ke kedua sisi sayap sungai.');
  doc += p('2. Limpasan Debit Hulu (River Inflow Factor): Kontribusi debit banjir kiriman dari daerah tangkapan air (DTA) hulu:');
  doc += formulaBox('Elevasi Muka Air Sungai Meluap', 'Z_river = BaseDEM + 1.2 + ( (Q_inflow / 1000) × 0.4 × F_tanggul ) + ( TidalSurge × (1 - d_river) )', 'di mana Q_inflow = debit hulu (m³/s), F_tanggul = faktor pengali kondisi tanggul, TidalSurge = tinggi pasang rob (m), d_river = jarak relatif ternormalisasi dari sungai.');

  doc += p('3. Kondisi Batas Tanggul (Levee Condition):');
  doc += p('   • Intact (Normal): F_tanggul = 1.0 (aliran tertampung di palung normal).');
  doc += p('   • Overtopped (Tanggul Meluap): F_tanggul = 1.25 (air melimpas di atas mercu tanggul).');
  doc += p('   • Breached (Tanggul Jebol): F_tanggul = 1.60 (debit air menyembur langsung ke permukiman).');

  doc += p('4. Efek Reduksi Pompa Drainase (Polder System): Kapasitas pompa aktif (pumpCapacity, m³/s) mengurangi ketinggian genangan air secara linier: Reduksi = min(0.35, (Pump / 50) × 0.3) meter.');

  doc += h2('2.4 Kecepatan Aliran (Aproksimasi Rumus Manning)');
  doc += p('Kecepatan rambatan aliran air banjir dihitung dengan mengadaptasi rumus hidraulika Manning untuk saluran terbuka dangkal:');
  doc += formulaBox('Kecepatan Aliran Air Permukaan (Manning)', 'V = (1 / n) × (R)^(2/3) × (S)^(1/2)', 'di mana V = kecepatan aliran (m/s), n = koefisien kekasaran Manning (0.015 - 0.060), R = radius hidrolis (diaproksimasi dengan kedalaman air d), S = kemiringan lereng permukaan (slope).');

  doc += h2('2.5 Matriks Kategori Tingkat Bahaya (Hazard Level)');
  doc += p('Tingkat keparahan bahaya banjir di setiap titik sel diklasifikasikan ke dalam 5 tingkatan standar kebencanaan:');
  doc += table(
    ['Kategori Bahaya', 'Kedalaman Genangan (d)', 'Kode Warna Hex', 'Implikasi Lapangan & Tindakan Evakuasi'],
    [
      ['Aman (Safe)', 'd < 0.08 m', '#F1F5F9 (Abu)', 'Tidak terjadi genangan atau hanya basah permukaan jalan.'],
      ['Rendah (Low)', '0.08 m ≤ d ≤ 0.30 m', '#38BDF8 (Cyan)', 'Genangan trotoar/jalan setapak. Kendaraan masih dapat melintas.'],
      ['Sedang (Moderate)', '0.30 m < d ≤ 0.80 m', '#0284C7 (Biru)', 'Air masuk ke pekarangan rumah. Sepeda motor mogok. Waspada evakuasi.'],
      ['Tinggi (High)', '0.80 m < d ≤ 1.50 m', '#2563EB (Biru Tua)', 'Air masuk ruang utama rumah. Kendaraan roda 4 terendam. Evakuasi wajib.'],
      ['Ekstrem (Extreme)', 'd > 1.50 m', '#1E40AF (Navy Gelap)', 'Genangan mencapai atap rumah. Arus deras membahayakan jiwa. SAR aktif.']
    ]
  );

  doc += h2('2.6 Dinamika Linimasa Hidrograf Waktu (Time-Lapse Progression)');
  doc += p('Untuk mensimulasikan fase pra, saat, dan pasca-bencana, engine menyediakan 6 langkah waktu (timeline steps) dengan faktor pengali volume dan kedalaman genangan:');
  doc += table(
    ['Langkah Waktu', 'Fase Hidrograf Banjir', 'Persentase Genangan', 'Deskripsi Kondisi Lapangan'],
    [
      ['00:00 (Jam ke-0)', 'Awal Kejadian Hujan', '5% Volume Air', 'Hujan mulai turun lebat, air mulai mengisi saluran drainase lokal.'],
      ['02:00 (Jam ke-2)', 'Limpasan Menggenang', '35% Volume Air', 'Saluran drainase penuh, air mulai meluap di titik-titik cekungan rendah.'],
      ['04:00 (Jam ke-4)', 'Limpasan Meluas', '72% Volume Air', 'Debit sungai meningkat pesat, air mulai merendam permukiman sekitar bantaran.'],
      ['08:00 (Jam ke-8)', 'Puncak Banjir (Peak Flood)', '100% Volume Maksimal', 'Genangan mencapai luasan dan kedalaman tertinggi. Tanggap darurat penuh.'],
      ['16:00 (Jam ke-16)', 'Hujan Reda & Aliran Hilir', '65% Volume Air', 'Intensitas hujan menurun drastis, air mengalir perlahan ke muara/saluran primer.'],
      ['24:00 (Jam ke-24)', 'Resapan & Surut Total', '30% Volume Sisa', 'Sebagian besar daratan mengering, genangan hanya tersisa di cekungan terdalam.']
    ]
  );

  // BAB 3
  doc += h1('BAB III. ESTIMASI DAMPAK SOSIO-EKONOMI & FASILITAS UMUM');
  doc += h2('3.1 Model Penilaian Kerusakan dan Kerugian (DINA / DaLA BNPB & Bappenas)');
  doc += p('Kalkulasi dampak pada modul Simulasi Modeling mengadopsi metodologi baku Damage and Loss Assessment (DaLA) yang diterbitkan oleh BNPB dan Bappenas. Penghitungan dilakukan secara otomatis saat area genangan terhitung.');

  doc += h2('3.2 Estimasi Populasi Terdampak Berbasis Spasial');
  doc += p('Populasi terdampak dihitung dari perkalian luas area tergenang (Hektar) dengan koefisien kepadatan penduduk spesifik berdasarkan tutupan lahan:');
  doc += formulaBox('Populasi Terdampak (Jiwa)', 'Populasi = Luas_Ha × Kepadatan × Faktor_Kedalaman', 'di mana Kepadatan = 180 jiwa/Ha (Urban), 95 jiwa/Ha (Suburban), 30 jiwa/Ha (Rural). Faktor kedalaman = 1.0 jika d_avg > 0.5m, atau 0.4 jika d_avg ≤ 0.5m.');

  doc += h2('3.3 Estimasi Kerusakan Bangunan & Infrastruktur Publik');
  doc += p('• Bangunan / Rumah Terdampak: Dihitung dengan rasio rata-rata 4.2 jiwa per kepala keluarga: Bangunan = Populasi / 4.2 unit.');
  doc += p('• Sekolah Terdampak: Diestimasi rata-rata 1 unit sekolah per 120 Hektar area tergenang.');
  doc += p('• Fasilitas Kesehatan (RS / Puskesmas): Diestimasi rata-rata 1 unit fasilitas per 280 Hektar area tergenang.');
  doc += p('• Jaringan Jalan Terendam: Diestimasi dengan koefisien kerapatan jalan 4.2 km jalan per 1 km² area genangan: Panjang_Jalan = Luas_km² × 4.2 km.');

  doc += h2('3.4 Estimasi Kerugian Finansial Ekonomi Makro');
  doc += formulaBox('Estimasi Kerugian Finansial (Miliar Rupiah)', 'Kerugian = (Bangunan × 0.045 M) + (Jalan_km × 0.850 M) + (Populasi × 0.005 M)', 'Mengacu pada nilai unit cost rata-rata kerusakan fisik rumah tinggal (Rp 45 juta/unit), rekonstruksi jalan (Rp 850 juta/km), dan biaya kedaruratan perorangan (Rp 5 juta/jiwa).');

  doc += h2('3.5 Pemilahan Demografi Rentan (Disabilitas, Balita, Lansia, Ibu Hamil & Menyusui)');
  doc += p('Kelompok rentan dihitung secara presisi menggunakan integrasi live data Bappenas atau model demografi acuan nasional:');
  doc += table(
    ['Kelompok Rentan', 'Proporsi Acuan', 'Sumber Metodologi', 'Kebutuhan Logistik Khusus'],
    [
      ['Balita (Usia 0-5 Thn)', '8.5% - 10.0%', 'SEPAKAT Bappenas / Sensus BPS', 'Makanan Pendamping ASI (MP-ASI), Popok Bayi (4 pcs/hari), PAUD Kit.'],
      ['Lansia (Usia ≥ 60 Thn)', '8.0% - 11.8%', 'SEPAKAT Bappenas / Sensus BPS', 'Tim medis geriatri, popok dewasa, makanan lunak bernutrisi, obat hipertensi/diabetes.'],
      ['Disabilitas Berat (PD-1)', '1.2%', 'SEPAKAT Bappenas (Data KJS)', 'Kursi roda, jalur evakuasi ramah difabel, pendampingan khusus relawan.'],
      ['Disabilitas Sedang (PD-2)', '2.8%', 'SEPAKAT Bappenas (Data KJS)', 'Alat bantu dengar/jalan, tempat penampungan pengungsi ramah aksesibilitas.'],
      ['Ibu Hamil', '3.0%', 'Standar PPAM Kemenkes RI & UNFPA', 'Maternity Kit, biskuit makanan tambahan (PMT), bidan siaga di posko.'],
      ['Ibu Menyusui', '4.0%', 'Standar PPAM Kemenkes RI & UNFPA', 'Laktasi Kit, ruang khusus menyusui di tenda pengungsi, suplemen zat besi/gizi.']
    ]
  );

  // BAB 4
  doc += h1('BAB IV. SUMBER DATA & ARSITEKTUR INTEGRASI DATA');
  doc += h2('4.1 BAPPENAS (Badan Perencanaan Pembangunan Nasional)');
  doc += p('Sistem terhubung langsung ke Server Geospasial Bappenas melalui endpoint REST API berikut:');
  doc += p('• Endpoint Layanan: https://geospasial.bappenas.go.id/server/rest/services/Produksi/hexbin_agg9/MapServer/0/query');
  doc += p('• Dataset: Hexbin H3 Resolusi 9 (hexbin_agg9) yang mengagregasikan data sensus sosial ekonomi mikro.');
  doc += p('• Parameter Spasial: Dilakukan operasi spatialRel=esriSpatialRelIntersects menggunakan bounding box poligon banjir yang dihasilkan oleh engine simulasi.');
  doc += p('• Field Atribut: jml_lakila, jml_peremp, jml_lansia, jml_balita, jml_pd1 (disabilitas berat), jml_pd2 (disabilitas sedang), dan jml_klg (jumlah keluarga).');

  doc += h2('4.2 BADAN INFORMASI GEOSPASIAL (BIG)');
  doc += p('• DEMNAS (Digital Elevation Model Nasional): Digunakan sebagai acuan dasar elevasi topografi wilayah dan pembentukan palung sungai.');
  doc += p('• Batas Administrasi Desa/Kelurahan: Layer batas wilayah terverifikasi BIG untuk membatasi kewenangan administratif.');
  doc += p('• Peta Rupa Bumi Indonesia (RBI) Skala 1:5.000 / 1:25.000: Data jaringan jalan raya, tutupan lahan produktif, dan sebaran bangunan fasilitas publik.');

  doc += h2('4.3 BADAN NASIONAL PENANGGULANGAN BENCANA (BNPB)');
  doc += p('• InARISK Geoportal (gis.bnpb.go.id): Peta indeks bahaya banjir dan kerentanan multi-ancaman nasional.');
  doc += p('• DIBI (Data Informasi Bencana Indonesia): Rekam data historis kejadian banjir tabular (tersimpan di public/20260505_072732.json) yang digunakan untuk memverifikasi tren frekuensi kejadian banjir.');

  doc += h2('4.4 BADAN METEOROLOGI, KLIMATOLOGI, DAN GEOFISIKA (BMKG)');
  doc += p('• Kurva IDF (Intensity-Duration-Frequency): Nilai intensitas hujan untuk berbagai durasi (1, 2, 6, 12, 24 jam).');
  doc += p('• Kala Ulang Hujan (Return Period): Besaran curah hujan ekstrem periode ulang 2, 5, 10, 25, 50, dan 100 tahun.');

  doc += h2('4.5 KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT (PUPR / BBWS)');
  doc += p('• Data Debit Banjir Rencana (Q25, Q50, Q100) dari Balai Besar Wilayah Sungai (BBWS Ciliwung-Cisadane, Citarum, Bengawan Solo, Brantas, Pemali Juana, BWS Sumatera V).');
  doc += p('• Kapasitas stasiun pompa pengendali banjir dan elevasi mercu tanggul pengendali banjir.');

  // BAB 5
  doc += h1('BAB V. KALIBRASI ENAM WILAYAH PRESET BANJIR NASIONAL');
  doc += p('Sistem telah dilengkapi dengan 6 preset wilayah rawan banjir kritis di Indonesia yang telah dikalibrasi sesuai topografi nyata:');
  doc += table(
    ['Nama Wilayah Preset', 'Provinsi / Lokasi', 'Elevasi Dasar (DEM)', 'Tipe Risiko Dominan', 'Karakteristik DAS & Ancaman Utama'],
    [
      ['DAS Ciliwung - Manggarai', 'DKI Jakarta', '8.5 m dpl', 'Banjir Luapan Sungai', 'Kawasan padat penduduk, luapan Ciliwung hulu (Bogor) & drainase kota.'],
      ['Pesisir Kaligawe & Genuk', 'Jawa Tengah (Semarang)', '1.2 m dpl', 'Rob / Pasang Laut', 'Dataran sangat rendah pantai utara dengan ancaman kombinasi pasang rob dan drainase polder.'],
      ['DAS Citarum - Dayeuhkolot', 'Jawa Barat (Bandung)', '652.0 m dpl', 'Banjir Luapan Sungai', 'Cekungan Bandung dengan kemiringan sangat landai yang menampung aliran Citarum hulu.'],
      ['DAS Bengawan Solo - Pasar Kliwon', 'Jawa Tengah (Surakarta)', '92.0 m dpl', 'Banjir Luapan Sungai', 'Lembah sungai terpanjang di Jawa dengan limpasan air kiriman saat hujan lebat di hulu.'],
      ['DAS Batang Kuranji', 'Sumatera Barat (Padang)', '18.0 m dpl', 'Banjir Bandang', 'Lereng curam Bukit Barisan menuju pesisir dengan waktu konsentrasi sangat singkat.'],
      ['Delta Sungai Porong & Brantas', 'Jawa Timur (Sidoarjo)', '4.8 m dpl', 'Banjir Muara / Sungai', 'Jalur pembuangan akhir sungai Brantas ke Selat Madura dengan tantangan sedimentasi & tanggul.']
    ]
  );

  // BAB 6
  doc += h1('BAB VI. ARSITEKTUR TEKNOLOGI & IMPLEMENTASI KODE');
  doc += h2('6.1 Struktur Modul Frontend & Engine Komputasi');
  doc += p('Pemodelan diimplementasikan secara modular pada arsitektur Next.js 14 App Router:');
  doc += p('• src/components/simulasi/SimulasiEngine.ts: Engine utama komputasi hidrologi FastFlood, kalkulasi raster grid, integrasi fetch REST SEPAKAT Bappenas, dan perhitungan dampak.');
  doc += p('• src/components/simulasi/SimulasiTypes.ts: Definisi antarmuka TypeScript (RegionPreset, SimulationParams, SimulationResults, InspectionPoint).');
  doc += p('• src/components/simulasi/SimulasiControlPanel.tsx: Panel kontrol parameter input (intensitas hujan, durasi, tutupan lahan, debit sungai, pasang laut, tanggul, pompa).');
  doc += p('• src/components/simulasi/SimulasiLeafletMap.tsx: Komponen pemetaan Leaflet interaktif yang merender sel grid poligon GeoJSON secara dinamis dengan pewarnaan gradasi kedalaman.');
  doc += p('• src/components/simulasi/SimulasiModelingView.tsx: Orkestrator tampilan utama yang menghubungkan panel kontrol, peta, linimasa waktu, dan kartu ringkasan dampak.');

  doc += h2('6.2 Fitur Map Click Inspection Point');
  doc += p('Pengguna dapat melakukan klik pada koordinat mana saja di atas peta. Algoritma Euclidean Distance terdekat (findNearestInspectionPoint) akan langsung menampilkan popup koordinat presisi, elevasi tanah (m dpl), kedalaman air (m), tinggi muka air absolut (m dpl), kecepatan arus (m/s), dan kategori bahaya di titik tersebut.');

  // BAB 7
  doc += h1('BAB VII. KESIMPULAN & REKOMENDASI PENGEMBANGAN');
  doc += p('Modul Simulasi Modeling pada platform Satu Data Bencana berhasil menjembatani kesenjangan antara akurasi pemodelan ilmiah dan kecepatan pengambilan keputusan di lapangan. Dengan komputasi super cepat (< 1 detik) dan integrasi data demografi mikro Bappenas, sistem ini siap mendukung operasional tanggap darurat, gladi lapang penanggulangan bencana, serta perencanaan tata ruang berbasis mitigasi bencana.');
  doc += p('Rekomendasi pengembangan masa depan:');
  doc += p('1. Integrasi sensor Automatic Water Level Recorder (AWLR) dan Automatic Weather Station (AWS) IoT secara streaming untuk simulasi berbasis kondisi aktual 10 menit terakhir.');
  doc += p('2. Pemanfaatan data LiDAR resolusi 1 meter untuk pemodelan mikro pada tingkat perumahan/gang perkotaan.');
  doc += p('3. Penerapan model Machine Learning (Physics-Informed Neural Networks - PINN) untuk kalibrasi dinamis koefisien kekasaran permukaan.');

  // FOOTER SIGNATURE
  doc += p('------------------------------------------------------------------------------------------------------------------------', { align: 'center', color: 'CBD5E1', spaceBefore: 300, spaceAfter: 100 });
  doc += p('Dokumen ini digenerate secara resmi dari Antigravity Disaster Management Analytics Platform.', { align: 'center', italic: true, color: '64748B', size: 18, spaceAfter: 40 });
  doc += p('© 2026 Platform Satu Data Bencana Indonesia — Hak Cipta Dilindungi Undang-Undang.', { align: 'center', bold: true, color: '0B3C5D', size: 18, spaceAfter: 200 });

  return doc;
}

async function buildDocx() {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`;
  zip.file('[Content_Types].xml', contentTypesXml);

  // 2. _rels/.rels
  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  zip.folder('_rels').file('.rels', relsXml);

  // 3. word/_rels/document.xml.rels
  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;
  zip.folder('word').folder('_rels').file('document.xml.rels', wordRelsXml);

  // 4. word/settings.xml
  const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>`;
  zip.folder('word').file('settings.xml', settingsXml);

  // 5. word/styles.xml
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:lang w:val="id-ID"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="140" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="360" w:after="160"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:color w:val="0B3C5D"/>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:color w:val="1F8080"/>
      <w:sz w:val="26"/>
      <w:szCs w:val="26"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:pPr>
      <w:spacing w:before="160" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:color w:val="333333"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>`;
  zip.folder('word').file('styles.xml', stylesXml);

  // 6. word/document.xml
  const docBody = generateDocxXml();
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    ${docBody}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  zip.folder('word').file('document.xml', documentXml);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const outputPath = path.join(__dirname, '..', 'DOKUMEN_METODOLOGI_SIMULASI_PEMODELAN_BENCANA.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('Berhasil membuat file DOCX di:', outputPath);
  return buffer;
}

if (require.main === module) {
  buildDocx()
    .then(() => {
      console.log('Selesai membuat file DOCX!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Gagal membuat DOCX:', err);
      process.exit(1);
    });
}

module.exports = { buildDocx, generateDocxXml };
