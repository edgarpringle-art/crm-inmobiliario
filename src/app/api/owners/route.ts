import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query(`
      SELECT o.*,
        (SELECT COUNT(*) FROM Property p WHERE p.ownerId = o.id) as propertyCount
      FROM Owner o
      ORDER BY o.lastName ASC, o.firstName ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching owners:", error);
    return NextResponse.json({ error: "Error al obtener propietarios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.firstName || !body.lastName) return NextResponse.json({ error: "firstName y lastName son obligatorios" }, { status: 400 });
    const id = await insert("Owner", body);
    const rows = await query("SELECT * FROM Owner WHERE id = ?", [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating owner:", error);
    return NextResponse.json({ error: "Error al crear propietario" }, { status: 500 });
  }
}
