import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, COOKIE_SESSION } from "@/lib/auth";

// Routes that don't require auth
const PUBLIC_PREFIXES = ["/login", "/p/", "/catalogo", "/ver/", "/api/auth/", "/api/catalogo", "/api/leads", "/api/cron/", "/api/propuestas/public", "/api/propuestas/respond"];

// Public site pages served at clean URLs on panamainmo.com (files live in /catalogo/*)
const PORTAL_PAGES = ["/propiedades", "/servicios", "/nosotros", "/contacto"];

// Routes blocked for "agent" role (only broker + admin can access)
const ADMIN_PREFIXES = ["/contabilidad", "/api/gastos"];

// Routes only accessible by broker (Edgar)
const BROKER_PREFIXES = ["/agentes", "/api/agents"];

// Routes the EP Realty bot needs to read for syncing into mis_listados.
// These can be accessed via Bearer ${BOT_SYNC_TOKEN} without a browser session.
const BOT_SYNC_PREFIXES = ["/api/properties", "/api/clients", "/api/deals", "/api/busquedas"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") || "").toLowerCase();
  const isPortalDomain = host === "panamainmo.com" || host === "www.panamainmo.com";

  // Public portal domain: clean URLs (/servicios) are served from /catalogo/* via rewrite.
  // Any other authenticated path → home (public visitors shouldn't see login)
  if (isPortalDomain) {
    // Old /catalogo URLs → clean ones (keeps shared links working)
    if (pathname === "/catalogo" || pathname.startsWith("/catalogo/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice("/catalogo".length) || "/";
      return NextResponse.redirect(url, 301);
    }
    // The old MLS search page was replaced by the merged catalog
    if (pathname === "/buscar") {
      const url = request.nextUrl.clone();
      url.pathname = "/propiedades";
      return NextResponse.redirect(url, 301);
    }
    if (pathname === "/" || pathname === "" || PORTAL_PAGES.includes(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" || pathname === "" ? "/catalogo" : `/catalogo${pathname}`;
      const headers = new Headers(request.headers);
      headers.set("x-pathname", url.pathname);
      return NextResponse.rewrite(url, { request: { headers } });
    }
    // Allow only public paths on the portal domain
    const allowedOnPortal =
      pathname.startsWith("/p/") ||
      pathname.startsWith("/api/catalogo") ||
      pathname.startsWith("/api/leads") ||
      pathname.startsWith("/api/cron/") || // Vercel Cron may call the primary domain; the route checks CRON_SECRET
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/logo") ||
      pathname.startsWith("/favicon") ||
      /\.(svg|png|jpg|jpeg|webp|ico|css|js)$/.test(pathname);
    if (!allowedOnPortal) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
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
