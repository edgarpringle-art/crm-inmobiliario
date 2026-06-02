import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { syncBusquedaFromClient } from "@/lib/syncBusqueda";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    let sql = "SELECT * FROM Client WHERE 1=1";
    const args: unknown[] = [];

    if (search) {
      sql += " AND (firstName LIKE ? OR lastName LIKE ? OR email LIKE ? OR phone LIKE ? OR cedula LIKE ? OR city LIKE ?)";
      const s = `%${search}%`;
      args.push(s, s, s, s, s, s);
    }

    if (status) {
      sql += " AND status = ?";
      args.push(status);
    }

    sql += " ORDER BY createdAt DESC";

    const clients = await query(sql, args);
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error al obtener los clientes", details: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.firstName || !body.lastName || !body.clientType) {
      return NextResponse.json({ error: "firstName, lastName y clientType son obligatorios" }, { status: 400 });
    }

    const me = await getCurrentUser();
    const id = await insert("Client", { ...body, createdBy: me?.displayName || null });
    const client = await query<Record<string, unknown>>("SELECT * FROM Client WHERE id = ?", [id]);

    // Mirror search criteria into Busqueda table so the EP Realty bot picks it up
    await syncBusquedaFromClient(client[0] as unknown as Parameters<typeof syncBusquedaFromClient>[0]);

    return NextResponse.json(client[0], { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error al crear el cliente", details: msg }, { status: 500 });
  }
}
