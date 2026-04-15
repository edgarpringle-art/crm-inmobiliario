import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get("completed");
    const clientId = searchParams.get("clientId");
    const dealId = searchParams.get("dealId");

    let sql = `
      SELECT t.*,
        cl.firstName as clientFirstName, cl.lastName as clientLastName,
        p.title as propertyTitle
      FROM Task t
      LEFT JOIN Client cl ON t.clientId = cl.id
      LEFT JOIN Deal d ON t.dealId = d.id
      LEFT JOIN Property p ON d.propertyId = p.id
      WHERE 1=1
    `;
    const args: unknown[] = [];

    if (completed !== null) { sql += " AND t.completed = ?"; args.push(completed === "true" ? 1 : 0); }
    if (clientId) { sql += " AND t.clientId = ?"; args.push(clientId); }
    if (dealId) { sql += " AND t.dealId = ?"; args.push(dealId); }

    sql += " ORDER BY t.completed ASC, t.dueDate ASC, t.createdAt DESC";

    const rows = await query(sql, args);
    return NextResponse.json(rows.map((t: Record<string, unknown>) => ({
      ...t,
      client: t.clientFirstName ? { firstName: t.clientFirstName, lastName: t.clientLastName } : null,
      deal: t.propertyTitle ? { property: { title: t.propertyTitle } } : null,
    })));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Error al obtener las tareas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) return NextResponse.json({ error: "title es obligatorio" }, { status: 400 });
    const id = await insert("Task", { ...body, completed: 0 });
    const rows = await query("SELECT * FROM Task WHERE id = ?", [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Error al crear la tarea" }, { status: 500 });
  }
}
