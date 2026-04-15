import { NextRequest, NextResponse } from "next/server";
import { query, update, remove } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query(`
      SELECT o.*,
        p.id as propId, p.title as propTitle, p.propertyType as propType,
        p.operationType as propOp, p.status as propStatus,
        p.salePrice as propSalePrice, p.rentPrice as propRentPrice, p.currency as propCurrency
      FROM Owner o
      LEFT JOIN Property p ON p.ownerId = o.id
      WHERE o.id = ?
    `, [id]);
    if (rows.length === 0) return NextResponse.json({ error: "Propietario no encontrado" }, { status: 404 });

    const owner = { ...(rows[0] as Record<string, unknown>) };
    const properties = rows
      .filter((r: Record<string, unknown>) => r.propId)
      .map((r: Record<string, unknown>) => ({ id: r.propId, title: r.propTitle, propertyType: r.propType, operationType: r.propOp, status: r.propStatus, salePrice: r.propSalePrice, rentPrice: r.propRentPrice, currency: r.propCurrency }));

    return NextResponse.json({ ...owner, properties });
  } catch (error) {
    console.error("Error fetching owner:", error);
    return NextResponse.json({ error: "Error al obtener propietario" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await update("Owner", id, body);
    const rows = await query("SELECT * FROM Owner WHERE id = ?", [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating owner:", error);
    return NextResponse.json({ error: "Error al actualizar propietario" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await remove("Owner", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting owner:", error);
    return NextResponse.json({ error: "Error al eliminar propietario" }, { status: 500 });
  }
}
