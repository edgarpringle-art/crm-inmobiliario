import { ensureColumn, query } from "@/lib/db";
import { ensureMlsTable } from "@/lib/mls/sync";
import { scoreListing, type MatchListing, type SearchCriteria } from "@/lib/mls/match";

// Web alerts ("Avísame cuando haya algo así"): a visitor's saved search on panamainmo.com.
// Stored on the Client: webAlert (JSON criteria), webAlertActive, webAlertSince, webAlertSentAt.

export interface WebAlert { op: "COMPRA" | "ALQUILER"; type: string | null; zones: string[]; max: number | null; beds: number | null; lang?: string }

export async function ensureAlertColumns() {
  await ensureColumn("Client", "webAlert");
  await ensureColumn("Client", "webAlertActive", "INTEGER");
  await ensureColumn("Client", "webAlertSince");
  await ensureColumn("Client", "webAlertSentAt");
}

export function alertCriteria(a: WebAlert): SearchCriteria {
  return { modalidad: a.op, tipo: a.type, zonas: a.zones, min: null, max: a.max, bedsMin: a.beds, bedsMax: null, bathsMin: null };
}

export function parseAlert(raw: unknown): WebAlert | null {
  if (typeof raw !== "string" || !raw) return null;
  try { return JSON.parse(raw) as WebAlert; } catch { return null; }
}

export interface AlertMatch { id: string; title: string; price: number | null; zone: string; source: "own" | "mls"; createdAt: string }
export interface AlertRow {
  id: string; firstName: string; lastName: string | null; phone: string | null; email: string | null;
  alert: WebAlert; since: string; sentAt: string | null; active: boolean;
  newMatches: AlertMatch[]; totalNew: number;
}

/** Every web alert with the listings (own + MLS) published since the last time the client was notified. */
export async function getAlerts(): Promise<AlertRow[]> {
  await ensureAlertColumns();
  await ensureMlsTable().catch(() => {});
  const clients = await query<Record<string, unknown>>(
    `SELECT id, firstName, lastName, phone, email, webAlert, webAlertActive, webAlertSince, webAlertSentAt
     FROM Client WHERE webAlert IS NOT NULL ORDER BY webAlertSince DESC`
  );
  if (!clients.length) return [];

  const listings = [
    ...(await query<MatchListing & { createdAt: string }>(
      `SELECT id, id AS mlsId, title, propertyType, operationType, salePrice, rentPrice, currency, area, landArea,
              bedrooms, bathrooms, sector, corregimiento, city, state, NULL AS photos, createdAt
       FROM Property WHERE status = 'DISPONIBLE'`
    ).catch(() => [])).map((l) => ({ ...l, source: "own" as const })),
    ...(await query<MatchListing & { createdAt: string }>(
      `SELECT id, mlsId, title, propertyType, operationType, salePrice, rentPrice, currency, area, landArea,
              bedrooms, bathrooms, sector, corregimiento, city, state, NULL AS photos, createdAt
       FROM MlsListing WHERE active = 1 AND title IS NOT NULL`
    ).catch(() => [])).map((l) => ({ ...l, source: "mls" as const })),
  ];

  return clients.flatMap((c) => {
    const alert = parseAlert(c.webAlert);
    if (!alert) return [];
    const since = String(c.webAlertSentAt || c.webAlertSince || "");
    const criteria = alertCriteria(alert);
    const matches = listings
      .filter((l) => !since || String(l.createdAt || "") > since)
      .map((l) => ({ l, m: scoreListing(criteria, l) }))
      .filter((x) => x.m)
      .sort((a, b) => b.m!.score - a.m!.score || String(b.l.createdAt).localeCompare(String(a.l.createdAt)));
    return [{
      id: String(c.id), firstName: String(c.firstName || ""), lastName: (c.lastName as string) || null,
      phone: (c.phone as string) || null, email: (c.email as string) || null,
      alert, since: String(c.webAlertSince || ""), sentAt: (c.webAlertSentAt as string) || null, active: !!c.webAlertActive,
      totalNew: matches.length,
      newMatches: matches.slice(0, 10).map(({ l }) => ({
        id: l.id, title: l.title,
        price: alert.op === "ALQUILER" ? l.rentPrice : l.salePrice ?? l.rentPrice,
        zone: [l.sector, l.city].filter(Boolean).join(", "), source: l.source, createdAt: String(l.createdAt || ""),
      })),
    }];
  });
}
