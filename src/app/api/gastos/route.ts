import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query("SELECT * FROM Gasto ORDER BY date DESC, createdAt DESC");
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching gastos:", error);
    return NextResponse.json({ error: "Error al obtener los gastos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.description || !body.amount) {
      return NextResponse.json({ error: "description y amount son obligatorios" }, { status: 400 });
    }
    const id = await insert("Gasto", body);
    const rows = await query("SELECT * FROM Gasto WHERE id = ?", [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating gasto:", error);
    return NextResponse.json({ error: "Error al crear el gasto" }, { status: 500 });
  }
}
