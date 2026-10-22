import { NextRequest, NextResponse } from "next/server";
import { importMlsLinks } from "@/lib/mls/sync";

export const maxDuration = 60;

// Imports pasted Xposure links into the web (session required by middleware).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const urls: string[] = Array.isArray(body.urls) ? body.urls.filter((u: unknown) => typeof u === "string") : [];
  if (!urls.length) return NextResponse.json({ error: "Pega al menos un enlace" }, { status: 400 });
  try {
    return NextResponse.json({ results: await importMlsLinks(urls) });
  } catch (error) {
    console.error("MLS import failed:", error);
    return NextResponse.json({ error: "No se pudo importar" }, { status: 500 });
  }
}
