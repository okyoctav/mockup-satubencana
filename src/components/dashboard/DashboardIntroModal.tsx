'use client';

import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface DashboardIntroModalProps {
  isOpen: boolean;
  onCloseTemporarily: () => void;
  onDismissPermanently: () => void;
}

export default function DashboardIntroModal({
  isOpen,
  onCloseTemporarily,
  onDismissPermanently
}: DashboardIntroModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseTemporarily();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onCloseTemporarily]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-xl flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-[#cbd5e1] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f8fafc] transition-all"
      >
        {/* ============================================================
            1. MODAL HEADER (SOLID RGB GRADIENT, NO BADGES)
            ============================================================ */}
        <div
          className="text-white px-5 sm:px-6 py-4 border-b border-[#0f3750] flex items-center justify-between gap-4 shrink-0 shadow-sm"
          style={{
            background: 'linear-gradient(135deg, rgb(25, 79, 112), rgb(15, 55, 80))'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#225779] border border-[#35729c] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Dashboard Manajemen Data Bencana (MDB)
              </h2>
            </div>
          </div>

          {/* Quick Close (Temporary) */}
          <button
            onClick={onCloseTemporarily}
            className="w-8 h-8 rounded-lg bg-[#225779] hover:bg-[#b91c1c] text-white flex items-center justify-center transition-colors border border-[#35729c] shrink-0 cursor-pointer"
            title="Tutup sementara (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================
            2. CONTENT BODY (CONCISE AS REQUESTED BY USER)
            ============================================================ */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-4 sm:p-5 rounded-xl bg-[#f8fafc] dark:bg-[#1e293b] border border-[#cbd5e1] dark:border-[#334155] flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#00695c] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm leading-relaxed text-[#1e293b] dark:text-[#f1f5f9]">
                Dashboard <strong>Manajemen Data Bencana (MDB)</strong> adalah platform komando geospasial terintegrasi yang dikembangkan untuk mempercepat pengambilan keputusan, pemodelan skenario kontinjensi, dan orkestrasi respon tanggap darurat kebencanaan di seluruh Indonesia.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================
            3. MODAL ACTION FOOTER (2 BUTTONS SPECIFIED BY USER)
            ============================================================ */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#f1f5f9] dark:bg-[#0f172a] border-t border-[#cbd5e1] dark:border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-[#64748b] dark:text-[#94a3b8] font-medium text-center sm:text-left">
            <span>Dapat dibuka kembali via tombol </span>
            <strong className="text-[#00695c] dark:text-[#2dd4bf]">&ldquo;Panduan Dashboard&rdquo;</strong>
            <span> di atas.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* BUTTON 2: HANYA CLOSE (AKAN MUNCUL KEMBALI SAAT BUKA HALAMAN) */}
            <button
              type="button"
              onClick={onCloseTemporarily}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-[#cbd5e1] dark:border-[#475569] bg-white dark:bg-[#1e293b] hover:bg-[#e2e8f0] dark:hover:bg-[#334155] text-[#334155] dark:text-[#e2e8f0] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="Tutup sekarang (akan muncul lagi saat halaman dibuka kembali)"
            >
              <X className="w-3.5 h-3.5 text-[#64748b]" />
              <span>Tutup Sementara</span>
            </button>

            {/* BUTTON 1: SUDAH PAHAM (TIDAK AKAN MUNCUL LAGI) */}
            <button
              type="button"
              onClick={onDismissPermanently}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#00695c] hover:bg-[#004d40] text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer border border-[#00695c]"
              title="Saya sudah paham dan jangan tampilkan modal ini lagi"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Paham, Jangan Tampilkan Lagi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
