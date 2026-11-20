// Models / typologies of a new-development project (stored as JSON in Property.unitModels).
// Project-wide ranges live in salePrice (desde) / salePriceMax (hasta) and area (desde) / areaMax (hasta).

export interface UnitModel {
  name: string;
  bedrooms: string;
  bathrooms: string;
  areaMin: string;
  areaMax: string;
  priceMin: string;
  priceMax: string;
}

export const emptyModel = (): UnitModel => ({ name: "", bedrooms: "", bathrooms: "", areaMin: "", areaMax: "", priceMin: "", priceMax: "" });

const s = (v: unknown) => (v == null ? "" : String(v));

export function parseUnitModels(raw: unknown): UnitModel[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr.map((m) => ({
      name: s(m?.name), bedrooms: s(m?.bedrooms), bathrooms: s(m?.bathrooms),
      areaMin: s(m?.areaMin), areaMax: s(m?.areaMax), priceMin: s(m?.priceMin), priceMax: s(m?.priceMax),
    }));
  } catch { return []; }
}

const isFilled = (m: UnitModel) => Object.values(m).some((v) => v.trim() !== "");

export function serializeUnitModels(models: UnitModel[]): string | null {
  const clean = models.filter(isFilled).map((m) => ({ ...m, name: m.name.trim() }));
  return clean.length ? JSON.stringify(clean) : null;
}

const num = (v: string) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : null; };

/** Min/max price and area across all models (null when no model has that value). */
export function rangeFromModels(models: UnitModel[]) {
  const prices = models.flatMap((m) => [num(m.priceMin), num(m.priceMax)]).filter((n): n is number => n != null);
  const areas = models.flatMap((m) => [num(m.areaMin), num(m.areaMax)]).filter((n): n is number => n != null);
  return {
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
    areaMin: areas.length ? Math.min(...areas) : null,
    areaMax: areas.length ? Math.max(...areas) : null,
  };
}

/** "80 – 128" or "80" (no unit). */
export function fmtRange(min: number | string | null | undefined, max: number | string | null | undefined, fmt: (n: number) => string = (n) => n.toLocaleString("en-US")): string {
  const a = min != null && min !== "" ? Number(min) : null;
  const b = max != null && max !== "" ? Number(max) : null;
  if (a != null && b != null && b > a) return `${fmt(a)} – ${fmt(b)}`;
  if (a != null) return fmt(a);
  if (b != null) return fmt(b);
  return "";
}
