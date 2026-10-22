import { getDb, query } from "@/lib/db";
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
  ensured = true;
}

const COLS = [
  "id", "code", "mlsId", "url", "title", "buildingName", "propertyType", "operationType",
  "salePrice", "rentPrice", "currency", "maintenanceFee", "area", "landArea", "bedrooms", "bathrooms",
  "parkingSpots", "yearBuilt", "sector", "city", "state", "corregimiento", "description", "features",
  "photos", "mlsStatus", "active",
] as const;

async function upsert(r: MlsRecord): Promise<void> {
  const now = new Date().toISOString();
  const values = COLS.map((c) => {
    const v = r[c as keyof MlsRecord];
    return Array.isArray(v) ? JSON.stringify(v) : (v as string | number | null);
  });
  const updates = COLS.filter((c) => c !== "id").map((c) => `${c} = excluded.${c}`).join(", ");
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

export interface ImportResult { input: string; ok: boolean; id?: string; title?: string; error?: string }

/** Imports pasted Xposure links (max 25 per call). Re-importing a link refreshes it. */
export async function importMlsLinks(raw: string[]): Promise<ImportResult[]> {
  await ensureMlsTable();
  const seen = new Set<string>();
  const jobs = raw.map((input) => ({ input, norm: normalizeXposureUrl(input) })).slice(0, 25);
  const results: ImportResult[] = [];
  await pool(jobs, 3, async ({ input, norm }) => {
    if (!norm) { results.push({ input, ok: false, error: "No es un enlace de propiedades.mlsacobir.com/listing/..." }); return; }
    if (seen.has(norm.code)) return;
    seen.add(norm.code);
    try {
      const rec = await fetchXposure(norm.url, norm.code);
      if (!rec) { results.push({ input, ok: false, error: "La propiedad ya no existe en el MLS" }); return; }
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
  await pool(rows, 3, async (r) => {
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

export async function removeMlsListing(id: string): Promise<void> {
  await ensureMlsTable();
  await getDb().execute({ sql: "DELETE FROM MlsListing WHERE id = ?", args: [id] });
}
