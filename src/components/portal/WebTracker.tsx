"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Sends anonymous usage events to /api/track: page views, property views and WhatsApp clicks.
export function track(type: string, data: Record<string, unknown> = {}) {
  try {
    const lang = document.cookie.match(/(?:^|; )pi_lang=(\w+)/)?.[1] || "es";
    const body = JSON.stringify({ type, path: location.pathname, ref: document.referrer || null, lang, ...data });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch { /* never break the page for analytics */ }
}

const propertyIdFromPath = (path: string) => path.match(/^\/p\/([^/?#]+)/)?.[1] || null;

export default function WebTracker() {
  const pathname = usePathname() || "";

  useEffect(() => {
    const propertyId = propertyIdFromPath(pathname);
    track(propertyId ? "view" : "page", { propertyId });
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a[href*='wa.me']");
      if (a) track("wa", { propertyId: propertyIdFromPath(location.pathname) || (a as HTMLElement).dataset.propertyId || null });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
