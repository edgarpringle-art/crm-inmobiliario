import { NextRequest, NextResponse } from "next/server";
import { insert, update } from "@/lib/db";
import { recordWebEvent } from "@/lib/webEvents";
import { clean, cleanNum, findByContact, rateLimited, todayPanama } from "@/lib/publicLead";
import { ensureAlertColumns, type WebAlert } from "@/lib/webAlerts";

// Public "Avísame cuando haya algo así" form. Creates (or reuses) the Client with the saved search,
// turns the web alert on and opens a Task. New matching listings show up in the CRM at /alertas-web.

const TYPES = ["APARTAMENTO", "PENTHOUSE", "CASA", "VILLA", "PROYECTO", "LOCAL", "OFICINA", "TERRENO", "NAVE"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (clean(body.website, 200)) return NextResponse.json({ ok: true }); // honeypot
    if (rateLimited(request)) return NextResponse.json({ error: "Demasiadas solicitudes, intenta más tarde." }, { status: 429 });

    const name = clean(body.name, 100);
    const phone = clean(body.phone, 30);
    const email = clean(body.email, 150).toLowerCase();
    if (!name || phone.replace(/\D/g, "").length < 7) return NextResponse.json({ error: "Nombre y teléfono son obligatorios." }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Email inválido." }, { status: 400 });

    const type = clean(body.type, 20);
    const alert: WebAlert = {
      op: body.op === "ALQUILER" ? "ALQUILER" : "COMPRA",
      type: TYPES.includes(type) ? type : null,
      zones: (Array.isArray(body.zones) ? body.zones : []).map((z: unknown) => clean(z, 60)).filter(Boolean).slice(0, 6),
      max: cleanNum(body.max),
      beds: cleanNum(body.beds),
      lang: body.lang === "en" ? "en" : "es",
    };
    const now = new Date().toISOString();
    const summary = [
      alert.op === "ALQUILER" ? "Alquilar" : "Comprar",
      alert.type,
      alert.zones.length ? `en ${alert.zones.join(", ")}` : null,
      alert.max ? `hasta $${alert.max.toLocaleString("en-US")}` : null,
      alert.beds ? `${alert.beds}+ rec.` : null,
    ].filter(Boolean).join(" · ");
    const note = `[Web ${todayPanama()}] Alerta de búsqueda: ${summary}`;

    await ensureAlertColumns();
    const alertCols = { webAlert: JSON.stringify(alert), webAlertActive: 1, webAlertSince: now, webAlertSentAt: null };
    const existing = await findByContact<{ id: string; notes: string | null }>("Client", phone, email);
    let clientId: string;
    if (existing) {
      clientId = existing.id;
      await update("Client", clientId, {
        ...alertCols, notes: [existing.notes, note].filter(Boolean).join("\n\n"),
        lastActivityBy: "Web panamainmo.com", lastActivityAt: now,
      });
    } else {
      const [firstName, ...rest] = name.split(/\s+/);
      clientId = await insert("Client", {
        firstName, lastName: rest.join(" ") || "", phone, email: email || null,
        clientType: alert.op === "ALQUILER" ? "ARRENDATARIO" : "COMPRADOR",
        source: "PORTAL_WEB", status: "PROSPECTO",
        searchType: alert.op, searchPropertyType: alert.type, searchZone: alert.zones[0] || null,
        searchZones: alert.zones.length ? JSON.stringify(alert.zones) : null,
        budgetMax: alert.max, bedrooms: alert.beds, notes: note, ...alertCols,
        createdBy: "Web panamainmo.com", lastActivityBy: "Web panamainmo.com", lastActivityAt: now,
      });
    }

    await insert("Activity", { type: "NOTA", description: `🔔 Activó una alerta en la web: ${summary}`, clientId, agent: "EDGAR" })
      .catch((e) => console.error("Alert activity error:", e));
    await insert("Task", {
      title: `Contactar lead web: ${name} (alerta)`,
      description: `${existing ? "Cliente existente" : "Cliente nuevo"} activó una alerta de búsqueda.\n${summary}\nTel: ${phone} · Email: ${email || "—"}\nLas coincidencias nuevas aparecen en Alertas Web.`,
      dueDate: todayPanama(), priority: "ALTA", completed: 0, assignedAgent: "EDGAR", clientId,
    }).catch((e) => console.error("Alert task error:", e));
    await recordWebEvent({ type: "lead", propertyId: null, path: "/alerta", meta: { op: alert.op, ...(alert.type ? { type: alert.type } : {}) } }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Web alert failed:", error);
    return NextResponse.json({ error: "No se pudo activar. Intenta por WhatsApp." }, { status: 500 });
  }
}
