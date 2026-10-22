import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureMlsTable } from "@/lib/mls/sync";

// CRM list of the MLS ACOBIR inventory (session required by middleware).
export async function GET(request: NextRequest) {
  try {
    await ensureMlsTable();
    const sp = new URL(request.url).searchParams;
    const q = (sp.get("q") || "").trim();
    const type = sp.get("type") || "";
    const op = sp.get("op") || "";
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = 30;

    let where = "WHERE active = 1";
    const args: (string | number)[] = [];
    if (type) { where += " AND propertyType = ?"; args.push(type); }
    if (op) { where += " AND (operationType = ? OR operationType = 'VENTA_Y_ALQUILER')"; args.push(op); }
    if (q) {
      where += " AND (title LIKE ? OR sector LIKE ? OR city LIKE ? OR corregimiento LIKE ? OR buildingName LIKE ? OR mlsId = ?)";
      const like = `%${q}%`;
      args.push(like, like, like, like, like, q.replace(/\D/g, ""));
    }

    const [items, count, stats] = await Promise.all([
      query(`SELECT id, mlsId, url, mlsStatus, title, buildingName, propertyType, operationType, salePrice, rentPrice, currency,
                    area, landArea, bedrooms, bathrooms, parkingSpots, sector, city, state, photos
             FROM MlsListing ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...args, limit, (page - 1) * limit]),
      query<{ n: number }>(`SELECT COUNT(*) AS n FROM MlsListing ${where}`, args),
      query<{ active: number; lastSync: string | null }>("SELECT SUM(active) AS active, MAX(fetchedAt) AS lastSync FROM MlsListing"),
    ]);

    return NextResponse.json({
      items: items.map((r) => {
        const row = r as unknown as Record<string, unknown>;
        let photo: string | null = null;
        try { photo = JSON.parse(String(row.photos || "[]"))[0] || null; } catch { /* ignore */ }
        return { ...row, photos: undefined, photo };
      }),
      total: Number(count[0]?.n || 0),
      page, limit,
      active: Number(stats[0]?.active || 0),
      lastSync: stats[0]?.lastSync || null,
    });
  } catch (error) {
    console.error("Error listing MLS:", error);
    return NextResponse.json({ error: "Error al obtener inventario MLS" }, { status: 500 });
  }
}
