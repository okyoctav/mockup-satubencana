export type BmkgAlertItem = {
  id: string;
  jenis: 'gempa' | 'tsunami';
  level: 'tinggi' | 'sedang' | 'rendah';
  pesan: string;
  waktu: string;
  waktuIso: string | null;
  lat: number;
  lng: number;
  color: string;
  icon: string;
  source: 'autogempa' | 'gempaterkini' | 'gempadirasakan';
  magnitude: number;
  /** true = kejadian terbaru BMKG (autogempa), selalu ditampilkan di slot pertama */
  pinned?: boolean;
};
