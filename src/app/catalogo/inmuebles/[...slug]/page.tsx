import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import PropertyCard from "@/components/portal/PropertyCard";
import AlertForm from "@/components/portal/AlertForm";
import { getAvailableProperties } from "@/components/portal/data";
import { getLang, isPortalRequest } from "@/components/portal/portalHost";
import { tr, type Lang } from "@/components/portal/i18n";
import { SANS, SERIF, portalHref, type PortalProperty } from "@/components/portal/brand";
import { IconArrow } from "@/components/portal/icons";
import {
  MIN_ZONE_LISTINGS, SITE_URL, TYPES, collectLandings, landingPath, matchesLanding, parseLanding, zoneName,
  type Landing, pageAlternates,
} from "@/components/portal/seo";
import { formatCurrency } from "@/lib/constants";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 36;
type Params = Promise<{ slug: string[] }>;
type SP = Promise<Record<string, string | string[] | undefined>>;

const titleCase = (slug: string) => slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

interface Resolved {
  landing: Landing; list: PortalProperty[]; all: PortalProperty[];
  zone: string | null; typeLabel: string | null; title: string; from: string | null; to: string | null;
}

// Stable order for search pages: own listings first, then those with more photos.
function stableSort(list: PortalProperty[]) {
  return [...list].sort((a, b) =>
    Number(b.source === "own") - Number(a.source === "own") ||
    (b.photoCount ?? 0) - (a.photoCount ?? 0) || a.id.localeCompare(b.id));
}

async function resolve(slug: string[], lang: Lang): Promise<Resolved | null> {
  const landing = parseLanding(slug.map((s) => decodeURIComponent(s).toLowerCase()));
  if (!landing) return null;
  const all = await getAvailableProperties();
  const list = stableSort(all.filter((p) => matchesLanding(p, landing)));
  if (!list.length) return null;
  const t = tr(lang).landing;
  const zone = landing.zone ? zoneName(all, landing.zone) || titleCase(landing.zone) : null;
  const typeLabel = landing.type ? TYPES[landing.type][lang] : null;
  const prices = list
    .map((p) => (landing.op === "alquiler" ? p.rentPrice : p.salePrice))
    .filter((x): x is number => x != null && x > 0)
    .sort((a, b) => a - b);
  const fmt = (n: number) => formatCurrency(n, "USD").replace(/\.00$/, "") + (landing.op === "alquiler" ? tr(lang).common.perMonth : "");
  return {
    landing, list, all, zone, typeLabel,
    title: t.title(typeLabel, landing.op, zone),
    from: prices.length ? fmt(prices[0]) : null,
    to: prices.length ? fmt(prices[prices.length - 1]) : null,
  };
}

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SP }): Promise<Metadata> {
  const lang = await getLang();
  const r = await resolve((await params).slug, lang);
  if (!r) return { title: tr(lang).detail.notFound };
  const page = Number((await searchParams).page) || 1;
  const path = landingPath(r.landing);
  return {
    title: `${r.title}${page > 1 ? ` · ${tr(lang).landing.page(page)}` : ""} | PanamaInmo`,
    description: tr(lang).landing.metaDesc(r.list.length, r.title, r.from),
    alternates: pageAlternates(path, lang, page > 1 ? `?page=${page}` : ""),
    robots: r.landing.zone && r.list.length < MIN_ZONE_LISTINGS ? { index: false, follow: true } : undefined,
    openGraph: { title: r.title, url: `${SITE_URL}${path}`, siteName: "PanamaInmo", type: "website" },
  };
}

