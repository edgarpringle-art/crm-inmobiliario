import { NextRequest, NextResponse } from "next/server";
import { insert, query, update } from "@/lib/db";

// Public lead capture from panamainmo.com — no auth required.
// Creates (or reuses) a Client, logs an Activity and opens a Task for the agent.

const WEB_SOURCE = "PORTAL_WEB";
const WEB_CREATOR = "Web panamainmo.com";

// Best-effort rate limit per IP (per serverless instance).
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function todayPanama(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
}

interface PropertyRow {
  id: string; title: string; operationType: string; propertyType: string;
  sector: string | null; city: string | null; createdBy: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Honeypot: real users never fill this hidden field.
    if (clean(body.website, 200)) return NextResponse.json({ ok: true });

    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Demasiadas solicitudes, intenta más tarde." }, { status: 429 });
    }

    const name = clean(body.name, 100);
    const email = clean(body.email, 150).toLowerCase();
    const phone = clean(body.phone, 30);
    const message = clean(body.message, 2000);
    const propertyId = clean(body.propertyId, 50);
    const phoneDigits = phone.replace(/\D/g, "");

    if (!name || (!phoneDigits && !email)) {
      return NextResponse.json({ error: "Nombre y teléfono o email son obligatorios." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    let property: PropertyRow | null = null;
    let mlsUrl: string | null = null;
    if (propertyId) {
      const rows = await query<PropertyRow>(
        "SELECT id, title, operationType, propertyType, sector, city, createdBy FROM Property WHERE id = ?",
        [propertyId]
      );
      property = rows[0] || null;
      // MLS ACOBIR listing shown on the site as ours ("mls26108")
      if (!property && /^mls\d+$/.test(propertyId)) {
        const mls = await query<PropertyRow & { mlsId: string; url: string }>(
          "SELECT id, title, operationType, propertyType, sector, city, NULL AS createdBy, mlsId, url FROM MlsListing WHERE id = ?",
          [propertyId]
        ).catch(() => []);
        if (mls[0]) {
          property = { ...mls[0], title: `${mls[0].title} [MLS #${mls[0].mlsId}]` };
          mlsUrl = mls[0].url;
        }
      }
    }

    // Agent: whoever published the property, else Edgar.
    let agentCode = "EDGAR";
    if (property?.createdBy) {
      const ag = await query<{ code: string }>("SELECT code FROM Agent WHERE fullName = ? LIMIT 1", [property.createdBy]).catch(() => []);
      if (ag[0]?.code) agentCode = ag[0].code;
    }

    const propLine = property
      ? `${property.title}${property.sector ? ` (${property.sector})` : ""} — https://panamainmo.com/p/${property.id}`
      : "Consulta general";
    const mlsLine = mlsUrl ? `
Ficha MLS: ${mlsUrl}` : "";
    const leadNote = `[Web ${todayPanama()}] ${propLine}${message ? `\n${message}` : ""}`;

    // Dedupe: same phone (last 8 digits) or same email.
    const last8 = phoneDigits.slice(-8);
    const existing = await query<{ id: string; notes: string | null }>(
      `SELECT id, notes FROM Client
       WHERE (? != '' AND substr(replace(replace(replace(replace(replace(phone,' ',''),'-',''),'+',''),'(',''),')',''), -8) = ?)
          OR (? != '' AND lower(email) = ?)
       LIMIT 1`,
      [last8, last8, email, email]
    );

    let clientId: string;
    let isNew = false;
    if (existing.length) {
      clientId = existing[0].id;
      await update("Client", clientId, {
        notes: [existing[0].notes, leadNote].filter(Boolean).join("\n\n"),
        lastActivityBy: WEB_CREATOR,
        lastActivityAt: new Date().toISOString(),
      });
    } else {
      isNew = true;
      const [firstName, ...rest] = name.split(/\s+/);
      const isRent = property?.operationType === "ALQUILER";
      clientId = await insert("Client", {
        firstName,
        lastName: rest.join(" ") || "",
        email: email || null,
        phone: phone || null,
        clientType: isRent ? "ARRENDATARIO" : "COMPRADOR",
        source: WEB_SOURCE,
        status: "PROSPECTO",
        searchType: property ? (isRent ? "ALQUILER" : "COMPRA") : null,
        searchPropertyType: property?.propertyType || null,
        searchZone: property?.sector || null,
        notes: leadNote,
        createdBy: WEB_CREATOR,
        lastActivityBy: WEB_CREATOR,
        lastActivityAt: new Date().toISOString(),
      });
    }

    await insert("Activity", {
      type: "NOTA",
      description: `🌐 Solicitud de información desde la web: ${propLine}${message ? `\n"${message}"` : ""}`,
      clientId,
      agent: agentCode,
    }).catch((e) => console.error("Lead activity error:", e));

    await insert("Task", {
      title: `Contactar lead web: ${name}`,
      description: `${isNew ? "Cliente nuevo" : "Cliente existente"} pidió información.\n${propLine}${mlsLine}\nTel: ${phone || "—"} · Email: ${email || "—"}${message ? `\nMensaje: ${message}` : ""}`,
      dueDate: todayPanama(),
      priority: "ALTA",
      completed: 0,
      assignedAgent: agentCode,
      clientId,
    }).catch((e) => console.error("Lead task error:", e));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "No se pudo enviar. Intenta por WhatsApp." }, { status: 500 });
  }
}
