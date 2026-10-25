import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { getAvailableProperties } from "@/components/portal/data";
import { optimizePhoto } from "@/lib/publicProperty";
import { collectLandings, landingPath, pageAlternates } from "@/components/portal/seo";
import { GUIDES } from "@/components/portal/guides";

export const revalidate = 3600; // rebuilt at most once an hour

// Home, static pages, every search landing page and every available property (with its cover photo).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const props = await getAvailableProperties();
  const updated = new Map<string, string>();
  const rows = await query<{ id: string; updatedAt: string | null }>(
    `SELECT id, updatedAt FROM Property WHERE status = 'DISPONIBLE'
     UNION ALL SELECT id, COALESCE(fetchedAt, updatedAt) FROM MlsListing WHERE active = 1`
  ).catch(() => []);
  for (const r of rows) if (r.updatedAt) updated.set(String(r.id), String(r.updatedAt));
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: "/", lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: "/propiedades", lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: "/buscamos", lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: "/vender", changeFrequency: "monthly", priority: 0.7 },
    { url: "/guias", changeFrequency: "monthly", priority: 0.6 },
    ...GUIDES.map((g) => ({ url: `/guias/${g.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...["servicios", "nosotros", "contacto"].map((p) => ({ url: `/${p}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
  const landings: MetadataRoute.Sitemap = collectLandings(props).map((l) => ({
    url: landingPath(l),
    lastModified: now,
    changeFrequency: "daily",
    priority: l.zone ? (l.type ? 0.7 : 0.75) : 0.85,
  }));
  const listings: MetadataRoute.Sitemap = props.map((p) => ({
    url: `/p/${p.id}`,
    lastModified: updated.get(p.id) ? new Date(updated.get(p.id)!) : undefined,
    changeFrequency: "weekly",
    priority: p.source === "own" ? 0.8 : 0.6,
    images: p.photos[0] ? [optimizePhoto(p.photos[0], 1200)] : undefined,
  }));
  // Every page in Spanish and under /en, each listing both versions as hreflang alternates.
  return [...pages, ...landings, ...listings].flatMap((e) => {
    const { languages } = pageAlternates(e.url, "es");
    const alternates = { languages: { es: languages.es, en: languages.en } };
    return [
      { ...e, url: languages.es, alternates },
      { ...e, url: languages.en, alternates, priority: e.priority != null ? Math.round(e.priority * 0.8 * 100) / 100 : undefined },
    ];
  });
}
