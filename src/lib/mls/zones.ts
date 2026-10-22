import { query } from "@/lib/db";
import { ensureMlsTable } from "./sync";

export interface MlsZoneGroup { area: string; district: string | null; province: string | null; count: number; barrios: string[] }

const key = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const PROVINCE_ORDER = ["panama", "panama oeste", "cocle", "chiriqui", "colon", "los santos", "herrera", "veraguas", "bocas del toro", "darien"];

/** Áreas (corregimientos) and their barrios as the MLS names them, from the published MLS inventory. */
export async function getMlsZoneGroups(): Promise<MlsZoneGroup[]> {
  await ensureMlsTable();
  const rows = await query<{ state: string | null; city: string | null; corregimiento: string | null; sector: string | null; n: number }>(
    `SELECT state, city, corregimiento, sector, COUNT(*) AS n FROM MlsListing
     WHERE active = 1 GROUP BY state, city, corregimiento, sector`
  );
  const groups = new Map<string, MlsZoneGroup & { seen: Set<string> }>();
  for (const r of rows) {
    const area = (r.corregimiento || r.sector || r.city || "").trim();
    if (!area) continue;
    const g = groups.get(key(area)) || { area, district: r.city, province: r.state, count: 0, barrios: [], seen: new Set<string>() };
    g.count += Number(r.n);
    const b = (r.sector || "").trim();
    if (b && key(b) !== key(area) && !g.seen.has(key(b))) { g.seen.add(key(b)); g.barrios.push(b); }
    groups.set(key(area), g);
  }
  const rank = (p: string | null) => { const i = PROVINCE_ORDER.indexOf(key(p || "")); return i < 0 ? 99 : i; };
  return [...groups.values()]
    .map(({ seen: _seen, ...g }) => ({ ...g, barrios: g.barrios.sort((a, b) => a.localeCompare(b, "es")) }))
    .sort((a, b) => rank(a.province) - rank(b.province) || a.area.localeCompare(b.area, "es"));
}
