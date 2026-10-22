// Matches a client's search criteria against the published MLS ACOBIR listings.
// Hard filters (operation, type, zone, budget, bedrooms when given) keep results relevant among
// 1,000+ listings; the score only orders what passes. Mirrors the weights of /api/match-busquedas.

export interface SearchCriteria {
  modalidad: string | null;       // COMPRA | ALQUILER | COMPRA_Y_ALQUILER
  tipo: string | null;            // PROPERTY_TYPES value
  zonas: string[];
  min: number | null; max: number | null;
  bedsMin: number | null; bedsMax: number | null;
  bathsMin: number | null;
}

export interface MatchListing {
  id: string; mlsId: string; title: string; propertyType: string; operationType: string;
  salePrice: number | null; rentPrice: number | null; currency: string;
  area: number | null; landArea: number | null; bedrooms: number | null; bathrooms: number | null;
  sector: string | null; city: string | null; state: string | null; photos: string | null;
  corregimiento?: string | null;
}

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, "").trim();

export function hasCriteria(c: SearchCriteria): boolean {
  return !!(c.modalidad || c.tipo || c.zonas.length || c.min || c.max || c.bedsMin);
}

export function scoreListing(c: SearchCriteria, p: MatchListing): { score: number; reasons: string[] } | null {
  const reasons: string[] = [];
  let score = 0;

  // 1. Operation (hard). Buyers see sale listings, renters see rentals.
  const wantsSale = c.modalidad === "COMPRA" || c.modalidad === "COMPRA_Y_ALQUILER";
  const wantsRent = c.modalidad === "ALQUILER" || c.modalidad === "COMPRA_Y_ALQUILER";
  const isSale = p.operationType === "VENTA" || p.operationType === "VENTA_Y_ALQUILER";
  const isRent = p.operationType === "ALQUILER" || p.operationType === "VENTA_Y_ALQUILER";
  if (c.modalidad) {
    if (!((wantsSale && isSale) || (wantsRent && isRent))) return null;
    score += 25; reasons.push("Modalidad");
  }

  // 2. Type (hard when given; apartment searches also accept penthouses)
  if (c.tipo) {
    const ok = c.tipo === p.propertyType || (c.tipo === "APARTAMENTO" && p.propertyType === "PENTHOUSE");
    if (!ok) return null;
    score += 15; reasons.push("Tipo");
  }

  // 3. Zone (hard when given)
  if (c.zonas.length) {
    const pz = [p.sector, p.corregimiento, p.city, p.state].filter(Boolean).map((z) => norm(z as string));
    const title = norm(p.title);
    const cz = c.zonas.map(norm).filter(Boolean);
    if (!cz.some((z) => pz.some((x) => x.includes(z) || z.includes(x)) || title.includes(z))) return null;
    score += 35; reasons.push("Zona");
  }

  // 4. Budget (hard when given, with the same 15% / 10% tolerance)
  const price = c.modalidad === "ALQUILER" ? p.rentPrice : c.modalidad === "COMPRA" ? p.salePrice : (p.salePrice ?? p.rentPrice);
  if (c.min != null || c.max != null) {
    if (price == null) return null;
    if (c.min != null && price < c.min * 0.85) return null;
    if (c.max != null && price > c.max * 1.1) return null;
    score += 20; reasons.push("Presupuesto");
  }

  // 5. Bedrooms / bathrooms
  if (c.bedsMin != null && p.bedrooms != null) {
    if (p.bedrooms < c.bedsMin) return null;
    if (c.bedsMax != null && p.bedrooms > c.bedsMax + 1) return null;
    score += 5; reasons.push(`${p.bedrooms} hab`);
  }
  if (c.bathsMin != null && p.bathrooms != null && p.bathrooms >= c.bathsMin) { score += 2; reasons.push(`${p.bathrooms} baños`); }

  return { score, reasons };
}
