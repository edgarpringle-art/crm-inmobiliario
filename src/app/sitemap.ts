import type { MetadataRoute } from "next";
import { query } from "@/lib/db";
import { getAvailableProperties } from "@/components/portal/data";
import { optimizePhoto } from "@/lib/publicProperty";
import { SITE_URL, collectLandings, landingPath } from "@/components/portal/seo";

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
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/propiedades`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/buscamos`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    ...["servicios", "nosotros", "contacto"].map((p) => ({ url: `${SITE_URL}/${p}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
  const landings: MetadataRoute.Sitemap = collectLandings(props).map((l) => ({
    url: SITE_URL + landingPath(l),
    lastModified: now,
    changeFrequency: "daily",
    priority: l.zone ? (l.type ? 0.7 : 0.75) : 0.85,
  }));
  const listings: MetadataRoute.Sitemap = props.map((p) => ({
    url: `${SITE_URL}/p/${p.id}`,
    lastModified: updated.get(p.id) ? new Date(updated.get(p.id)!) : undefined,
    changeFrequency: "weekly",
    priority: p.source === "own" ? 0.8 : 0.6,
    images: p.photos[0] ? [optimizePhoto(p.photos[0], 1200)] : undefined,
  }));
  return [...pages, ...landings, ...listings];
}
