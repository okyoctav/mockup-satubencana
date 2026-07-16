import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import { SectionCards } from '@/components/section-cards';
import { SiteHeader } from '@/components/site-header';

import data from './data.json';

const navItems = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Simulasi K3', href: '/admin/simulasi-k3' },
  { label: 'Management', href: '/management' },
  { label: 'Users & Roles', href: '/admin/roles' },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Admin</p>
                <h1 className="mt-4 text-3xl font-semibold text-slate-900">Dashboard</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">Kontrol operasional dan pemantauan data bencana dalam satu tampilan.</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Menu cepat</p>
                <div className="mt-4 space-y-2">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-900"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Status ringkas</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>Data terbaru: 15 Juli 2026</p>
                  <p>Koneksi: stabil</p>
                  <p>Update otomatis setiap 10 menit</p>
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <SiteHeader />

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Ikhtisar</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">Operasional hari ini</h2>
                  </div>
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Terbaru</div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <SectionCards />
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">Ringkasan prioritas</h3>
                  <p className="mt-2 text-sm text-slate-500">Titik fokus utama operasional dan mitigasi.</p>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700">Wilayah dengan prioritas tinggi</p>
                      <p className="mt-2 text-sm text-slate-600">Jawa Barat, Sulawesi Selatan, dan Papua.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700">Informasi penting</p>
                      <p className="mt-2 text-sm text-slate-600">Pembaruan data telah diterapkan dan siap ditinjau.</p>
                    </div>
                  </div>
                </div>

                <ChartAreaInteractive />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Data tabel</p>
                  <h2 className="text-2xl font-semibold text-slate-900">Kejadian terbaru</h2>
                </div>
                <div className="text-sm text-slate-500">Menampilkan ringkasan data bencana terkini.</div>
              </div>
              <div className="mt-6 overflow-x-auto">
                <DataTable data={data} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
