'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import bencanaData from '@/data/bencana.json';

type KejadianBase = {
  provinsi: string;
  kabupaten: string;
  lat: number;
  lng: number;
};

// Build lookup dari bencana.json langsung
const allKejadian = bencanaData.kejadian as KejadianBase[];

// Unique provinsi sorted A-Z
const PROVINSI_LIST = Array.from(new Set(allKejadian.map((k) => k.provinsi))).sort((a, b) =>
  a.localeCompare(b, 'id')
);

// Kabupaten per provinsi
const KAB_BY_PROV: Record<string, { nama: string; lat: number; lng: number }[]> = {};
for (const k of allKejadian) {
  if (!KAB_BY_PROV[k.provinsi]) KAB_BY_PROV[k.provinsi] = [];
  if (!KAB_BY_PROV[k.provinsi].find((x) => x.nama === k.kabupaten)) {
    KAB_BY_PROV[k.provinsi].push({ nama: k.kabupaten, lat: k.lat, lng: k.lng });
  }
}
for (const arr of Object.values(KAB_BY_PROV)) {
  arr.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
}

// Center of provinsi = average lat/lng of its records
const PROV_CENTER: Record<string, { lat: number; lng: number }> = {};
for (const prov of PROVINSI_LIST) {
  const recs = allKejadian.filter((k) => k.provinsi === prov);
  const lat = recs.reduce((s, r) => s + r.lat, 0) / recs.length;
  const lng = recs.reduce((s, r) => s + r.lng, 0) / recs.length;
  PROV_CENTER[prov] = { lat, lng };
}

// Pemetaan Kode Kemendagri 2-digit resmi untuk 38 Provinsi Indonesia
export const KODE_KEMENDAGRI_PROVINSI: Record<string, string> = {
  'ACEH': '11',
  'SUMATERA UTARA': '12',
  'SUMATERA BARAT': '13',
  'RIAU': '14',
  'JAMBI': '15',
  'SUMATERA SELATAN': '16',
  'BENGKULU': '17',
  'LAMPUNG': '18',
  'KEPULAUAN BANGKA BELITUNG': '19',
  'KEPULAUAN RIAU': '21',
  'DKI JAKARTA': '31',
  'JAWA BARAT': '32',
  'JAWA TENGAH': '33',
  'DI YOGYAKARTA': '34',
  'DAERAH ISTIMEWA YOGYAKARTA': '34',
  'D.I. YOGYAKARTA': '34',
  'JAWA TIMUR': '35',
  'BANTEN': '36',
  'BALI': '51',
  'NUSA TENGGARA BARAT': '52',
  'NUSA TENGGARA TIMUR': '53',
  'KALIMANTAN BARAT': '61',
  'KALIMANTAN TENGAH': '62',
  'KALIMANTAN SELATAN': '63',
  'KALIMANTAN TIMUR': '64',
  'KALIMANTAN UTARA': '65',
  'SULAWESI UTARA': '71',
  'SULAWESI TENGAH': '72',
  'SULAWESI SELATAN': '73',
  'SULAWESI TENGGARA': '74',
  'GORONTALO': '75',
  'SULAWESI BARAT': '76',
  'MALUKU': '81',
  'MALUKU UTARA': '82',
  'PAPUA BARAT': '91',
  'PAPUA': '92',
  'PAPUA SELATAN': '93',
  'PAPUA TENGAH': '94',
  'PAPUA PEGUNUNGAN': '95',
  'PAPUA BARAT DAYA': '96',
};

export type FilterWilayah =
  | { tipe: 'provinsi'; nama: string; kodeKemendagri?: string; lat: number; lng: number }
  | { tipe: 'kabupaten'; nama: string; provinsi: string; kodeKemendagri?: string; lat: number; lng: number };

interface Props {
  onSelect: (w: FilterWilayah | null) => void;
  theme: string;
}

