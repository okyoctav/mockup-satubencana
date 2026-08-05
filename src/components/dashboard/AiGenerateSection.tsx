'use client';

import { useState } from 'react';
import { Bot, Send, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import { EstimationData } from './LogisticAnalysisSection';

interface Props {
  estimationData?: EstimationData | null;
}

export default function AiGenerateSection({ estimationData }: Props) {
  const [apiKey, setApiKey] = useState<string>('sk-69d85b197b53b2e9-6vjduo-ddf53562');
  const [endpoint, setEndpoint] = useState<string>('https://rzh4rfn.abc-tunnel.us/v1');
  const [selectedModel, setSelectedModel] = useState<string>('xai/grok-4');
  const [prompt, setPrompt] = useState<string>('Buatkan ringkasan rekomendasi analisis penanganan darurat bencana berdasarkan populasi terestimasi.');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; responseText?: string } | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Complete list of 24 models available on your 9Router tunnel
  const availableModels = [
    // { id: 'ag/gemini-3-flash', name: '⚡ Gemini 3 Flash (Fast)' },
    // { id: 'ag/gemini-3-flash-agent', name: '🤖 Gemini 3 Flash Agent' },
    // { id: 'ag/gemini-3.5-flash-low', name: '🔹 Gemini 3.5 Flash Low' },
    // { id: 'ag/gemini-3.5-flash-extra-low', name: '🔹 Gemini 3.5 Flash Extra Low' },
    // { id: 'ag/gemini-pro-agent', name: '🧠 Gemini Pro Agent' },
    // { id: 'ag/gemini-3.1-pro-low', name: '🧠 Gemini 3.1 Pro Low' },
    // { id: 'ag/claude-sonnet-4-6', name: '🟧 Claude Sonnet 4.6' },
    // { id: 'ag/claude-opus-4-6-thinking', name: '🎓 Claude Opus 4.6 (Thinking)' },
    // { id: 'ag/gpt-oss-120b-medium', name: '🟩 GPT-OSS 120B Medium' },
    { id: 'xai/grok-4', name: '🚀 Grok 4 (xAI)' },
    { id: 'xai/grok-4-fast-reasoning', name: '🚀 Grok 4 Fast Reasoning' },
    { id: 'xai/grok-code-fast-1', name: '💻 Grok Code Fast 1' },
    { id: 'xai/grok-3', name: '🚀 Grok 3 (xAI)' },
    { id: 'kimi/kimi-k3', name: '🌙 Kimi K3 (1M Context)' },
    { id: 'kimi/k3', name: '🌙 Kimi K3' },
    { id: 'kimi/kimi-for-coding', name: '💻 Kimi For Coding' },
    { id: 'kimi/kimi-for-coding-highspeed', name: '⚡ Kimi For Coding Highspeed' },
    { id: 'kimi/kimi-k2.7-code', name: '💻 Kimi K2.7 Code' },
    { id: 'kimi/kimi-k2.7-code-highspeed', name: '⚡ Kimi K2.7 Code Highspeed' },
    { id: 'kimi/kimi-k2.6', name: '🌙 Kimi K2.6' },
    { id: 'kimi/kimi-k2.5', name: '🌙 Kimi K2.5' },
    { id: 'kimi/kimi-k2.5-thinking', name: '🎓 Kimi K2.5 Thinking' },
    { id: 'kimi/kimi-latest', name: '🌙 Kimi Latest' },
  ];

  // Test tunnel connection & send completion request
  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setTestResult(null);

    const userMsg = prompt;
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setPrompt('');

    try {
      // Build contextual prompt if spatial estimation data exists
      let contextPrefix = '';
      if (estimationData) {
        contextPrefix = `[DATA SPASIAL BENCANA TERHUBUNG]\n` +
          `- Total Populasi: ${estimationData.totalPopulasi.toLocaleString('id')} jiwa\n` +
          `- Balita: ${estimationData.totalBalita.toLocaleString('id')}, Lansia: ${estimationData.totalLansia.toLocaleString('id')}\n` +
          `- Laki-laki: ${estimationData.totalLakiLaki.toLocaleString('id')}, Perempuan: ${estimationData.totalPerempuan.toLocaleString('id')}\n` +
          `- Disabilitas: ${estimationData.totalPd1 + estimationData.totalPd2} jiwa\n\n`;
      }

      const response = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'Anda adalah Asisten AI Antigravity untuk Penanggulangan Bencana Indonesia. Berikan analisis profesional, terstruktur, dan solutif.',
            },
            {
              role: 'user',
              content: `${contextPrefix}${userMsg}`,
            },
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const rawText = await response.text();
      let aiContent = '';

      // Handle standard JSON response or SSE stream lines
      if (rawText.trim().startsWith('{')) {
        const json = JSON.parse(rawText);
        aiContent = json.choices?.[0]?.message?.content || json.choices?.[0]?.delta?.content || 'Respons kosong dari AI';
      } else {
        // SSE format stream lines parsing
        const lines = rawText.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const chunk = JSON.parse(line.slice(6));
              const content = chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.message?.content || '';
              if (content) aiContent += content;
            } catch {
              // ignore parse errors
            }
          }
        }
        if (!aiContent) aiContent = rawText;
      }

      setChatHistory((prev) => [...prev, { role: 'assistant', content: aiContent }]);
      setTestResult({
        success: true,
        message: `Koneksi Tunnel 9Router Berhasil! (${selectedModel})`,
        responseText: aiContent,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error tidak diketahui';
      setTestResult({
        success: false,
        message: `Gagal menghubungkan 9Router: ${errMsg}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-[#19506e] via-[#1f8080] to-purple-800 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            <h2 className="font-bold text-lg tracking-tight">Generate AI (9Router Intelligence Tunnel)</h2>
          </div>
          <p className="text-xs text-slate-200">
            Modul pengujian integrasi AI kebencanaan via 9Router Tunnel HTTP API (`https://rzh4rfn.abc-tunnel.us/v1`).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Tunnel Active</span>
          </span>
        </div>
      </div>

      {/* CONFIG & TEST PANEL */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#19506e] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#1f8080]" />
            <span>⚙️ Pengaturan Tunnel & Model AI</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">9Router API Endpoint</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Tunnel Endpoint URL</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#1f8080]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Authorization Bearer Token</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#1f8080]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Pilih Model AI (9Router)</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STATUS TEST RESULT BADGE */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
            <span className="text-[10px] opacity-80 font-mono">STATUS: {testResult.success ? '200 OK' : 'FAILED'}</span>
          </div>
        )}
      </div>

      {/* CHAT & PROMPT GENERATOR INTERFACE (GEMINI STYLE) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 min-h-[400px] flex flex-col justify-between">
        {/* CHAT MESSAGES DISPLAY */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {chatHistory.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1f8080]/10 text-[#1f8080] flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Tes Pengujian AI 9Router Tunnel</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ketik pertanyaan atau instruksi analisis bencana di bawah ini. AI akan merespons menggunakan model <strong>{selectedModel}</strong> melalui tunnel 9Router.
              </p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 text-xs ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-[#19506e] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl max-w-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#19506e] text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-bl-none font-medium whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">
                    U
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 text-xs items-center text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60 w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-[#1f8080]" />
              <span>Memproses respons dari 9Router AI ({selectedModel})...</span>
            </div>
          )}
        </div>

        {/* INPUT PROMPT BOX & SEND BUTTON */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerateAI();
              }
            }}
            placeholder="Tanyakan analisis bencana atau instruksi AI di sini... (Shift + Enter untuk baris baru)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-[#1f8080] resize-none"
          />

          <button
            onClick={handleGenerateAI}
            disabled={loading || !prompt.trim()}
            className="px-5 py-3 rounded-xl bg-[#19506e] hover:bg-[#19506e]/90 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Kirim AI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
