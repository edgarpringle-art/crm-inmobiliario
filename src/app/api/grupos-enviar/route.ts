import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const EP_REALTY_URL = process.env.EP_REALTY_URL || "http://localhost:3000";
const EP_REALTY_TOKEN = process.env.EP_REALTY_TOKEN || "";

/**
 * Encola una publicación en los grupos seleccionados.
 * El bot responde de inmediato con un envio_id; el avance se consulta con GET.
 */
export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();

    const res = await fetch(`${EP_REALTY_URL}/api/v1/enviar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EP_REALTY_TOKEN}`,
        "Content-Type": "application/json",
      },
      // El agente lo pone el servidor, no el cliente: así el log del bot
      // siempre refleja quién publicó de verdad.
      body: JSON.stringify({ ...body, agente: me.displayName || me.username }),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar al bot" }, { status: 503 });
  }
}

/** Avance de un envío (?id=) o historial completo. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const path = id ? `/api/v1/envios/${id}` : `/api/v1/envios?limit=30`;

  try {
    const res = await fetch(`${EP_REALTY_URL}${path}`, {
      headers: { Authorization: `Bearer ${EP_REALTY_TOKEN}` },
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar al bot" }, { status: 503 });
  }
}
