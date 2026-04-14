import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, update, remove } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const client = await queryOne("SELECT * FROM Client WHERE id = ?", [id]);
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const ownedProperties = await query("SELECT * FROM Property WHERE ownerId = ?", [id]);
    const deals = await query(`
      SELECT d.*, p.id as propertyId2, p.title as propertyTitle
      FROM Deal d LEFT JOIN Property p ON d.propertyId = p.id
      WHERE d.clientId = ?
    `, [id]);

    const dealsFormatted = deals.map((d: Record<string, unknown>) => ({
      ...d,
      property: d.propertyId ? { id: d.propertyId, title: d.propertyTitle } : null,
    }));

    return NextResponse.json({ ...client, ownedProperties, deals: dealsFormatted });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Error al obtener el cliente" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await queryOne("SELECT id FROM Client WHERE id = ?", [id]);
    if (!existing) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const body = await request.json();
    await update("Client", id, body);
    const client = await queryOne("SELECT * FROM Client WHERE id = ?", [id]);
    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Error al actualizar el cliente" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await queryOne("SELECT id FROM Client WHERE id = ?", [id]);
    if (!existing) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    await remove("Client", id);
    return NextResponse.json({ message: "Cliente eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Error al eliminar el cliente" }, { status: 500 });
  }
}
