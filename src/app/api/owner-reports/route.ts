import { NextRequest, NextResponse } from "next/server";
import { ensureColumn, getDb, query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ensureWebEventTable } from "@/lib/webEvents";
import { ensureVisitaTable } from "@/lib/visitas";

// Owner reports: per own listing, how many people viewed it on panamainmo.com, clicked WhatsApp,
// sent a form and visited it, in the last N days (plus the previous period to show the trend).
export async function GET(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const days = Math.min(90, Math.max(7, Number(new URL(request.url).searchParams.get("days")) || 30));
  await Promise.all([ensureWebEventTable(), ensureVisitaTable(), ensureColumn("Property", "ownerReportAt")]);

  const now = Date.now();
  const from = new Date(now - days * 86_400_000).toISOString();
  const prevFrom = new Date(now - 2 * days * 86_400_000).toISOString();
  const fromDay = from.slice(0, 10);

  const props = await query<Record<string, unknown>>(
    `SELECT p.id, p.title, p.status, p.sector, p.city, p.operationType, p.salePrice, p.rentPrice, p.currency, p.createdAt,
            p.ownerReportAt, p.createdBy,
            COALESCE(NULLIF(trim(coalesce(c.firstName,'') || ' ' || coalesce(c.lastName,'')), ''), p.ownerName) AS ownerName,
            COALESCE(c.phone, p.ownerPhone) AS ownerPhone
     FROM Property p LEFT JOIN Client c ON c.id = p.ownerId
     WHERE p.status IN ('DISPONIBLE','RESERVADO') ORDER BY p.createdAt DESC`
  ).catch(() => query<Record<string, unknown>>(
    `SELECT id, title, status, sector, city, operationType, salePrice, rentPrice, currency, createdAt, ownerReportAt, createdBy,
            ownerName, ownerPhone FROM Property WHERE status IN ('DISPONIBLE','RESERVADO') ORDER BY createdAt DESC`
  ));

  const ev = await query<{ propertyId: string; type: string; cur: number; prev: number }>(
    `SELECT propertyId, type, SUM(createdAt >= ?) AS cur, SUM(createdAt < ?) AS prev FROM WebEvent
     WHERE createdAt >= ? AND propertyId IS NOT NULL AND type IN ('view','wa','lead') GROUP BY propertyId, type`,
    [from, from, prevFrom]
  ).catch(() => []);
  const visits = await query<{ propertyId: string; n: number }>(
    `SELECT propertyId, COUNT(*) AS n FROM Visita WHERE propertyId IS NOT NULL AND date >= ? AND status != 'CANCELADA' GROUP BY propertyId`,
    [fromDay]
  ).catch(() => []);

  const stat = (id: string, type: string, k: "cur" | "prev") => Number(ev.find((e) => e.propertyId === id && e.type === type)?.[k] || 0);
  return NextResponse.json({
    days,
    items: props.map((p) => {
      const id = String(p.id);
      return {
        id, title: p.title, status: p.status, zone: [p.sector, p.city].filter(Boolean).join(", "),
        operationType: p.operationType, price: p.salePrice ?? p.rentPrice, currency: p.currency,
        ownerName: p.ownerName || null, ownerPhone: p.ownerPhone || null, reportAt: p.ownerReportAt || null,
        agent: p.createdBy || null, listedAt: p.createdAt,
        views: stat(id, "view", "cur"), viewsPrev: stat(id, "view", "prev"),
        whatsapp: stat(id, "wa", "cur"), leads: stat(id, "lead", "cur"),
        visits: Number(visits.find((v) => v.propertyId === id)?.n || 0),
      };
    }),
  });
}

// { propertyId } — marks the owner report as sent today.
export async function POST(request: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { propertyId } = await request.json().catch(() => ({}));
  if (!propertyId) return NextResponse.json({ error: "propertyId requerido" }, { status: 400 });
  await ensureColumn("Property", "ownerReportAt");
  // Direct SQL so the listing's updatedAt (used by the sitemap) doesn't change.
  await getDb().execute({ sql: "UPDATE Property SET ownerReportAt = ? WHERE id = ?", args: [new Date().toISOString(), String(propertyId)] });
  return NextResponse.json({ ok: true });
}
