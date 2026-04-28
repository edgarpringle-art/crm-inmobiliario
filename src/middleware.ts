import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, COOKIE_SESSION } from "@/lib/auth";

// Routes that don't require auth
const PUBLIC_PREFIXES = ["/login", "/p/", "/api/auth/"];

// Routes blocked for "agent" role (only broker + admin can access)
const ADMIN_PREFIXES = ["/contabilidad", "/api/gastos"];

// Routes only accessible by broker (Edgar)
const BROKER_PREFIXES = ["/agentes", "/api/agents"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
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
