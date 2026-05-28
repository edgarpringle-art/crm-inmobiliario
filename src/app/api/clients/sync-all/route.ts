import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { syncBusquedaFromClient } from "@/lib/syncBusqueda";

/**
 * One-shot: iterate every client and run syncBusquedaFromClient.
 * Useful after adding the auto-sync feature to backfill existing records.
 * Broker only.
 */
export async function POST() {
  const me = await getCurrentUser();
  if (!me || me.role !== "broker") {
    return NextResponse.json({ error: "Solo broker puede ejecutar" }, { status: 403 });
  }

  const clients = await query<Record<string, unknown>>("SELECT * FROM Client");

  let processed = 0, errors = 0;
  for (const c of clients) {
    try {
      await syncBusquedaFromClient(c as unknown as Parameters<typeof syncBusquedaFromClient>[0]);
      processed++;
    } catch (e) {
      console.error(`[sync-all] client ${c.id}:`, e);
      errors++;
    }
  }

  // Count current state of the Busqueda table after sync for reporting
  const activeBusquedas = await query<{ n: number }>(
    "SELECT COUNT(*) as n FROM Busqueda WHERE status = 'ACTIVO'"
  ).catch(() => [{ n: 0 }]);
  const inactiveBusquedas = await query<{ n: number }>(
    "SELECT COUNT(*) as n FROM Busqueda WHERE status = 'INACTIVO'"
  ).catch(() => [{ n: 0 }]);

  return NextResponse.json({
    total: clients.length,
    processed,
    errors,
    activeBusquedas: activeBusquedas[0]?.n ?? 0,
    inactiveBusquedas: inactiveBusquedas[0]?.n ?? 0,
  });
}
