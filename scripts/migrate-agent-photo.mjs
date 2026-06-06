// One-off migration: adds photoUrl column to Agent (local dev.db + Turso).
// Reads the Turso auth token from .env.local (DATABASE_AUTH_TOKEN). Safe to re-run.
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

async function migrate(db, label) {
  try {
    await db.execute("ALTER TABLE Agent ADD COLUMN photoUrl TEXT");
    console.log(`OK (${label}): columna photoUrl agregada`);
  } catch (e) {
    if (/duplicate column|already exists/i.test(e.message)) console.log(`YA EXISTE (${label}): photoUrl`);
    else { console.error(`ERROR (${label}):`, e.message); process.exitCode = 1; }
  }
}

// Local
await migrate(createClient({ url: "file:./dev.db" }), "local");

// Turso
const token = readEnvLocal();
if (!token) {
  console.error("\n⚠️  No encontré DATABASE_AUTH_TOKEN en .env.local — Turso NO migrado. Agrega el token y vuelve a correr.\n");
} else {
  await migrate(createClient({ url: TURSO_URL, authToken: token }), "turso");
}
console.log("\n✅ Migración photoUrl lista.\n");
