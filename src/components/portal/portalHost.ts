import { headers } from "next/headers";

// Server-only: true when the request comes from panamainmo.com (clean URLs),
// false on the CRM domain / localhost (pages live under /catalogo).
export async function isPortalRequest(): Promise<boolean> {
  const host = ((await headers()).get("host") || "").toLowerCase();
  return host === "panamainmo.com" || host === "www.panamainmo.com";
}
