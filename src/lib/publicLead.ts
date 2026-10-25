import { query } from "@/lib/db";

// Shared helpers for public forms on panamainmo.com (valuation, alerts).

const hits = new Map<string, number[]>();
/** Best-effort rate limit per IP (per serverless instance): 5 requests / 10 min. */
export function rateLimited(request: Request): boolean {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const cleanNum = (v: unknown) => {
  const n = Number(typeof v === "string" ? v.replace(/[^\d.]/g, "") : v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function todayPanama(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
}

/** Existing row in Client/Owner with the same phone (last 8 digits) or email. */
export async function findByContact<T>(table: "Client" | "Owner", phone: string, email: string, cols = "id, notes"): Promise<T | null> {
  const last8 = phone.replace(/\D/g, "").slice(-8);
  const rows = await query<T>(
    `SELECT ${cols} FROM ${table}
     WHERE (? != '' AND substr(replace(replace(replace(replace(replace(phone,' ',''),'-',''),'+',''),'(',''),')',''), -8) = ?)
        OR (? != '' AND lower(email) = ?)
     LIMIT 1`,
    [last8, last8, email, email]
  );
  return rows[0] || null;
}
