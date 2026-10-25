import { cookies, headers } from "next/headers";
import { LANG_COOKIE, type Lang } from "./i18n";

// Server-only: true when the request comes from panamainmo.com (clean URLs),
// false on the CRM domain / localhost (pages live under /catalogo).
export async function isPortalRequest(): Promise<boolean> {
  const host = ((await headers()).get("host") || "").toLowerCase();
  return host === "panamainmo.com" || host === "www.panamainmo.com";
}

/** Site language: the URL decides (/en/... → English, set by the middleware as x-pi-lang). */
export async function getLang(): Promise<Lang> {
  const h = (await headers()).get("x-pi-lang");
  if (h === "en" || h === "es") return h;
  return (await cookies()).get(LANG_COOKIE)?.value === "en" ? "en" : "es";
}
