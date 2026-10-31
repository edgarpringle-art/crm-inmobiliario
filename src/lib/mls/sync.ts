import { ensureColumn, getDb, query } from "@/lib/db";
import { fetchXposure, normalizeXposureUrl, type MlsRecord } from "./xposure";

// MLS ACOBIR listings the user chose to publish (imported from their Xposure links).
// Own table so they never mix with the CRM's properties, the WhatsApp bot sync or matches.
let ensured = false;
export async function ensureMlsTable(): Promise<void> {
  if (ensured) return;
  await getDb().execute(`CREATE TABLE IF NOT EXISTS MlsListing (
    id TEXT PRIMARY KEY, code TEXT, mlsId TEXT, url TEXT,
    title TEXT, buildingName TEXT, propertyType TEXT, operationType TEXT,
    salePrice REAL, rentPrice REAL, currency TEXT, maintenanceFee REAL,
    area REAL, landArea REAL, bedrooms REAL, bathrooms REAL, parkingSpots REAL, yearBuilt INTEGER,
    sector TEXT, city TEXT, state TEXT, corregimiento TEXT,
    description TEXT, features TEXT, photos TEXT,
    mlsStatus TEXT, active INTEGER DEFAULT 1, fetchedAt TEXT, createdAt TEXT, updatedAt TEXT
  )`);
  await getDb().execute("CREATE INDEX IF NOT EXISTS MlsListing_active ON MlsListing(active)");
  for (const c of ["listingAgent", "listingAgentPhone", "listingOffice", "descriptionEn", "descriptionEnSource"]) await ensureColumn("MlsListing", c);
  ensured = true;
}

const COLS = [
  "id", "code", "mlsId", "url", "title", "buildingName", "propertyType", "operationType",
  "salePrice", "rentPrice", "currency", "maintenanceFee", "area", "landArea", "bedrooms", "bathrooms",
  "parkingSpots", "yearBuilt", "sector", "city", "state", "corregimiento", "description", "features",
  "photos", "mlsStatus", "active", "listingAgent", "listingAgentPhone", "listingOffice",
] as const;

async function upsert(r: MlsRecord): Promise<void> {
  const now = new Date().toISOString();
  const values = COLS.map((c) => {
    const v = r[c as keyof MlsRecord];
    return Array.isArray(v) ? JSON.stringify(v) : (v as string | number | null);
  });
  // The public page only knows the corregimiento; a neighborhood saved from the member search
  // (corregimiento set) is kept when a later refresh doesn't bring one.
  const updates = COLS.filter((c) => c !== "id").map((c) =>
    c === "sector" ? "sector = CASE WHEN excluded.corregimiento IS NULL AND MlsListing.corregimiento IS NOT NULL THEN MlsListing.sector ELSE excluded.sector END"
    : c === "corregimiento" ? "corregimiento = COALESCE(excluded.corregimiento, MlsListing.corregimiento)"
    : `${c} = excluded.${c}`).join(", ");
  await getDb().execute({
    sql: `INSERT INTO MlsListing (${COLS.join(", ")}, fetchedAt, createdAt, updatedAt)
          VALUES (${COLS.map(() => "?").join(", ")}, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET ${updates}, fetchedAt = excluded.fetchedAt, updatedAt = excluded.updatedAt`,
    args: [...values, now, now, now],
  });
}

async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>, deadline = Infinity) {
  let i = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (i < items.length && Date.now() < deadline) await fn(items[i++]);
  }));
}

export interface ImportResult { input: string; ok: boolean; skipped?: boolean; id?: string; title?: string; error?: string }

/**
 * Imports Xposure links (max 25 per call). Re-importing a link refreshes it, unless
 * `skipExisting` is set and the listing is already published (used for bulk file imports).
 */
export interface ZoneHint { barrio?: string | null; area?: string | null }

