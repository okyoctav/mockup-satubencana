import { useState } from 'react';
import { Truck, Compass, Route, RefreshCw, ChevronDown, ChevronUp, Info, X, MapPin, Navigation } from 'lucide-react';
import { EstimationData } from './LogisticAnalysisSection';

interface Props {
  estimationData?: EstimationData | null;
}

// Interactive OSRM Route Calculator Component
function RouteCalculatorWidget({ onDistanceCalculated }: { onDistanceCalculated: (km: number) => void }) {
  const [pointA, setPointA] = useState({ name: 'Gudang Logistik BPBD Sulut (Manado)', lat: 1.4748, lng: 124.8428 });
  const [pointB, setPointB] = useState({ name: 'Posko Pengungsian Bitung (Maesa)', lat: 1.4429, lng: 125.1834 });
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<{ distanceKm: number; durationMin: number; summary: string } | null>(null);

  const presets = [
    { label: 'Gudang Manado ➔ Posko Bitung', a: { name: 'Gudang BPBD Sulut (Manado)', lat: 1.4748, lng: 124.8428 }, b: { name: 'Posko Pengungsian Bitung', lat: 1.4429, lng: 125.1834 } },
    { label: 'Posko Komando ➔ Faskes RSUD Bitung', a: { name: 'Posko Utama Evakuasi', lat: 1.4450, lng: 125.1700 }, b: { name: 'RSUD Manembo-nembo Bitung', lat: 1.4350, lng: 125.1320 } },
    { label: 'Pelabuhan Bitung ➔ Gudang Logistik', a: { name: 'Pelabuhan Samudera Bitung', lat: 1.4400, lng: 125.1900 }, b: { name: 'Gudang Darurat BPBD', lat: 1.4550, lng: 125.1500 } },
  ];

  const calculateOSRMRoute = async () => {
    setLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pointA.lng},${pointA.lat};${pointB.lng},${pointB.lat}?overview=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengambil rute OSRM');
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distKm = Math.round((route.distance / 1000) * 10) / 10;
        const durMin = Math.round(route.duration / 60);
        setRouteResult({
          distanceKm: distKm,
          durationMin: durMin,
          summary: route.legs?.[0]?.summary || 'Jalur Utama Lintas Provinsi/Kota',
        });
        onDistanceCalculated(distKm);
      }
    } catch {
      // Fallback straight line Haversine distance calculation
      const R = 6371;
      const dLat = ((pointB.lat - pointA.lat) * Math.PI) / 180;
      const dLon = ((pointB.lng - pointA.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((pointA.lat * Math.PI) / 180) * Math.cos((pointB.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = Math.round(R * c * 1.25 * 10) / 10;
      const durMin = Math.round(distKm * 1.8);
      setRouteResult({
        distanceKm: distKm,
        durationMin: durMin,
        summary: 'Estimasi Jarak Vektor Darat (Fallback)',
      });
      onDistanceCalculated(distKm);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Preset Quick Select Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-bold text-slate-500 mr-1">Rute Cepat Bencana:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setPointA(p.a);
              setPointB(p.b);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-[#1f8080]/10 hover:text-[#19506e] text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition-all"
          >
            📍 {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Titik A */}
        <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>TITIK A (Asal Evakuasi / Gudang)</span>
          </div>
          <input
            type="text"
            value={pointA.name}
            onChange={(e) => setPointA({ ...pointA, name: e.target.value })}
            className="w-full bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none"
          />
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 font-medium">Latitude:</span>
              <input
                type="number"
                step="0.0001"
                value={pointA.lat}
                onChange={(e) => setPointA({ ...pointA, lat: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 font-mono text-slate-700"
              />
            </div>
            <div>
              <span className="text-slate-500 font-medium">Longitude:</span>
              <input
                type="number"
                step="0.0001"
                value={pointA.lng}
                onChange={(e) => setPointA({ ...pointA, lng: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 font-mono text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Titik B */}
        <div className="p-3 bg-sky-50/60 border border-sky-200/80 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>TITIK B (Tujuan Posko / Faskes)</span>
          </div>
          <input
            type="text"
            value={pointB.name}
            onChange={(e) => setPointB({ ...pointB, name: e.target.value })}
            className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none"
          />
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 font-medium">Latitude:</span>
              <input
                type="number"
                step="0.0001"
                value={pointB.lat}
                onChange={(e) => setPointB({ ...pointB, lat: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 font-mono text-slate-700"
              />
            </div>
            <div>
              <span className="text-slate-500 font-medium">Longitude:</span>
              <input
                type="number"
                step="0.0001"
                value={pointB.lng}
                onChange={(e) => setPointB({ ...pointB, lng: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 font-mono text-slate-700"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={calculateOSRMRoute}
          disabled={loading}
          className="px-4 py-2.5 bg-[#19506e] hover:bg-[#19506e]/90 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin text-sky-300" /> : <Navigation className="w-4 h-4 text-sky-300" />}
          <span>Hitung Rute Tercepat (OSRM API)</span>
        </button>

        {routeResult && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs">
            <span className="font-bold text-emerald-900">📏 Jarak Tercepat: <u className="no-underline text-emerald-700">{routeResult.distanceKm} Km</u></span>
            <span className="text-slate-400">•</span>
            <span className="font-bold text-emerald-900">⏱️ Waktu Tempuh: <u className="no-underline text-emerald-700">{routeResult.durationMin} Menit</u></span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccessibilityRouteSection({ estimationData }: Props) {
  const [isVariableOpen, setIsVariableOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<{ title: string; content: string } | null>(null);

  const PARAM_INFOS = {
    populasi: {
      title: '👥 Total Populasi Terdampak (Jiwa)',
      content: 'Populasi total terestimasi yang digunakan untuk menghitung jumlah armada truk logistik 6 roda (kapasitas 6 ton per 1.000 jiwa) dan mobil operasional double cabin.',
    },
    jarakKm: {
      title: '🚚 Estimasi Jarak Tempuh Evakuasi & Distribusi (Km)',
      content: 'Berdasarkan standar Manajemen Logistik Bencana BNPB & Perhub, jarak tempuh dari Gudang Utama BPBD/BNPB ke posko menentukan konsumsi BBM Solar armada truk (1 Liter / 4 Km per trip).',
    },
  };
  const defaultPop = estimationData?.totalPopulasi && estimationData.totalPopulasi > 0 ? estimationData.totalPopulasi : 1000;
  const [populasi, setPopulasi] = useState<number>(defaultPop);
  const [estimasiJarakKm, setEstimasiJarakKm] = useState<number>(45); // 45 Km ke gudang BPBD/BNPB

  // 1. Kebutuhan Armada Mobilisasi & Truk Logistik
  const trukLogistik6Roda = Math.ceil(populasi / 1000); // 1 truk (6 Ton) per 1000 jiwa
  const mobilOperasionalDoubleCabin = Math.max(2, Math.ceil(populasi / 1500));
  const motorTrailEvakuasi = Math.max(4, Math.ceil(populasi / 500));

  // 2. Kebutuhan Alat Berat Pembersihan Jalur Darurat (Search & Rescue Support)
  const excavatorAlatBerat = Math.max(1, Math.ceil(populasi / 2500));
  const wheelLoaderDozzer = Math.max(1, Math.ceil(populasi / 3500));
  const dumpTrukPembersihPuing = Math.ceil(excavatorAlatBerat * 2);

  // 3. Estimasi Waktu Tempuh & Konsumsi BBM Armada Evakuasi
  const waktuTempuhKategori = estimasiJarakKm > 50 ? 'Jalur Terisolasi (>50 Km)' : 'Jalur Terjangkau (<50 Km)';
  const bbmSolarTrukLiterPerTrip = Math.round((estimasiJarakKm / 4) * trukLogistik6Roda); // 1 Liter / 4 Km per truk

  return (
    <div className="space-y-6 font-sans">
      {/* SECTION HEADER */}
      <div className="bg-gradient-to-r from-[#19506e] to-[#1f8080] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-300 animate-pulse" />
            <h2 className="font-bold text-lg tracking-tight">Analisis Aksesibilitas & Rute Evakuasi / Distribusi Logistik</h2>
          </div>
          <p className="text-xs text-slate-200">
            Simulasi armada truk distribusi logistik, mobilisasi alat berat pembersih jalur darurat, dan estimasi waktu tempuh evakuasi.
          </p>
        </div>

        <button
          onClick={() => {
            setPopulasi(1000);
            setEstimasiJarakKm(45);
          }}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Parameter</span>
        </button>
      </div>

      {/* LIVE SYNC BANNER FROM MAP DRAW */}
      {estimationData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-xs font-medium space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>
              <strong>Data Terhubung Dari Simulasi Polygon Peta:</strong> Total Populasi Terestimasi <strong>{estimationData.totalPopulasi.toLocaleString('id')} Jiwa</strong>
            </span>
          </div>

          {/* Rincian Demografi Lengkap (Sama Seperti Popup Estimasi Peta) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-emerald-200/80">
            <div className="bg-white/80 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">👨 Laki-laki</span>
              <span className="font-extrabold text-[#19506e] text-xs">{estimationData.totalLakiLaki.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">👩 Perempuan</span>
              <span className="font-extrabold text-[#19506e] text-xs">{estimationData.totalPerempuan.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">👴 Lansia</span>
              <span className="font-extrabold text-[#19506e] text-xs">{estimationData.totalLansia.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">🧒 Balita</span>
              <span className="font-extrabold text-[#19506e] text-xs">{estimationData.totalBalita.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-cyan-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-cyan-700 font-semibold block">🧾 Disabilitas (PD1)</span>
              <span className="font-extrabold text-cyan-700 text-xs">{estimationData.totalPd1.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-purple-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-purple-700 font-semibold block">📊 Disabilitas (PD2)</span>
              <span className="font-extrabold text-purple-700 text-xs">{estimationData.totalPd2.toLocaleString('id')}</span>
            </div>
            <div className="bg-white/80 border border-emerald-200 p-2 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">🏠 Total KK</span>
              <span className="font-extrabold text-[#1f8080] text-xs">{estimationData.totalKeluarga.toLocaleString('id')}</span>
            </div>
          </div>

          {estimationData.kelurahanDampak && estimationData.kelurahanDampak.length > 0 && (
            <div className="pt-2 border-t border-emerald-200/60">
              <span className="font-bold text-[#19506e] block mb-1">🏛️ Wilayah Kelurahan / Desa Terdampak:</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {estimationData.kelurahanDampak.map((k, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[11px] text-[#19506e] font-semibold flex items-center gap-1">
                    <span>📍 {k.namaKelurahan}</span>
                    {k.kodeKemendagri && (
                      <span className="text-[9px] bg-slate-100 px-1 py-0.2 rounded font-mono font-bold text-slate-700">
                        [{k.kodeKemendagri}]
                      </span>
                    )}
                    <span className="text-slate-500 font-normal">({k.namaKecamatan || k.namaKabupaten})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VARIABLE ACCORDION CONTROL PANEL */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all">
        {/* Accordion Toggle Header */}
        <button
          onClick={() => setIsVariableOpen(!isVariableOpen)}
          className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between transition-colors border-b border-slate-200/60"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs text-[#19506e] tracking-wide uppercase">⚙️ Variable Estimasi & Parameter Akses Rute</span>
            <span className="text-[10px] bg-[#1f8080]/10 text-[#1f8080] font-semibold px-2 py-0.5 rounded-md border border-[#1f8080]/20">
              Populasi {populasi.toLocaleString('id')} Jiwa • Jarak {estimasiJarakKm} Km • Akses {waktuTempuhKategori}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span>{isVariableOpen ? 'Sembunyikan' : 'Pengaturan Parameter Variable'}</span>
            {isVariableOpen ? <ChevronUp className="w-4 h-4 text-[#19506e]" /> : <ChevronDown className="w-4 h-4 text-[#19506e]" />}
          </div>
        </button>

        {/* Accordion Content Form Body */}
        {isVariableOpen && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border-t border-slate-100">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#19506e] uppercase tracking-wider">Populasi Area Terdampak (Jiwa)</label>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal(PARAM_INFOS.populasi)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Informasi Metodologi Populasi"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                value={populasi}
                onChange={(e) => setPopulasi(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#19506e] uppercase tracking-wider">Jarak Dari Posko/Gudang (Km)</label>
                <button
                  type="button"
                  onClick={() => setActiveInfoModal(PARAM_INFOS.jarakKm)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Informasi Metodologi Jarak Tempuh"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="number"
                min="1"
                max="300"
                value={estimasiJarakKm}
                onChange={(e) => setEstimasiJarakKm(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                <span>BBM Solar Truk:</span>
                <span className="font-extrabold text-sky-800 bg-sky-50 border border-sky-200/60 px-1.5 py-0.5 rounded">
                  = {bbmSolarTrukLiterPerTrip} Liter / Trip
                </span>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-xl p-3 flex flex-col justify-center space-y-1 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider">Status Aksesibilitas Jalur:</span>
              <span className="text-xs font-extrabold text-sky-800">
                {waktuTempuhKategori} ({bbmSolarTrukLiterPerTrip} L Solar/Konvoi)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* OSRM ROUTING INTERACTIVE CALCULATOR (JARAK TERCEPAT TITIK A KE B) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-[#1f8080]" />
            <h3 className="font-bold text-sm text-[#19506e]">📍 Kalkulator Rute Tercepat (OSRM Routing Engine)</h3>
          </div>
          <span className="text-[10px] bg-[#1f8080]/10 text-[#1f8080] font-bold px-2 py-0.5 rounded-md border border-[#1f8080]/20">
            OpenStreetMap OSRM Service API
          </span>
        </div>

        <RouteCalculatorWidget onDistanceCalculated={(km) => setEstimasiJarakKm(km)} />
      </div>

      {/* INFO EXPLANATION POPUP MODAL */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-[#1f8080]" />
                <span>{activeInfoModal.title}</span>
              </h3>
              <button
                onClick={() => setActiveInfoModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs leading-relaxed text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p>{activeInfoModal.content}</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveInfoModal(null)}
                className="px-4 py-2 bg-[#19506e] hover:bg-[#19506e]/90 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3 GRID CARDS KLASTER MOBILISASI & RUTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. ARMADA TRUK DISTRIBUSI LOGISTIK */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">1. Armada Logistik & Evakuasi</h3>
              <p className="text-[11px] text-slate-500">Mobilisasi angkutan darat</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🚚 Truk Logistik (Kapasitas 6 Ton)</span>
              <span className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border">{trukLogistik6Roda} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🛻 Mobil Operasional Double Cabin (4x4)</span>
              <span className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border">{mobilOperasionalDoubleCabin} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🏍️ Motor Trail Evakuasi Offroad</span>
              <span className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border">{motorTrailEvakuasi} Unit</span>
            </div>
          </div>
        </div>

        {/* 2. ALAT BERAT PEMBERSIHAN JALUR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-[#19506e]/10 text-[#19506e]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">2. Alat Berat Pembersih Jalur</h3>
              <p className="text-[11px] text-slate-500">Penanganan longsor & puing</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🚜 Excavator Pembersih Longsor</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{excavatorAlatBerat} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🏗️ Wheel Loader / Dozer</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{wheelLoaderDozzer} Unit</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">🚛 Dump Truck Pengangkut Puing</span>
              <span className="font-bold text-[#19506e] bg-white px-2.5 py-1 rounded-lg border">{dumpTrukPembersihPuing} Unit</span>
            </div>
          </div>
        </div>

        {/* 3. EVALUASI RUTE & DISTRIBUSI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#1f8080]/50 transition-all">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#19506e]">3. Estimasi Distribusi Rute</h3>
              <p className="text-[11px] text-slate-500">Konsumsi BBM & waktu tempuh</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">📏 Jarak Tempuh Ke Posko Utama</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{estimasiJarakKm} Km</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">⛽ BBM Solar Sekali Konvoi (PP)</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{bbmSolarTrukLiterPerTrip} Liter</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium text-slate-700">⏱️ Estimasi Waktu Tempuh Konvoi</span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border">{Math.round(estimasiJarakKm * 1.8)} Menit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
