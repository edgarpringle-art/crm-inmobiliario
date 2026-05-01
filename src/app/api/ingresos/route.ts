import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query("SELECT * FROM Ingreso ORDER BY date DESC, createdAt DESC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching ingresos:", error);
    return NextResponse.json({ error: "Error al obtener los ingresos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.description || !body.amount) {
      return NextResponse.json({ error: "description y amount son obligatorios" }, { status: 400 });
    }
    const id = await insert("Ingreso", body);
    const rows = await query("SELECT * FROM Ingreso WHERE id = ?", [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating ingreso:", error);
    return NextResponse.json({ error: "Error al crear el ingreso" }, { status: 500 });
  }
}
