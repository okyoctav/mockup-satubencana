'use client';

import { useEffect, useRef, useState } from 'react';

const PHASES = [
  {
    id: 'pra',
    label: 'Pra-Bencana',
    subtitle: 'Mitigasi & Kesiapsiagaan',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.25)',
    icon: '🛡️',
    description:
      'Identifikasi risiko lebih awal dengan analisis data historis, peta kerentanan, dan sistem peringatan dini berbasis AI. Kurangi dampak sebelum bencana terjadi.',
    features: [
      { label: 'Peta Risiko Multi-Bahaya', icon: '🗺️' },
      { label: 'Early Warning System', icon: '⚡' },
      { label: 'Analisis Kerentanan', icon: '📊' },
      { label: 'Simulasi Skenario', icon: '🔬' },
    ],
    stat: { value: '89%', label: 'akurasi prediksi risiko' },
    illustration: 'pra',
  },
  {
    id: 'saat',
    label: 'Saat Bencana',
    subtitle: 'Respons & Koordinasi',
    color: '#F97316',
    bgColor: 'rgba(249,115,22,0.08)',
    borderColor: 'rgba(249,115,22,0.25)',
    icon: '🚨',
    description:
      'Koordinasi respons real-time. Pantau situasi lapangan, distribusi bantuan, tracking tim SAR, dan status pengungsian dalam satu dashboard operasional.',
    features: [
      { label: 'Situasi Room Real-time', icon: '📡' },
      { label: 'Tracking Tim SAR', icon: '🚑' },
      { label: 'Logistik & Distribusi', icon: '📦' },
      { label: 'Data Pengungsi Terpadu', icon: '👥' },
    ],
    stat: { value: '<30 mnt', label: 'waktu respons rata-rata' },
    illustration: 'saat',
  },
  {
    id: 'pasca',
    label: 'Pasca-Bencana',
    subtitle: 'Pemulihan & Rekonstruksi',
    color: '#0EA5E9',
    bgColor: 'rgba(14,165,233,0.08)',
    borderColor: 'rgba(14,165,233,0.25)',
    icon: '🔄',
    description:
      'Analisis kerugian, validasi data lapangan, perencanaan rekonstruksi berbasis data, dan monitoring pemulihan jangka panjang per wilayah terdampak.',
    features: [
      { label: 'Asesmen Kerusakan', icon: '🏚️' },
      { label: 'Monitoring Pemulihan', icon: '📈' },
      { label: 'Laporan Otomatis', icon: '📋' },
      { label: 'Basis Data Luka/Jiwa', icon: '🏥' },
    ],
    stat: { value: '342+', label: 'kejadian terdokumentasi' },
    illustration: 'pasca',
  },
];

function PhaseIllustration({ type, color }: { type: string; color: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, []);

  if (type === 'pra') {
    return (
      <svg viewBox="0 0 200 160" className="w-full h-40">
        {/* Shield */}
        <path
          d="M100 20 L140 40 L140 90 Q140 130 100 145 Q60 130 60 90 L60 40 Z"
          fill={`${color}20`}
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M85 85 L95 95 L120 70"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Radar rings */}
        {[1, 2, 3].map((r) => (
          <circle
            key={r}
            cx="100"
            cy="85"
            r={r * 18}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            opacity={((tick % 3) === r - 1) ? 0.8 : 0.2}
          />
        ))}
        {/* Nodes */}
        {[[40, 40], [160, 35], [30, 120], [170, 115]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill={color} opacity="0.6" />
        ))}
        <text x="100" y="155" textAnchor="middle" fill={color} fontSize="9" opacity="0.7">
          MITIGASI AKTIF
        </text>
      </svg>
    );
  }

  if (type === 'saat') {
    return (
      <svg viewBox="0 0 200 160" className="w-full h-40">
        {/* Pulse circles */}
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx="100"
            cy="75"
            r={20 + i * 20}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            opacity={(tick % 3 === i) ? 0.9 : 0.15}
          />
        ))}
        {/* Center marker */}
        <circle cx="100" cy="75" r="10" fill={color} opacity="0.9" />
        <circle cx="100" cy="75" r="4" fill="#fff" />
        {/* Arrow lines */}
        {[[55, 35], [145, 35], [45, 115], [155, 115]].map(([x, y], i) => (
          <line
            key={i}
            x1={x}
            y1={y}
            x2="100"
            y2="75"
            stroke={color}
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.5"
          />
        ))}
        {/* Icons around */}
        {['🚑', '🚁', '⛑️', '📡'].map((emoji, i) => {
          const angle = (i * Math.PI) / 2 - Math.PI / 4;
          const r = 55;
          return (
            <text
              key={i}
              x={100 + r * Math.cos(angle)}
              y={75 + r * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
            >
              {emoji}
            </text>
          );
        })}
        <text x="100" y="148" textAnchor="middle" fill={color} fontSize="9" opacity="0.7">
          KOORDINASI REAL-TIME
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 160" className="w-full h-40">
      {/* Bar chart recovery */}
      {[30, 55, 75, 88, 95].map((h, i) => (
        <rect
          key={i}
          x={30 + i * 30}
          y={120 - (h * 0.8)}
          width="20"
          height={h * 0.8}
          rx="4"
          fill={color}
          opacity={0.3 + i * 0.14}
        />
      ))}
      {/* Trend line */}
      <polyline
        points="40,96 70,76 100,56 130,44 160,34"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots on line */}
      {[[40, 96], [70, 76], [100, 56], [130, 44], [160, 34]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={color} />
      ))}
      {/* Arrow up */}
      <text x="170" y="30" textAnchor="middle" fill={color} fontSize="14">
        ↗
      </text>
      <text x="100" y="148" textAnchor="middle" fill={color} fontSize="9" opacity="0.7">
        PEMULIHAN TERUKUR
      </text>
    </svg>
  );
}

