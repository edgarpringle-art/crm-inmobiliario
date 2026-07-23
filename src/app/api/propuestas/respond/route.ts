import { NextRequest, NextResponse } from "next/server";
import { query, update } from "@/lib/db";

// Public endpoint: the client marks a proposal as INTERESADO or DESCARTADO.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, note } = body;
    if (!id || !["INTERESADO", "DESCARTADO", "PENDIENTE"].includes(status)) {
      return NextResponse.json({ error: "id y status válido requeridos" }, { status: 400 });
    }
    await update("Propuesta", id, {
      status,
      clientNote: note || null,
      respondedAt: new Date().toISOString(),
    });
    const rows = await query("SELECT id, status FROM Propuesta WHERE id = ?", [id]);
    return NextResponse.json(rows[0] || { ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
