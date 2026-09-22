export interface KabupatenItem {
  nama: string;
  kejadian: number;
  meninggal: number;
  hilang: number;
  luka: number;
  pengungsi: number;
  rusakBerat: number;
  rusakSedang: number;
  rusakRingan: number;
  totalRumahRusak: number;
  terendam: number;
  fasilitas: number;
  topBencana?: string;
  jenisBreakdown?: Record<string, number>;
}

// Material Design Color Palette & Icons for Disasters
export const DISASTER_THEMES: Record<string, { main: string; light: string; border: string; icon: string }> = {
  'Semua': { main: '#00897b', light: 'rgba(0,137,123,0.15)', border: '#00897b', icon: '🌐' },
  'Banjir': { main: '#1e88e5', light: 'rgba(30,136,229,0.15)', border: '#1565c0', icon: '💧' },
  'Longsor': { main: '#6d4c41', light: 'rgba(109,76,65,0.15)', border: '#4e342e', icon: '⛰️' },
  'Cuaca ekstrem': { main: '#3949ab', light: 'rgba(57,73,171,0.15)', border: '#283593', icon: '🌪️' },
  'Kekeringan': { main: '#fbc02d', light: 'rgba(251,192,45,0.15)', border: '#f57f17', icon: '☀️' },
  'Kebakaran hutan dan lahan': { main: '#e53935', light: 'rgba(229,57,53,0.15)', border: '#c62828', icon: '🔥' },
  'Gempabumi': { main: '#8e24aa', light: 'rgba(142,36,170,0.15)', border: '#6a1b9a', icon: '🏚️' },
  'Gelombang pasang / Abrasi': { main: '#00acc1', light: 'rgba(0,172,193,0.15)', border: '#00838f', icon: '🌊' },
  'Erupsi gunung api': { main: '#f4511e', light: 'rgba(244,81,30,0.15)', border: '#d84315', icon: '🌋' },
  'Tsunami': { main: '#0288d1', light: 'rgba(2,136,209,0.15)', border: '#0277bd', icon: '🌊' }
};

export const DISASTER_COLORS: Record<string, string> = {
  'Banjir': '#1e88e5',
  'Longsor': '#6d4c41',
  'Cuaca ekstrem': '#3949ab',
  'Kekeringan': '#fbc02d',
  'Kebakaran hutan dan lahan': '#e53935',
  'Gempabumi': '#8e24aa',
  'Gelombang pasang / Abrasi': '#00acc1',
  'Erupsi gunung api': '#f4511e',
  'Tsunami': '#0288d1'
};
