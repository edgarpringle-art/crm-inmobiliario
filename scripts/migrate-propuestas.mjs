// One-off migration: creates the Propuesta table (local dev.db + Turso).
// A Propuesta is an option (property) the agent sends to a client so the
// client can approve (INTERESADO) or discard (DESCARTADO) it from a public link.
// Reads the Turso auth token from .env.local. Safe to re-run.
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const TURSO_URL = "libsql://crm-inmobiliario-crmbr.aws-ap-northeast-1.turso.io";

const CREATE = `
CREATE TABLE IF NOT EXISTS Propuesta (
  id TEXT PRIMARY KEY,
  clientId TEXT,
  title TEXT,
  description TEXT,
  zona TEXT,
  price REAL,
  currency TEXT,
  link TEXT,
  photos TEXT,
  status TEXT DEFAULT 'PENDIENTE',
  respondedAt TEXT,
  clientNote TEXT,
  createdBy TEXT,
  createdAt TEXT,
  updatedAt TEXT
)`;

const INDEX = "CREATE INDEX IF NOT EXISTS idx_propuesta_client ON Propuesta(clientId)";

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

async function migrate(db, label) {
  await db.execute(CREATE);
  await db.execute(INDEX);
  console.log(`OK (${label}): tabla Propuesta lista`);
}

// Local
await migrate(createClient({ url: "file:./dev.db" }), "local");

// Turso
const token = readEnvLocal();
if (!token) {
  console.error("\n⚠️  Sin DATABASE_AUTH_TOKEN en .env.local — Turso NO migrado.\n");
} else {
  await migrate(createClient({ url: TURSO_URL, authToken: token }), "turso");
}
console.log("\n✅ Migración Propuesta lista.\n");
