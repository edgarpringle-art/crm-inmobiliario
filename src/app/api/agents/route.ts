import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";

interface AgentRow {
  id: string;
  code: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  password: string;
  role: string;
  initials: string | null;
  color: string | null;
  active: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get("active") === "1";

    let sql = "SELECT id, code, fullName, email, phone, role, initials, color, active, notes, createdAt FROM Agent";
    if (onlyActive) sql += " WHERE active = 1";
    sql += " ORDER BY active DESC, fullName ASC";

    const rows = await query<AgentRow>(sql).catch(() => []);
    return NextResponse.json(rows);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.code || !body.fullName || !body.password) {
      return NextResponse.json({ error: "code, fullName y password son obligatorios" }, { status: 400 });
    }
    const code = String(body.code).toLowerCase().trim();

    // Check duplicate code
    const existing = await query("SELECT id FROM Agent WHERE code = ?", [code]);
    if (existing.length > 0) {
      return NextResponse.json({ error: `Ya existe un agente con código "${code}"` }, { status: 409 });
    }

    const data = {
      code,
      fullName: body.fullName,
      email: body.email || null,
      phone: body.phone || null,
      password: body.password,
      role: body.role || "agent",
      initials: body.initials || null,
      color: body.color || "from-slate-500 to-slate-600",
      active: 1,
      notes: body.notes || null,
    };

    const id = await insert("Agent", data);
    const row = await query("SELECT id, code, fullName, email, phone, role, initials, color, active FROM Agent WHERE id = ?", [id]);
    return NextResponse.json(row[0], { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
