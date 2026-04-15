import { NextRequest, NextResponse } from "next/server";
import { query, update, remove } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await update("Task", id, body);
    const rows = await query("SELECT * FROM Task WHERE id = ?", [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Error al actualizar la tarea" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await remove("Task", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Error al eliminar la tarea" }, { status: 500 });
  }
}
