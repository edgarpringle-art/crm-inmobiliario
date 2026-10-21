// Shared brand data for the public portal (panamainmo.com).

export const BROKER = {
  phone: "50763183113",
  phoneDisplay: "+507 6318-3113",
  email: "edgar@panamainmo.com",
  instagram: "epringle.realestate",
  instagramUrl: "https://www.instagram.com/epringle.realestate",
  license: "PN5016",
};

// Official MLS ACOBIR (Xposure) search portal branded with our agent id.
export const MLS_PORTAL_URL = "https://propiedades.mlsacobir.com/panama-provincia/userId_701390";

export const waLink = (text?: string) =>
  `https://wa.me/${BROKER.phone}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

// Warm palette taken from the logo (gold) + cream/sand neutrals.
// ink #1E1A15 · cream #F7F2EA · sand #EDE3D2 · line #E4D9C6 · gold #B8945F · goldDark #8A6A3A · muted #6B6155
export const SERIF = { fontFamily: "'Cinzel', serif" } as const;
export const SANS = { fontFamily: "'Josefin Sans', sans-serif" } as const;

export const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/buscar", label: "Buscador MLS" },
  { href: "/servicios", label: "Servicios" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

/** Clean path ("/servicios") → real href. On panamainmo.com it stays clean; on the CRM domain it lives under /catalogo. */
export function portalHref(path: string, portal: boolean): string {
  if (portal) return path;
  const [p, qs] = path.split("?");
  return `${p === "/" ? "/catalogo" : `/catalogo${p}`}${qs ? `?${qs}` : ""}`;
}

export const typeLabel: Record<string, string> = {
  APARTAMENTO: "Apartamento", PENTHOUSE: "Penthouse", CASA: "Casa", VILLA: "Villa",
  PROYECTO: "Proyecto", LOCAL: "Local Comercial", OFICINA: "Oficina", TERRENO: "Terreno", NAVE: "Nave Industrial", OTRO: "Propiedad",
};

export const PROPERTY_TYPE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "CASA", label: "Casa" },
  { value: "PROYECTO", label: "Proyecto" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "VILLA", label: "Villa" },
  { value: "LOCAL", label: "Local Comercial" },
  { value: "OFICINA", label: "Oficina" },
  { value: "TERRENO", label: "Terreno" },
  { value: "NAVE", label: "Nave Industrial" },
];

// Home category cards. Photo comes from a real listing of that type; these are fallbacks.
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=75`;
export const CATEGORIES = [
  { type: "APARTAMENTO", label: "Apartamentos", fallback: u("1545324418-cc1a3fa10c00") },
  { type: "CASA", label: "Casas", fallback: u("1600596542815-ffad4c1539a9") },
  { type: "PENTHOUSE", label: "Penthouses", fallback: u("1600607687939-ce8a6c25118c") },
  { type: "PROYECTO", label: "Proyectos", fallback: u("1460317442991-0ec209397118") },
  { type: "LOCAL", label: "Locales", fallback: u("1441986300917-64674bd600d8") },
  { type: "OFICINA", label: "Oficinas", fallback: u("1497366216548-37526070297c") },
  { type: "TERRENO", label: "Terrenos", fallback: u("1500382017468-9049fed747ef") },
];

export interface PortalProperty {
  id: string; title: string; propertyType: string; operationType: string;
  sector: string | null; city: string | null; state: string | null;
  salePrice: number | null; rentPrice: number | null; currency: string;
  area: number | null; bedrooms: number | null; bathrooms: number | null; parkingSpots: number | null;
  photos: string[];
}

export function parsePhotos(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw !== "string" || !raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
