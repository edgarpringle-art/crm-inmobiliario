// One-off migration: adds "who created / who followed up" tracking columns to Turso.
// Reads the Turso auth token from .env.local (DATABASE_AUTH_TOKEN) so it never
// has to be pasted into a chat. Safe to re-run — existing columns are skipped.
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const TURSO_URL = "libsql://crm-inmobiliario-crmbr.aws-ap-northeast-1.turso.io";

function readEnvLocal() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*DATABASE_AUTH_TOKEN\s*=\s*(.*)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  } catch {}
  return process.env.DATABASE_AUTH_TOKEN || "";
}

const token = readEnvLocal();
if (!token) {
  console.error("\n❌ No encontré DATABASE_AUTH_TOKEN en .env.local. Agrega esa línea con el token nuevo de Turso y vuelve a correr.\n");
  process.exit(1);
}

const db = createClient({ url: TURSO_URL, authToken: token });

const stmts = [
  "ALTER TABLE Client ADD COLUMN createdBy TEXT",
  "ALTER TABLE Client ADD COLUMN lastActivityBy TEXT",
  "ALTER TABLE Client ADD COLUMN lastActivityAt TEXT",
  "ALTER TABLE Property ADD COLUMN createdBy TEXT",
  "ALTER TABLE Activity ADD COLUMN agent TEXT",
];

let ok = 0, skipped = 0;
for (const s of stmts) {
  try { await db.execute(s); console.log("OK:  ", s); ok++; }
  catch (e) {
    if (/duplicate column|already exists/i.test(e.message)) { console.log("YA EXISTE:", s); skipped++; }
    else { console.error("ERROR:", s, "->", e.message); process.exit(1); }
  }
}
console.log(`\n✅ Migración Turso lista — ${ok} columnas nuevas, ${skipped} ya existían.\n`);
