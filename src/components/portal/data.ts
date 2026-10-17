import { query } from "@/lib/db";
import { parsePhotos, type PortalProperty } from "./brand";

// Server-only: available properties for the public portal.
export async function getAvailableProperties(): Promise<PortalProperty[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT id, title, propertyType, operationType, sector, city, state,
            salePrice, rentPrice, currency, area, bedrooms, bathrooms, parkingSpots, photos
     FROM Property WHERE status = 'DISPONIBLE' ORDER BY createdAt DESC LIMIT 300`
  ).catch(() => []);
  const str = (v: unknown) => (v == null ? null : String(v));
  const num = (v: unknown) => (v == null ? null : Number(v));
  // Plain objects only — these are passed to client components.
  return rows.map((r) => ({
    id: String(r.id), title: String(r.title), propertyType: String(r.propertyType), operationType: String(r.operationType),
    sector: str(r.sector), city: str(r.city), state: str(r.state),
    salePrice: num(r.salePrice), rentPrice: num(r.rentPrice), currency: String(r.currency || "USD"),
    area: num(r.area), bedrooms: num(r.bedrooms), bathrooms: num(r.bathrooms), parkingSpots: num(r.parkingSpots),
    photos: parsePhotos(r.photos),
  }));
}
