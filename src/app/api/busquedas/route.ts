import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const modalidad = searchParams.get("modalidad") || "";
    const agent = searchParams.get("agent") || "";

    let sql = "SELECT * FROM Busqueda WHERE 1=1";
    const args: unknown[] = [];

    if (search) {
      sql += " AND (nombre LIKE ? OR telefono LIKE ? OR zonas LIKE ? OR requisitos LIKE ?)";
      const s = `%${search}%`;
      args.push(s, s, s, s);
    }
    if (status) { sql += " AND status = ?"; args.push(status); }
    if (modalidad) { sql += " AND modalidad = ?"; args.push(modalidad); }
    if (agent) { sql += " AND assignedAgent = ?"; args.push(agent); }

    sql += " ORDER BY createdAt DESC";

    const rows = await query(sql, args).catch(() => []);
    return NextResponse.json(rows);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error al obtener búsquedas", details: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.nombre) {
      return NextResponse.json({ error: "nombre es obligatorio" }, { status: 400 });
    }
    // Stringify zonas array
    if (Array.isArray(body.zonas)) {
      body.zonas = JSON.stringify(body.zonas);
    }
    const id = await insert("Busqueda", body);
    const row = await query("SELECT * FROM Busqueda WHERE id = ?", [id]);
    return NextResponse.json(row[0], { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error al crear búsqueda", details: msg }, { status: 500 });
  }
}
