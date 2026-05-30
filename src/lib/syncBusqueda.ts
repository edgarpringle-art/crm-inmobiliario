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
  status?: string | null;
  searchType?: string | null;
  searchZone?: string | null;          // legacy single-zone string
  searchZones?: string | null;         // new: JSON array of zones
  searchPropertyType?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency?: string | null;
  bedrooms?: number | null;            // min bedrooms
  bedroomsMax?: number | null;
  bathrooms?: number | null;           // min bathrooms
  bathroomsMax?: number | null;
  amoblado?: string | null;
  hasPool?: number | boolean | null;
  hasGym?: number | boolean | null;
  hasElevator?: number | boolean | null;
  hasSecurity?: number | boolean | null;
  hasGenerator?: number | boolean | null;
  hasFurniture?: number | boolean | null;
  hasAppliances?: number | boolean | null;
  hasAC?: number | boolean | null;
  hasBalcony?: number | boolean | null;
  hasGarden?: number | boolean | null;
  searchNotes?: string | null;
}

// Funnel stages where we keep matching with WhatsApp groups
const ACTIVE_STATUSES = ["PROSPECTO", "ACTIVO", "EN_PROCESO"];

function modalidadFromClient(client: ClientLike): string {
  const st = (client.searchType || "").toUpperCase();
  if (st === "ALQUILER") return "ALQUILER";
  if (st === "COMPRA" || st === "COMPRA_Y_ALQUILER") return "COMPRA";
  // Fallback derived from clientType
  if (client.clientType === "ARRENDATARIO") return "ALQUILER";
  return "COMPRA";
}

function parseZonesField(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((z) => typeof z === "string" && z.trim()) : [];
  } catch { return []; }
}

function clientZones(client: ClientLike): string[] {
  const fromMulti = parseZonesField(client.searchZones);
  if (fromMulti.length) return fromMulti;
  return client.searchZone?.trim() ? [client.searchZone.trim()] : [];
}

function hasSearchData(client: ClientLike): boolean {
  return !!(
    clientZones(client).length ||
    client.searchPropertyType ||
    client.budgetMin != null ||
    client.budgetMax != null ||
    client.bedrooms != null ||
    client.bedroomsMax != null ||
    (client.searchType && client.searchType.trim()) ||
    (client.searchNotes && client.searchNotes.trim())
  );
}

function asBool(v: number | boolean | null | undefined): number {
  return v ? 1 : 0;
}

/**
 * Upserts a Busqueda for the given client if they're a search-type client
 * with criteria filled in. Deactivates the linked Busqueda otherwise.
 */
export async function syncBusquedaFromClient(client: ClientLike): Promise<void> {
  if (!client?.id) return;

  const isSearchType = client.clientType ? SEARCH_CLIENT_TYPES.includes(client.clientType) : false;
  const isActiveStage = client.status ? ACTIVE_STATUSES.includes(client.status) : true;

  // Deactivate the búsqueda when:
  //  - Client type isn't search-type (Vendedor/Propietario), OR
  //  - Client is in a non-active funnel stage (Perdido/Cerrado)
  // This makes the bot stop matching them with WhatsApp groups
  // (and on next sync the bot will remove their entries from mis_listados
  // and clean up orphan matches).
  if (!isSearchType || !isActiveStage) {
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
  const zones = clientZones(client);

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
    currency: client.currency || "USD",
    habitacionesMin: client.bedrooms ?? null,
    habitacionesMax: client.bedroomsMax ?? null,
    banosMin: client.bathrooms ?? null,
    banosMax: client.bathroomsMax ?? null,
    zonas: zones.length ? JSON.stringify(zones) : null,
    amoblado: client.amoblado || "INDIFERENTE",
    hasPool:      asBool(client.hasPool),
    hasGym:       asBool(client.hasGym),
    hasElevator:  asBool(client.hasElevator),
    hasSecurity:  asBool(client.hasSecurity),
    hasGenerator: asBool(client.hasGenerator),
    hasFurniture: asBool(client.hasFurniture),
    hasAppliances:asBool(client.hasAppliances),
    hasAC:        asBool(client.hasAC),
    hasBalcony:   asBool(client.hasBalcony),
    hasGarden:    asBool(client.hasGarden),
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
