import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const app = searchParams.get("app") || "bitung_kolut";
  const individu = searchParams.get("individu") || "1";
  const page = searchParams.get("page") || "1";

  const targetUrl = `https://sepakat.bappenas.go.id/pk-api/?app=${app}&individu=${individu}&page=${page}`;
  const username = "27082026";
  const password = "sepakat@2026";
  const authHeader = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const res = await fetch(targetUrl, {
      cache: "no-store",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
    });

    const status = res.status;
    const contentType = res.headers.get("content-type") || "";
    const rawText = await res.text();

    return NextResponse.json({
      status,
      contentType,
      url: targetUrl,
      isCloudflareBlocked: rawText.includes("Just a moment...") || rawText.includes("challenge-platform"),
      previewSnippet: rawText.slice(0, 1000),
      rawResponse: rawText,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan proxy";
    return NextResponse.json({ error: msg, url: targetUrl }, { status: 500 });
  }
}
