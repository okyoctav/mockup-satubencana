/** Bentuk kejadian yang dipakai dashboard (marker + filter + detail). */
export type Kejadian = {
  id: number;
  nama: string;
  provinsi: string;
  kabupaten: string;
  lat: number;
  lng: number;
  jenis: string;
  /** Label asli kategori BNPB */
  jenisLabel?: string;
  tanggal: string;
  korban_jiwa: number;
  pengungsi: number;
  rumah_terdampak?: number;
  status: string;
  level: string;
  /** Sumber data (untuk label kualitas) */
  source?: 'bnpb_mingguan' | 'bencana_json';
  sourceId?: string;
  /** Provinsi dari lookup kode/nama — bukan field live */
  provinsiDilengkapi?: boolean;

  // —— Field detail dari feed BNPB (opsional; hide-zero di UI) ——
  minggu?: number;
  jumlah_kejadian?: number;
  meninggal?: number;
  hilang?: number;
  luka_sakit?: number;
  menderita?: number;
  mengungsi_detail?: number;
  rumah_rusak_berat?: number;
  rumah_rusak_sedang?: number;
  rumah_rusak_ringan?: number;
  rumah_terendam?: number;
  rumah_rusak?: number;
  lahan_hektar?: number;
  estimasi_kerugian_rumah?: number;
  pendidikan_rusak?: number;
  rumah_ibadat_rusak?: number;
  fasyankes_rusak?: number;
  fasum_rusak?: number;
  kantor_rusak?: number;
  jembatan_rusak?: number;
  kronologis?: string;
  penyebab?: string;
  deskripsi?: string;
  kondisi_mutakhir?: string;
  upaya?: string;
  id_kab_sdi?: string;
};
