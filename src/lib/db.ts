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

// Helper to run an insert and return the id
export async function insert(table: string, data: Record<string, unknown>): Promise<string> {
  const id = data.id as string || generateCuid();
  const now = new Date().toISOString();
  const fullData = { ...data, id, createdAt: now, updatedAt: now };

  const keys = Object.keys(fullData);
  const placeholders = keys.map(() => "?").join(", ");
  const values = keys.map((k) => fullData[k] === undefined ? null : fullData[k]);

  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
  await getDb().execute({ sql, args: values as (string | number | null)[] });
  return id;
}

// Helper to update a row
export async function update(table: string, id: string, data: Record<string, unknown>): Promise<void> {
  const now = new Date().toISOString();
  const fullData = { ...data, updatedAt: now };

  // Remove id and createdAt from update data
  delete fullData.id;
  delete fullData.createdAt;

  const keys = Object.keys(fullData);
  const setClause = keys.map((k) => `${k} = ?`).join(", ");
  const values = [...keys.map((k) => fullData[k] === undefined ? null : fullData[k]), id];

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
