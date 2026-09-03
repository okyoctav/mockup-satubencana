import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

let lastGrabTime = 0;

function triggerBackgroundGrab() {
  const now = Date.now();
  // Throttle background grab script to run at most once every 60 seconds
  if (now - lastGrabTime < 60000) return;
  lastGrabTime = now;

  const scriptPath = path.join(process.cwd(), "scripts", "grab_satupeta_geotagging.py");
  exec(`python3 "${scriptPath}"`, (error, stdout) => {
    if (error) {
      console.error("Background grab-satupeta error:", error.message);
      return;
    }
    if (stdout) {
      console.log("Background grab-satupeta output:", stdout.trim());
    }
  });
}

export async function GET() {
  // Trigger background grab script automatically when application / service loads
  triggerBackgroundGrab();

  const filePath = path.join(process.cwd(), "public", "data", "satupeta_geotagging.json");

  // 1. Serve local grabbed JSON file if available
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const jsonData = JSON.parse(fileContent);
      return NextResponse.json(jsonData, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cache-Control": "no-store",
        },
      });
    }
  } catch (err) {
    console.error("Gagal membaca file lokal satupeta_geotagging.json:", err);
  }

  // 2. Fallback to live API request if local JSON file is not yet created
  const targetUrl = "https://simrenas-webgis.bappenas.go.id/satupeta/api/survey_dtsen_kk";
  try {
    const res = await fetch(targetUrl, {
      cache: "no-store",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Remote HTTP Error ${res.status}` },
        {
          status: res.status,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil data Satupeta Geotagging";
    return NextResponse.json(
      { error: msg },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
