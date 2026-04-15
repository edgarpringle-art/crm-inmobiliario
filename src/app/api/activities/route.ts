import { NextRequest, NextResponse } from "next/server";
import { query, insert, remove } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const dealId = searchParams.get("dealId");

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
    const id = await insert("Activity", body);
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
