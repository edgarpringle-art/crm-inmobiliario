import type { MetadataRoute } from "next";
import { isPortalRequest } from "@/components/portal/portalHost";
import { SITE_URL } from "@/components/portal/seo";

// panamainmo.com is indexable; the CRM domain is private and must not compete with it in Google.
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!(await isPortalRequest())) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
