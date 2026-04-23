import { NextRequest, NextResponse } from "next/server";
import { query, update, remove } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query("SELECT * FROM Busqueda WHERE id = ?", [id]);
    if (!rows.length) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error", details: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (Array.isArray(body.zonas)) {
      body.zonas = JSON.stringify(body.zonas);
    }
    await update("Busqueda", id, body);
    const rows = await query("SELECT * FROM Busqueda WHERE id = ?", [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error al actualizar", details: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await remove("Busqueda", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error al eliminar", details: msg }, { status: 500 });
  }
}
