export function SiteHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Admin Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Halo, Admin 👋</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Pantau ringkasan operasional, navigasi modul, dan lihat data penting dalam satu tampilan.</p>
      </div>
      <div className="rounded-3xl bg-slate-900 px-5 py-4 text-sm text-white shadow-sm">
        Update terakhir: 15 Juli 2026, 08:40 WIB
      </div>
    </div>
  )
}
