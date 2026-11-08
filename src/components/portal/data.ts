import { cache } from "react";
import { unstable_cache } from "next/cache";
import { ensureColumn, query } from "@/lib/db";
import { PORTAL_PROPERTIES_TAG } from "@/lib/portalCache";
import { ensureMlsTable } from "@/lib/mls/sync";
import { parsePhotos, type PortalProperty } from "./brand";
import { decodeEntities } from "@/lib/publicProperty";
import { mlsDescriptionEn } from "@/lib/mls/translate";
import type { Lang } from "./i18n";

const str = (v: unknown) => (v == null ? null : String(v));
const num = (v: unknown) => (v == null ? null : Number(v));

// Plain objects only — these are passed to client components. Only the cover photo is sent.
function toPortal(r: Record<string, unknown>, source: "own" | "mls"): PortalProperty {
  // Only the cover is selected (cover/photoCount); fall back to parsing a full photos column.
  const photos = r.cover !== undefined ? (r.cover ? [String(r.cover)] : []) : parsePhotos(r.photos);
  return {
    id: String(r.id), title: decodeEntities(String(r.title)) || "", propertyType: String(r.propertyType), operationType: String(r.operationType),
    sector: str(r.sector), city: str(r.city), state: str(r.state),
    salePrice: num(r.salePrice), rentPrice: num(r.rentPrice), currency: String(r.currency || "USD"),
    area: num(r.area ?? r.landArea), bedrooms: num(r.bedrooms), bathrooms: num(r.bathrooms), parkingSpots: num(r.parkingSpots),
    corregimiento: str(r.corregimiento),
    photos: photos.slice(0, 1), photoCount: r.photoCount != null ? Number(r.photoCount) : photos.length, source,
  };
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Server-only: own available properties and the MLS ACOBIR inventory.
// Cached for an hour (and refreshed on CRM edits via the tag): search engines crawl thousands of
// public pages and each one needs this list, so reading ~1,300 rows per visit burned the CPU quota.
const loadAvailableCached = unstable_cache(() => loadAvailable(true), ["portal-available-properties-v1"], {
  revalidate: 3600,
  tags: [PORTAL_PROPERTIES_TAG],
});

// Page and metadata of the same request share one read.
const loadAvailableOnce = cache(() => loadAvailableCached());

export async function getAvailableProperties(): Promise<PortalProperty[]> {
  const list = await loadAvailableOnce().catch(() => loadAvailable(false));
  // Random order on every visit, own and MLS listings mixed together.
  return shuffle([...list]);
}

// strict: a failed read throws instead of returning an empty list, so the cache never keeps a DB hiccup.
async function loadAvailable(strict: boolean): Promise<PortalProperty[]> {
  const soft = <T,>(e: unknown): T[] => { if (strict) throw e; return []; };
  await ensureColumn("Property", "corregimiento").catch(() => {});
  const own = await query<Record<string, unknown>>(
    `SELECT id, title, propertyType, operationType, sector, corregimiento, city, state,
            salePrice, rentPrice, currency, area, bedrooms, bathrooms, parkingSpots,
            CASE WHEN json_valid(photos) THEN json_extract(photos, '$[0]') END AS cover,
            CASE WHEN json_valid(photos) THEN json_array_length(photos) ELSE 0 END AS photoCount
     FROM Property WHERE status = 'DISPONIBLE' ORDER BY createdAt DESC LIMIT 300`
  ).catch(soft<Record<string, unknown>>);
  const mls = await ensureMlsTable()
    .then(() => query<Record<string, unknown>>(
      `SELECT id, title, propertyType, operationType, sector, city, state,
              salePrice, rentPrice, currency, area, landArea, bedrooms, bathrooms, parkingSpots, corregimiento,
              json_extract(photos, '$[0]') AS cover, json_array_length(photos) AS photoCount
       FROM MlsListing WHERE active = 1 AND title IS NOT NULL ORDER BY createdAt DESC`
    ))
    .catch(soft<Record<string, unknown>>);
  return [...own.map((r) => toPortal(r, "own")), ...mls.map((r) => toPortal(r, "mls"))];
}

/** One property for the public detail page: own Property by id, or an MLS listing ("mls26108"). */
export async function getPublicProperty(id: string, lang: Lang = "es"): Promise<Record<string, unknown> | null> {
  if (/^mls\d+$/.test(id)) {
    const rows = await ensureMlsTable()
      .then(() => query<Record<string, unknown>>("SELECT * FROM MlsListing WHERE id = ? AND active = 1", [id]))
      .catch(() => []);
    const m = rows[0];
    if (!m) return null;
    const description = decodeEntities(m.description as string | null);
    const descriptionEn = lang === "en"
      ? await mlsDescriptionEn(id, description, str(m.descriptionEn), str(m.descriptionEnSource))
      : null;
    return {
      ...m, title: decodeEntities(m.title as string), description: descriptionEn || description, status: "DISPONIBLE", address: null, country: "Panamá", referencePoint: null, floors: null,
      hasPool: 0, hasGym: 0, hasElevator: 0, hasSecurity: 0, hasGenerator: 0, hasFurniture: 0, hasAppliances: 0,
      hasAC: 0, hasBalcony: 0, hasGarden: 0, notes: null, ownerName: null, createdBy: null, videoUrl: null, brochureUrl: null,
      listingAgent: null, listingAgentPhone: null, listingOffice: null, // internal only
      sector: m.sector, city: [m.corregimiento, m.city].filter((x, i, a) => x && a.indexOf(x) === i).join(", ") || m.city,
    };
  }
  const rows = await query<Record<string, unknown>>("SELECT * FROM Property WHERE id = ?", [id]).catch(() => []);
  return rows[0] || null;
}
