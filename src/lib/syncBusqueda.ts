/**
 * Auto-sync between Client (form) and Busqueda (bot-readable) tables.
 *
 * The CRM form now lets you enter search criteria directly on the Client record
 * for clientType in COMPRADOR / ARRENDATARIO / INVERSOR. The EP Realty bot,
 * however, reads /api/busquedas which queries the Busqueda table.
 *
 * This helper keeps a one-to-one Busqueda record in sync with each client that
 * has search criteria, so:
 *  - The bot still picks up the search and matches it against WhatsApp groups
 *  - The user doesn't need to fill the dedicated /busquedas form anymore
 */

import { query, queryOne, insert, update } from "@/lib/db";

const SEARCH_CLIENT_TYPES = ["COMPRADOR", "ARRENDATARIO", "INVERSOR"];

interface ClientLike {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  phone2?: string | null;
  clientType?: string | null;
  searchType?: string | null;
  searchZone?: string | null;
  searchPropertyType?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  bedrooms?: number | null;
  searchNotes?: string | null;
}

function modalidadFromClient(client: ClientLike): string {
  const st = (client.searchType || "").toUpperCase();
  if (st === "ALQUILER") return "ALQUILER";
  if (st === "COMPRA" || st === "COMPRA_Y_ALQUILER") return "COMPRA";
  // Fallback derived from clientType
  if (client.clientType === "ARRENDATARIO") return "ALQUILER";
  return "COMPRA";
}

function hasSearchData(client: ClientLike): boolean {
  return !!(
    (client.searchZone && client.searchZone.trim()) ||
    client.searchPropertyType ||
    client.budgetMin != null ||
    client.budgetMax != null ||
    client.bedrooms != null ||
    (client.searchType && client.searchType.trim()) ||
    (client.searchNotes && client.searchNotes.trim())
  );
}

/**
 * Upserts a Busqueda for the given client if they're a search-type client
 * with criteria filled in. Deactivates the linked Busqueda otherwise.
 */
export async function syncBusquedaFromClient(client: ClientLike): Promise<void> {
  if (!client?.id) return;

  const isSearchType = client.clientType ? SEARCH_CLIENT_TYPES.includes(client.clientType) : false;

  if (!isSearchType) {
    // Client is now a Vendedor / Propietario / etc — deactivate linked búsqueda
    try {
      await query("UPDATE Busqueda SET status = 'INACTIVO' WHERE clientId = ?", [client.id]);
    } catch { /* table or column may be missing in some environments — ignore */ }
    return;
  }

  if (!hasSearchData(client)) {
    // No search criteria filled — don't create an empty búsqueda
    return;
  }

  const fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Cliente";

  const fields = {
    clientId: client.id,
    nombre: fullName,
    telefono: client.phone || null,
    telefono2: client.phone2 || null,
    email: client.email || null,
    modalidad: modalidadFromClient(client),
    tipoPropiedad: client.searchPropertyType || null,
    presupuestoMin: client.budgetMin ?? null,
    presupuestoMax: client.budgetMax ?? null,
    currency: "USD",
    habitacionesMin: client.bedrooms ?? null,
    zonas: client.searchZone ? JSON.stringify([client.searchZone]) : null,
    requisitos: client.searchNotes || null,
    status: "ACTIVO",
    assignedAgent: "EDGAR",
  };

  try {
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM Busqueda WHERE clientId = ? LIMIT 1",
      [client.id]
    );
    if (existing) {
      await update("Busqueda", existing.id, fields);
    } else {
      await insert("Busqueda", fields);
    }
  } catch (error) {
    // Don't fail the client save if búsqueda sync fails — just log
    console.error("[syncBusquedaFromClient]", error);
  }
}
