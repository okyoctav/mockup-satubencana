'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

interface BencanaData {
  Tahun: number;
  Provinsi: string;
  'Jenis Bencana': string;
  'Jumlah Kejadian': number;
  Meninggal: number;
  Hilang: number;
  'Luka / Sakit': number;
  menderita_mengungsi: number;
  'Rumah Rusak Berat': number;
  'Rumah Rusak Sedang': number;
  'Rumah Rusak Ringan': number;
  Kabupaten: string;
}

const BENCANA_COLORS: Record<string, string> = {
  'Semua': '#64748b',
  'Banjir': '#3B82F6',
  'Longsor': '#92400E',
  'Cuaca ekstrem': '#6366F1',
  'Kekeringan': '#D97706',
  'Kebakaran hutan dan lahan': '#EF4444',
  'Gempabumi': '#8B5CF6',
  'Gelombang pasang / Abrasi': '#06B6D4',
  'Erupsi gunung api': '#F97316',
  'Tsunami': '#0EA5E9'
};

export default function AnalysisDashboard() {
  const [data, setData] = useState<BencanaData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedJenis, setSelectedJenis] = useState<string>('Semua');
  const [selectedProvinsi, setSelectedProvinsi] = useState<string>('Semua');
  const [startTahun, setStartTahun] = useState<string>('');
  const [endTahun, setEndTahun] = useState<string>('');

  useEffect(() => {
    fetch('/20260505_072732.json')
      .then(res => res.json())
      .then((json) => {
        const rows: BencanaData[] = json.Sheet1 ?? json;
        setData(rows);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data', err);
        setLoading(false);
      });
  }, []);

  const availableTahun = useMemo(() => {
    const years = Array.from(new Set(data.map(d => d.Tahun))).filter(Boolean).sort();
    return years;
  }, [data]);

  useEffect(() => {
    if (availableTahun.length > 0 && !startTahun && !endTahun) {
      setStartTahun(availableTahun[0].toString());
      setEndTahun(availableTahun[availableTahun.length - 1].toString());
    }
  }, [availableTahun, startTahun, endTahun]);

  // Filters
  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (selectedJenis !== 'Semua' && d['Jenis Bencana'] !== selectedJenis) return false;
      if (selectedProvinsi !== 'Semua' && d.Provinsi !== selectedProvinsi) return false;
      if (startTahun && d.Tahun < parseInt(startTahun)) return false;
      if (endTahun && d.Tahun > parseInt(endTahun)) return false;
      return true;
    });
  }, [data, selectedJenis, selectedProvinsi, startTahun, endTahun]);

  const availableProvinsi = useMemo(() => {
    const dataForProvinsi = data.filter(d => {
       if (selectedJenis !== 'Semua' && d['Jenis Bencana'] !== selectedJenis) return false;
       return true;
    });
    return Array.from(new Set(dataForProvinsi.map(d => d.Provinsi))).filter(Boolean).sort();
  }, [data, selectedJenis]);

  // KPIs
  const totalKejadian = filteredData.reduce((sum, d) => sum + (d['Jumlah Kejadian'] || 0), 0);
  const totalMeninggal = filteredData.reduce((sum, d) => sum + (d.Meninggal || 0), 0);
  const totalMengungsi = filteredData.reduce((sum, d) => sum + (d.menderita_mengungsi || 0), 0);
  const totalRumahRusak = filteredData.reduce((sum, d) => sum + (d['Rumah Rusak Berat'] || 0) + (d['Rumah Rusak Sedang'] || 0) + (d['Rumah Rusak Ringan'] || 0), 0);

  // Line Chart
  const lineChartData = useMemo(() => {
    const agg: Record<number, number> = {};
    filteredData.forEach(d => {
      if (d.Tahun) {
        agg[d.Tahun] = (agg[d.Tahun] || 0) + (d['Jumlah Kejadian'] || 0);
      }
    });
    return Object.entries(agg).map(([year, total]) => ({
      year: parseInt(year),
      total
    })).sort((a, b) => a.year - b.year);
  }, [filteredData]);

  // Bar Chart Top Provinsi
  const barChartData = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredData.forEach(d => {
      if (d.Provinsi) {
        agg[d.Provinsi] = (agg[d.Provinsi] || 0) + (d['Jumlah Kejadian'] || 0);
      }
    });
    return Object.entries(agg)
      .map(([prov, total]) => ({ prov, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredData]);

  // Pie Chart Distribusi
  const pieChartData = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredData.forEach(d => {
      if (d['Jenis Bencana']) {
        agg[d['Jenis Bencana']] = (agg[d['Jenis Bencana']] || 0) + (d['Jumlah Kejadian'] || 0);
      }
    });
    return Object.entries(agg)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Summary Table Top Kab
  const topKabupaten = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredData.forEach(d => {
      if (d.Kabupaten) {
        agg[d.Kabupaten] = (agg[d.Kabupaten] || 0) + (d['Jumlah Kejadian'] || 0);
      }
    });
    return Object.entries(agg)
      .map(([kab, total]) => ({ kab, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ color: 'var(--text-primary)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'var(--text-primary)' }}></div>
      </div>
    );
  }

  const kpiStyle = { background: 'var(--bg-card)', border: '1px solid var(--border-faint)', color: 'var(--text-primary)' };
  const customTooltipStyle = { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-faint)' };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden p-4 gap-4 text-sm" style={{ color: 'var(--text-primary)' }}>
      {/* Filter Bar */}
      <div className="flex-none flex flex-col lg:flex-row gap-4 items-start lg:items-center p-3 rounded-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-faint)' }}>
        <div className="flex-1 flex flex-wrap gap-2">
          {Object.entries(BENCANA_COLORS).map(([jenis, color]) => (
            <button
              key={jenis}
              onClick={() => setSelectedJenis(jenis)}
              className="px-3 py-1 rounded-full border text-xs font-medium transition-colors"
              style={{
                backgroundColor: selectedJenis === jenis ? color : 'transparent',
                borderColor: color,
                color: selectedJenis === jenis ? '#fff' : color
              }}
            >
              {jenis}
            </button>
          ))}
        </div>
        <div className="flex gap-4 items-center">
          <select 
            value={selectedProvinsi} 
            onChange={(e) => setSelectedProvinsi(e.target.value)}
            className="p-1 rounded outline-none border"
            style={{ background: 'var(--bg-page)', borderColor: 'var(--border-faint)', color: 'var(--text-primary)' }}
          >
            <option value="Semua">Semua Provinsi</option>
            {availableProvinsi.map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <select
               value={startTahun}
               onChange={(e) => setStartTahun(e.target.value)}
               className="p-1 rounded outline-none border"
               style={{ background: 'var(--bg-page)', borderColor: 'var(--border-faint)', color: 'var(--text-primary)' }}
            >
               {availableTahun.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span>-</span>
            <select
               value={endTahun}
               onChange={(e) => setEndTahun(e.target.value)}
               className="p-1 rounded outline-none border"
               style={{ background: 'var(--bg-page)', borderColor: 'var(--border-faint)', color: 'var(--text-primary)' }}
            >
               {availableTahun.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="flex-none flex gap-4 h-[76px]">
        <div className="flex-1 rounded-md p-3 flex flex-col justify-center" style={kpiStyle}>
          <div style={{ color: 'var(--text-secondary)' }} className="text-xs">Total Kejadian</div>
          <div className="text-xl font-bold">{totalKejadian.toLocaleString()}</div>
        </div>
        <div className="flex-1 rounded-md p-3 flex flex-col justify-center" style={kpiStyle}>
          <div style={{ color: 'var(--text-secondary)' }} className="text-xs">Korban Meninggal</div>
          <div className="text-xl font-bold">{totalMeninggal.toLocaleString()}</div>
        </div>
        <div className="flex-1 rounded-md p-3 flex flex-col justify-center" style={kpiStyle}>
          <div style={{ color: 'var(--text-secondary)' }} className="text-xs">Menderita & Mengungsi</div>
          <div className="text-xl font-bold">{totalMengungsi.toLocaleString()}</div>
        </div>
        <div className="flex-1 rounded-md p-3 flex flex-col justify-center" style={kpiStyle}>
          <div style={{ color: 'var(--text-secondary)' }} className="text-xs">Rumah Rusak</div>
          <div className="text-xl font-bold">{totalRumahRusak.toLocaleString()}</div>
        </div>
      </div>

      {/* Row 1: Line Chart & Bar Chart */}
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 rounded-md p-4 flex flex-col" style={kpiStyle}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Tren Kejadian</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" />
                <XAxis dataKey="year" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="w-80 rounded-md p-4 flex flex-col" style={kpiStyle}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Top 10 Provinsi</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={barChartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" horizontal={true} vertical={false}/>
                <XAxis type="number" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                <YAxis type="category" dataKey="prov" stroke="var(--text-secondary)" tick={{fontSize: 10}} width={80} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="total" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Donut & Summary Table */}
      <div className="h-44 flex-none flex gap-4">
        <div className="w-72 rounded-md p-4 flex flex-col" style={kpiStyle}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Distribusi Jenis Bencana</h3>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BENCANA_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex-1 rounded-md p-4 flex flex-col" style={kpiStyle}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Top 5 Kabupaten by Total Kejadian</h3>
          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
             <div className="flex flex-col gap-2">
               {topKabupaten.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center p-2 rounded" style={{ background: 'var(--bg-page)' }}>
                    <span className="font-medium">{item.kab}</span>
                    <span className="font-bold">{item.total.toLocaleString()}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
