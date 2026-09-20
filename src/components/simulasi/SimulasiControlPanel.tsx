'use client';

import { useState } from 'react';
import { SimulationParams, SimulationResults, RegionPreset, REGION_PRESETS } from './SimulasiTypes';
import {
  CloudRain,
  Sliders,
  ShieldAlert,
  Download,
  Play,
  RotateCcw,
  Waves,
  AlertTriangle,
  FileDown,
  Activity,
  X,
} from 'lucide-react';

interface Props {
  selectedRegion: RegionPreset;
  onSelectRegion: (region: RegionPreset) => void;
  params: SimulationParams;
  onParamsChange: (params: SimulationParams) => void;
  results: SimulationResults | null;
  onRunSimulation: () => void;
  isSimulating: boolean;
  onResetParams: () => void;
  onExportGeoJson: () => void;
  onExportReport: () => void;
  onClose?: () => void;
}

export default function SimulasiControlPanel({
  selectedRegion,
  onSelectRegion,
  params,
  onParamsChange,
  results,
  onRunSimulation,
  isSimulating,
  onResetParams,
  onExportGeoJson,
  onExportReport,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<'rain' | 'boundary' | 'impact' | 'export'>('rain');
  const [isTechnicalMode, setIsTechnicalMode] = useState(false);

  const updateParam = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-hidden select-none font-sans">
      {/* 1. TOP HEADER: Region Selector, Mode Toggle & Close Button */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
              <Waves className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-xs font-black text-[#0a1e36] dark:text-white uppercase tracking-wider truncate">
                FastFlood Engine
              </h2>
              <p className="text-[10px] text-slate-500 truncate">Pemodelan Hidrodinamika 2D Cepat</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mode Switcher */}
            <button
              onClick={() => setIsTechnicalMode(!isTechnicalMode)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                isTechnicalMode
                  ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
              title="Beralih antara Mode Cepat dan Mode Teknis"
            >
              {isTechnicalMode ? '⚙️ Teknis' : '🌐 Cepat'}
            </button>

            {/* Close Button if docked */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Tutup Panel Kontrol"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Region Quick Dropdown */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Wilayah Simulasi (DAS / Pesisir)
          </label>
          <select
            value={selectedRegion.id}
            onChange={(e) => {
              const r = REGION_PRESETS.find((p) => p.id === e.target.value);
              if (r) onSelectRegion(r);
            }}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0a1e36] dark:text-white outline-none cursor-pointer shadow-2xs"
          >
            {REGION_PRESETS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.province}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{selectedRegion.description}</p>
        </div>
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 p-1 gap-1 shrink-0 text-xs font-bold">
        <button
          onClick={() => setActiveTab('rain')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'rain'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>Hujan</span>
        </button>

        <button
          onClick={() => setActiveTab('boundary')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'boundary'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Batas & Polder</span>
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'impact'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Dampak</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'export'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* 3. SCROLLABLE TAB CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: HUJAN & PRESIPITASI */}
        {activeTab === 'rain' && (
          <div className="space-y-4">
            {/* Quick Rainfall Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Preset Intensitas Hujan (BMKG)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Hujan Sedang (25 mm/h)', val: 25 },
                  { label: 'Hujan Lebat (50 mm/h)', val: 50 },
                  { label: 'Sangat Lebat (100 mm/h)', val: 100 },
                  { label: 'Ekstrem (150 mm/h)', val: 150 },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => updateParam('rainfallIntensity', item.val)}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border text-left transition-all ${
                      params.rainfallIntensity === item.val
                        ? 'bg-sky-500 text-white border-sky-400 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Intensitas Hujan */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#0a1e36] dark:text-white text-xs">Intensitas Curah Hujan</span>
                <span className="font-mono font-extrabold text-sky-600 dark:text-sky-400 text-xs">
                  {params.rainfallIntensity} mm/jam
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={params.rainfallIntensity}
                onChange={(e) => updateParam('rainfallIntensity', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>10 mm/h</span>
                <span>100 mm/h</span>
                <span>200 mm/h</span>
              </div>
            </div>

            {/* Slider Durasi Hujan */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#0a1e36] dark:text-white text-xs">Durasi Hujan</span>
                <span className="font-mono font-extrabold text-sky-600 dark:text-sky-400 text-xs">
                  {params.durationHours} Jam
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={params.durationHours}
                onChange={(e) => updateParam('durationHours', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>1 Jam</span>
                <span>12 Jam</span>
                <span>24 Jam</span>
              </div>
            </div>

            {/* Total Akumulasi Curah Hujan Card */}
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-sky-800 dark:text-sky-300 font-bold uppercase">Total Akumulasi Hujan</div>
                <div className="text-base font-black text-sky-900 dark:text-sky-200">
                  {params.rainfallIntensity * params.durationHours} mm
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] px-2 py-0.5 rounded-md font-extrabold bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                  Kala Ulang Q{params.returnPeriod} Thn
                </span>
              </div>
            </div>

            {/* Tutupan Lahan & Infiltrasi */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Tutupan Lahan & Koefisien Limpasan (C)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { type: 'urban', label: 'Perkotaan (C=0.85)', c: 0.85, inf: 2 },
                  { type: 'suburban', label: 'Pemukiman (C=0.65)', c: 0.65, inf: 8 },
                  { type: 'agriculture', label: 'Pertanian (C=0.35)', c: 0.35, inf: 16 },
                  { type: 'forest', label: 'Hutan/Alami (C=0.15)', c: 0.15, inf: 25 },
                ].map((lc) => (
                  <button
                    key={lc.type}
                    onClick={() => {
                      updateParam('landCoverType', lc.type as SimulationParams['landCoverType']);
                      updateParam('runoffCoefficient', lc.c);
                      updateParam('infiltrationRate', lc.inf);
                    }}
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold border text-left transition-all ${
                      params.landCoverType === lc.type
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {lc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Infiltration Rate Slider (Technical Mode) */}
            {isTechnicalMode && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#0a1e36] dark:text-white text-xs">Laju Infiltrasi Tanah</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                    {params.infiltrationRate} mm/jam
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={params.infiltrationRate}
                  onChange={(e) => updateParam('infiltrationRate', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KONDISI BATAS & POLDER */}
        {activeTab === 'boundary' && (
          <div className="space-y-4">
            {/* Debit Aliran Hulu */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#0a1e36] dark:text-white text-xs">Debit Aliran Hulu Sungai</span>
                <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs">
                  {params.riverInflow} m³/s
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="25"
                value={params.riverInflow}
                onChange={(e) => updateParam('riverInflow', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>50 m³/s (Normal)</span>
                <span>800 m³/s (Banjir)</span>
                <span>1500 m³/s (Ekstrem)</span>
              </div>
            </div>

            {/* Pasang Air Laut / Rob */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#0a1e36] dark:text-white text-xs">Pasang Air Laut (Rob / Tidal Surge)</span>
                <span className="font-mono font-extrabold text-cyan-600 dark:text-cyan-400 text-xs">
                  +{params.tidalSurge} m
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2.5"
                step="0.1"
                value={params.tidalSurge}
                onChange={(e) => updateParam('tidalSurge', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>0.0 m (Surut)</span>
                <span>1.2 m (Pasang Purnama)</span>
                <span>2.5 m (Badai Ekstrem)</span>
              </div>
            </div>

            {/* Status Tanggul */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Integritas Tanggul & Perlindungan
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'intact', label: 'Tanggul Utuh', color: 'emerald' },
                  { key: 'overtopped', label: 'Air Meluap', color: 'amber' },
                  { key: 'breached', label: 'Tanggul Jebol', color: 'rose' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => updateParam('leveeStatus', item.key as SimulationParams['leveeStatus'])}
                    className={`py-2 px-1 text-center rounded-xl text-[10.5px] font-bold border transition-all ${
                      params.leveeStatus === item.key
                        ? item.key === 'breached'
                          ? 'bg-rose-500 text-white border-rose-400'
                          : item.key === 'overtopped'
                          ? 'bg-amber-500 text-white border-amber-400'
                          : 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kapasitas Pompa Pengendali */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#0a1e36] dark:text-white text-xs">Kapasitas Pompa Drainase</span>
                <span className="font-mono font-extrabold text-[#1f8080] text-xs">
                  {params.pumpCapacity} m³/s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="2"
                value={params.pumpCapacity}
                onChange={(e) => updateParam('pumpCapacity', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1f8080]"
              />
            </div>
          </div>
        )}

        {/* TAB 3: HASIL & DAMPAK */}
        {activeTab === 'impact' && (
          <div className="space-y-3">
            {results ? (
              <>
                {/* Hazard Level Badge Card */}
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    results.hazardCategory === 'Ekstrem'
                      ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
                      : results.hazardCategory === 'Tinggi'
                      ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200'
                      : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-extrabold uppercase">Tingkat Bahaya Simulasi</div>
                      <div className="text-sm font-black">Status {results.hazardCategory}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 dark:bg-black/40 border">
                    Kedalaman Maks: {results.maxDepth} m
                  </span>
                </div>

                {/* 6 Grid Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Luas Tergenang</span>
                    <span className="text-sm font-black text-sky-600 dark:text-sky-400">
                      {results.floodedAreaHa.toLocaleString('id-ID')} Ha
                    </span>
                    <span className="text-[10px] text-slate-500 block">({results.floodedAreaKm2} km²)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Populasi Terancam</span>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                      {results.affectedPopulation.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Jiwa butuh evakuasi</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Bangunan Terendam</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {results.affectedBuildings.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Unit Rumah & Gedung</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Fasum Terdampak</span>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                      {results.affectedSchools} Sek / {results.affectedHospitals} RS
                    </span>
                    <span className="text-[10px] text-slate-500 block">Sekolah & Faskes</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Jalan Terputus</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {results.inundatedRoadKm} km
                    </span>
                    <span className="text-[10px] text-slate-500 block">Ruas jalan lumpuh</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimasi Kerugian</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      Rp {results.economicLossBillion.toLocaleString('id-ID')} M
                    </span>
                    <span className="text-[10px] text-slate-500 block">Kerusakan fisik</span>
                  </div>
                </div>

                {/* SEPAKAT Bappenas Demographic Card */}
                {results.sepakatStats ? (
                  <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-teal-200/80 dark:border-teal-800/80 pb-1.5">
                      <div className="font-bold text-[#0a1e36] dark:text-white flex items-center gap-1.5 text-xs">
                        <span>🏛️</span>
                        <span>Demografi Riil SEPAKAT Bappenas</span>
                      </div>
                      <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-teal-200 dark:bg-teal-900 text-teal-900 dark:text-teal-200">
                        H3 Res-9
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                      <div className="flex justify-between py-0.5 border-b border-teal-100 dark:border-teal-900">
                        <span className="text-slate-600 dark:text-slate-400">👨 Laki-laki:</span>
                        <b className="text-slate-800 dark:text-slate-200">{results.sepakatStats.totalLakiLaki.toLocaleString('id-ID')}</b>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-teal-100 dark:border-teal-900">
                        <span className="text-slate-600 dark:text-slate-400">👩 Perempuan:</span>
                        <b className="text-slate-800 dark:text-slate-200">{results.sepakatStats.totalPerempuan.toLocaleString('id-ID')}</b>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-teal-100 dark:border-teal-900">
                        <span className="text-slate-600 dark:text-slate-400">👴 Lansia:</span>
                        <b className="text-amber-700 dark:text-amber-400">{results.sepakatStats.totalLansia.toLocaleString('id-ID')}</b>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-teal-100 dark:border-teal-900">
                        <span className="text-slate-600 dark:text-slate-400">🧒 Balita:</span>
                        <b className="text-rose-600 dark:text-rose-400">{results.sepakatStats.totalBalita.toLocaleString('id-ID')}</b>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-teal-100 dark:border-teal-900">
                        <span className="text-slate-600 dark:text-slate-400">♿ Disabilitas (PD1):</span>
                        <b className="text-cyan-600 dark:text-cyan-400">{results.sepakatStats.totalPd1.toLocaleString('id-ID')}</b>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-teal-100 dark:border-teal-900">
                        <span className="text-slate-600 dark:text-slate-400">📊 Disabilitas (PD2):</span>
                        <b className="text-purple-600 dark:text-purple-400">{results.sepakatStats.totalPd2.toLocaleString('id-ID')}</b>
                      </div>
                    </div>
                    <div className="flex justify-between pt-1 text-[11px] font-bold text-teal-950 dark:text-teal-100 border-t border-teal-200 dark:border-teal-800">
                      <span>🏠 Total Kepala Keluarga (KK):</span>
                      <span>{results.sepakatStats.totalKeluarga.toLocaleString('id-ID')} KK</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-500 dark:text-slate-400">Basis Data: Estimasi Spasial Exposure (BPS/BNPB)</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Land Cover
                    </span>
                  </div>
                )}

                {/* Mitigasi & Rekomendasi Box */}
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 space-y-1.5">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-xs">
                    <span>💡</span>
                    <span>Rekomendasi Respons Lapangan</span>
                  </div>
                  <ul className="list-disc pl-4 text-[10.5px] text-amber-800 dark:text-amber-300 space-y-1">
                    <li>Siapkan {Math.max(2, Math.round(results.affectedPopulation / 1200))} unit posko pengungsian sekunder.</li>
                    <li>Mobilisasi minimal {Math.max(4, Math.round(results.floodedAreaHa / 40))} unit perahu karet evakuasi.</li>
                    <li>Lakukan rekayasa lalu lintas di {results.inundatedRoadKm} km ruas jalan utama yang terancam tergenang.</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Activity className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
                <p className="font-bold text-xs">Belum ada hasil simulasi</p>
                <p className="text-[10.5px]">Klik tombol &quot;Jalankan Simulasi&quot; di bawah untuk menghitung dampak.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EXPORT & DATA */}
        {activeTab === 'export' && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <FileDown className="w-4 h-4 text-sky-500" />
                <span>Export Lapisan Spasial & Laporan</span>
              </div>
              <p className="text-[10.5px] text-slate-500">
                Unduh data poligon genangan hasil simulasi untuk diolah lebih lanjut di GIS (QGIS, ArcGIS) atau dipresentasikan.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={onExportGeoJson}
                  className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh GeoJSON Genangan (.geojson)</span>
                </button>

                <button
                  onClick={onExportReport}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Unduh Ringkasan Laporan (.json)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. BOTTOM PRIMARY ACTION BUTTON: RUN SIMULATION */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-2 shadow-lg">
        <button
          onClick={onResetParams}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Reset Parameter ke Default"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isSimulating
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isSimulating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Memproses Hidrodinamika...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Jalankan Simulasi Hidrodinamika</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
