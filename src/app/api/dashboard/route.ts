import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date().toISOString();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 60);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString();

    const [totalClientsRow, activeClientsRow, totalPropertiesRow, availablePropertiesRow, totalDealsRow, closedDealsRow, commissionsRow] = await Promise.all([
      queryOne("SELECT COUNT(*) as count FROM Client"),
      queryOne("SELECT COUNT(*) as count FROM Client WHERE status = 'ACTIVO'"),
      queryOne("SELECT COUNT(*) as count FROM Property"),
      queryOne("SELECT COUNT(*) as count FROM Property WHERE status = 'DISPONIBLE'"),
      queryOne("SELECT COUNT(*) as count FROM Deal"),
      queryOne("SELECT COUNT(*) as count FROM Deal WHERE status = 'CERRADO'"),
      queryOne("SELECT COALESCE(SUM(commissionAmount), 0) as total FROM Deal WHERE status = 'CERRADO'"),
    ]);

    const recentDeals = await query(`
      SELECT d.*,
        cl.firstName as clientFirstName, cl.lastName as clientLastName,
        p.title as propertyTitle
      FROM Deal d
      LEFT JOIN Client cl ON d.clientId = cl.id
      LEFT JOIN Property p ON d.propertyId = p.id
      ORDER BY d.createdAt DESC LIMIT 5
    `);

    const expiringContracts = await query(`
      SELECT d.*,
        cl.firstName as clientFirstName, cl.lastName as clientLastName,
        p.title as propertyTitle
      FROM Deal d
      LEFT JOIN Client cl ON d.clientId = cl.id
      LEFT JOIN Property p ON d.propertyId = p.id
      WHERE d.dealType = 'ALQUILER' AND d.contractEndDate >= ? AND d.contractEndDate <= ?
      ORDER BY d.contractEndDate ASC
    `, [now, thirtyDaysStr]);

    const asNum = (row: Record<string, unknown> | null, field: string) => Number((row as Record<string, unknown>)?.[field] ?? 0);

    return NextResponse.json({
      totalClients: asNum(totalClientsRow, "count"),
      activeClients: asNum(activeClientsRow, "count"),
      totalProperties: asNum(totalPropertiesRow, "count"),
      availableProperties: asNum(availablePropertiesRow, "count"),
      totalDeals: asNum(totalDealsRow, "count"),
      closedDeals: asNum(closedDealsRow, "count"),
      totalCommissions: asNum(commissionsRow, "total"),
      recentDeals: recentDeals.map((d: Record<string, unknown>) => ({
        ...d,
        client: d.clientFirstName ? { firstName: d.clientFirstName, lastName: d.clientLastName } : null,
        property: d.propertyTitle ? { title: d.propertyTitle } : null,
      })),
      expiringContracts: expiringContracts.map((d: Record<string, unknown>) => ({
        ...d,
        client: d.clientFirstName ? { firstName: d.clientFirstName, lastName: d.clientLastName } : null,
        property: d.propertyTitle ? { title: d.propertyTitle } : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error al obtener las estadisticas del dashboard", details: msg }, { status: 500 });
  }
}
