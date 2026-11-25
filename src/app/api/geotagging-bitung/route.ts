import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

type CompactItem = [
  number, // 0: id
  string, // 1: nama
  string, // 2: hub
  string, // 3: jk ('L' | 'P')
  string, // 4: usia
  string, // 5: disabilitas
  string, // 6: lansia
  number, // 7: lat
  number  // 8: lng
];

let cachedData: CompactItem[] | null = null;

function loadGeotaggingData(): CompactItem[] {
  if (cachedData) return cachedData;

  const primaryPath = path.join(
    process.cwd(),
    "public",
    "data",
    "geotagging_bitung_compact.json"
  );

  if (fs.existsSync(primaryPath)) {
    try {
      const raw = fs.readFileSync(primaryPath, "utf-8");
      cachedData = JSON.parse(raw);
      return cachedData!;
    } catch (err) {
      console.error("[geotagging-bitung] Gagal baca compact JSON:", err);
    }
  }

  // Fallback jika file compact belum dibuat, coba baca DATAMDB.json langsung
  const fallbackDatamdb = path.join(process.cwd(), "DATAMDB.json");
  if (fs.existsSync(fallbackDatamdb)) {
    try {
      const raw = JSON.parse(fs.readFileSync(fallbackDatamdb, "utf-8"));
      const items: CompactItem[] = [];
      for (const it of raw) {
        const lat = it.lat || it.latitude;
        const lng = it.long || it.longitude || it.lng;
        if (lat != null && lng != null) {
          const flat = parseFloat(String(lat));
          const flng = parseFloat(String(lng));
          if (!isNaN(flat) && !isNaN(flng) && flat >= -90 && flat <= 90 && flng >= -180 && flng <= 180) {
            const jkRaw = String(it.jenis_kelamin || "").trim().toUpperCase();
            const jk = jkRaw.startsWith("L") ? "L" : (jkRaw.startsWith("P") ? "P" : jkRaw);
            items.push([
              it.id,
              String(it.nama_lengkap || "").trim(),
              String(it.hubungan_keluarga || "").trim(),
              jk,
              it.usia != null ? String(it.usia) : "",
              String(it.disabilitas_kerentanan || "").trim(),
              String(it.lansia || "").trim(),
              Math.round(flat * 1e6) / 1e6,
              Math.round(flng * 1e6) / 1e6,
            ]);
          }
        }
      }
      cachedData = items;
      return cachedData;
    } catch (err) {
      console.error("[geotagging-bitung] Gagal fallback DATAMDB:", err);
    }
  }

  return [];
}

function pointInPolygon(x: number, y: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loadGeotaggingData();

    if (!data.length) {
      return NextResponse.json(
        { status: "empty", total: 0, lakiLaki: 0, perempuan: 0, lansia: 0, disabilitas: 0, items: [] },
        { status: 200, headers: CORS }
      );
    }

    const { type, ring, center, radius, minLat, maxLat, minLng, maxLng } = body;

    let filterFn: (lat: number, lng: number) => boolean;

    if (type === "circle" && center && radius) {
      const cLat = center.lat;
      const cLng = center.lng;
      const r = radius; // meters
      const rLat = r / 111139;
      const rLng = r / (111139 * Math.max(0.1, Math.cos((cLat * Math.PI) / 180)));

      filterFn = (lat: number, lng: number) => {
        if (Math.abs(lat - cLat) > rLat || Math.abs(lng - cLng) > rLng) return false;
        const dLat = (lat - cLat) * 111139;
        const dLng = (lng - cLng) * 111139 * Math.cos((cLat * Math.PI) / 180);
        return dLat * dLat + dLng * dLng <= r * r;
      };
    } else if (type === "polygon" && Array.isArray(ring) && ring.length >= 3) {
      // Calculate ring bounding box for quick rejection
      let polyMinLng = Infinity, polyMaxLng = -Infinity;
      let polyMinLat = Infinity, polyMaxLat = -Infinity;

      for (const p of ring) {
        const lng = p[0];
        const lat = p[1];
        if (lng < polyMinLng) polyMinLng = lng;
        if (lng > polyMaxLng) polyMaxLng = lng;
        if (lat < polyMinLat) polyMinLat = lat;
        if (lat > polyMaxLat) polyMaxLat = lat;
      }

      filterFn = (lat: number, lng: number) => {
        if (lat < polyMinLat || lat > polyMaxLat || lng < polyMinLng || lng > polyMaxLng) {
          return false;
        }
        return pointInPolygon(lng, lat, ring as [number, number][]);
      };
    } else if (minLat != null && maxLat != null && minLng != null && maxLng != null) {
      filterFn = (lat: number, lng: number) => {
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
      };
    } else {
      return NextResponse.json(
        { error: "Invalid geometry parameters" },
        { status: 400, headers: CORS }
      );
    }

    let lakiLaki = 0;
    let perempuan = 0;
    let lansia = 0;
    let disabilitas = 0;
    const items: Array<{
      id: number;
      nama: string;
      hub: string;
      jk: string;
      usia: string;
      disabilitas: string;
      lansia: string;
      lat: number;
      lng: number;
    }> = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const lat = row[7];
      const lng = row[8];

      if (filterFn(lat, lng)) {
        const jk = row[3];
        if (jk === "L") lakiLaki++;
        else if (jk === "P") perempuan++;

        const lansiaVal = row[6];
        if (lansiaVal && lansiaVal.toLowerCase() !== "tidak" && lansiaVal !== "0") {
          lansia++;
        }

        const disVal = row[5];
        if (disVal && disVal.toLowerCase() !== "tidak" && disVal !== "0") {
          disabilitas++;
        }

        // Limit detail items to 5,000 for network payload sanity
        if (items.length < 5000) {
          items.push({
            id: row[0],
            nama: row[1],
            hub: row[2],
            jk: row[3],
            usia: row[4],
            disabilitas: row[5],
            lansia: row[6],
            lat: row[7],
            lng: row[8],
          });
        }
      }
    }

    return NextResponse.json(
      {
        status: "success",
        total: lakiLaki + perempuan,
        lakiLaki,
        perempuan,
        lansia,
        disabilitas,
        items,
      },
      { status: 200, headers: CORS }
    );
  } catch (err: unknown) {
    console.error("[geotagging-bitung] Query error:", err);
    return NextResponse.json(
      { status: "error", error: (err as Error)?.message || "Internal error" },
      { status: 500, headers: CORS }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const minLat = searchParams.get("minLat");
  const maxLat = searchParams.get("maxLat");
  const minLng = searchParams.get("minLng");
  const maxLng = searchParams.get("maxLng");

  if (minLat && maxLat && minLng && maxLng) {
    return POST(
      new NextRequest(req.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bbox",
          minLat: parseFloat(minLat),
          maxLat: parseFloat(maxLat),
          minLng: parseFloat(minLng),
          maxLng: parseFloat(maxLng),
        }),
      })
    );
  }

  // Return dataset summary info
  const data = loadGeotaggingData();
  let l = 0, p = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i][3] === "L") l++;
    else if (data[i][3] === "P") p++;
  }

  return NextResponse.json(
    {
      dataset: "Geotagging Penduduk Kota Bitung",
      totalLoaded: data.length,
      lakiLaki: l,
      perempuan: p,
    },
    { status: 200, headers: CORS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}
