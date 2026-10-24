import { NextRequest, NextResponse } from "next/server";
import { insert, query } from "@/lib/db";
import { findPublicSearch } from "@/lib/publicSearches";

// Public: a broker/owner offers a property for a published client search (panamainmo.com/buscamos).
// Logs an Activity on the client and opens a Task for the agent — the client stays anonymous.

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 8;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (clean(body.website, 200)) return NextResponse.json({ ok: true }); // honeypot

    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    if (rateLimited(ip)) return NextResponse.json({ error: "Demasiadas solicitudes, intenta más tarde." }, { status: 429 });

    const name = clean(body.name, 100);
    const company = clean(body.company, 100);
    const phone = clean(body.phone, 30);
    const email = clean(body.email, 150).toLowerCase();
    const link = clean(body.link, 500);
    const message = clean(body.message, 2000);
    if (!name || (!phone && !email)) return NextResponse.json({ error: "Nombre y teléfono o email son obligatorios." }, { status: 400 });
    if (!link && !message) return NextResponse.json({ error: "Comparte el enlace o los detalles de la propiedad." }, { status: 400 });

    const search = await findPublicSearch(clean(body.code, 20));
    if (!search) return NextResponse.json({ error: "Esta búsqueda ya no está activa." }, { status: 404 });

    let agentCode = "EDGAR";
    if (search.createdBy) {
      const ag = await query<{ code: string }>("SELECT code FROM Agent WHERE fullName = ? LIMIT 1", [search.createdBy]).catch(() => []);
      if (ag[0]?.code) agentCode = ag[0].code;
    }

    const who = `${name}${company ? ` (${company})` : ""}`;
    const details = [`Tel: ${phone || "—"} · Email: ${email || "—"}`, link && `Propiedad: ${link}`, message && `Mensaje: ${message}`].filter(Boolean).join("\n");

    await insert("Activity", {
      type: "NOTA",
      description: `🤝 ${who} ofreció una propiedad para la búsqueda publicada ${search.code}\n${details}`,
      clientId: search.clientId,
      agent: agentCode,
    }).catch((e) => console.error("Offer activity error:", e));

    await insert("Task", {
      title: `Revisar propiedad ofrecida por ${who} · ${search.code}`,
      description: details,
      dueDate: new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" }),
      priority: "ALTA",
      completed: 0,
      assignedAgent: agentCode,
      clientId: search.clientId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Offer error:", error);
    return NextResponse.json({ error: "No se pudo enviar. Intenta por WhatsApp." }, { status: 500 });
  }
}
