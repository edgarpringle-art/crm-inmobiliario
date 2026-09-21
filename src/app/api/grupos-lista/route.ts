import { NextResponse } from "next/server";

const EP_REALTY_URL = process.env.EP_REALTY_URL || "http://localhost:3000";
const EP_REALTY_TOKEN = process.env.EP_REALTY_TOKEN || "";

/** Lista los grupos de WhatsApp que el bot viene leyendo, con su categoría. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dias = searchParams.get("dias") || "30";
  const ocultos = searchParams.get("ocultos") === "1" ? "&ocultos=1" : "";

  try {
    const res = await fetch(`${EP_REALTY_URL}/api/v1/grupos?dias=${dias}${ocultos}`, {
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

/**
 * Fija la categoría de un grupo, o lo oculta/restaura si viene `ocultar`.
 * Ocultar además hace que el bot deje de capturar ese grupo.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const destino = "ocultar" in body ? "ocultar" : "tipo";
    const res = await fetch(`${EP_REALTY_URL}/api/v1/grupos/${destino}`, {
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
