import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Public catalog API — no auth required
// Returns available properties with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const opType = searchParams.get("op") || ""; // VENTA | ALQUILER
    const propType = searchParams.get("type") || "";
    const minPrice = searchParams.get("min") ? Number(searchParams.get("min")) : null;
    const maxPrice = searchParams.get("max") ? Number(searchParams.get("max")) : null;
    const bedrooms = searchParams.get("beds") ? Number(searchParams.get("beds")) : null;
    const zone = searchParams.get("zone") || "";

    let sql = `
      SELECT id, title, propertyType, operationType, status,
             sector, city, state, address, referencePoint,
             salePrice, rentPrice, currency, maintenanceFee,
             area, bedrooms, bathrooms, parkingSpots,
             hasPool, hasGym, hasElevator, hasSecurity, hasGenerator,
             hasFurniture, hasAppliances, hasAC, hasBalcony, hasGarden,
             description, photos
      FROM Property
      WHERE status = 'DISPONIBLE'
    `;
    const args: unknown[] = [];

    if (opType) {
      // VENTA_Y_ALQUILER also matches if filtering by VENTA or ALQUILER
      sql += " AND (operationType = ? OR operationType = 'VENTA_Y_ALQUILER')";
      args.push(opType);
    }
    if (propType) {
      sql += " AND propertyType = ?";
      args.push(propType);
    }
    if (minPrice != null) {
      sql += " AND (salePrice >= ? OR rentPrice >= ?)";
      args.push(minPrice, minPrice);
    }
    if (maxPrice != null) {
      sql += " AND (salePrice <= ? OR rentPrice <= ?)";
      args.push(maxPrice, maxPrice);
    }
    if (bedrooms != null) {
      sql += " AND bedrooms >= ?";
      args.push(bedrooms);
    }
    if (zone) {
      sql += " AND (sector = ? OR city = ?)";
      args.push(zone, zone);
    }

    sql += " ORDER BY createdAt DESC LIMIT 100";

    const rows = await query(sql, args);

    // Parse photos JSON for each property
    const properties = rows.map((r: Record<string, unknown>) => ({
      ...r,
      photos: r.photos ? (() => { try { return JSON.parse(r.photos as string); } catch { return []; } })() : [],
    }));

    return NextResponse.json(properties, {
      headers: {
        // Cache for 5 minutes on CDN
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching catalog:", error);
    return NextResponse.json({ error: "Error al obtener el catálogo" }, { status: 500 });
  }
}
