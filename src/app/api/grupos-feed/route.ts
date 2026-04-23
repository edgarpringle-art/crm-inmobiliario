import { NextResponse } from "next/server";

const EP_REALTY_URL = process.env.EP_REALTY_URL || "http://localhost:3000";
const EP_REALTY_TOKEN = process.env.EP_REALTY_TOKEN || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dias = searchParams.get("dias") || "7";

  try {
    const res = await fetch(
      `${EP_REALTY_URL}/api/v1/feed?dias=${dias}&limit=10000`,
      {
        headers: {
          Authorization: `Bearer ${EP_REALTY_TOKEN}`,
        },
        // No cachear — siempre datos frescos
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Error al conectar con EP Realty" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar al bot. ¿Está corriendo EP Realty?" },
      { status: 503 }
    );
  }
}
