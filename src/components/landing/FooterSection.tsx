'use client';

const MITRA = [
  { nama: 'BNPB', kepanjangan: 'Badan Nasional Penanggulangan Bencana', url: 'https://bnpb.go.id' },
  { nama: 'BPBD', kepanjangan: 'Badan Penanggulangan Bencana Daerah', url: '#' },
  { nama: 'BMKG', kepanjangan: 'Badan Meteorologi, Klimatologi, dan Geofisika', url: 'https://bmkg.go.id' },
  { nama: 'BIG', kepanjangan: 'Badan Informasi Geospasial', url: 'https://big.go.id' },
  { nama: 'BRIN', kepanjangan: 'Badan Riset dan Inovasi Nasional', url: 'https://brin.go.id' },
  { nama: 'PMI', kepanjangan: 'Palang Merah Indonesia', url: 'https://pmi.or.id' },
];

const LINKS = {
  Platform: [
    { label: 'Landing Page', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Peta Bencana', href: '#peta' },
    { label: 'Analisis Data', href: '#dashboard-info' },
  ],
  Sumber: [
    { label: 'Data BNPB', href: 'https://bnpb.go.id/datainformasi/data-bencana' },
    { label: 'GeoJSON BIG', href: 'https://big.go.id' },
    { label: 'Data BMKG', href: 'https://bmkg.go.id' },
    { label: 'Open Data Bencana', href: '#' },
  ],
  Informasi: [
    { label: 'Tentang Proyek', href: '#' },
    { label: 'Metodologi', href: '#' },
    { label: 'Kontak', href: '#' },
    { label: 'Kebijakan Data', href: '#' },
  ],
};

export default function FooterSection() {
  return (
    <footer
      id="footer"
      className="relative pt-20 pb-8"
      style={{
        background: 'var(--footer-bg)',
        borderTop: '1px solid var(--border-faint)',
      }}
    >
      {/* Glow top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, #0EA5E9, transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #0EA5E9, #22C55E)' }}
              >
                🌋
              </div>
              <div>
                <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>DataBencana</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sistem Analisis Nasional</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
              Platform geospasial terpadu untuk manajemen dan analisis data bencana nasional.
              Mendukung pengambilan keputusan berbasis data dari pra hingga pasca-bencana.
            </p>
            {/* Status indicator */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs"
              style={{
                backgroundColor: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                color: '#22C55E',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              Sistem Aktif · Data Diperbarui Setiap Jam
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                {group}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors duration-200 hover:text-sky-400"
                      style={{ color: 'var(--text-muted)' }}
                      {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mitra section */}
        <div className="mb-12">
          <h4 className="text-xs font-semibold tracking-widest mb-6 text-center" style={{ color: 'var(--text-secondary)' }}>
            MITRA & ORGANISASI TERLIBAT
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {MITRA.map((m) => (
              <a
                key={m.nama}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                title={m.kepanjangan}
                className="rounded-2xl px-4 py-4 text-center transition-all duration-200 hover:scale-105 group"
                style={{
                  backgroundColor: 'var(--mitra-bg)',
                  border: '1px solid var(--mitra-border)',
                }}
              >
                <div
                  className="text-lg font-bold mb-1 transition-colors group-hover:text-sky-400"
                  style={{ color: 'var(--text-feature)' }}
                >
                  {m.nama}
                </div>
                <div className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
                  {m.kepanjangan.split(', ').slice(0, 2).join(', ')}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="rounded-2xl p-6 mb-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          style={{
            backgroundColor: 'var(--mitra-bg)',
            border: '1px solid var(--mitra-border)',
          }}
        >
          {[
            { value: '342', label: 'Kejadian 2024', color: '#0EA5E9' },
            { value: '38', label: 'Provinsi', color: '#22C55E' },
            { value: '127', label: 'Jiwa Terdampak', color: '#EF4444' },
            { value: '89.340', label: 'Pengungsi', color: '#F97316' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6"
          style={{ borderTop: '1px solid var(--border-faint)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © 2026 DataBencana — Sistem Analisis Data Bencana Nasional. Semua hak dilindungi.
          </p>
          <div className="flex items-center gap-4">
            {['Kebijakan Privasi', 'Syarat Penggunaan', 'API'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs transition-colors hover:text-sky-400"
                style={{ color: 'var(--text-muted)' }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
