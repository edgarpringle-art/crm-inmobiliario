import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    let sql = `
      SELECT d.*,
        cl.id as clientId_rel, cl.firstName as clientFirstName, cl.lastName as clientLastName, cl.email as clientEmail, cl.phone as clientPhone,
        p.id as propertyId_rel, p.title as propertyTitle, p.address as propertyAddress, p.propertyType as propertyPropertyType, p.salePrice as propertySalePrice, p.rentPrice as propertyRentPrice
      FROM Deal d
      LEFT JOIN Client cl ON d.clientId = cl.id
      LEFT JOIN Property p ON d.propertyId = p.id
      WHERE 1=1
    `;
    const args: unknown[] = [];

    if (search) {
      sql += " AND (d.notes LIKE ? OR cl.firstName LIKE ? OR cl.lastName LIKE ? OR p.title LIKE ? OR p.address LIKE ?)";
      const s = `%${search}%`;
      args.push(s, s, s, s, s);
    }

    if (status) {
      sql += " AND d.status = ?";
      args.push(status);
    }

    sql += " ORDER BY d.createdAt DESC";

    const rows = await query(sql, args);
    const deals = rows.map((d: Record<string, unknown>) => ({
      ...d,
      client: d.clientId_rel ? { id: d.clientId_rel, firstName: d.clientFirstName, lastName: d.clientLastName, email: d.clientEmail, phone: d.clientPhone } : null,
      property: d.propertyId_rel ? { id: d.propertyId_rel, title: d.propertyTitle, address: d.propertyAddress, propertyType: d.propertyPropertyType, salePrice: d.propertySalePrice, rentPrice: d.propertyRentPrice } : null,
    }));

    return NextResponse.json(deals);
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json({ error: "Error al obtener los negocios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.dealType) {
      return NextResponse.json({ error: "dealType es obligatorio" }, { status: 400 });
    }

    const id = await insert("Deal", body);
    const deal = await query("SELECT * FROM Deal WHERE id = ?", [id]);
    return NextResponse.json(deal[0], { status: 201 });
  } catch (error) {
    console.error("Error creating deal:", error);
    return NextResponse.json({ error: "Error al crear el negocio" }, { status: 500 });
  }
}
