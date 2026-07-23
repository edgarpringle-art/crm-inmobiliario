import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

// Public list of proposals for a client (no auth). Returns only safe fields.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 });

    const client = await queryOne<{ firstName: string }>(
      "SELECT firstName FROM Client WHERE id = ?",
      [clientId]
    ).catch(() => null);
    if (!client) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const rows = await query(
      `SELECT id, title, description, zona, price, currency, link, photos, status
       FROM Propuesta WHERE clientId = ? ORDER BY createdAt DESC`,
      [clientId]
    ).catch(() => []);

    return NextResponse.json({ clientFirstName: client.firstName, propuestas: rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
