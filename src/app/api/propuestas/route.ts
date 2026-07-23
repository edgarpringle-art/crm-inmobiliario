import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// List proposals for a client (agent view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 });

    const rows = await query(
      "SELECT * FROM Propuesta WHERE clientId = ? ORDER BY createdAt DESC",
      [clientId]
    ).catch(() => []);
    return NextResponse.json(rows);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Create a proposal (agent)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.clientId || !body.title) {
      return NextResponse.json({ error: "clientId y title son obligatorios" }, { status: 400 });
    }
    const me = await getCurrentUser();
    const data = {
      clientId: body.clientId,
      title: body.title,
      description: body.description || null,
      zona: body.zona || null,
      price: body.price != null && body.price !== "" ? Number(body.price) : null,
      currency: body.currency || "USD",
      link: body.link || null,
      photos: Array.isArray(body.photos) ? JSON.stringify(body.photos) : (body.photos || null),
      status: "PENDIENTE",
      createdBy: me?.displayName || null,
    };
    const id = await insert("Propuesta", data);
    const rows = await query("SELECT * FROM Propuesta WHERE id = ?", [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
