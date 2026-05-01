import { NextRequest, NextResponse } from "next/server";
import { query, update, remove } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await update("Ingreso", id, body);
    const rows = await query("SELECT * FROM Ingreso WHERE id = ?", [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating ingreso:", error);
    return NextResponse.json({ error: "Error al actualizar el ingreso" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await remove("Ingreso", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ingreso:", error);
    return NextResponse.json({ error: "Error al eliminar el ingreso" }, { status: 500 });
  }
}
