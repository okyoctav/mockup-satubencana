import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

let lastGrabTime = 0;

function triggerBackgroundGrab(force = false) {
  const now = Date.now();
  if (!force && now - lastGrabTime < 30000) return;
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

function runGrabSync(): Promise<boolean> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), "scripts", "grab_satupeta_geotagging.py");
    exec(`python3 "${scriptPath}"`, (error, stdout) => {
      if (error) {
        console.error("Sync grab-satupeta error:", error.message);
        resolve(false);
        return;
      }
      if (stdout) {
        console.log("Sync grab-satupeta output:", stdout.trim());
      }
      resolve(true);
    });
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isRefresh = searchParams.get("refresh") === "true" || searchParams.get("sync") === "true";

  if (isRefresh) {
    await runGrabSync();
  } else {
    triggerBackgroundGrab();
  }

  const filePath = path.join(process.cwd(), "public", "data", "satupeta_geotagging.json");

  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
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
    console.error("Gagal membaca file lokal satupeta_geotagging.json:", err);
  }

  // Fallback to live API request if local JSON file is not yet created
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
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

export async function POST() {
  const ok = await runGrabSync();
  const filePath = path.join(process.cwd(), "public", "data", "satupeta_geotagging.json");

  if (ok && fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(fileContent);
    return NextResponse.json(
      { success: true, message: "Berhasil sync data Satupeta Geotagging!", data: jsonData },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }

  return NextResponse.json({ error: "Gagal me-refresh data dari server Satupeta" }, { status: 500 });
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
