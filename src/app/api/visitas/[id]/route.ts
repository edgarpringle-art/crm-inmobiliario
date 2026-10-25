import { NextRequest, NextResponse } from "next/server";
import { remove, update } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ensureVisitaTable } from "@/lib/visitas";

const FIELDS = ["clientId", "propertyId", "propertyLabel", "address", "date", "time", "agent", "status", "notes", "feedback", "reminderSentAt"];

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await ensureVisitaTable();
  const { id } = await params;
  const b = await request.json().catch(() => ({}));
  const data = Object.fromEntries(Object.entries(b).filter(([k]) => FIELDS.includes(k)));
  if (!Object.keys(data).length) return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  await update("Visita", id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await ensureVisitaTable();
  await remove("Visita", (await params).id);
  return NextResponse.json({ ok: true });
}