export async function importMlsLinks(
  raw: string[],
  { skipExisting = false, hints = {} as Record<string, ZoneHint> } = {}
): Promise<ImportResult[]> {
  await ensureMlsTable();
  const seen = new Set<string>();
  const jobs = raw.map((input) => ({ input, norm: normalizeXposureUrl(input) })).slice(0, 25);
  const published = new Set(
    skipExisting ? (await query<{ code: string }>("SELECT code FROM MlsListing WHERE active = 1")).map((r) => r.code) : []
  );
  const results: ImportResult[] = [];
  await pool(jobs, 4, async ({ input, norm }) => {
    if (!norm) { results.push({ input, ok: false, error: "No es un enlace de propiedades.mlsacobir.com/listing/..." }); return; }
    if (seen.has(norm.code)) return;
    seen.add(norm.code);
    const hint = hints[norm.code];
    const barrio = hint?.barrio?.trim() || null;
    const area = hint?.area?.trim() || null;
    if (published.has(norm.code)) {
      // Already published: only refresh the neighborhood from the search file (no download).
      if (barrio) await getDb().execute({ sql: "UPDATE MlsListing SET sector = ?, corregimiento = ? WHERE code = ?", args: [barrio, area || barrio, norm.code] });
      results.push({ input, ok: true, skipped: true });
      return;
    }
    try {
      const rec = await fetchXposure(norm.url, norm.code);
      if (!rec) { results.push({ input, ok: false, error: "La propiedad ya no existe en el MLS" }); return; }
      if (barrio) { rec.sector = barrio; rec.corregimiento = area || barrio; }
      await upsert(rec);
      results.push({ input, ok: true, id: rec.id, title: rec.title });
    } catch (e) {
      results.push({ input, ok: false, error: e instanceof Error ? e.message : "No se pudo leer" });
    }
  });
  return results;
}

export interface RecheckResult { checked: number; hidden: number; failed: number; remaining: number; active: number }

/**
 * Re-reads published listings (oldest first) to refresh price/photos and hide the ones that
 * left the MLS. Stops at the time budget; the next run continues where this one stopped.
 */
export async function recheckMls({ budgetMs = 45_000 } = {}): Promise<RecheckResult> {
  const deadline = Date.now() + budgetMs;
  await ensureMlsTable();
  const rows = await query<{ id: string; code: string; url: string }>(
    "SELECT id, code, url FROM MlsListing WHERE active = 1 ORDER BY fetchedAt ASC"
  );
  let checked = 0, hidden = 0, failed = 0;
  await pool(rows, 5, async (r) => {
    try {
      const rec = await fetchXposure(r.url, r.code);
      if (rec && rec.id === r.id) await upsert(rec);
      else {
        await getDb().execute({ sql: "UPDATE MlsListing SET active = 0, mlsStatus = 'Retirada', fetchedAt = ?, updatedAt = ? WHERE id = ?", args: [new Date().toISOString(), new Date().toISOString(), r.id] });
        hidden++;
      }
      checked++;
    } catch (e) {
      failed++;
      console.error("MLS recheck error", r.id, e);
    }
  }, deadline);
  const active = Number((await query<{ n: number }>("SELECT COUNT(*) AS n FROM MlsListing WHERE active = 1"))[0]?.n || 0);
  return { checked, hidden, failed, remaining: Math.max(0, rows.length - checked - failed), active };
}

/**
 * Hides published listings whose code is not in `codes` (a fresh full MLS search the user
 * uploaded): those were sold or withdrawn. Returns how many were hidden.
 */
export async function pruneMls(codes: string[]): Promise<number> {
  await ensureMlsTable();
  const keep = new Set(codes.map((c) => c.toLowerCase()));
  const active = await query<{ id: string; code: string }>("SELECT id, code FROM MlsListing WHERE active = 1");
  const gone = active.filter((r) => !keep.has(String(r.code)));
  const now = new Date().toISOString();
  for (const r of gone) {
    await getDb().execute({ sql: "UPDATE MlsListing SET active = 0, mlsStatus = 'Retirada', updatedAt = ? WHERE id = ?", args: [now, r.id] });
  }
  return gone.length;
}

export async function removeMlsListing(id: string): Promise<void> {
  await ensureMlsTable();
  await getDb().execute({ sql: "DELETE FROM MlsListing WHERE id = ?", args: [id] });
}
