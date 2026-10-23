import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureWebEventTable } from "@/lib/webEvents";

// Website statistics for the CRM (session required by middleware).
interface Ev { type: string; propertyId: string | null; path: string | null; meta: string | null; ref: string | null; lang: string | null; createdAt: string }

const dayPA = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Panama" });
const TYPE_LABEL: Record<string, string> = {
  APARTAMENTO: "Apartamento", CASA: "Casa", PENTHOUSE: "Penthouse", TERRENO: "Terreno", LOCAL: "Local",
  OFICINA: "Oficina", PROYECTO: "Proyecto", NAVE: "Bodega", VILLA: "Villa",
};

function top(map: Map<string, number>, n: number) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));
}
const bump = (m: Map<string, number>, k: string | null | undefined, by = 1) => { if (k) m.set(k, (m.get(k) || 0) + by); };

export async function GET(request: NextRequest) {
  try {
    await ensureWebEventTable();
    const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 30));
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const events = await query<Ev>(
      "SELECT type, propertyId, path, meta, ref, lang, createdAt FROM WebEvent WHERE createdAt >= ? ORDER BY createdAt",
      [since]
    );

    const totals = { visits: 0, propertyViews: 0, whatsapp: 0, leads: 0, searches: 0 };
    const daily = new Map<string, { visits: number; whatsapp: number; leads: number }>();
    const props = new Map<string, { views: number; whatsapp: number; leads: number }>();
    const zones = new Map<string, number>(), types = new Map<string, number>(), ops = new Map<string, number>();
    const pages = new Map<string, number>(), refs = new Map<string, number>(), langs = new Map<string, number>();

    // Every day of the range appears in the chart, even with zero visits.
    for (let i = days - 1; i >= 0; i--) daily.set(dayPA(new Date(Date.now() - i * 86400000).toISOString()), { visits: 0, whatsapp: 0, leads: 0 });

    for (const e of events) {
      const d = daily.get(dayPA(e.createdAt));
      const pr = e.propertyId ? props.get(e.propertyId) || { views: 0, whatsapp: 0, leads: 0 } : null;
      if (e.type === "view" || e.type === "page") {
        totals.visits++; if (d) d.visits++;
        bump(refs, e.ref || "Directo / WhatsApp"); bump(langs, e.lang === "en" ? "Inglés" : "Español");
        if (e.type === "view") { totals.propertyViews++; if (pr) pr.views++; } else bump(pages, e.path);
      } else if (e.type === "wa") { totals.whatsapp++; if (d) d.whatsapp++; if (pr) pr.whatsapp++; }
      else if (e.type === "lead") { totals.leads++; if (d) d.leads++; if (pr) pr.leads++; }
      else if (e.type === "search") {
        totals.searches++;
        try {
          const m = JSON.parse(e.meta || "{}") as Record<string, string>;
          bump(zones, m.zone || m.dist || m.prov);
          bump(types, TYPE_LABEL[m.type] || m.type);
          bump(ops, m.op === "VENTA" ? "Comprar" : m.op === "ALQUILER" ? "Alquilar" : null);
        } catch { /* ignore */ }
      }
      if (pr && e.propertyId) props.set(e.propertyId, pr);
    }

    // Titles for the most viewed properties (own or MLS).
    const topIds = [...props.entries()].sort((a, b) => b[1].views - a[1].views || b[1].whatsapp - a[1].whatsapp).slice(0, 15);
    const ids = topIds.map(([id]) => id);
    const titles = new Map<string, { title: string; zone: string | null; mlsId: string | null }>();
    if (ids.length) {
      const ph = ids.map(() => "?").join(",");
      const own = await query<{ id: string; title: string; sector: string | null }>(`SELECT id, title, sector FROM Property WHERE id IN (${ph})`, ids).catch(() => []);
      own.forEach((r) => titles.set(r.id, { title: r.title, zone: r.sector, mlsId: null }));
      const mls = await query<{ id: string; title: string; sector: string | null; mlsId: string }>(`SELECT id, title, sector, mlsId FROM MlsListing WHERE id IN (${ph})`, ids).catch(() => []);
      mls.forEach((r) => titles.set(r.id, { title: r.title, zone: r.sector, mlsId: r.mlsId }));
    }

    return NextResponse.json({
      days, totals,
      daily: [...daily.entries()].map(([date, v]) => ({ date, ...v })),
      topProperties: topIds.map(([id, v]) => ({ id, ...v, ...(titles.get(id) || { title: id, zone: null, mlsId: null }) })),
      topZones: top(zones, 12), topTypes: top(types, 8), ops: top(ops, 2),
      topPages: top(pages, 10), referrers: top(refs, 8), langs: top(langs, 2),
    });
  } catch (error) {
    console.error("web-stats error:", error);
    return NextResponse.json({ error: "Error al calcular estadísticas" }, { status: 500 });
  }
}
