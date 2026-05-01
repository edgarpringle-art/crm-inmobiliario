import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, update, remove } from "@/lib/db";
import { getCurrentUser, type SessionUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

interface DealRow {
  id: string;
  assignedAgent: string | null;
}

/** Returns true if the user is allowed to access this deal. */
function canAccess(user: SessionUser | null, deal: DealRow | null): boolean {
  if (!deal) return false;
  if (!user) return false;
  if (user.role === "broker" || user.role === "admin") return true;
  // agent: only their own deals
  return (deal.assignedAgent || "").toLowerCase() === user.username.toLowerCase();
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const me = await getCurrentUser();
    const dealRow = await queryOne<DealRow>("SELECT id, assignedAgent FROM Deal WHERE id = ?", [id]);
    if (!dealRow) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    if (!canAccess(me, dealRow)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const rows = await query(`
      SELECT d.*,
        cl.id as clientId_rel, cl.firstName as clientFirstName, cl.lastName as clientLastName, cl.email as clientEmail, cl.phone as clientPhone,
        p.id as propertyId_rel, p.title as propertyTitle, p.address as propertyAddress, p.propertyType as propertyPropertyType
      FROM Deal d
      LEFT JOIN Client cl ON d.clientId = cl.id
      LEFT JOIN Property p ON d.propertyId = p.id
      WHERE d.id = ?
    `, [id]);

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
    const me = await getCurrentUser();
    const existing = await queryOne<DealRow>("SELECT id, assignedAgent FROM Deal WHERE id = ?", [id]);
    if (!existing) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    if (!canAccess(me, existing)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const body = await request.json();
    // Prevent agents from re-assigning the deal to someone else
    if (me?.role === "agent") {
      body.assignedAgent = me.username.toUpperCase();
    }

    await update("Deal", id, body);

    // Auto-sync property availability with deal status
    // CERRADO  → VENDIDA / ALQUILADA (off the catalog)
    // CANCELADO → DISPONIBLE (back on the catalog)
    const fullDeal = await queryOne<{ propertyId: string | null; dealType: string | null; status: string | null }>(
      "SELECT propertyId, dealType, status FROM Deal WHERE id = ?", [id]
    );
    if (fullDeal?.propertyId) {
      if (fullDeal.status === "CERRADO") {
        const newPropertyStatus = fullDeal.dealType === "ALQUILER" ? "ALQUILADA" : "VENDIDA";
        await update("Property", fullDeal.propertyId, { status: newPropertyStatus });
      } else if (fullDeal.status === "CANCELADO") {
        // Only revert if currently marked as VENDIDA/ALQUILADA — don't touch RESERVADA/NO_DISPONIBLE
        const prop = await queryOne<{ status: string }>("SELECT status FROM Property WHERE id = ?", [fullDeal.propertyId]);
        if (prop && (prop.status === "VENDIDA" || prop.status === "ALQUILADA")) {
          await update("Property", fullDeal.propertyId, { status: "DISPONIBLE" });
        }
      }
    }

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
    const me = await getCurrentUser();
    const existing = await queryOne<DealRow>("SELECT id, assignedAgent FROM Deal WHERE id = ?", [id]);
    if (!existing) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    if (!canAccess(me, existing)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    await remove("Deal", id);
    return NextResponse.json({ message: "Negocio eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json({ error: "Error al eliminar el negocio" }, { status: 500 });
  }
}
