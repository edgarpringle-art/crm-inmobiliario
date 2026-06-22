import { NextRequest, NextResponse } from "next/server";
import { query, insert, update, remove } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const dealId = searchParams.get("dealId");
    const recent = searchParams.get("recent");

    // Cross-client feed: latest follow-ups with the client's name attached
    if (recent) {
      const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
      const rows = await query(
        `SELECT a.id, a.type, a.description, a.agent, a.createdAt, a.clientId,
                c.firstName AS clientFirstName, c.lastName AS clientLastName
         FROM Activity a
         LEFT JOIN Client c ON a.clientId = c.id
         WHERE a.clientId IS NOT NULL
         ORDER BY a.createdAt DESC LIMIT ?`,
        [limit]
      ).catch(() => []);
      return NextResponse.json(rows);
    }

    let sql = "SELECT * FROM Activity WHERE 1=1";
    const args: unknown[] = [];

    if (clientId) { sql += " AND clientId = ?"; args.push(clientId); }
    if (dealId) { sql += " AND dealId = ?"; args.push(dealId); }

    sql += " ORDER BY createdAt DESC LIMIT 50";
    const rows = await query(sql, args);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Error al obtener actividades" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.type || !body.description) return NextResponse.json({ error: "type y description son obligatorios" }, { status: 400 });

    const me = await getCurrentUser();
    const agent = me?.displayName || null;
    const id = await insert("Activity", { ...body, agent });

    // Bump the client to the top of its column and record who followed up last
    if (body.clientId) {
      try {
        await update("Client", body.clientId, {
          lastActivityAt: new Date().toISOString(),
          lastActivityBy: agent,
        });
      } catch { /* column may not exist yet on prod — ignore */ }
    }

    const rows = await query("SELECT * FROM Activity WHERE id = ?", [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Error al crear actividad" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    await remove("Activity", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json({ error: "Error al eliminar actividad" }, { status: 500 });
  }
}