export default function WilayahDropdown({ onSelect, theme }: Props) {
  const [selectedProv, setSelectedProv] = useState('');
  const [selectedKab, setSelectedKab] = useState('');

  // Dropdown open states
  const [isProvOpen, setIsProvOpen] = useState(false);
  const [isKabOpen, setIsKabOpen] = useState(false);

  // Search input queries inside dropdowns
  const [provSearch, setProvSearch] = useState('');
  const [kabSearch, setKabSearch] = useState('');

  const provRef = useRef<HTMLDivElement>(null);
  const kabRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // List kabupaten for currently selected provinsi
  const kabList = useMemo(
    () => (selectedProv ? KAB_BY_PROV[selectedProv] ?? [] : []),
    [selectedProv]
  );

  // Filtered lists based on search inputs
  const filteredProvList = useMemo(() => {
    if (!provSearch.trim()) return PROVINSI_LIST;
    const query = provSearch.toLowerCase();
    return PROVINSI_LIST.filter((p) => {
      const kode = KODE_KEMENDAGRI_PROVINSI[p.toUpperCase()] || '';
      return p.toLowerCase().includes(query) || kode.includes(query);
    });
  }, [provSearch]);

  const filteredKabList = useMemo(() => {
    if (!kabSearch.trim()) return kabList;
    const query = kabSearch.toLowerCase();
    return kabList.filter((k) => k.nama.toLowerCase().includes(query));
  }, [kabList, kabSearch]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (provRef.current && !provRef.current.contains(e.target as Node)) {
        setIsProvOpen(false);
      }
      if (kabRef.current && !kabRef.current.contains(e.target as Node)) {
        setIsKabOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProvSelect = (prov: string) => {
    setSelectedProv(prov);
    setSelectedKab('');
    setIsProvOpen(false);
    setProvSearch('');
    setKabSearch('');

    if (!prov) {
      onSelect(null);
      return;
    }

    const c = PROV_CENTER[prov];
    const kode = KODE_KEMENDAGRI_PROVINSI[prov.toUpperCase()] || '';
    onSelect({ tipe: 'provinsi', nama: prov, kodeKemendagri: kode, lat: c.lat, lng: c.lng });
  };

  const handleKabSelect = (kab: string) => {
    setSelectedKab(kab);
    setIsKabOpen(false);
    setKabSearch('');

    if (!kab) {
      const c = PROV_CENTER[selectedProv];
      const kode = KODE_KEMENDAGRI_PROVINSI[selectedProv.toUpperCase()] || '';
      onSelect({ tipe: 'provinsi', nama: selectedProv, kodeKemendagri: kode, lat: c.lat, lng: c.lng });
      return;
    }

    const found = kabList.find((k) => k.nama === kab);
    if (!found) return;
    const kode = KODE_KEMENDAGRI_PROVINSI[selectedProv.toUpperCase()] || '';
    onSelect({
      tipe: 'kabupaten',
      nama: kab,
      provinsi: selectedProv,
      kodeKemendagri: kode,
      lat: found.lat,
      lng: found.lng,
    });
  };

  const handleClear = () => {
    setSelectedProv('');
    setSelectedKab('');
    setIsProvOpen(false);
    setIsKabOpen(false);
    setProvSearch('');
    setKabSearch('');
    onSelect(null);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] whitespace-nowrap">
        Filter:
      </span>

      {/* 1. PROVINSI SEARCH SELECT DROPDOWN */}
      <div className="relative min-w-[190px]" ref={provRef}>
        <button
          type="button"
          onClick={() => {
            setIsProvOpen(!isProvOpen);
            setIsKabOpen(false);
          }}
          className={`w-full h-8 px-3 rounded-xl border flex items-center justify-between gap-2 font-bold text-left transition-all ${
            isDark
              ? 'bg-slate-900/90 border-slate-700 text-slate-100 hover:border-[#1f8080]'
              : 'bg-white border-slate-200 text-slate-800 hover:border-[#1f8080] shadow-xs'
          }`}
        >
          <span className="truncate">
            {selectedProv ? (
              <span>
                <span className="text-[#1f8080] font-mono mr-1">
                  [{KODE_KEMENDAGRI_PROVINSI[selectedProv.toUpperCase()] || '34'}]
                </span>
                {selectedProv}
              </span>
            ) : (
              <span className="text-slate-400 font-normal">— Semua Provinsi —</span>
            )}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Dropdown Menu Panel */}
        {isProvOpen && (
          <div
            className={`absolute left-0 top-9 z-[9999] w-64 rounded-2xl shadow-2xl border p-2 space-y-2 animate-in fade-in duration-100 ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Cari provinsi / kode..."
                value={provSearch}
                onChange={(e) => setProvSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#1f8080]'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#1f8080]'
                }`}
              />
            </div>

            {/* List Items */}
            <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
              <button
                type="button"
                onClick={() => handleProvSelect('')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                  !selectedProv
                    ? 'bg-[#1f8080]/15 text-[#1f8080] font-bold'
                    : isDark
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>— Semua Provinsi —</span>
                {!selectedProv && <Check className="w-3.5 h-3.5 text-[#1f8080]" />}
              </button>

              {filteredProvList.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">Provinsi tidak ditemukan</div>
              ) : (
                filteredProvList.map((p) => {
                  const kode = KODE_KEMENDAGRI_PROVINSI[p.toUpperCase()] || '';
                  const isSelected = selectedProv === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProvSelect(p)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1f8080]/15 text-[#1f8080] font-bold'
                          : isDark
                          ? 'hover:bg-slate-800 text-slate-200'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">
                        {kode && <span className="font-mono text-[#1f8080] mr-1.5">[{kode}]</span>}
                        {p}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#1f8080] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. KABUPATEN / KOTA SEARCH SELECT DROPDOWN */}
      <div className="relative min-w-[190px]" ref={kabRef}>
        <button
          type="button"
          disabled={!selectedProv}
          onClick={() => {
            setIsKabOpen(!isKabOpen);
            setIsProvOpen(false);
          }}
          className={`w-full h-8 px-3 rounded-xl border flex items-center justify-between gap-2 font-bold text-left transition-all ${
            !selectedProv
              ? 'opacity-45 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
              : isDark
              ? 'bg-slate-900/90 border-slate-700 text-slate-100 hover:border-[#1f8080]'
              : 'bg-white border-slate-200 text-slate-800 hover:border-[#1f8080] shadow-xs'
          }`}
        >
          <span className="truncate">
            {selectedKab ? (
              <span>{selectedKab}</span>
            ) : (
              <span className="text-slate-400 font-normal">— Semua Kab/Kota —</span>
            )}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>

        {/* Dropdown Menu Panel */}
        {isKabOpen && selectedProv && (
          <div
            className={`absolute left-0 top-9 z-[9999] w-64 rounded-2xl shadow-2xl border p-2 space-y-2 animate-in fade-in duration-100 ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Cari kab/kota..."
                value={kabSearch}
                onChange={(e) => setKabSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#1f8080]'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#1f8080]'
                }`}
              />
            </div>

            {/* List Items */}
            <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
              <button
                type="button"
                onClick={() => handleKabSelect('')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                  !selectedKab
                    ? 'bg-[#1f8080]/15 text-[#1f8080] font-bold'
                    : isDark
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>— Semua Kab/Kota —</span>
                {!selectedKab && <Check className="w-3.5 h-3.5 text-[#1f8080]" />}
              </button>

              {filteredKabList.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">Kabupaten/Kota tidak ditemukan</div>
              ) : (
                filteredKabList.map((k) => {
                  const isSelected = selectedKab === k.nama;
                  return (
                    <button
                      key={k.nama}
                      type="button"
                      onClick={() => handleKabSelect(k.nama)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#1f8080]/15 text-[#1f8080] font-bold'
                          : isDark
                          ? 'hover:bg-slate-800 text-slate-200'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{k.nama}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#1f8080] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. RESET CLEAR FILTER BUTTON */}
      {(selectedProv || selectedKab) && (
        <button
          type="button"
          onClick={handleClear}
          title="Reset Filter Wilayah"
          className="h-8 px-2.5 rounded-xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold transition-colors flex items-center gap-1 shadow-xs"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
