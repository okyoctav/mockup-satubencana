import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fetchUpstreamJson } from "@/lib/upstreamFetch";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

function readLocalFallback(localFilePath: string) {
  if (!fs.existsSync(localFilePath)) return null;
  const fileContent = fs.readFileSync(localFilePath, "utf-8");
  return JSON.parse(fileContent);
}

export async function GET() {
  const targetUrl =
    "https://simrenas-webgis.bappenas.go.id/satupeta/api/survey_dtsen_kk";
  const localFilePath = path.join(
    process.cwd(),
    "public",
    "data",
    "satupeta_geotagging.json",
  );

  const live = await fetchUpstreamJson(targetUrl, {
    timeoutMs: 10_000,
    maxAttempts: 3,
  });

  if (live.data != null) {
    try {
      const dstDir = path.join(process.cwd(), "public", "data");
      if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
      fs.writeFileSync(
        localFilePath,
        JSON.stringify(live.data, null, 2),
        "utf-8",
      );
    } catch (err) {
      console.error("[satupeta] gagal simpan cache:", err);
    }

    return NextResponse.json(live.data, {
      status: 200,
      headers: {
        ...CORS,
        "X-Cache": "LIVE",
        "X-Data-Source": "simrenas-webgis.bappenas.go.id",
        "X-Upstream-Attempts": String(live.meta.attempts),
      },
    });
  }

  console.warn("[satupeta] live gagal, fallback lokal:", live.error);

  try {
    const jsonData = readLocalFallback(localFilePath);
    if (jsonData) {
      return NextResponse.json(jsonData, {
        status: 200,
        headers: {
          ...CORS,
          "X-Cache": "FALLBACK_LOCAL",
          "X-Data-Source": "satupeta_geotagging.json",
          "X-Upstream-Error": String(live.error || "upstream gagal").slice(0, 120),
        },
      });
    }
  } catch (err) {
    console.error("[satupeta] gagal baca fallback lokal:", err);
  }

  return NextResponse.json(
    {
      status: 500,
      error: "Gagal mengambil data Satupeta Geotagging",
      fallback: false,
    },
    { status: 500, headers: CORS },
  );
}

export async function POST() {
  return GET();
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
