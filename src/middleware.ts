import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, COOKIE_SESSION } from "@/lib/auth";

// Routes that don't require auth
const PUBLIC_PREFIXES = ["/login", "/p/", "/catalogo", "/api/auth/", "/api/catalogo"];

// Routes blocked for "agent" role (only broker + admin can access)
const ADMIN_PREFIXES = ["/contabilidad", "/api/gastos"];

// Routes only accessible by broker (Edgar)
const BROKER_PREFIXES = ["/agentes", "/api/agents"];

// Routes the EP Realty bot needs to read for syncing into mis_listados.
// These can be accessed via Bearer ${BOT_SYNC_TOKEN} without a browser session.
const BOT_SYNC_PREFIXES = ["/api/properties", "/api/clients", "/api/deals"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") || "").toLowerCase();
  const isPortalDomain = host === "panamainmo.com" || host === "www.panamainmo.com";

  // Public portal domain: root → /catalogo
  // Any other authenticated path → /catalogo too (public visitors shouldn't see login)
  if (isPortalDomain) {
    if (pathname === "/" || pathname === "") {
      const url = request.nextUrl.clone();
      url.pathname = "/catalogo";
      return NextResponse.redirect(url);
    }
    // Allow only public paths on the portal domain
    const allowedOnPortal =
      pathname.startsWith("/catalogo") ||
      pathname.startsWith("/p/") ||
      pathname.startsWith("/api/catalogo") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/logo") ||
      pathname.startsWith("/favicon") ||
      /\.(svg|png|jpg|jpeg|webp|ico|css|js)$/.test(pathname);
    if (!allowedOnPortal) {
      const url = request.nextUrl.clone();
      url.pathname = "/catalogo";
      return NextResponse.redirect(url);
    }
  }

  // Always allow public routes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
  }

  // Bot sync bypass: Bearer token for read-only sync endpoints
  if (
    request.method === "GET" &&
    BOT_SYNC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    const auth = request.headers.get("authorization") || "";
    const expected = process.env.BOT_SYNC_TOKEN;
    if (expected && auth === `Bearer ${expected}`) {
      const res = NextResponse.next();
      res.headers.set("x-pathname", pathname);
      return res;
    }
  }

  // Check session cookie
  const sessionCookie = request.cookies.get(COOKIE_SESSION)?.value;
  const user = sessionCookie ? await verifySession(sessionCookie) : null;

  if (!user) {
    // Redirect to login, preserving intended URL
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Broker-only check (managing agents)
  if (BROKER_PREFIXES.some((p) => pathname.startsWith(p)) && user.role !== "broker") {
    // For API routes, return JSON 403 instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("blocked", "1");
    return NextResponse.redirect(url);
  }

  // Admin-only check (broker + admin allowed, agent blocked)
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) && user.role !== "broker" && user.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("blocked", "1");
    return NextResponse.redirect(url);
  }

  // Pass pathname to layout via header (used to show/hide sidebar on public pages)
  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
