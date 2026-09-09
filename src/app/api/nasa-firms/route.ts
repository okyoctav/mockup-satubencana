import { NextResponse } from "next/server";

const DEFAULT_MAP_KEY = "NQfG3k9SgDxbwGs7AR4Sgm6jdWyCzhMnGrTH0tmp";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || process.env.NASA_FIRMS_MAP_KEY || DEFAULT_MAP_KEY;
  const days = searchParams.get("days") || "1";
  const source = searchParams.get("source") || "VIIRS_SNPP_NRT"; // VIIRS_SNPP_NRT, VIIRS_NOAA20_NRT, MODIS_NRT

  // BBOX for Indonesia: MinLng, MinLat, MaxLng, MaxLat
  const bbox = searchParams.get("bbox") || "95,-11,141,6";

  const targetUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${bbox}/${days}`;

  try {
    const res = await fetch(targetUrl, {
      cache: "no-store",
      headers: {
        "Accept": "text/csv, application/json, */*",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
    });

    if (res.ok) {
      const csvText = await res.text();

      // Check if NASA returned an error string like "Invalid MAP_KEY"
      if (csvText.trim().startsWith("Invalid") || csvText.trim().startsWith("Error")) {
        return NextResponse.json({
          status: 200,
          key: key,
          source: source,
          notice: csvText.trim(),
          message: "API Key NASA FIRMS masih dalam proses aktivasi atau limit. Menampilkan layer raster NASA GIBS WMS realtime.",
          count: 0,
          fires: [],
        }, {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
          },
        });
      }

      // Parse CSV to JSON
      const lines = csvText.trim().split("\n");
      if (lines.length <= 1) {
        return NextResponse.json({ status: 200, count: 0, fires: [] });
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const fires = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const obj: Record<string, string | number> = {};
        headers.forEach((h, idx) => {
          const val = values[idx];
          if (h === "latitude" || h === "longitude" || h === "brightness" || h === "bright_t31" || h === "frp") {
            obj[h] = parseFloat(val) || 0;
          } else {
            obj[h] = val;
          }
        });
        return obj;
      });

      return NextResponse.json({
        status: 200,
        count: fires.length,
        source: source,
        fires: fires,
      }, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil data NASA FIRMS";
    console.error("NASA FIRMS Proxy Error:", msg);
  }

  return NextResponse.json({
    status: 200,
    key: key,
    notice: "Fallback to NASA GIBS WMS Tile Layers",
    count: 0,
    fires: [],
  }, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
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
