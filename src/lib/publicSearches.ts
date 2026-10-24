import { query, ensureColumn } from "@/lib/db";

// Client searches published on panamainmo.com/buscamos so other brokers and owners can offer properties.
// Only the criteria go public — never the client's name or contact data.

export async function ensurePublicSearchColumns(): Promise<void> {
  await ensureColumn("Client", "publicSearch", "INTEGER");
  await ensureColumn("Client", "publicSearchAt", "TEXT");
}

export interface PublicSearch {
  code: string; // "B-7K2QX" — public reference, derived from the client id
  op: "COMPRA" | "ALQUILER" | "COMPRA_Y_ALQUILER";
  propertyType: string | null;
  zones: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  publishedAt: string | null;
}

interface Row {
  id: string; searchType: string | null; searchPropertyType: string | null; searchZones: string | null; searchZone: string | null;
  budgetMin: number | null; budgetMax: number | null; bedrooms: number | null; bathrooms: number | null;
  publicSearchAt: string | null; createdBy: string | null;
}

export const searchCode = (clientId: string) => `B-${clientId.slice(-5).toUpperCase()}`;

function parseZones(r: Row): string[] {
  try {
    const z = JSON.parse(r.searchZones || "[]");
    if (Array.isArray(z) && z.length) return z.filter((s) => typeof s === "string" && s.trim()).slice(0, 5);
  } catch { /* legacy single zone */ }
  return r.searchZone ? [r.searchZone] : [];
}

// Closed or lost clients drop off automatically.
async function rows(): Promise<Row[]> {
  await ensurePublicSearchColumns();
  return query<Row>(
    `SELECT id, searchType, searchPropertyType, searchZones, searchZone, budgetMin, budgetMax, bedrooms, bathrooms, publicSearchAt, createdBy
     FROM Client WHERE publicSearch = 1 AND searchType IS NOT NULL AND status NOT IN ('CERRADO', 'INACTIVO')
     ORDER BY publicSearchAt DESC`
  ).catch(() => []);
}

const toPublic = (r: Row): PublicSearch => ({
  code: searchCode(r.id),
  op: (r.searchType as PublicSearch["op"]) || "COMPRA",
  propertyType: r.searchPropertyType,
  zones: parseZones(r),
  budgetMin: r.budgetMin, budgetMax: r.budgetMax,
  bedrooms: r.bedrooms, bathrooms: r.bathrooms,
  publishedAt: r.publicSearchAt,
});

export async function listPublicSearches(): Promise<PublicSearch[]> {
  return (await rows()).map(toPublic);
}

/** Resolves a public code back to the client (server-side only, for offers). */
export async function findPublicSearch(code: string): Promise<(PublicSearch & { clientId: string; createdBy: string | null }) | null> {
  const r = (await rows()).find((x) => searchCode(x.id) === code.trim().toUpperCase());
  return r ? { ...toPublic(r), clientId: r.id, createdBy: r.createdBy } : null;
}
