import { getDb } from "@/lib/db";

// Own lightweight analytics for the public site: property views, WhatsApp clicks, form leads,
// searches and page views. Table created on demand.
export type WebEventType = "view" | "page" | "wa" | "lead" | "search";

let ensured = false;
export async function ensureWebEventTable(): Promise<void> {
  if (ensured) return;
  await getDb().execute(`CREATE TABLE IF NOT EXISTS WebEvent (
    id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, propertyId TEXT, path TEXT,
    meta TEXT, ref TEXT, lang TEXT, createdAt TEXT NOT NULL
  )`);
  await getDb().execute("CREATE INDEX IF NOT EXISTS WebEvent_created ON WebEvent(createdAt)");
  await getDb().execute("CREATE INDEX IF NOT EXISTS WebEvent_type_prop ON WebEvent(type, propertyId)");
  ensured = true;
}

export async function recordWebEvent(e: {
  type: WebEventType; propertyId?: string | null; path?: string | null; meta?: Record<string, string> | null;
  ref?: string | null; lang?: string | null;
}): Promise<void> {
  await ensureWebEventTable();
  await getDb().execute({
    sql: "INSERT INTO WebEvent (type, propertyId, path, meta, ref, lang, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [e.type, e.propertyId || null, e.path || null, e.meta ? JSON.stringify(e.meta) : null, e.ref || null, e.lang || null, new Date().toISOString()],
  });
}
