"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Key, Globe, ShieldAlert, CheckCircle, Code } from "lucide-react";

export default function ApiTestingPage() {
  const [app, setApp] = useState("bitung_kolut");
  const [individu, setIndividu] = useState("1");
  const [page, setPage] = useState("1");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);

  const handleTestApi = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/sepakat-proxy?app=${app}&individu=${individu}&page=${page}`);
      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memanggil proxy API";
      setResult({ error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard_k5"
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-sky-400 text-xs font-bold tracking-wider uppercase mb-1">
                <Globe className="w-3.5 h-3.5" />
                <span>API Testing Module</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Pengujian Endpoint BAPPENAS SEPAKAT
              </h1>
            </div>
          </div>

          <button
            onClick={handleTestApi}
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold text-sm shadow-lg hover:shadow-sky-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Testing API..." : "Jalankan Pengujian API"}</span>
          </button>
        </div>

        {/* Info Card Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-4 h-4" />
              <span>Target Endpoint API</span>
            </div>
            <p className="text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-slate-300 break-all">
              https://sepakat.bappenas.go.id/pk-api/
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Key className="w-4 h-4" />
              <span>Otentikasi Basic Auth</span>
            </div>
            <div className="text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-slate-300 space-y-1">
              <div>User: <span className="text-emerald-400 font-bold">27082026</span></div>
              <div>Pass: <span className="text-emerald-400 font-bold">sepakat@2026</span></div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Code className="w-4 h-4" />
              <span>Parameter Request</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">APP</label>
                <input
                  value={app}
                  onChange={(e) => setApp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">INDIVIDU</label>
                <input
                  value={individu}
                  onChange={(e) => setIndividu(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">PAGE</label>
                <input
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Code className="w-4 h-4 text-[#0EA5E9]" />
              <span>Hasil Pengujian Respon API Proxy</span>
            </h3>
            {result && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  result.status === 200 && !result.isCloudflareBlocked
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}
              >
                {result.status === 200 && !result.isCloudflareBlocked ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Status HTTP {result.status} OK</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Status {result.status || "Response Checked"}</span>
                  </>
                )}
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="py-12 text-center text-slate-500 text-sm italic">
              Klik tombol <span className="text-sky-400 font-bold">Jalankan Pengujian API</span> di atas untuk menguji konektivitas endpoint BAPPENAS SEPAKAT.
            </div>
          )}

          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-sky-400">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold tracking-wider uppercase">Menghubungi Endpoint Proxy Server...</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.isCloudflareBlocked && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-2 text-amber-400 text-sm">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Proteksi Cloudflare Managed Challenge Terdeteksi</span>
                  </div>
                  <p className="leading-relaxed">
                    Server BAPPENAS SEPAKAT mengembalikan halaman proteksi Cloudflare Turnstile/Bot Protection (HTTP 200 HTML Challenge page) sebelum mengizinkan payload JSON.
                  </p>
                </div>
              )}

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-x-auto">
                <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Format Content-Type: <span className="text-sky-400 font-mono">{result.contentType || "N/A"}</span>
                </div>
                <pre className="text-xs font-mono text-slate-300 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
                  {typeof result.rawResponse === "string"
                    ? result.rawResponse
                    : JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
