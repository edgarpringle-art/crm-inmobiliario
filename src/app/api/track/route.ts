import { NextRequest, NextResponse } from "next/server";
import { recordWebEvent, type WebEventType } from "@/lib/webEvents";
import { COOKIE_SESSION } from "@/lib/auth";

const TYPES: WebEventType[] = ["view", "page", "wa", "search"];
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|preview|lighthouse|headless|vercel/i;
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : null);

// Public beacon from the website (no auth). Ignores bots and logged-in CRM users browsing the site.
export async function POST(request: NextRequest) {
  try {
    if (BOT.test(request.headers.get("user-agent") || "") || request.cookies.get(COOKIE_SESSION)) {
      return new NextResponse(null, { status: 204 });
    }
    const body = await request.json().catch(() => ({}));
    const type = body.type as WebEventType;
    if (!TYPES.includes(type)) return new NextResponse(null, { status: 204 });

    let meta: Record<string, string> | null = null;
    if (body.meta && typeof body.meta === "object") {
      meta = {};
      for (const [k, v] of Object.entries(body.meta).slice(0, 10)) if (typeof v === "string" && v) meta[k.slice(0, 20)] = v.slice(0, 80);
    }
    // Keep only the referring site's host (google.com, facebook.com…), never full URLs.
    let ref: string | null = null;
    try { ref = body.ref ? new URL(String(body.ref)).hostname.replace(/^www\./, "") : null; } catch { ref = null; }
    if (ref && /panamainmo\.com$/.test(ref)) ref = null;

    await recordWebEvent({
      type, propertyId: clip(body.propertyId, 40), path: clip(body.path, 200), meta, ref, lang: clip(body.lang, 5),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("track error:", error);
    return new NextResponse(null, { status: 204 });
  }
}
