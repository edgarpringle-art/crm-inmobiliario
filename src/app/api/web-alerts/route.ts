import { NextRequest, NextResponse } from "next/server";
import { update } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ensureAlertColumns, getAlerts } from "@/lib/webAlerts";

// CRM: web alerts with their new matching listings (session required).
export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json(await getAlerts());
  } catch (error) {
    console.error("Web alerts failed:", error);
    return NextResponse.json({ error: "Error al cargar alertas" }, { status: 500 });
  }
}

// { id, action: "sent" | "off" | "on" } — "sent" marks the current matches as notified.
export async function PATCH(request: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, action } = await request.json().catch(() => ({}));
  if (!id || !["sent", "off", "on"].includes(action)) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  await ensureAlertColumns();
  const now = new Date().toISOString();
  await update("Client", String(id), action === "sent" ? { webAlertSentAt: now } : { webAlertActive: action === "on" ? 1 : 0 });
  return NextResponse.json({ ok: true });
}
