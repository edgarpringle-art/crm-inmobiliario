import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, COOKIE_SESSION } from "@/lib/auth";

// Routes that don't require auth
const PUBLIC_PREFIXES = ["/robots.txt", "/sitemap.xml", "/login", "/p/", "/catalogo", "/ver/", "/api/auth/", "/api/catalogo", "/api/leads", "/api/buscamos", "/api/valoracion", "/api/alertas", "/api/track", "/api/cron/", "/api/propuestas/public", "/api/propuestas/respond"];

// Public site pages served at clean URLs on panamainmo.com (files live in /catalogo/*)
const PORTAL_PAGES = ["/propiedades", "/servicios", "/nosotros", "/buscamos", "/contacto", "/vender", "/guias"];

// Routes blocked for "agent" role (only broker + admin can access)
const ADMIN_PREFIXES = ["/contabilidad", "/api/gastos"];

// Routes only accessible by broker (Edgar)
const BROKER_PREFIXES = ["/agentes", "/api/agents"];

// Routes the EP Realty bot needs to read for syncing into mis_listados.
// These can be accessed via Bearer ${BOT_SYNC_TOKEN} without a browser session.
const BOT_SYNC_PREFIXES = ["/api/properties", "/api/clients", "/api/deals", "/api/busquedas"];

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").toLowerCase();
  const isPortalDomain = host === "panamainmo.com" || host === "www.panamainmo.com";

  // English version of the public site: /en/... serves the same page with x-pi-lang=en.
  const rawPath = request.nextUrl.pathname;
  const isEn = rawPath === "/en" || rawPath.startsWith("/en/");
  const pathname = isEn ? rawPath.slice(3) || "/" : rawPath;
  const isPublicPage = (p: string) => p === "/" || p.startsWith("/p/") || p.startsWith("/catalogo") ||
    PORTAL_PAGES.includes(p) || p.startsWith("/guias/") || /^\/(venta|alquiler)(\/|$)/.test(p);
  if (isEn && !(isPublicPage(pathname) && (isPortalDomain || pathname !== "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    return NextResponse.redirect(url);
  }
  // Rewrite to `target` (or pass through) carrying the language and the real path for the layout.
  const serve = (target: string) => {
    const headers = new Headers(request.headers);
    headers.set("x-pathname", target);
    headers.set("x-pi-lang", isEn ? "en" : "es");
    if (target === rawPath) return NextResponse.next({ request: { headers } });
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url, { request: { headers } });
  };
  // Visitors who picked English keep getting English pages (Google has no cookie: it sees both versions).
  if (!isEn && request.method === "GET" && request.cookies.get("pi_lang")?.value === "en" &&
      isPublicPage(pathname) && (isPortalDomain ? pathname !== "/catalogo" : pathname.startsWith("/catalogo") || pathname.startsWith("/p/"))) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    return NextResponse.redirect(url);
  }

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
    // Search landing pages: /venta, /alquiler/casas/boquete … (files in /catalogo/inmuebles/[...slug])
    if (/^\/(venta|alquiler)(\/|$)/.test(pathname)) return serve(`/catalogo/inmuebles${pathname}`);
    if (pathname === "/" || pathname === "" || PORTAL_PAGES.includes(pathname) || pathname.startsWith("/guias/")) {
      return serve(pathname === "/" || pathname === "" ? "/catalogo" : `/catalogo${pathname}`);
    }
    if (pathname.startsWith("/p/")) return serve(pathname);
    // Allow only public paths on the portal domain
    const allowedOnPortal =
      pathname.startsWith("/p/") ||
      pathname.startsWith("/api/catalogo") ||
      pathname.startsWith("/api/leads") ||
      pathname.startsWith("/api/buscamos") ||
      pathname.startsWith("/api/valoracion") ||
      pathname.startsWith("/api/alertas") ||
      pathname.startsWith("/api/track") ||
      pathname.startsWith("/api/cron/") ||
      pathname === "/robots.txt" || pathname === "/sitemap.xml" || // Vercel Cron may call the primary domain; the route checks CRON_SECRET
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/logo") ||
      pathname.startsWith("/favicon") ||
      /\.(svg|png|jpg|jpeg|webp|ico|css|js|pdf)$/.test(pathname);
    if (!allowedOnPortal) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Always allow public routes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    const res = serve(pathname);
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.pdf$).*)",
  ],
};
