// Reader for MLS ACOBIR listing pages on Xposure (propiedades.mlsacobir.com/listing/...).
// These are the public links an agent shares with clients; we read only the ones the user pastes.

const UA = "Mozilla/5.0 (compatible; PanamaInmoSync/1.0; +https://panamainmo.com)";
export const AGENT_ID = "701390";

export interface MlsRecord {
  id: string; code: string; mlsId: string; url: string;
  title: string; buildingName: string | null;
  propertyType: string; operationType: string;
  salePrice: number | null; rentPrice: number | null; currency: string; maintenanceFee: number | null;
  area: number | null; landArea: number | null;
  bedrooms: number | null; bathrooms: number | null; parkingSpots: number | null; yearBuilt: number | null;
  sector: string | null; city: string | null; state: string | null; corregimiento: string | null;
  description: string | null; features: string[]; photos: string[];
  mlsStatus: string | null; active: number;
}

/** Validates a pasted link and returns its canonical form (with our agent id) and listing code. */
export function normalizeXposureUrl(raw: string): { url: string; code: string } | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.hostname !== "propiedades.mlsacobir.com" || !u.pathname.startsWith("/listing/")) return null;
  const code = u.pathname.split("/").filter(Boolean).pop() || "";
  if (!/^[a-z0-9]+$/i.test(code)) return null;
  return { url: `https://propiedades.mlsacobir.com${u.pathname}?locale=es_PA&u=${AGENT_ID}`, code: code.toLowerCase() };
}

const decode = (s: string) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&#8217;|&apos;/g, "'")
    .replace(/&reg;/g, "®").replace(/&sup2;/g, "²").replace(/&bull;/g, "•").replace(/&ndash;|&#8211;/g, "–").replace(/&mdash;|&#8212;/g, "—")
    .replace(/&([a-z])(acute|tilde|uml);/gi, (_, c: string, k: string) => {
      const map: Record<string, string> = { acute: "́", tilde: "̃", uml: "̈" };
      return (c + map[k.toLowerCase()]).normalize("NFC");
    })
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));

const stripTags = (s: string) =>
  decode(s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

const num = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

const titleCase = (s: string | null) =>
  s ? s.toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase()) : null;

// "COSTA SUR – EL DORAL" → "Costa Sur – El Doral" (only when the title is mostly uppercase)
const niceTitle = (s: string) => {
  const letters = s.replace(/[^\p{L}]/gu, "");
  const upper = letters.replace(/[^\p{Lu}]/gu, "");
  if (!(letters.length > 6 && upper.length / letters.length > 0.7)) return s;
  const small = new Set(["de", "del", "en", "con", "y", "la", "el", "las", "los", "a", "al", "por", "para", "o"]);
  return titleCase(s)!.split(" ").map((w, i) => (i > 0 && small.has(w.toLowerCase()) ? w.toLowerCase() : w)).join(" ");
};

function mapType(t: string): string {
  const s = t.toLowerCase();
  if (s.includes("penthouse")) return "PENTHOUSE";
  if (s.includes("apartamento") || s.includes("estudio") || s.includes("condo")) return "APARTAMENTO";
  if (s.includes("casa") || s.includes("townhouse") || s.includes("duplex") || s.includes("dúplex")) return "CASA";
  if (s.includes("local") || s.includes("negocio")) return "LOCAL";
  if (s.includes("oficina") || s.includes("consultorio")) return "OFICINA";
  if (s.includes("terreno") || s.includes("lote") || s.includes("finca")) return "TERRENO";
  if (s.includes("galera") || s.includes("bodega") || s.includes("industrial")) return "NAVE";
  return "OTRO";
}

