"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Key,
  Globe,
  ShieldAlert,
  CheckCircle,
  Code,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Layers,
  Save,
  FileJson,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface BigTokenResponse {
  token: string;
  expires: number;
  ssl: boolean;
  updatedAt?: string;
  isValid?: boolean;
}

export default function ApiTestingPage() {
  const [activeTab, setActiveTab] = useState<"big" | "sepakat">("big");

  // ==================== BIG TOKEN STATES ====================
  const [bigTokenData, setBigTokenData] = useState<BigTokenResponse | null>(null);
  const [loadingBig, setLoadingBig] = useState(true);
  const [savingBig, setSavingBig] = useState(false);
  const [testingBig, setTestingBig] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string; details?: any } | null>(null);
  const [saveAlert, setSaveAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Form states
  const [inputMode, setInputMode] = useState<"form" | "json">("form");
  const [formToken, setFormToken] = useState("");
  const [formExpires, setFormExpires] = useState<number | string>("");
  const [formSsl, setFormSsl] = useState<boolean>(true);
  const [rawJsonInput, setRawJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");

  // ==================== BAPPENAS SEPAKAT STATES ====================
  const [app, setApp] = useState("bitung_kolut");
  const [individu, setIndividu] = useState("1");
  const [page, setPage] = useState("1");
  const [loadingSepakat, setLoadingSepakat] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resultSepakat, setResultSepakat] = useState<any>(null);

  // Load BIG Token on Mount
  const fetchBigToken = async () => {
    setLoadingBig(true);
    setSaveAlert(null);
    try {
      const res = await fetch("/api/big-token", { cache: "no-store" });
      const data = await res.json();
      if (data && data.token) {
        setBigTokenData(data);
        setFormToken(data.token);
        setFormExpires(data.expires);
        setFormSsl(data.ssl !== undefined ? Boolean(data.ssl) : true);
        setRawJsonInput(
          JSON.stringify(
            {
              token: data.token,
              expires: data.expires,
              ssl: data.ssl !== undefined ? Boolean(data.ssl) : true,
            },
            null,
            2
          )
        );
      }
    } catch (err) {
      console.error("Gagal mengambil token BIG:", err);
    } finally {
      setLoadingBig(false);
    }
  };

  useEffect(() => {
    fetchBigToken();
  }, []);

  // Format Helper Functions
  const formatEpochDate = (epochMs: number | string | undefined): string => {
    if (!epochMs) return "—";
    const num = Number(epochMs);
    if (isNaN(num) || num <= 0) return "Format tidak valid";
    try {
      return new Date(num).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB";
    } catch {
      return String(epochMs);
    }
  };

  const calculateRemainingTime = (epochMs: number | string | undefined): { text: string; isExpired: boolean } => {
    if (!epochMs) return { text: "Tidak diketahui", isExpired: true };
    const num = Number(epochMs);
    if (isNaN(num)) return { text: "Tidak valid", isExpired: true };
    const diff = num - Date.now();
    if (diff <= 0) {
      return { text: "Sudah Kadaluarsa", isExpired: true };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) {
      return { text: `${days} hari ${hours} jam lagi`, isExpired: false };
    }
    return { text: `${hours} jam ${minutes} menit lagi`, isExpired: false };
  };

  // Preset Buttons for Expires
  const handleApplyPreset = (hoursToAdd: number) => {
    const newExpires = Date.now() + hoursToAdd * 60 * 60 * 1000;
    setFormExpires(newExpires);
  };

  // Test Token Connectivity
  const handleTestBigToken = async () => {
    setTestingBig(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/big-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          token: formToken || bigTokenData?.token,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menguji koneksi token";
      setTestResult({ valid: false, message: msg });
    } finally {
      setTestingBig(false);
    }
  };

  // Save Token Form
  const handleSaveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formToken.trim()) {
      setSaveAlert({ type: "error", message: "Token BIG tidak boleh kosong!" });
      return;
    }

    let parsedExpires = Number(formExpires);
    if (isNaN(parsedExpires) || parsedExpires <= 0) {
      parsedExpires = Date.now() + 24 * 60 * 60 * 1000;
    }

    setSavingBig(true);
    setSaveAlert(null);
    try {
      const res = await fetch("/api/big-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formToken.trim(),
          expires: parsedExpires,
          ssl: Boolean(formSsl),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveAlert({
          type: "success",
          message: "Token BIG berhasil diperbarui dan disimpan secara permanen!",
        });
        setBigTokenData({
          token: data.token,
          expires: data.expires,
          ssl: data.ssl,
          updatedAt: data.updatedAt,
          isValid: true,
        });
        setRawJsonInput(
          JSON.stringify(
            {
              token: data.token,
              expires: data.expires,
              ssl: data.ssl,
            },
            null,
            2
          )
        );
      } else {
        setSaveAlert({
          type: "error",
          message: data.error || data.message || "Gagal menyimpan token.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kesalahan server saat menyimpan token";
      setSaveAlert({ type: "error", message: msg });
    } finally {
      setSavingBig(false);
    }
  };

  // Parse & Save JSON
  const handleSaveJson = async () => {
    setJsonError("");
    try {
      const parsed = JSON.parse(rawJsonInput);
      if (!parsed.token || typeof parsed.token !== "string") {
        setJsonError("Objek JSON harus memiliki properti 'token' (string)!");
        return;
      }
      const tokenVal = parsed.token.trim();
      const expiresVal = Number(parsed.expires) || Date.now() + 24 * 60 * 60 * 1000;
      const sslVal = parsed.ssl !== undefined ? Boolean(parsed.ssl) : true;

      setFormToken(tokenVal);
      setFormExpires(expiresVal);
      setFormSsl(sslVal);

      // Submit
      setSavingBig(true);
      setSaveAlert(null);
      const res = await fetch("/api/big-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenVal,
          expires: expiresVal,
          ssl: sslVal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveAlert({
          type: "success",
          message: "Objek JSON berhasil diekstrak dan disimpan ke server!",
        });
        setBigTokenData({
          token: data.token,
          expires: data.expires,
          ssl: data.ssl,
          updatedAt: data.updatedAt,
          isValid: true,
        });
      } else {
        setSaveAlert({
          type: "error",
          message: data.error || data.message || "Gagal menyimpan token dari JSON.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sintaks JSON tidak valid!";
      setJsonError(msg);
    } finally {
      setSavingBig(false);
    }
  };

  const handleCopyToken = () => {
    if (bigTokenData?.token) {
      navigator.clipboard.writeText(bigTokenData.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // ==================== BAPPENAS SEPAKAT HANDLER ====================
  const handleTestSepakat = async () => {
    setLoadingSepakat(true);
    setResultSepakat(null);
    try {
      const res = await fetch(`/api/sepakat-proxy?app=${app}&individu=${individu}&page=${page}`);
      const data = await res.json();
      setResultSepakat(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memanggil proxy API";
      setResultSepakat({ error: msg });
    } finally {
      setLoadingSepakat(false);
    }
  };

  const remainingInfo = calculateRemainingTime(bigTokenData?.expires);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95 shadow-md"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold tracking-wider uppercase mb-1">
                <Key className="w-3.5 h-3.5" />
                <span>Manajemen API & Token Integrasi</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Konfigurasi Token & Pengujian Endpoint
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBigToken}
              disabled={loadingBig}
              className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-md"
              title="Muat ulang status token saat ini"
            >
              <RefreshCw className={`w-4 h-4 ${loadingBig ? "animate-spin text-sky-400" : ""}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("big")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "big"
                ? "bg-[#0a1e36] text-white border border-sky-500/40 shadow-lg shadow-sky-950/40"
                : "bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Token BIG (Geoservices BIG)</span>
            {bigTokenData && (
              <span
                className={`w-2 h-2 rounded-full ${
                  remainingInfo.isExpired ? "bg-rose-500" : "bg-emerald-400 animate-pulse"
                }`}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("sepakat")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "sepakat"
                ? "bg-[#0a1e36] text-white border border-sky-500/40 shadow-lg shadow-sky-950/40"
                : "bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Globe className="w-4 h-4 text-teal-400" />
            <span>Pengujian BAPPENAS SEPAKAT</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: TOKEN BIG MANAGEMENT */}
        {/* ============================================================ */}
        {activeTab === "big" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Save Feedback Alert */}
            {saveAlert && (
              <div
                className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 animate-in slide-in-from-top-2 duration-200 ${
                  saveAlert.type === "success"
                    ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                    : "bg-rose-950/40 border-rose-800/80 text-rose-300"
                }`}
              >
                {saveAlert.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div className="flex-1">{saveAlert.message}</div>
              </div>
            )}

            {/* Current Token Status Card */}
            <div className="bg-[#0a1e36]/70 border border-sky-900/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shadow-inner">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Status Token BIG Aktif</span>
                      <span
                        className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                          remainingInfo.isExpired
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {remainingInfo.isExpired ? "Kadaluarsa" : "Aktif / Terdaftar"}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300">
                      Digunakan oleh seluruh layer MapServer & Vector Tile RBI, Peta Dasar, dan Fasum BIG
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestBigToken}
                    disabled={testingBig}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingBig ? "animate-spin" : ""}`} />
                    <span>{testingBig ? "Menguji ke Server..." : "Uji Koneksi BIG"}</span>
                  </button>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Sisa Masa Berlaku</span>
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      remainingInfo.isExpired ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {remainingInfo.text}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Waktu Kadaluarsa</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    {formatEpochDate(bigTokenData?.expires)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    ({bigTokenData?.expires || "0"})
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>Protokol SSL</span>
                  </div>
                  <div className="text-sm font-bold text-teal-300">
                    {bigTokenData?.ssl !== false ? "HTTPS (ssl: true)" : "HTTP (ssl: false)"}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                    <span>Terakhir Disimpan</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-300">
                    {bigTokenData?.updatedAt ? new Date(bigTokenData.updatedAt).toLocaleTimeString("id-ID") : "—"}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {bigTokenData?.updatedAt ? new Date(bigTokenData.updatedAt).toLocaleDateString("id-ID") : "—"}
                  </div>
                </div>
              </div>

              {/* Token String Preview */}
              <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    String Token Aktif:
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedToken ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Token</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-300 break-all bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 select-all max-h-24 overflow-y-auto">
                  {bigTokenData?.token || "Belum ada token tersimpan"}
                </div>
              </div>

              {/* Test Connection Live Result */}
              {testResult && (
                <div
                  className={`mt-4 p-4 rounded-2xl border text-xs font-medium space-y-1.5 animate-in fade-in duration-200 ${
                    testResult.valid
                      ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                      : "bg-rose-950/40 border-rose-800 text-rose-200"
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    {testResult.valid ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Koneksi Server BIG Berhasil!</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Koneksi Server BIG Gagal!</span>
                      </>
                    )}
                  </div>
                  <p className="leading-relaxed">{testResult.message}</p>
                  {testResult.details && (
                    <pre className="text-[10px] font-mono bg-black/40 p-2 rounded-lg text-slate-300 overflow-x-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Form Update Token BIG */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Pembaruan Token BIG</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Masukkan token, waktu kadaluarsa (expires), dan status ssl untuk memperbarui token BIG
                  </p>
                </div>

                {/* Mode Selector */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setInputMode("form")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      inputMode === "form"
                        ? "bg-[#0a1e36] text-white border border-sky-500/40 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Formulir Input
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("json")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      inputMode === "json"
                        ? "bg-[#0a1e36] text-white border border-sky-500/40 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>Paste JSON</span>
                  </button>
                </div>
              </div>

              {/* MODE 1: FORMULIR INPUT */}
              {inputMode === "form" ? (
                <form onSubmit={handleSaveForm} className="space-y-4">
                  {/* Token Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        1. String Token BIG <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10.5px] text-slate-500 font-mono">
                        {formToken.length} karakter
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={formToken}
                      onChange={(e) => setFormToken(e.target.value)}
                      placeholder="Paste token BIG di sini (cth: -1djg_mpMNlhZJXNYZBJo8fjwPVW8QVh7hhgEcjm4ebj9xcgdy9sB_rXgmpsgYomCCuoEWZjhxs...)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all leading-relaxed"
                      required
                    />
                  </div>

                  {/* Expires Field & Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        2. Waktu Kadaluarsa (Timestamp / Epoch Milliseconds){" "}
                        <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-amber-400">
                        {formatEpochDate(formExpires)}
                      </span>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mb-2">
                      <input
                        type="number"
                        value={formExpires}
                        onChange={(e) => setFormExpires(e.target.value)}
                        placeholder="Cth: 1795150289776"
                        className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        required
                      />
                      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(2)}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors whitespace-nowrap"
                        >
                          +2 Jam
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(24)}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors whitespace-nowrap"
                        >
                          +24 Jam
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(24 * 7)}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors whitespace-nowrap"
                        >
                          +7 Hari
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(24 * 365)}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors whitespace-nowrap"
                        >
                          +1 Tahun
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SSL Field */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        3. Protokol SSL (HTTPS)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Gunakan enkripsi SSL/HTTPS untuk request geoservices BIG (Direkomendasikan: Aktif)
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formSsl}
                        onChange={(e) => setFormSsl(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={savingBig}
                      className="px-6 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingBig ? "Menyimpan Token..." : "Simpan & Terapkan Token BIG"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* MODE 2: PASTE JSON OBJECT */
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Paste Objek JSON Token BIG (token, expires, ssl):
                    </label>
                    <textarea
                      rows={6}
                      value={rawJsonInput}
                      onChange={(e) => {
                        setRawJsonInput(e.target.value);
                        setJsonError("");
                      }}
                      placeholder={`{\n  "token": "-1djg_mpMNlhZJXNYZBJo8fjwPVW8QVh7hhgEcjm4ebj9xcgdy9sB...",\n  "expires": 1795150289776,\n  "ssl": true\n}`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-mono text-sky-300 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all leading-relaxed"
                    />
                    {jsonError && (
                      <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                        <span>⚠️</span> {jsonError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Sistem akan langsung mem-parsing properti <code>token</code>, <code>expires</code>, dan <code>ssl</code>.
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveJson}
                      disabled={savingBig}
                      className="px-6 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingBig ? "Memproses..." : "Ekstrak & Simpan JSON"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: BAPPENAS SEPAKAT API TESTER */}
        {/* ============================================================ */}
        {activeTab === "sepakat" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Action */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-400" />
                  <span>Pengujian Koneksi BAPPENAS SEPAKAT</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Uji keterjangkauan endpoint proxy PK-API BAPPENAS dari server WebGIS
                </p>
              </div>

              <button
                onClick={handleTestSepakat}
                disabled={loadingSepakat}
                className="px-5 py-2.5 rounded-2xl bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-sky-500/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSepakat ? "animate-spin" : ""}`} />
                <span>{loadingSepakat ? "Testing API..." : "Jalankan Pengujian API"}</span>
              </button>
            </div>

            {/* Info Card Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div>
                    User: <span className="text-emerald-400 font-bold">27082026</span>
                  </div>
                  <div>
                    Pass: <span className="text-emerald-400 font-bold">sepakat@2026</span>
                  </div>
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
                {resultSepakat && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      resultSepakat.status === 200 && !resultSepakat.isCloudflareBlocked
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {resultSepakat.status === 200 && !resultSepakat.isCloudflareBlocked ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Status HTTP {resultSepakat.status} OK</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Status {resultSepakat.status || "Response Checked"}</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              {!resultSepakat && !loadingSepakat && (
                <div className="py-12 text-center text-slate-500 text-sm italic">
                  Klik tombol <span className="text-sky-400 font-bold">Jalankan Pengujian API</span> di atas untuk menguji konektivitas endpoint BAPPENAS SEPAKAT.
                </div>
              )}

              {loadingSepakat && (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 text-sky-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-bold tracking-wider uppercase">
                    Menghubungi Endpoint Proxy Server...
                  </span>
                </div>
              )}

              {resultSepakat && (
                <div className="space-y-4">
                  {resultSepakat.isCloudflareBlocked && (
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
                      Format Content-Type:{" "}
                      <span className="text-sky-400 font-mono">
                        {resultSepakat.contentType || "N/A"}
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-slate-300 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
                      {typeof resultSepakat.rawResponse === "string"
                        ? resultSepakat.rawResponse
                        : JSON.stringify(resultSepakat, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
