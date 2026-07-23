import { NextRequest, NextResponse } from "next/server";
import { query, update, remove } from "@/lib/db";

// Edit a proposal (agent)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (Array.isArray(body.photos)) body.photos = JSON.stringify(body.photos);
    if (body.price != null && body.price !== "") body.price = Number(body.price);
    await update("Propuesta", id, body);
    const rows = await query("SELECT * FROM Propuesta WHERE id = ?", [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await remove("Propuesta", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