/** Parses an Xposure listing page. Details come as <tr><td><strong>Label</strong></td><td>Value</td></tr>. */
export function parseXposure(html: string, url: string, code: string): MlsRecord | null {
  const rows = new Map<string, string>();
  for (const m of html.matchAll(/<tr>\s*<td>\s*<strong>([^<]+)<\/strong>\s*<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)) {
    const label = decode(m[1]).trim().toLowerCase();
    if (!rows.has(label)) rows.set(label, stripTags(m[2]));
  }
  const get = (...keys: (string | RegExp)[]) => {
    for (const k of keys) for (const [label, v] of rows) if ((typeof k === "string" ? label === k : k.test(label)) && v) return v;
    return null;
  };

  const mlsId = get(/^mls/) || html.match(/MLS#\s*(\d+)/)?.[1] || null;
  if (!mlsId) return null; // not a listing page (removed or invalid)

  const og = (p: string) => html.match(new RegExp(`<meta property="og:${p}"\\s+content="([^"]*)"`))?.[1];
  const title = niceTitle(stripTags(html.match(/<span class="project-name">([\s\S]*?)<\/span>/)?.[1] || og("title") || `Propiedad MLS ${mlsId}`));

  // Price: "$449,000", "$1,500/Month", or "$515,000 / $2,500"
  const priceText = get("precio", /precio de venta/) || stripTags(html.match(/<span class="header-price">([\s\S]*?)<\/span>/)?.[1] || "");
  const rentText = get(/alquiler/);
  const monthly = /\/\s*(mes|month)/i.test(priceText);
  let salePrice: number | null = monthly ? null : num(priceText);
  let rentPrice: number | null = rentText ? num(rentText) : monthly ? num(priceText) : null;
  const t = title.toLowerCase();
  if (!rentPrice && !monthly && /alquiler|renta\b/.test(t) && !/venta/.test(t) && salePrice != null && salePrice < 20000) {
    rentPrice = salePrice; salePrice = null; // rental listed without the "/month" suffix
  }
  const operationType = salePrice != null && rentPrice != null ? "VENTA_Y_ALQUILER" : rentPrice != null ? "ALQUILER" : "VENTA";

  const description = (() => {
    const i = html.indexOf('id="basicDiv"');
    if (i < 0) return null;
    const after = html.slice(html.indexOf("</table>", i) + 8);
    const p = after.match(/^\s*<p>([\s\S]*?)<\/p>/);
    return p ? stripTags(p[1]) || null : null;
  })();

  const photos = [...new Set(html.match(/https:\/\/van-media\.xposureapp\.com\/media\/[^"'\s)]+?\.(?:jpe?g|png|webp)/g) || [])];

  const parkingType = get("estacionamientos");
  const features = [parkingType && !/^\d+$/.test(parkingType) ? `Estacionamiento: ${parkingType}` : null].filter(Boolean) as string[];

  return {
    id: `mls${mlsId}`, code, mlsId, url,
    title, buildingName: get(/edificio|^ph/),
    propertyType: /penthouse/i.test(title) ? "PENTHOUSE" : mapType(get("tipo de propiedad") || title),
    operationType, salePrice, rentPrice, currency: "USD",
    maintenanceFee: num(get(/mantenimiento|cuota/)),
    area: num(get(/constru/)), landArea: num(get(/terreno|lote/)),
    bedrooms: num(get("dormitorios", "recámaras", "habitaciones")),
    bathrooms: num(get("baños")),
    parkingSpots: num(get("número de estacionamientos")),
    yearBuilt: num(get(/año de constru/)),
    sector: titleCase(get("barrio")) || titleCase(get("área")),
    city: get("barrio") && get("área") && titleCase(get("barrio")) !== titleCase(get("área")) ? titleCase(get("área")) : null,
    state: get("departamento", "provincia"),
    corregimiento: null,
    description, features, photos,
    mlsStatus: "Activo", active: 1,
  };
}

/** Downloads and parses one listing. Returns null when the listing no longer exists. */
export async function fetchXposure(url: string, code: string): Promise<MlsRecord | null> {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "es" }, signal: AbortSignal.timeout(25_000), cache: "no-store" });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseXposure(await res.text(), url, code);
}
