import { NextRequest, NextResponse } from "next/server";
import { query, update } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await query("SELECT id, code, fullName, email, phone, role, initials, color, active, notes, createdAt FROM Agent WHERE id = ?", [id]);
    if (!rows.length) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Don't allow code change (it's the login username and FK basis)
    delete body.code;
    // Only update password if provided
    if (!body.password) delete body.password;

    if (body.role && !["broker", "admin", "agent"].includes(body.role)) {
      return NextResponse.json({ error: "role inválido" }, { status: 400 });
    }

    if (typeof body.active === "boolean") body.active = body.active ? 1 : 0;

    await update("Agent", id, body);
    const rows = await query("SELECT id, code, fullName, email, phone, role, initials, color, active FROM Agent WHERE id = ?", [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Soft delete: set active = 0
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await update("Agent", id, { active: 0 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
