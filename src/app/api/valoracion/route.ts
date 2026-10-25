import { NextRequest, NextResponse } from "next/server";
import { insert, update } from "@/lib/db";
import { recordWebEvent } from "@/lib/webEvents";
import { clean, cleanNum, findByContact, rateLimited, todayPanama } from "@/lib/publicLead";

// Public "¿Cuánto vale tu propiedad?" form (panamainmo.com/vender).
// Creates (or reuses) the owner as a Client (type PROPIETARIO/VENDEDOR) and opens a high-priority Task.

const OPS: Record<string, string> = { VENTA: "Vender", ALQUILER: "Alquilar", AMBOS: "Vender o alquilar" };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (clean(body.website, 200)) return NextResponse.json({ ok: true }); // honeypot
    if (rateLimited(request)) return NextResponse.json({ error: "Demasiadas solicitudes, intenta más tarde." }, { status: 429 });

    const name = clean(body.name, 100);
    const phone = clean(body.phone, 30);
    const email = clean(body.email, 150).toLowerCase();
    if (!name || phone.replace(/\D/g, "").length < 7) {
      return NextResponse.json({ error: "Nombre y teléfono son obligatorios." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Email inválido." }, { status: 400 });

    const op = OPS[clean(body.operation, 20)] || "Vender";
    const type = clean(body.propertyType, 40);
    const zone = clean(body.zone, 120);
    const area = cleanNum(body.area);
    const beds = cleanNum(body.bedrooms);
    const expected = cleanNum(body.expectedPrice);
    const message = clean(body.message, 2000);

    const details = [
      `Quiere: ${op}`,
      type && `Tipo: ${type}`,
      zone && `Zona: ${zone}`,
      area && `Área: ${area} m²`,
      beds && `Recámaras: ${beds}`,
      expected && `Precio esperado: $${expected.toLocaleString("en-US")}`,
      message && `Mensaje: ${message}`,
    ].filter(Boolean).join("\n");
    const note = `[Web ${todayPanama()}] Solicitud de valoración\n${details}`;

    const existing = await findByContact<{ id: string; notes: string | null }>("Client", phone, email);
    let clientId: string;
    if (existing) {
      clientId = existing.id;
      await update("Client", clientId, {
        notes: [existing.notes, note].filter(Boolean).join("\n\n"),
        lastActivityBy: "Web panamainmo.com", lastActivityAt: new Date().toISOString(),
      });
    } else {
      const [firstName, ...rest] = name.split(/\s+/);
      clientId = await insert("Client", {
        firstName, lastName: rest.join(" ") || "", phone, email: email || null,
        clientType: op === "Alquilar" ? "PROPIETARIO" : "VENDEDOR",
        source: "PORTAL_WEB", status: "PROSPECTO", city: zone || null, notes: note,
        createdBy: "Web panamainmo.com", lastActivityBy: "Web panamainmo.com", lastActivityAt: new Date().toISOString(),
      });
    }

    await insert("Activity", {
      type: "NOTA", description: `🏷️ Solicitud de valoración desde la web\n${details}`, clientId, agent: "EDGAR",
    }).catch((e) => console.error("Valuation activity error:", e));

    await insert("Task", {
      title: `Valorar propiedad: ${name}`,
      description: `${existing ? "Cliente existente" : "Propietario nuevo"} pidió una valoración desde la web.\nTel: ${phone} · Email: ${email || "—"}\n${details}`,
      dueDate: todayPanama(),
      priority: "ALTA",
      completed: 0,
      assignedAgent: "EDGAR",
      clientId,
    }).catch((e) => console.error("Valuation task error:", e));

    await recordWebEvent({ type: "lead", propertyId: null, path: "/vender" }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Valuation lead failed:", error);
    return NextResponse.json({ error: "No se pudo enviar. Intenta por WhatsApp." }, { status: 500 });
  }
}
