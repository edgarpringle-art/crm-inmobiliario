import { NextRequest, NextResponse } from "next/server";
import { insert, query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ensureVisitaTable } from "@/lib/visitas";

// Showings agenda. GET ?from=YYYY-MM-DD&to=YYYY-MM-DD (agents only see their own).
export async function GET(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await ensureVisitaTable();
  const sp = new URL(request.url).searchParams;
  const where: string[] = [];
  const args: unknown[] = [];
  if (sp.get("from")) { where.push("v.date >= ?"); args.push(sp.get("from")); }
  if (sp.get("to")) { where.push("v.date <= ?"); args.push(sp.get("to")); }
  if (sp.get("clientId")) { where.push("v.clientId = ?"); args.push(sp.get("clientId")); }
  if (me.role === "agent") { where.push("upper(v.agent) = upper(?)"); args.push(me.username); }
  const rows = await query(
    `SELECT v.*, c.firstName AS clientFirstName, c.lastName AS clientLastName, c.phone AS clientPhone
     FROM Visita v LEFT JOIN Client c ON c.id = v.clientId
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY v.date ASC, v.time ASC LIMIT 500`,
    args
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await ensureVisitaTable();
  const b = await request.json().catch(() => ({}));
  if (!b.date || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });
  if (!b.clientId && !b.propertyLabel) return NextResponse.json({ error: "Indica el cliente o la propiedad" }, { status: 400 });
  const id = await insert("Visita", {
    clientId: b.clientId || null, propertyId: b.propertyId || null, propertyLabel: b.propertyLabel || null,
    address: b.address || null, date: b.date, time: b.time || null,
    agent: b.agent || me.username.toUpperCase(), status: "PROGRAMADA", notes: b.notes || null,
  });
  if (b.clientId) {
    await insert("Activity", {
      type: "VISITA", clientId: b.clientId, agent: (b.agent || me.username).toUpperCase(),
      description: `📅 Visita programada: ${b.propertyLabel || "propiedad"} — ${b.date}${b.time ? ` ${b.time}` : ""}`,
    }).catch(() => {});
  }
  return NextResponse.json({ id });
}
