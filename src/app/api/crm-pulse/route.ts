import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ensureVisitaTable, todayPanama } from "@/lib/visitas";
import { getAlerts } from "@/lib/webAlerts";

// Small status feed polled by the CRM sidebar: web leads waiting for contact, web alerts with
// new matches and today's showings. Agents only see their own leads and visits.

const LEAD_TASKS = "(title LIKE 'Contactar lead web:%' OR title LIKE 'Valorar propiedad:%')";
const OVERDUE_MS = 2 * 60 * 60 * 1000;

let alertsCache: { at: number; n: number } | null = null;

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const mine = me.role === "agent";

  const leads = await query<{ id: string; title: string; createdAt: string; clientId: string | null }>(
    `SELECT id, title, createdAt, clientId FROM Task WHERE completed = 0 AND ${LEAD_TASKS}
     ${mine ? "AND upper(assignedAgent) = upper(?)" : ""} ORDER BY createdAt ASC LIMIT 50`,
    mine ? [me.username] : []
  ).catch(() => []);
  const now = Date.now();
  const overdue = leads.filter((l) => now - new Date(l.createdAt).getTime() > OVERDUE_MS);

  // Alerts are heavier (every listing is scored), so they're cached for 5 minutes.
  if (!alertsCache || now - alertsCache.at > 5 * 60_000) {
    const alerts = await getAlerts().catch(() => []);
    alertsCache = { at: now, n: alerts.filter((a) => a.active && a.totalNew > 0).length };
  }

  await ensureVisitaTable().catch(() => {});
  const [visits] = await query<{ today: number; tomorrow: number }>(
    `SELECT SUM(date = ?) AS today, SUM(date = ? AND reminderSentAt IS NULL) AS tomorrow FROM Visita
     WHERE status IN ('PROGRAMADA','CONFIRMADA') ${mine ? "AND upper(agent) = upper(?)" : ""}`,
    mine ? [todayPanama(), todayPanama(1), me.username] : [todayPanama(), todayPanama(1)]
  ).catch(() => [{ today: 0, tomorrow: 0 }]);

  return NextResponse.json({
    leads: leads.length,
    overdue: overdue.map((l) => ({ id: l.id, title: l.title, createdAt: l.createdAt, clientId: l.clientId })),
    newestLead: leads.length ? leads[leads.length - 1].createdAt : null,
    alertsNew: alertsCache.n,
    visitsToday: Number(visits?.today || 0),
    visitsTomorrowPending: Number(visits?.tomorrow || 0),
  });
}
