'use client';

import Link from 'next/link';
import { AdminLayout } from '@/app/admin/AdminLayout';

export default function AdminPage() {
  const quickLinks = [
    {
      label: 'Dashboard Bencana',
      desc: 'Pantau kondisi terkini dan tren kejadian bencana.',
      href: '/dashboard',
      accent: 'from-blue-500 to-cyan-500',
      meta: 'Real-time monitoring',
    },
    {
      label: 'Management Data',
      desc: 'Kelola daftar data, metadata, dan referensi geospasial.',
      href: '/management',
      accent: 'from-violet-500 to-fuchsia-500',
      meta: 'Data & metadata',
    },
  ];

  const stats = [
    { label: 'Kejadian hari ini', value: '24', hint: '+12% dari minggu lalu', tone: 'text-emerald-600' },
    { label: 'Wilayah terdampak', value: '18', hint: '3 prioritas tinggi', tone: 'text-amber-600' },
    { label: 'Data terverifikasi', value: '93%', hint: 'Pembaruan 10 menit lalu', tone: 'text-sky-600' },
  ];

  const activity = [
    'Pembaruan data wilayah Jawa Barat selesai',
    '3 laporan kejadian sedang diverifikasi',
    'Metadata layer terbaru sudah siap',
  ];

  const priorities = [
    { label: 'Jawa Barat', value: 'Tinggi', tone: 'text-amber-600' },
    { label: 'Sulawesi Selatan', value: 'Sedang', tone: 'text-sky-600' },
    { label: 'Papua', value: 'Waspada', tone: 'text-emerald-600' },
  ];

  const chartBars = [42, 68, 54, 76, 64, 88];

  return (
    <AdminLayout title="Dashboard Bencana" subtitle="Panel kontrol admin">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Selamat datang</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Halo, Admin 👋</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Anda dapat memantau ringkasan operasional, menavigasi data bencana, dan mengakses modul pengelolaan dari satu dashboard.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">
              Update terakhir: 15 Juli 2026, 08:40 WIB
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
              <p className={`mt-1 text-sm ${stat.tone}`}>{stat.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Tren kejadian</h3>
                  <p className="text-sm text-slate-500">Visualisasi sederhana dari data mingguan</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Mingguan</span>
              </div>

              <div className="mt-6 flex h-44 items-end gap-3">
                {chartBars.map((height, index) => (
                  <div key={`${height}-${index}`} className="flex-1">
                    <div
                      className="rounded-t-2xl bg-gradient-to-t from-slate-900 to-sky-500"
                      style={{ height: `${height}%` }}
                    />
                    <div className="mt-2 text-center text-xs text-slate-500">M{index + 1}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group block rounded-3xl border border-slate-200 bg-gradient-to-br ${item.accent} p-[1px] shadow-sm`}
                >
                  <div className="rounded-[calc(1.5rem-1px)] bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{item.meta}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.label}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
                        Buka
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Aktivitas terbaru</h3>
                  <p className="text-sm text-slate-500">Ringkasan status operasional</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">Normal</span>
              </div>

              <ul className="mt-4 space-y-3">
                {activity.map((item) => (
                  <li key={item} className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-900" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Prioritas wilayah</h3>
                  <p className="text-sm text-slate-500">Daftar wilayah dengan perhatian utama</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {priorities.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className={`font-medium ${item.tone}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
