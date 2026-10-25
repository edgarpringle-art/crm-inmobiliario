// SEO helpers: canonical site URL and the search landing pages
// (/venta, /venta/apartamentos, /venta/costa-del-este, /venta/apartamentos/costa-del-este).

import type { PortalProperty } from "./brand";

export const SITE_URL = "https://panamainmo.com";

/** Canonical + hreflang for a public page ("/servicios", "/p/abc"); English lives under /en. */
export function pageAlternates(path: string, lang: "es" | "en", qs = "") {
  const es = `${SITE_URL}${path === "/" ? "" : path}`;
  const en = `${SITE_URL}/en${path === "/" ? "" : path}`;
  return {
    canonical: (lang === "en" ? en : es) + qs,
    languages: { es: es + qs, en: en + qs, "x-default": es + qs },
  };
}
export const MIN_ZONE_LISTINGS = 3; // fewer listings → no zone page (thin content hurts rankings)

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const OPS = { venta: "VENTA", alquiler: "ALQUILER" } as const;
export type OpSlug = keyof typeof OPS;

// Type slugs → property types. Apartments include penthouses (that's how people search).
export const TYPES: Record<string, { types: string[]; es: string; en: string }> = {
  apartamentos: { types: ["APARTAMENTO", "PENTHOUSE"], es: "Apartamentos", en: "Apartments" },
  casas: { types: ["CASA", "VILLA"], es: "Casas", en: "Houses" },
  penthouses: { types: ["PENTHOUSE"], es: "Penthouses", en: "Penthouses" },
  terrenos: { types: ["TERRENO"], es: "Terrenos", en: "Land" },
  locales: { types: ["LOCAL"], es: "Locales comerciales", en: "Retail spaces" },
  oficinas: { types: ["OFICINA"], es: "Oficinas", en: "Offices" },
  proyectos: { types: ["PROYECTO"], es: "Proyectos", en: "New developments" },
  bodegas: { types: ["NAVE"], es: "Bodegas y galeras", en: "Warehouses" },
};

export interface Landing { op: OpSlug; type: string | null; zone: string | null }

const isOp = (p: PortalProperty, op: OpSlug) =>
  p.operationType === OPS[op] || p.operationType === "VENTA_Y_ALQUILER";

/** Zones a listing belongs to: barrio, corregimiento and district (slug → display name). */
export function zonesOf(p: PortalProperty): { slug: string; name: string }[] {
  const out: { slug: string; name: string }[] = [];
  for (const raw of [p.sector, p.corregimiento, p.city]) {
    if (!raw) continue;
    // The district "Panamá" is Panama City — name it that way (clearer, and it's how people search).
    const n = slugify(raw) === "panama" ? "Ciudad de Panamá" : raw;
    const slug = slugify(n);
    if (slug && !out.some((z) => z.slug === slug)) out.push({ slug, name: n });
  }
  return out;
}

export function matchesLanding(p: PortalProperty, l: Landing): boolean {
  if (!isOp(p, l.op)) return false;
  if (l.type && !TYPES[l.type]?.types.includes(p.propertyType)) return false;
  if (l.zone && !zonesOf(p).some((z) => z.slug === l.zone)) return false;
  return true;
}

/** "/venta/apartamentos/costa-del-este" */
export function landingPath(l: Landing): string {
  return "/" + [l.op, l.type, l.zone].filter(Boolean).join("/");
}

/** Parses ["venta", "apartamentos", "costa-del-este"]; the 2nd segment is a type if known, else a zone. */
export function parseLanding(slug: string[]): Landing | null {
  const [op, a, b, ...rest] = slug;
  if (!(op in OPS) || rest.length) return null;
  if (!a) return { op: op as OpSlug, type: null, zone: null };
  if (TYPES[a]) return { op: op as OpSlug, type: a, zone: b || null };
  if (b) return null;
  return { op: op as OpSlug, type: null, zone: a };
}

/** Most common spelling of a zone slug among the listings (for titles). */
export function zoneName(props: PortalProperty[], slug: string): string | null {
  const counts = new Map<string, number>();
  for (const p of props) for (const z of zonesOf(p)) if (z.slug === slug) counts.set(z.name, (counts.get(z.name) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

/** Every landing page worth publishing, with its listing count (used by the sitemap and internal links). */
export function collectLandings(props: PortalProperty[]): (Landing & { count: number })[] {
  const counts = new Map<string, number>();
  const bump = (l: Landing) => { const k = landingPath(l); counts.set(k, (counts.get(k) || 0) + 1); };
  for (const p of props) {
    const types = Object.entries(TYPES).filter(([, t]) => t.types.includes(p.propertyType)).map(([k]) => k);
    for (const op of Object.keys(OPS) as OpSlug[]) {
      if (!isOp(p, op)) continue;
      bump({ op, type: null, zone: null });
      for (const type of types) bump({ op, type, zone: null });
      for (const z of zonesOf(p)) {
        bump({ op, type: null, zone: z.slug });
        for (const type of types) bump({ op, type, zone: z.slug });
      }
    }
  }
  return [...counts.entries()]
    .map(([path, count]) => ({ ...parseLanding(path.slice(1).split("/"))!, count }))
    .filter((l) => (l.zone ? l.count >= MIN_ZONE_LISTINGS : l.count > 0))
    .sort((a, b) => b.count - a.count);
}