export default async function LandingPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const portal = await isPortalRequest();
  const lang = await getLang();
  const t = tr(lang);
  const r = await resolve((await params).slug, lang);
  if (!r) notFound();
  const { landing, list, all, zone, typeLabel, title } = r;
  const h = (path: string) => portalHref(path, portal, lang);

  const pages = Math.ceil(list.length / PAGE_SIZE);
  const page = Math.min(Math.max(1, Number((await searchParams).page) || 1), pages);
  const visible = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Internal links: other types in this zone, and top zones for this operation/type.
  const landings = collectLandings(all);
  const otherTypes = zone ? landings.filter((l) => l.op === landing.op && l.zone === landing.zone && l.type && l.type !== landing.type) : [];
  const zones = landings
    .filter((l) => l.op === landing.op && l.type === landing.type && l.zone && l.zone !== landing.zone)
    .slice(0, 24);

  const opLabel = landing.op === "venta" ? t.landing.sale : t.landing.rent;
  const crumbs = [
    { name: t.landing.home, path: "/" },
    { name: opLabel, path: `/${landing.op}` },
    ...(landing.type ? [{ name: typeLabel!, path: landingPath({ op: landing.op, type: landing.type, zone: null }) }] : []),
    ...(zone ? [{ name: zone, path: landingPath(landing) }] : []),
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE_URL}${c.path}` })),
    },
    {
      "@context": "https://schema.org", "@type": "ItemList", name: title, numberOfItems: list.length,
      itemListElement: visible.map((p, i) => ({ "@type": "ListItem", position: (page - 1) * PAGE_SIZE + i + 1, url: `${SITE_URL}/p/${p.id}`, name: p.title })),
    },
  ];

  const filtersHref = h(`/propiedades?op=${landing.op === "venta" ? "VENTA" : "ALQUILER"}${zone ? `&zone=${encodeURIComponent(zone)}` : ""}`);
  const pageHref = (n: number) => h(`${landingPath(landing)}${n > 1 ? `?page=${n}` : ""}`);

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PortalHeader portal={portal} lang={lang} />

      <section className="relative bg-[#1E1A15] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,148,95,0.35),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.2em] text-[#CFC4B2] mb-4 flex flex-wrap gap-x-2 gap-y-1">
            {crumbs.map((c, i) => (
              <span key={c.path} className="flex items-center gap-2">
                {i > 0 && <span className="text-[#8A6A3A]">›</span>}
                {i < crumbs.length - 1 ? <Link href={h(c.path)} className="hover:text-white">{c.name}</Link> : <span className="text-[#D9BE8F]">{c.name}</span>}
              </span>
            ))}
          </nav>
          <h1 className="text-3xl sm:text-5xl text-white font-medium leading-tight" style={SERIF}>{title}</h1>
          <p className="text-[#CFC4B2] mt-4 max-w-3xl leading-relaxed">{t.landing.intro(list.length, title, r.from, r.to)}</p>
          <Link href={filtersHref} className="inline-flex items-center gap-2 mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#D9BE8F] border-b border-[#B8945F] pb-1 hover:text-white">
            {t.landing.seeAllFilters} <IconArrow />
          </Link>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((p) => <PropertyCard key={p.id} p={p} lang={lang} />)}
          </div>

          {pages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-10 flex-wrap" aria-label="Pagination">
              {page > 1 && <Link rel="prev" href={pageHref(page - 1)} className="px-4 py-2 rounded-full border border-[#E4D9C6] text-sm hover:border-[#B8945F]">{t.landing.prev}</Link>}
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={pageHref(n)} aria-current={n === page ? "page" : undefined}
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-sm ${n === page ? "bg-[#1E1A15] text-white" : "border border-[#E4D9C6] hover:border-[#B8945F]"}`}>
                  {n}
                </Link>
              ))}
              {page < pages && <Link rel="next" href={pageHref(page + 1)} className="px-4 py-2 rounded-full border border-[#E4D9C6] text-sm hover:border-[#B8945F]">{t.landing.next}</Link>}
            </nav>
          )}

          <div className="mt-12">
            <AlertForm lang={lang} prefill={{
              op: landing.op === "alquiler" ? "ALQUILER" : "COMPRA",
              type: landing.type ? TYPES[landing.type].types[0] : "", zone: zone || "",
            }} />
          </div>

          {otherTypes.length > 0 && (
            <div className="mt-14">
              <h2 className="text-xl mb-4" style={SERIF}>{t.landing.otherTypes(zone!)}</h2>
              <div className="flex flex-wrap gap-2">
                {otherTypes.map((l) => (
                  <Link key={landingPath(l)} href={h(landingPath(l))} className="px-4 py-2 rounded-full bg-white border border-[#E9E0D0] text-sm hover:border-[#B8945F]">
                    {t.landing.title(TYPES[l.type!][lang], l.op, zone)} ({l.count})
                  </Link>
                ))}
              </div>
            </div>
          )}

          {zones.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl mb-4" style={SERIF}>{t.landing.popularZones(t.landing.title(typeLabel, landing.op, null))}</h2>
              <div className="flex flex-wrap gap-2">
                {zones.map((l) => (
                  <Link key={landingPath(l)} href={h(landingPath(l))} className="px-4 py-2 rounded-full bg-white border border-[#E9E0D0] text-sm hover:border-[#B8945F]">
                    {zoneName(all, l.zone!) || titleCase(l.zone!)} ({l.count})
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <PortalFooter portal={portal} lang={lang} />
    </div>
  );
}
