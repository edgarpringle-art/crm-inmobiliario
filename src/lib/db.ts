import { createClient, type Client as LibSqlClient, type Row } from "@libsql/client";

let _db: LibSqlClient | null = null;

export function getDb(): LibSqlClient {
  if (!_db) {
    const config: Parameters<typeof createClient>[0] =
      process.env.DATABASE_URL
        ? {
            url: process.env.DATABASE_URL,
            authToken: process.env.DATABASE_AUTH_TOKEN,
          }
        : { url: "file:dev.db" };

    _db = createClient(config);
  }
  return _db;
}

// Helper to run a query and return rows
export async function query<T = Row>(sql: string, args: unknown[] = []): Promise<T[]> {
  const db = getDb();
  const result = await db.execute({ sql, args: args as (string | number | null)[] });
  return result.rows as unknown as T[];
}

// Helper to run a query and return the first row
export async function queryOne<T = Row>(sql: string, args: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] || null;
}

// Cache of real column names per table (populated via PRAGMA table_info).
const _columnsCache = new Map<string, Set<string>>();

/**
 * Returns the set of real column names for a table, cached after first read.
 * Used to defensively drop unknown keys from insert/update so a single
 * stray field never fails the whole statement ("no such column" class of bug).
 */
async function getTableColumns(table: string): Promise<Set<string>> {
  const cached = _columnsCache.get(table);
  if (cached) return cached;
  const rows = await query<{ name: string }>(`PRAGMA table_info(${table})`);
  const cols = new Set(rows.map((r) => r.name));
  if (cols.size) _columnsCache.set(table, cols);
  return cols;
}

/** Keeps only entries whose key is a real column in the table. */
async function filterToColumns(
  table: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const cols = await getTableColumns(table);
  // If we couldn't read the schema, don't filter (fail open).
  if (!cols.size) return data;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(data)) {
    if (cols.has(k)) out[k] = data[k];
  }
  return out;
}

// Helper to run an insert and return the id
export async function insert(table: string, data: Record<string, unknown>): Promise<string> {
  const id = data.id as string || generateCuid();
  const now = new Date().toISOString();
  const fullData: Record<string, unknown> = { ...data, id, createdAt: now, updatedAt: now };

  // Drop any keys that aren't real columns so one stray field can't break the insert.
  const safeData = await filterToColumns(table, fullData);

  const keys = Object.keys(safeData);
  const placeholders = keys.map(() => "?").join(", ");
  const values = keys.map((k) => safeData[k] === undefined ? null : safeData[k]);

  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
  await getDb().execute({ sql, args: values as (string | number | null)[] });
  return id;
}

// Helper to update a row
export async function update(table: string, id: string, data: Record<string, unknown>): Promise<void> {
  const now = new Date().toISOString();
  const fullData: Record<string, unknown> = { ...data, updatedAt: now };

  // Remove id and createdAt from update data
  delete fullData.id;
  delete fullData.createdAt;

  // Drop any keys that aren't real columns so one stray field can't break the update.
  const safeData = await filterToColumns(table, fullData);

  const keys = Object.keys(safeData);
  const setClause = keys.map((k) => `${k} = ?`).join(", ");
  const values = [...keys.map((k) => safeData[k] === undefined ? null : safeData[k]), id];

  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  await getDb().execute({ sql, args: values as (string | number | null)[] });
}

// Helper to delete a row
export async function remove(table: string, id: string): Promise<void> {
  await getDb().execute({ sql: `DELETE FROM ${table} WHERE id = ?`, args: [id] });
}

// Simple CUID-like ID generator
function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}
