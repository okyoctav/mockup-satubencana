import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Allow self-signed or unverified SSL certificates for remote Bappenas API
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET() {
  const targetUrl = "https://simrenas-webgis.bappenas.go.id/satupeta/api/survey_dtsen_kk";
  const localFilePath = path.join(process.cwd(), "public", "data", "satupeta_geotagging.json");

  // 1. Try Live API Fetch first to ensure data is always fresh & updated
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(targetUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      
      // Cache fresh data to public/data/satupeta_geotagging.json
      try {
        const dstDir = path.join(process.cwd(), "public", "data");
        if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
        fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), "utf-8");
      } catch (err) {
        console.error("Gagal menyimpan cache ke satupeta_geotagging.json:", err);
      }

      return NextResponse.json(data, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cache-Control": "no-store",
        },
      });
    }
  } catch (err) {
    console.warn("Live fetch ke Satupeta API bermasalah/timeout, menggunakan cache lokal:", err);
  }

  // 2. Fallback to local cached JSON file if live fetch failed or timed out
  try {
    if (fs.existsSync(localFilePath)) {
      const fileContent = fs.readFileSync(localFilePath, "utf-8");
      const jsonData = JSON.parse(fileContent);
      return NextResponse.json(jsonData, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cache-Control": "no-store",
        },
      });
    }
  } catch (err) {
    console.error("Gagal membaca file lokal fallback satupeta_geotagging.json:", err);
  }

  return NextResponse.json({ status: 500, error: "Gagal mengambil data Satupeta Geotagging" }, { status: 500 });
}

export async function POST() {
  return GET();
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
