import { NextRequest, NextResponse } from "next/server";
import { query, update, remove } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await update("Gasto", id, body);
    const rows = await query("SELECT * FROM Gasto WHERE id = ?", [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating gasto:", error);
    return NextResponse.json({ error: "Error al actualizar el gasto" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await remove("Gasto", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gasto:", error);
    return NextResponse.json({ error: "Error al eliminar el gasto" }, { status: 500 });
  }
}
