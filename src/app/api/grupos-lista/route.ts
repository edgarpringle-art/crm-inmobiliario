import { NextResponse } from "next/server";

const EP_REALTY_URL = process.env.EP_REALTY_URL || "http://localhost:3000";
const EP_REALTY_TOKEN = process.env.EP_REALTY_TOKEN || "";

/** Lista los grupos de WhatsApp que el bot viene leyendo, con su categoría. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dias = searchParams.get("dias") || "30";

  try {
    const res = await fetch(`${EP_REALTY_URL}/api/v1/grupos?dias=${dias}`, {
      headers: { Authorization: `Bearer ${EP_REALTY_TOKEN}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Error al conectar con EP Realty" }, { status: 502 });
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar al bot. ¿Está corriendo EP Realty?" },
      { status: 503 }
    );
  }
}

/** Fija la categoría de un grupo (oferta / busqueda / mixto). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${EP_REALTY_URL}/api/v1/grupos/tipo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EP_REALTY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar al bot" }, { status: 503 });
  }
}
