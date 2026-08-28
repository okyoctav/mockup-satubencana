import { useState } from 'react';
import { Bot, Send, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Cpu, ChevronDown, ChevronUp, Save, Trash2, PieChart } from 'lucide-react';
import { EstimationData } from './LogisticAnalysisSection';

interface Props {
  estimationData?: EstimationData | null;
}

// Rich Markdown Table & Content Formatter
function renderFormattedMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (keyIndex: number) => {
    if (tableRows.length > 0 || tableHeader.length > 0) {
      elements.push(
        <div key={`table-wrapper-${keyIndex}`} className="my-3 overflow-x-auto rounded-2xl border border-slate-200/80 shadow-xs bg-white">
          <table className="w-full text-xs text-left border-collapse">
            {tableHeader.length > 0 && (
              <thead className="bg-[#19506e] text-white font-bold">
                <tr>
                  {tableHeader.map((h, hIdx) => (
                    <th key={hIdx} className="px-3.5 py-2.5 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      {h.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 hover:bg-slate-100/50'}>
                  {row.map((cell, cIdx) => {
                    const isTotal = row[0]?.toLowerCase().includes('total');
                    const isHighlight = cIdx === 1 || cIdx === 2;
                    return (
                      <td
                        key={cIdx}
                        className={`px-3.5 py-2 text-xs ${
                          isTotal ? 'font-bold text-[#19506e] bg-slate-100/60' : 'text-slate-700'
                        } ${isHighlight && !isTotal ? 'font-semibold text-slate-900' : ''}`}
                      >
                        {cell.trim()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableHeader = [];
    tableRows = [];
    inTable = false;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1);
      if (cells.every((c) => c.trim().replace(/-/g, '') === '')) {
        return;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable(i);
    }

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="font-bold text-slate-800 text-xs mt-3 mb-1.5 flex items-center gap-1.5">{line.replace('### ', '')}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="font-bold text-slate-900 text-xs mt-3.5 mb-1.5 text-[#19506e] border-b border-slate-200 pb-1 flex items-center gap-1.5">{line.replace('## ', '')}</h3>);
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="font-bold text-slate-900 text-sm mt-4 mb-2 text-[#19506e] flex items-center gap-2">{line.replace('# ', '')}</h2>);
      return;
    }

    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-bold text-[#19506e]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-xs my-1 text-slate-700">
          {formattedLine}
        </li>
      );
      return;
    }

    if (!trimmed) {
      elements.push(<div key={i} className="h-1.5" />);
      return;
    }

    elements.push(<p key={i} className="my-1 leading-relaxed">{formattedLine}</p>);
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return elements;
}

export default function AiGenerateSection({ estimationData }: Props) {
  const [apiKey, setApiKey] = useState<string>('sk-69d85b197b53b2e9-6vjduo-ddf53562');
  const [endpoint, setEndpoint] = useState<string>('https://rzh4rfn.abc-tunnel.us/v1');
  const [selectedModel, setSelectedModel] = useState<string>('ag/gpt-oss-120b-medium');
  const [maxTokens, setMaxTokens] = useState<number>(4096);
  const [prompt, setPrompt] = useState<string>('Buatkan ringkasan rekomendasi analisis penanganan darurat bencana berdasarkan populasi terestimasi.');
  
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; responseText?: string } | null>(null);

  // LocalStorage Persistence for Chat History
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('antigravity_ai_chat_history');
      if (saved) {
        try { return JSON.parse(saved); } catch { /* ignore */ }
      }
    }
    return [];
  });

  const saveChatHistory = (history: { role: 'user' | 'assistant'; content: string }[]) => {
    setChatHistory(history);
    if (typeof window !== 'undefined') {
      localStorage.setItem('antigravity_ai_chat_history', JSON.stringify(history));
    }
  };

  const handleClearHistory = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat percakapan AI?')) {
      setChatHistory([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('antigravity_ai_chat_history');
      }
    }
  };

  const handleExportText = () => {
    if (chatHistory.length === 0) return;
    const textContent = chatHistory.map((m) => `[${m.role.toUpperCase()}]\n${m.content}\n`).join('\n----------------------------------------\n\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Riwayat_Chat_AI_Antigravity_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const availableModels = [
    { id: 'ag/gemini-3-flash', name: '⚡ Gemini 3 Flash (Fast)' },
    { id: 'ag/gemini-3-flash-agent', name: '🤖 Gemini 3 Flash Agent' },
    { id: 'ag/gemini-3.5-flash-low', name: '🔹 Gemini 3.5 Flash Low' },
    { id: 'ag/gemini-3.5-flash-extra-low', name: '🔹 Gemini 3.5 Flash Extra Low' },
    { id: 'ag/gemini-pro-agent', name: '🧠 Gemini Pro Agent' },
    { id: 'ag/gemini-3.1-pro-low', name: '🧠 Gemini 3.1 Pro Low' },
    { id: 'ag/claude-sonnet-4-6', name: '🟧 Claude Sonnet 4.6' },
    { id: 'ag/claude-opus-4-6-thinking', name: '🎓 Claude Opus 4.6 (Thinking)' },
    { id: 'ag/gpt-oss-120b-medium', name: '🟩 GPT-OSS 120B Medium' }
  ];

  const handleGenerateAI = async (customPromptText?: string) => {
    const userMsg = customPromptText || prompt;
    if (!userMsg.trim()) return;
    setLoading(true);
    setTestResult(null);

    const updatedUserList = [...chatHistory, { role: 'user' as const, content: userMsg }];
    saveChatHistory(updatedUserList);
    setPrompt('');

    try {
      let contextPrefix = '';
      if (estimationData && estimationData.totalPopulasi > 0) {
        const kelListStr = (estimationData.kelurahanDampak ?? [])
          .map((k) => `${k.namaKelurahan} (${k.namaKabupaten || k.namaKecamatan || ''})`)
          .join(', ');
        const sekolahListStr = (estimationData.sekolahDampak ?? [])
          .map((s) => `${s.nama} [${s.bentuk}]`)
          .slice(0, 8)
          .join(', ');

        contextPrefix = `[DATA SIMULASI SPASIAL SPESIFIK BENCANA - SANGAT PENTING]\n` +
          `Sistem telah mendeteksi area poligon bencana dengan data terhitung:\n` +
          `- Total Populasi Terdampak: ${estimationData.totalPopulasi.toLocaleString('id')} jiwa (${estimationData.totalKeluarga.toLocaleString('id')} KK)\n` +
          `- Rincian Kependudukan: Laki-laki ${estimationData.totalLakiLaki.toLocaleString('id')} jiwa | Perempuan ${estimationData.totalPerempuan.toLocaleString('id')} jiwa\n` +
          `- Kelompok Rentan: Balita ${estimationData.totalBalita.toLocaleString('id')} jiwa | Lansia ${estimationData.totalLansia.toLocaleString('id')} jiwa\n` +
          `- Disabilitas: PD1 Berat ${(estimationData.totalPd1 || 0).toLocaleString('id')} jiwa | PD2 Sedang ${(estimationData.totalPd2 || 0).toLocaleString('id')} jiwa\n` +
          (kelListStr ? `- Kelurahan/Desa Terdampak: ${kelListStr}\n` : '') +
          (sekolahListStr ? `- Fasilitas Sekolah Terdampak: ${sekolahListStr}\n` : '') +
          `Gunakan data riil di atas secara konsisten untuk menjawab pertanyaan berikut.\n\n`;
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
              content: 'Anda adalah Asisten AI Antigravity untuk Penanggulangan Bencana Indonesia. WAJIB sajikan data kuantitatif populasi, gender, dan kelompok rentan dalam TABEL MARKDOWN STANDAR (| Kategori | Jumlah | Persentase |) yang rapi, indah, dan terstruktur. Berikan analisis profesional, terstruktur, berbasis data riil spasial bencana, dan solutif.',
            },
            {
              role: 'user',
              content: `${contextPrefix}${userMsg}`,
            },
          ],
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const rawText = await response.text();
      let aiContent = '';

      if (rawText.trim().startsWith('{')) {
        const json = JSON.parse(rawText);
        aiContent = json.choices?.[0]?.message?.content || json.choices?.[0]?.delta?.content || 'Respons kosong dari AI';
      } else {
        const lines = rawText.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const chunk = JSON.parse(line.slice(6));
              const content = chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.message?.content || '';
              if (content) aiContent += content;
            } catch {
              /* ignore */
            }
          }
        }
        if (!aiContent) aiContent = rawText;
      }

      saveChatHistory([...updatedUserList, { role: 'assistant' as const, content: aiContent }]);
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

  const handleGenerateInfographic = () => {
    const promptText = "Buatkan infografis visual terstruktur lengkap dengan tabel profil populasi terdampak, rincian gender, dan diagram persentase kelompok rentan.";
    handleGenerateAI(promptText);
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

      {/* ACTIVE SPATIAL SIMULATION DATA BANNER */}
      {estimationData && estimationData.totalPopulasi > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              📊
            </div>
            <div>
              <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-2">
                <span>Peta Terhubung: Data Simulasi Poligon Terdeteksi</span>
                <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                  {estimationData.totalPopulasi.toLocaleString('id')} Jiwa
                </span>
              </h4>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Balita: {estimationData.totalBalita.toLocaleString('id')} | Lansia: {estimationData.totalLansia.toLocaleString('id')} | Disabilitas: {(estimationData.totalPd1 || 0) + (estimationData.totalPd2 || 0)} | Kel/Desa: {estimationData.kelurahanDampak?.length || 0} Wilayah
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-300 px-3 py-1 rounded-xl shadow-2xs">
            ✨ Otomatis Disuntikkan ke AI Prompt
          </span>
        </div>
      )}

      {/* CONFIG & TEST PANEL */}
      <div className="bg-[#19506e]/5 border border-[#19506e]/20 rounded-2xl overflow-hidden transition-all shadow-xs">
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between transition-colors border-b border-slate-200/60"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs text-[#19506e] tracking-wide uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#1f8080]" />
              <span>⚙️ Pengaturan Tunnel & Model AI</span>
            </span>
            <span className="text-[10px] bg-[#1f8080]/10 text-[#1f8080] font-semibold px-2 py-0.5 rounded-md border border-[#1f8080]/20 font-mono">
              {selectedModel} • {endpoint}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span>{isConfigOpen ? 'Sembunyikan' : 'Buka Pengaturan API'}</span>
            {isConfigOpen ? <ChevronUp className="w-4 h-4 text-[#19506e]" /> : <ChevronDown className="w-4 h-4 text-[#19506e]" />}
          </div>
        </button>

        {isConfigOpen && (
          <div className="p-5 space-y-4 bg-white border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tunnel Endpoint URL</label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#1f8080]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Authorization Bearer Token</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#1f8080]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Pilih Model AI (9Router)</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Batas Maksimum Output Token</label>
                <select
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#1f8080]"
                >
                  <option value={1000}>1.000 Token (~800 Kata)</option>
                  <option value={2048}>2.048 Token (~1.600 Kata)</option>
                  <option value={4096}>4.096 Token (~3.200 Kata - Default)</option>
                  <option value={8192}>8.192 Token (~6.400 Kata - Sangat Panjang)</option>
                  <option value={16384}>16.384 Token (~13.000 Kata - Laporan Lengkap)</option>
                </select>
              </div>
            </div>

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
        )}
      </div>

      {/* CHAT & PROMPT INTERFACE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 min-h-[400px] flex flex-col justify-between">
        {/* CHAT HEADER TOOLBAR */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#19506e]" />
            <h3 className="font-bold text-xs text-slate-800 tracking-tight">Sesi Dialog & Analisis Kebencanaan</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {chatHistory.length} Pesan
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateInfographic}
              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <PieChart className="w-3.5 h-3.5 text-purple-600" />
              <span>📊 Buat Infografis</span>
            </button>

            <button
              onClick={handleExportText}
              disabled={chatHistory.length === 0}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-40"
              title="Simpan Riwayat Chat ke Laptop (.txt)"
            >
              <Save className="w-3.5 h-3.5 text-slate-600" />
              <span>Simpan Chat</span>
            </button>

            <button
              onClick={handleClearHistory}
              disabled={chatHistory.length === 0}
              className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all disabled:opacity-40"
              title="Hapus Riwayat Chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES DISPLAY */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {chatHistory.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1f8080]/10 text-[#1f8080] flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Tes Pengujian AI 9Router Tunnel</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ketik pertanyaan atau instruksi analisis bencana di bawah ini. AI akan merespons menggunakan model <strong>{selectedModel}</strong> dengan format tabel dan ringkasan yang rapi.
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
                  className={`p-4 rounded-2xl max-w-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#19506e] text-white rounded-br-none font-medium'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-none shadow-2xs space-y-1'
                  }`}
                >
                  {msg.role === 'assistant' ? renderFormattedMarkdown(msg.content) : msg.content}
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

        {/* INPUT PROMPT BOX */}
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
            onClick={() => handleGenerateAI()}
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
