import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, update, remove } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const rows = await query(`
      SELECT d.*,
        cl.id as clientId_rel, cl.firstName as clientFirstName, cl.lastName as clientLastName, cl.email as clientEmail, cl.phone as clientPhone,
        p.id as propertyId_rel, p.title as propertyTitle, p.address as propertyAddress, p.propertyType as propertyPropertyType
      FROM Deal d
      LEFT JOIN Client cl ON d.clientId = cl.id
      LEFT JOIN Property p ON d.propertyId = p.id
      WHERE d.id = ?
    `, [id]);

    if (!rows[0]) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    const d = rows[0] as Record<string, unknown>;
    const deal = {
      ...d,
      client: d.clientId_rel ? { id: d.clientId_rel, firstName: d.clientFirstName, lastName: d.clientLastName, email: d.clientEmail, phone: d.clientPhone } : null,
      property: d.propertyId_rel ? { id: d.propertyId_rel, title: d.propertyTitle, address: d.propertyAddress, propertyType: d.propertyPropertyType } : null,
    };

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Error fetching deal:", error);
    return NextResponse.json({ error: "Error al obtener el negocio" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await queryOne("SELECT id FROM Deal WHERE id = ?", [id]);
    if (!existing) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    const body = await request.json();
    await update("Deal", id, body);
    const deal = await queryOne("SELECT * FROM Deal WHERE id = ?", [id]);
    return NextResponse.json(deal);
  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json({ error: "Error al actualizar el negocio" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await queryOne("SELECT id FROM Deal WHERE id = ?", [id]);
    if (!existing) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    await remove("Deal", id);
    return NextResponse.json({ message: "Negocio eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json({ error: "Error al eliminar el negocio" }, { status: 500 });
  }
}
