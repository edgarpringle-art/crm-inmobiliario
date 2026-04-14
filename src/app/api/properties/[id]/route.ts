import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, update, remove } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const rows = await query(`
      SELECT p.*, c.id as ownerId_rel, c.firstName as ownerFirstName, c.lastName as ownerLastName, c.phone as ownerPhoneRel, c.email as ownerEmailRel
      FROM Property p LEFT JOIN Client c ON p.ownerId = c.id WHERE p.id = ?
    `, [id]);
    if (!rows[0]) return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });

    const r = rows[0] as Record<string, unknown>;
    const property = {
      ...r,
      owner: r.ownerId_rel ? { id: r.ownerId_rel, firstName: r.ownerFirstName, lastName: r.ownerLastName, phone: r.ownerPhoneRel, email: r.ownerEmailRel } : null,
    };

    const deals = await query(`
      SELECT d.*, cl.id as clientId_rel, cl.firstName as clientFirstName, cl.lastName as clientLastName
      FROM Deal d LEFT JOIN Client cl ON d.clientId = cl.id WHERE d.propertyId = ?
    `, [id]);

    const dealsFormatted = deals.map((d: Record<string, unknown>) => ({
      ...d,
      client: d.clientId_rel ? { id: d.clientId_rel, firstName: d.clientFirstName, lastName: d.clientLastName } : null,
    }));

    return NextResponse.json({ ...property, deals: dealsFormatted });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json({ error: "Error al obtener la propiedad" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await queryOne("SELECT id FROM Property WHERE id = ?", [id]);
    if (!existing) return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });

    const body = await request.json();
    await update("Property", id, body);
    const property = await queryOne("SELECT * FROM Property WHERE id = ?", [id]);
    return NextResponse.json(property);
  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json({ error: "Error al actualizar la propiedad" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await queryOne("SELECT id FROM Property WHERE id = ?", [id]);
    if (!existing) return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });

    await remove("Property", id);
    return NextResponse.json({ message: "Propiedad eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json({ error: "Error al eliminar la propiedad" }, { status: 500 });
  }
}
