import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface Busqueda {
  id: string;
  clientId: string | null;
  nombre: string;
  telefono: string | null;
  modalidad: string;
  tipoPropiedad: string | null;
  presupuestoMin: number | null;
  presupuestoMax: number | null;
  currency: string;
  habitacionesMin: number | null;
  zonas: string | null;
  amoblado: string | null;
  hasPool: number; hasGym: number; hasElevator: number; hasSecurity: number;
  hasGenerator: number; hasFurniture: number; hasAppliances: number;
  hasAC: number; hasBalcony: number; hasGarden: number;
  requisitos: string | null;
  assignedAgent: string | null;
  status: string;
}

interface Property {
  id: string;
  propertyType: string;
  operationType: string;
  salePrice: number | null;
  rentPrice: number | null;
  currency: string;
  bedrooms: number | null;
  sector: string | null;
  city: string | null;
  state: string | null;
  hasPool: number; hasGym: number; hasElevator: number; hasSecurity: number;
  hasGenerator: number; hasFurniture: number; hasAppliances: number;
  hasAC: number; hasBalcony: number; hasGarden: number;
}

// Normalize string: lowercase, strip accents/symbols
function norm(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function parseZonas(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

const AMENITY_KEYS = [
  "hasPool", "hasGym", "hasElevator", "hasSecurity", "hasGenerator",
  "hasFurniture", "hasAppliances", "hasAC", "hasBalcony", "hasGarden",
] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  if (!propertyId) return NextResponse.json({ error: "propertyId requerido" }, { status: 400 });

  try {
    const [propRows, busquedas] = await Promise.all([
      query<Property>("SELECT * FROM Property WHERE id = ?", [propertyId]),
      query<Busqueda>("SELECT * FROM Busqueda WHERE status = 'ACTIVO'"),
    ]);

    if (!propRows.length) return NextResponse.json([]);
    const prop = propRows[0];

    // Property locations (normalized)
    const propZones = [prop.sector, prop.city, prop.state]
      .filter(Boolean)
      .map((z) => norm(z as string));

    const results: Array<Busqueda & { score: number; reasons: string[] }> = [];

    for (const b of busquedas) {
      const reasons: string[] = [];
      let score = 0;

      // 1. Modalidad match
      const bMod = b.modalidad; // COMPRA | ALQUILER
      const pOp = prop.operationType; // VENTA | ALQUILER | VENTA_Y_ALQUILER
      const modMatch =
        (bMod === "COMPRA" && (pOp === "VENTA" || pOp === "VENTA_Y_ALQUILER")) ||
        (bMod === "ALQUILER" && (pOp === "ALQUILER" || pOp === "VENTA_Y_ALQUILER"));
      if (!modMatch) continue;
      score += 25;
      reasons.push("Modalidad ✓");

      // 2. Tipo propiedad
      if (!b.tipoPropiedad || b.tipoPropiedad === prop.propertyType) {
        score += 15;
        reasons.push("Tipo ✓");
      } else {
        // Soft miss — still continue but lower score
        reasons.push("Tipo diferente");
      }

      // 3. Zona match (check if property zones overlap with búsqueda zones)
      const bZonas = parseZonas(b.zonas).map(norm);
      const zonaMatch = bZonas.some((bz) =>
        propZones.some((pz) => pz.includes(bz) || bz.includes(pz))
      );
      if (zonaMatch) {
        score += 35;
        reasons.push("Zona ✓");
      } else if (bZonas.length > 0) {
        reasons.push("Zona no coincide");
      }

      // 4. Precio match
      const price = bMod === "COMPRA" ? prop.salePrice : prop.rentPrice;
      if (price != null && (b.presupuestoMin != null || b.presupuestoMax != null)) {
        const minOk = b.presupuestoMin == null || price >= b.presupuestoMin * 0.85;
        const maxOk = b.presupuestoMax == null || price <= b.presupuestoMax * 1.10;
        if (minOk && maxOk) {
          score += 20;
          reasons.push("Presupuesto ✓");
        } else {
          reasons.push("Precio fuera de rango");
        }
      }

      // 5. Habitaciones
      if (b.habitacionesMin != null && prop.bedrooms != null) {
        if (prop.bedrooms >= b.habitacionesMin) {
          score += 5;
          reasons.push(`${prop.bedrooms} hab ≥ ${b.habitacionesMin} ✓`);
        } else {
          reasons.push(`${prop.bedrooms} hab < ${b.habitacionesMin} mín`);
        }
      }

      // 6. Amenidades (bonus)
      let amenBonus = 0;
      for (const k of AMENITY_KEYS) {
        if (b[k] && prop[k]) amenBonus++;
      }
      if (amenBonus > 0) {
        score += amenBonus * 2;
        reasons.push(`${amenBonus} amenidades ✓`);
      }

      // Min threshold: modalidad + either zona or precio
      if (score >= 40) {
        results.push({ ...b, score, reasons });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return NextResponse.json(results.slice(0, 20));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
