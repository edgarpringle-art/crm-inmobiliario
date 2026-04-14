import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    let sql = `
      SELECT p.*, c.id as ownerId_rel, c.firstName as ownerFirstName, c.lastName as ownerLastName, c.phone as ownerPhoneRel, c.email as ownerEmailRel
      FROM Property p LEFT JOIN Client c ON p.ownerId = c.id
      WHERE 1=1
    `;
    const args: unknown[] = [];

    if (search) {
      sql += " AND (p.title LIKE ? OR p.address LIKE ? OR p.sector LIKE ? OR p.city LIKE ? OR p.description LIKE ? OR p.ownerName LIKE ?)";
      const s = `%${search}%`;
      args.push(s, s, s, s, s, s);
    }

    if (status) {
      sql += " AND p.status = ?";
      args.push(status);
    }

    sql += " ORDER BY p.createdAt DESC";

    const rows = await query(sql, args);
    const properties = rows.map((r: Record<string, unknown>) => ({
      ...r,
      owner: r.ownerId_rel ? { id: r.ownerId_rel, firstName: r.ownerFirstName, lastName: r.ownerLastName, phone: r.ownerPhoneRel, email: r.ownerEmailRel } : null,
    }));

    return NextResponse.json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json({ error: "Error al obtener las propiedades" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.propertyType || !body.operationType) {
      return NextResponse.json({ error: "title, propertyType y operationType son obligatorios" }, { status: 400 });
    }

    const id = await insert("Property", body);
    const property = await query("SELECT * FROM Property WHERE id = ?", [id]);
    return NextResponse.json(property[0], { status: 201 });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json({ error: "Error al crear la propiedad" }, { status: 500 });
  }
}
