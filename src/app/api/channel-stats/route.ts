import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CLIENT_SOURCES } from "@/lib/constants";
import { ensureWebEventTable } from "@/lib/webEvents";

// Where clients come from and how many turn into deals: new clients per source in the last N days,
// how many have a deal and how many closed. Web leads are split by the form they used.
export async function GET(request: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const days = Math.min(365, Math.max(7, Number(new URL(request.url).searchParams.get("days")) || 30));
  const from = new Date(Date.now() - days * 86_400_000).toISOString();

  const rows = await query<{ source: string | null; clients: number; withDeal: number; closed: number }>(
    `SELECT c.source AS source, COUNT(*) AS clients,
            SUM(EXISTS (SELECT 1 FROM Deal d WHERE d.clientId = c.id)) AS withDeal,
            SUM(EXISTS (SELECT 1 FROM Deal d WHERE d.clientId = c.id AND d.status = 'CERRADO')) AS closed
     FROM Client c WHERE c.createdAt >= ? GROUP BY c.source ORDER BY clients DESC`,
    [from]
  ).catch(() => []);
  const label = (s: string | null) => CLIENT_SOURCES.find((x) => x.value === s)?.label || (s ? s : "Sin origen");

  await ensureWebEventTable().catch(() => {});
  const web = await query<{ kind: string; n: number }>(
    `SELECT CASE
       WHEN type = 'wa' THEN 'Clic en WhatsApp'
       WHEN path = '/vender' THEN 'Valoración (propietarios)'
       WHEN path = '/alerta' THEN 'Alerta de búsqueda'
       WHEN propertyId IS NOT NULL THEN 'Formulario en una propiedad'
       ELSE 'Formulario de contacto' END AS kind, COUNT(*) AS n
     FROM WebEvent WHERE createdAt >= ? AND type IN ('lead','wa') GROUP BY kind ORDER BY n DESC`,
    [from]
  ).catch(() => []);

  return NextResponse.json({
    days,
    sources: rows.map((r) => ({ source: label(r.source), clients: Number(r.clients), withDeal: Number(r.withDeal || 0), closed: Number(r.closed || 0) })),
    web: web.map((w) => ({ name: w.kind, count: Number(w.n) })),
  });
}
