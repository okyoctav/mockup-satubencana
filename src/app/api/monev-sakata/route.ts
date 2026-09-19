import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const targetUrl = "https://www.sadana.cloud/api/sandingan/monev/geojson";
  const localFilePath = path.join(process.cwd(), "public", "data", "monev_sakata.geojson");

  // 1. Try Live API fetch first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Accept": "application/geo+json, application/json, */*",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();

      // Cache fresh data to public/data/monev_sakata.geojson
      try {
        const dstDir = path.join(process.cwd(), "public", "data");
        if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
        fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), "utf-8");
      } catch (err) {
        console.error("Gagal menyimpan cache ke monev_sakata.geojson:", err);
      }

      return NextResponse.json(data, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "no-store",
        },
      });
    } else {
      console.warn(`Upstream sadana.cloud returned status ${res.status}, using local fallback`);
    }
  } catch (err) {
    console.warn("Live fetch ke sadana.cloud bermasalah/timeout, menggunakan cache lokal:", err);
  }

  // 2. Fallback to local cached GeoJSON file if upstream failed (e.g. 500 error)
  try {
    if (fs.existsSync(localFilePath)) {
      const fileContent = fs.readFileSync(localFilePath, "utf-8");
      const jsonData = JSON.parse(fileContent);
      return NextResponse.json(jsonData, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "no-store",
        },
      });
    }
  } catch (err) {
    console.error("Gagal membaca file lokal fallback monev_sakata.geojson:", err);
  }

  return NextResponse.json(
    { type: "FeatureCollection", features: [], error: "Gagal mengambil data Monev SAKATA" },
    { status: 500 }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
