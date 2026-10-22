import { query } from "@/lib/db";
import { ensureMlsTable } from "@/lib/mls/sync";
import { parsePhotos, type PortalProperty } from "./brand";

const str = (v: unknown) => (v == null ? null : String(v));
const num = (v: unknown) => (v == null ? null : Number(v));

// Plain objects only — these are passed to client components. Only the cover photo is sent.
function toPortal(r: Record<string, unknown>, source: "own" | "mls"): PortalProperty {
  const photos = parsePhotos(r.photos);
  return {
    id: String(r.id), title: String(r.title), propertyType: String(r.propertyType), operationType: String(r.operationType),
    sector: str(r.sector), city: str(r.city), state: str(r.state),
    salePrice: num(r.salePrice), rentPrice: num(r.rentPrice), currency: String(r.currency || "USD"),
    area: num(r.area ?? r.landArea), bedrooms: num(r.bedrooms), bathrooms: num(r.bathrooms), parkingSpots: num(r.parkingSpots),
    photos: photos.slice(0, 1), photoCount: photos.length, source,
  };
}

// Server-only: own available properties first, then the MLS ACOBIR inventory.
export async function getAvailableProperties(): Promise<PortalProperty[]> {
  const own = await query<Record<string, unknown>>(
    `SELECT id, title, propertyType, operationType, sector, city, state,
            salePrice, rentPrice, currency, area, bedrooms, bathrooms, parkingSpots, photos
     FROM Property WHERE status = 'DISPONIBLE' ORDER BY createdAt DESC LIMIT 300`
  ).catch(() => []);
  const mls = await ensureMlsTable()
    .then(() => query<Record<string, unknown>>(
      `SELECT id, title, propertyType, operationType, sector, city, state,
              salePrice, rentPrice, currency, area, landArea, bedrooms, bathrooms, parkingSpots, photos
       FROM MlsListing WHERE active = 1 AND title IS NOT NULL ORDER BY createdAt DESC`
    ))
    .catch(() => []);
  return [...own.map((r) => toPortal(r, "own")), ...mls.map((r) => toPortal(r, "mls"))];
}

/** One property for the public detail page: own Property by id, or an MLS listing ("mls26108"). */
export async function getPublicProperty(id: string): Promise<Record<string, unknown> | null> {
  if (/^mls\d+$/.test(id)) {
    const rows = await ensureMlsTable()
      .then(() => query<Record<string, unknown>>("SELECT * FROM MlsListing WHERE id = ? AND active = 1", [id]))
      .catch(() => []);
    const m = rows[0];
    if (!m) return null;
    return {
      ...m, status: "DISPONIBLE", address: null, country: "Panamá", referencePoint: null, floors: null,
      hasPool: 0, hasGym: 0, hasElevator: 0, hasSecurity: 0, hasGenerator: 0, hasFurniture: 0, hasAppliances: 0,
      hasAC: 0, hasBalcony: 0, hasGarden: 0, notes: null, ownerName: null, createdBy: null, videoUrl: null,
      sector: m.sector, city: [m.corregimiento, m.city].filter((x, i, a) => x && a.indexOf(x) === i).join(", ") || m.city,
    };
  }
  const rows = await query<Record<string, unknown>>("SELECT * FROM Property WHERE id = ?", [id]).catch(() => []);
  return rows[0] || null;
}
