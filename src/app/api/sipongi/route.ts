import { NextResponse } from "next/server";
import { fetchUpstreamJson } from "@/lib/upstreamFetch";

export const dynamic = "force-dynamic";

const memoryCache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_TTL_MS = 5 * 60 * 1000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "sebaran";

  let targetUrl = "";

  if (action === "sebaran") {
    const late = searchParams.get("late") || "24";
    const satelit = searchParams.get("satelit") || "all-nasa";
    const confidence = searchParams.get("confidence") || "all";
    const provinsi = searchParams.get("provinsi") || "all";
    targetUrl = `https://opsroom.sipongidata.my.id/api/sebaran?late=${encodeURIComponent(late)}&satelit=${encodeURIComponent(satelit)}&confidence=${encodeURIComponent(confidence)}&provinsi=${encodeURIComponent(provinsi)}`;
  } else if (action === "grafik_hotspot") {
    const text = searchParams.get("text") || "NASA-TERRA/AQUA";
    const satelit = searchParams.get("satelit") || "NASA-MODIS";
    const tahun = searchParams.get("tahun") || "2026";
    targetUrl = `https://opsroom.sipongidata.my.id/api/grafik/hotspot?text=${encodeURIComponent(text)}&satelit=${encodeURIComponent(satelit)}&tahun=${encodeURIComponent(tahun)}`;
  } else if (action === "luas_provinsi") {
    const tahunAwal = searchParams.get("tahunAwal") || "2015";
    const tahunAkhir = searchParams.get("tahunAkhir") || "2026";
    targetUrl = `https://opsroom.sipongidata.my.id/api/list/luas-kebakaran/provinsi?tahunAwal=${encodeURIComponent(tahunAwal)}&tahunAkhir=${encodeURIComponent(tahunAkhir)}`;
  } else if (action === "luas_kabupaten") {
    const provinsi = searchParams.get("provinsi") || "all";
    const tahunAwal = searchParams.get("tahunAwal") || "2015";
    const tahunAkhir = searchParams.get("tahunAkhir") || "2026";
    targetUrl = `https://opsroom.sipongidata.my.id/api/list/luas-kebakaran/kabupaten?provinsi=${encodeURIComponent(provinsi)}&tahunAwal=${encodeURIComponent(tahunAwal)}&tahunAkhir=${encodeURIComponent(tahunAkhir)}`;
  } else {
    return NextResponse.json(
      { error: "Action parameter tidak valid" },
      { status: 400 },
    );
  }

  const cacheKey = targetUrl;
  const cached = memoryCache[cacheKey];
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      status: 200,
      headers: {
        ...CORS,
        "X-Cache": "CACHE",
        "X-Data-Source": "opsroom.sipongidata.my.id (memory)",
      },
    });
  }

  const live = await fetchUpstreamJson(targetUrl, {
    timeoutMs: 12_000,
    maxAttempts: 3,
  });

  if (live.data != null) {
    memoryCache[cacheKey] = { data: live.data, timestamp: now };
    return NextResponse.json(live.data, {
      status: 200,
      headers: {
        ...CORS,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache": "LIVE",
        "X-Data-Source": "opsroom.sipongidata.my.id",
        "X-Upstream-Attempts": String(live.meta.attempts),
      },
    });
  }

  console.warn("[sipongi] live gagal:", live.error);

  if (cached) {
    return NextResponse.json(cached.data, {
      status: 200,
      headers: {
        ...CORS,
        "X-Cache": "FALLBACK_STALE",
        "X-Data-Source": "memory-stale",
        "X-Upstream-Error": String(live.error || "").slice(0, 120),
      },
    });
  }

  return NextResponse.json(
    {
      error: "Gagal mengambil data dari SIPONGI",
      details: live.error,
      attempts: live.meta.attempts,
    },
    {
      status: 502,
      headers: {
        ...CORS,
        "X-Cache": "ERROR",
        "X-Upstream-Error": String(live.error || "").slice(0, 120),
      },
    },
  );
}