function PhaseCard({ phase, index }: { phase: typeof PHASES[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="rounded-3xl p-6 md:p-8 transition-all duration-700"
      style={{
        backgroundColor: phase.bgColor,
        border: `1px solid ${phase.borderColor}`,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateY(0)'
          : index % 2 === 0
          ? 'translateY(40px)'
          : 'translateY(-40px)',
        transitionDelay: `${index * 150}ms`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className="text-3xl w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${phase.color}20` }}
        >
          {phase.icon}
        </div>
        <div>
          <div className="text-xs font-semibold tracking-widest mb-1" style={{ color: phase.color }}>
            {phase.subtitle.toUpperCase()}
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {phase.label}
          </h3>
        </div>
      </div>

      {/* Illustration */}
      <div
        className="rounded-2xl mb-5 p-4"
        style={{ backgroundColor: `${phase.color}08`, border: `1px solid ${phase.color}15` }}
      >
        <PhaseIllustration type={phase.illustration} color={phase.color} />
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
        {phase.description}
      </p>

      {/* Features */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {phase.features.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ backgroundColor: `${phase.color}10`, color: 'var(--text-feature)' }}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      {/* Stat */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ backgroundColor: `${phase.color}15`, border: `1px solid ${phase.color}20` }}
      >
        <span className="text-2xl font-bold" style={{ color: phase.color }}>
          {phase.stat.value}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {phase.stat.label}
        </span>
      </div>
    </div>
  );
}

export default function AnalysisSection() {
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setCtaVisible(true); },
      { threshold: 0.3 }
    );
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="dashboard-info"
      className="relative py-24 px-6"
      style={{ background: 'var(--section-gradient)' }}
    >
      {/* Section header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: '#0EA5E9' }}>
          SECTION 03 · ANALISIS KEBENCANAAN
        </p>
        <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Satu Platform,{' '}
          <span style={{
            background: 'linear-gradient(135deg, #22C55E, #0EA5E9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Tiga Fase
          </span>
        </h2>
        <p className="text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
          DataBencana menganalisis data dari hulu ke hilir — sebelum, selama, dan setelah kejadian —
          untuk pengambilan keputusan yang lebih cepat dan berbasis bukti.
        </p>
      </div>

      {/* Phase flow indicator */}
      <div className="flex items-center justify-center gap-2 mb-12 max-w-xl mx-auto">
        {PHASES.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2 flex-1">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}
            />
            <div className="text-xs font-semibold" style={{ color: p.color }}>
              {p.label}
            </div>
            {i < PHASES.length - 1 && (
              <div className="flex-1 h-px mx-1" style={{ backgroundColor: 'rgba(148,163,184,0.2)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Phase cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {PHASES.map((phase, i) => (
          <PhaseCard key={phase.id} phase={phase} index={i} />
        ))}
      </div>

      {/* CTA */}
      <div
        ref={ctaRef}
        className="text-center transition-all duration-700"
        style={{
          opacity: ctaVisible ? 1 : 0,
          transform: ctaVisible ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
          Siap menganalisis data bencana secara mendalam?
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-white text-lg transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #22C55E 100%)',
            boxShadow: '0 0 40px rgba(14,165,233,0.4), 0 0 80px rgba(34,197,94,0.15)',
          }}
        >
          <span>Buka Dashboard</span>
          <span className="text-xl">→</span>
        </a>
        <p className="text-xs mt-4" style={{ color: '#475569' }}>
          Akses gratis · Tidak perlu registrasi
        </p>
      </div>
    </section>
  );
}
