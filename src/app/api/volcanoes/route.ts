import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "data", "magma_volcanoes.json");

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const jsonData = JSON.parse(content);
      return NextResponse.json(jsonData, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Cache-Control": "no-store",
        },
      });
    }
  } catch (err) {
    console.error("Gagal membaca file magma_volcanoes.json:", err);
  }

  return NextResponse.json({ error: "Data gunung api tidak ditemukan" }, { status: 404 });
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
