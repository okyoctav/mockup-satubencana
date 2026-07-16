const chartBars = [42, 68, 54, 76, 64, 88]
const chartPoints = chartBars.map((height, index) => `${40 + index * 62},${110 - height * 0.8}`).join(" ")

export function ChartAreaInteractive() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tren kejadian</h2>
          <p className="text-sm text-slate-500">Visualisasi modern dari data mingguan</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Mingguan</span>
      </div>

      <div className="mt-6 rounded-3xl bg-slate-900 p-4">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Perkembangan aktifitas</span>
          <span className="rounded-full bg-white/10 px-3 py-1">+18%</span>
        </div>
        <svg viewBox="0 0 420 140" className="mt-4 h-40 w-full">
          <defs>
            <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <line x1="20" y1="110" x2="400" y2="110" stroke="#334155" strokeWidth="1" />
          <line x1="20" y1="70" x2="400" y2="70" stroke="#334155" strokeWidth="1" strokeDasharray="5 5" />
          <polyline points={chartPoints} fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
          <path d={`M 40,110 L ${chartPoints} L 380,110 Z`} fill="url(#chartFill)" />
          {chartBars.map((height, index) => {
            const x = 40 + index * 62
            const y = 110 - height * 0.8
            return <circle key={`${height}-${index}`} cx={x} cy={y} r="5" fill="#f8fafc" stroke="#38bdf8" strokeWidth="3" />
          })}
        </svg>
      </div>
    </div>
  )
}
