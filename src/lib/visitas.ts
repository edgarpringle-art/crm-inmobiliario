import { getDb } from "@/lib/db";

// Property showings (visitas) scheduled with clients. Table created on first use.
let ensured = false;
export async function ensureVisitaTable() {
  if (ensured) return;
  await getDb().execute(`CREATE TABLE IF NOT EXISTS Visita (
    id TEXT PRIMARY KEY, clientId TEXT, propertyId TEXT, propertyLabel TEXT, address TEXT,
    date TEXT NOT NULL, time TEXT, agent TEXT, status TEXT DEFAULT 'PROGRAMADA',
    notes TEXT, feedback TEXT, reminderSentAt TEXT, createdAt TEXT, updatedAt TEXT
  )`);
  ensured = true;
}

export const VISIT_STATUSES = [
  { value: "PROGRAMADA", label: "Programada", color: "bg-blue-100 text-blue-800" },
  { value: "CONFIRMADA", label: "Confirmada", color: "bg-emerald-100 text-emerald-800" },
  { value: "REALIZADA", label: "Realizada", color: "bg-purple-100 text-purple-800" },
  { value: "CANCELADA", label: "Cancelada", color: "bg-gray-100 text-gray-600" },
];

export function todayPanama(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Panama" });
}
