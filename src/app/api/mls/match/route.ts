import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureMlsTable } from "@/lib/mls/sync";
import { hasCriteria, scoreListing, type MatchListing, type SearchCriteria } from "@/lib/mls/match";

const num = (v: unknown) => (v == null || v === "" ? null : Number(v));
function zonesOf(raw: unknown, fallback: unknown): string[] {
  if (typeof raw === "string" && raw) { try { const z = JSON.parse(raw); if (Array.isArray(z)) return z.filter(Boolean); } catch { /* ignore */ } }
  return typeof fallback === "string" && fallback ? [fallback] : [];
}

// MLS listings that fit a client's search (session required by middleware).
// Uses the client's own search fields; falls back to an active Búsqueda linked to the client.
export async function GET(request: NextRequest) {
  const clientId = new URL(request.url).searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 });
  try {
    await ensureMlsTable();
    const [client] = await query<Record<string, unknown>>("SELECT * FROM Client WHERE id = ?", [clientId]);
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    let c: SearchCriteria = {
      modalidad: (client.searchType as string) || null,
      tipo: (client.searchPropertyType as string) || null,
      zonas: zonesOf(client.searchZones, client.searchZone),
      min: num(client.budgetMin), max: num(client.budgetMax),
      bedsMin: num(client.bedrooms), bedsMax: num(client.bedroomsMax), bathsMin: num(client.bathrooms),
    };
    if (!hasCriteria(c)) {
      const [b] = await query<Record<string, unknown>>(
        "SELECT * FROM Busqueda WHERE clientId = ? AND status = 'ACTIVO' ORDER BY updatedAt DESC LIMIT 1", [clientId]
      ).catch(() => []);
      if (b) c = {
        modalidad: (b.modalidad as string) || null, tipo: (b.tipoPropiedad as string) || null,
        zonas: zonesOf(b.zonas, null), min: num(b.presupuestoMin), max: num(b.presupuestoMax),
        bedsMin: num(b.habitacionesMin), bedsMax: num(b.habitacionesMax), bathsMin: num(b.banosMin),
      };
    }
    if (!hasCriteria(c)) return NextResponse.json({ criteria: false, total: 0, items: [] });

    const listings = await query<MatchListing>(
      `SELECT id, mlsId, title, propertyType, operationType, salePrice, rentPrice, currency, area, landArea,
              bedrooms, bathrooms, sector, corregimiento, city, state, json_extract(photos, '$[0]') AS photos,
              listingAgent, listingAgentPhone, listingOffice
       FROM MlsListing WHERE active = 1`
    );
    const matches = listings
      .map((p) => ({ p, m: scoreListing(c, p) }))
      .filter((x) => x.m)
      .sort((a, b) => b.m!.score - a.m!.score || (a.p.salePrice ?? a.p.rentPrice ?? 0) - (b.p.salePrice ?? b.p.rentPrice ?? 0));

    return NextResponse.json({
      criteria: true,
      total: matches.length,
      items: matches.slice(0, 30).map(({ p, m }) => ({ ...p, photo: p.photos, photos: undefined, score: m!.score, reasons: m!.reasons })),
    });
  } catch (error) {
    console.error("MLS match failed:", error);
    return NextResponse.json({ error: "Error al buscar coincidencias" }, { status: 500 });
  }
}
