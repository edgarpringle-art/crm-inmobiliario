import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { formatCurrency } from "@/lib/constants";
import type { Metadata } from "next";
import Link from "next/link";
import PhotoGallery from "./PhotoGallery";
import LeadForm from "@/components/portal/LeadForm";
import MortgageCalc from "@/components/portal/MortgageCalc";
import { isPortalRequest } from "@/components/portal/portalHost";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import { optimizePhoto, youtubeEmbedUrl } from "@/lib/publicProperty";
import { BROKER, portalHref } from "@/components/portal/brand";
import { getLang } from "@/components/portal/portalHost";
import { tr } from "@/components/portal/i18n";
import { getAvailableProperties, getPublicProperty } from "@/components/portal/data";
import { SITE_URL, TYPES, collectLandings, landingPath, pageAlternates, slugify, type OpSlug } from "@/components/portal/seo";

// Type slug used by the search pages for this property type (apartamentos, casas…).
const typeSlugOf = (propertyType: string) => Object.entries(TYPES).find(([, v]) => v.types.includes(propertyType))?.[0] || null;
const opSlugOf = (operationType: string): OpSlug => (operationType === "ALQUILER" ? "alquiler" : "venta");

// Strip line breaks / extra spaces and cut at a word boundary for meta descriptions.
const snippet = (text: string | null, max = 150) => {
  const s = (text || "").replace(/\s+/g, " ").trim();
  return s.length <= max ? s : s.slice(0, s.lastIndexOf(" ", max)) + "…";
};

interface Property {
  id: string; title: string; propertyType: string; operationType: string; status: string;
  address: string | null; sector: string | null; city: string | null; state: string | null;
  country: string; referencePoint: string | null;
  salePrice: number | null; rentPrice: number | null; currency: string; maintenanceFee: number | null;
  area: number | null; landArea: number | null; bedrooms: number | null; bathrooms: number | null;
  parkingSpots: number | null; floors: number | null; yearBuilt: number | null;
  hasPool: number; hasGym: number; hasElevator: number; hasSecurity: number;
  hasGenerator: number; hasFurniture: number; hasAppliances: number;
  hasAC: number; hasBalcony: number; hasGarden: number;
  description: string | null; notes: string | null;
  ownerName: string | null;
  createdBy: string | null;
  photos: string | null;
  features: string | null;
  videoUrl: string | null;
  brochureUrl?: string | null;
  noMortgage?: number | null;
  mlsId?: string | null;
  corregimiento?: string | null;
}

interface PublisherAgent {
  fullName: string;
  photoUrl: string | null;
  initials: string | null;
  color: string | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lang = await getLang();
  const t = tr(lang);
  const p = (await getPublicProperty(id)) as unknown as Property | null;
  if (!p) return { title: t.detail.notFound };
  const loc = [p.sector, p.city].filter((x, i, a): x is string => !!x && a.indexOf(x) === i).join(", ");
  const price = p.salePrice ? formatCurrency(p.salePrice, p.currency) : p.rentPrice ? `${formatCurrency(p.rentPrice, p.currency)}${t.common.perMonth}` : "";
  const op = p.operationType === "ALQUILER" ? t.detail.forRent : p.operationType === "VENTA" ? t.detail.forSale : `${t.detail.forSale} / ${t.detail.forRent}`;
  const specs = [p.bedrooms != null && `${p.bedrooms} ${t.detail.beds}`, p.area != null && `${p.area} m²`].filter(Boolean).join(", ");
  let firstPhoto: string | undefined;
  if (p.photos) { try { const arr = JSON.parse(p.photos); firstPhoto = arr[0]; } catch { /* ignore */ } }
  const description = [`${t.types[p.propertyType] || t.common.property} ${op.toLowerCase()}${loc ? ` · ${loc}` : ""}`, price, specs, snippet(p.description, 110)]
    .filter(Boolean).join(" · ");
  return {
    title: `${p.title}${loc ? ` · ${loc}` : ""} | PanamaInmo`,
    description,
    alternates: pageAlternates(`/p/${p.id}`, lang),
    openGraph: {
      title: p.title,
      description,
      url: `${SITE_URL}/p/${p.id}`,
      siteName: "PanamaInmo",
      type: "website",
      images: firstPhoto ? [{ url: optimizePhoto(firstPhoto, 1200) }] : undefined,
    },
  };
}

// ── SVG Icons ────────────────────────────────────────────────────────
const IconWA = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);
const IconPhone = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMail = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>;
const IconInstagram = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
const IconBadge = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IconPin = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-7-7.8-7-11a7 7 0 1114 0c0 3.2-3 7-7 11z"/><circle cx="12" cy="10" r="2"/></svg>;
const IconArrow = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IconCheck = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;

export default async function PublicPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const portal = await isPortalRequest();
  const lang = await getLang();
  const t = tr(lang);
  const p = (await getPublicProperty(id)) as unknown as Property | null;
  if (!p) notFound();

  // Agente que publicó la propiedad (createdBy = nombre completo del agente)
  let publisher: PublisherAgent | null = null;
  if (p.createdBy) {
    const ag = await query<PublisherAgent>(
      "SELECT fullName, photoUrl, initials, color FROM Agent WHERE fullName = ? LIMIT 1",
      [p.createdBy]
    ).catch(() => []);
    if (ag.length) publisher = ag[0];
  }

  const activeAmenities = Object.entries(t.amenities).filter(([k]) => (p as unknown as Record<string, unknown>)[k]);
  // Barrio, corregimiento, distrito, provincia — without repeating a name (e.g. "Chame, Chame")
  const loc = [p.sector, p.mlsId ? null : p.corregimiento, p.city, p.state]
    .filter((x, i, a): x is string => !!x && a.findIndex((y) => y?.toLowerCase() === x.toLowerCase()) === i).join(", ");
  let photos: string[] = [];
  if (p.photos) { try { photos = (JSON.parse(p.photos) as string[]).map((u) => optimizePhoto(u)); } catch { /* ignore */ } }
  let features: string[] = [];
  if (p.features) { try { features = JSON.parse(p.features); } catch { /* ignore */ } }
  const videoEmbed = youtubeEmbedUrl(p.videoUrl);
  const mapQuery = [p.address, p.sector, p.city, p.state, "Panamá"].filter(Boolean).join(", ");
  const refCode = p.mlsId ? `MLS #${p.mlsId}` : `Ref. ${p.id.slice(-6).toUpperCase()}`;
  const fullAddress = [p.address, loc].filter(Boolean).join(" · ");
  const isVenta = p.operationType === "VENTA" || p.operationType === "VENTA_Y_ALQUILER";
  const isAlquiler = p.operationType === "ALQUILER" || p.operationType === "VENTA_Y_ALQUILER";

  const waText = encodeURIComponent(t.common.waProperty(p.title, loc, `https://panamainmo.com/p/${p.id}`));

  // SEO: breadcrumb + links to the search pages this listing belongs to (only pages that exist).
  const opSlug = opSlugOf(p.operationType);
  const typeSlug = typeSlugOf(p.propertyType);
  const landingSet = new Set(collectLandings(await getAvailableProperties()).map(landingPath));
  const zoneCandidates = [p.sector, p.corregimiento, p.city].filter((x): x is string => !!x)
    .map((z) => (slugify(z) === "panama" ? "Ciudad de Panamá" : z));
  const related = [
    ...zoneCandidates.flatMap((z) => [
      typeSlug ? { path: landingPath({ op: opSlug, type: typeSlug, zone: slugify(z) }), label: t.landing.title(TYPES[typeSlug][lang], opSlug, z) } : null,
      { path: landingPath({ op: opSlug, type: null, zone: slugify(z) }), label: t.landing.title(null, opSlug, z) },
    ]),
    typeSlug ? { path: landingPath({ op: opSlug, type: typeSlug, zone: null }), label: t.landing.title(TYPES[typeSlug][lang], opSlug, null) } : null,
  ].filter((x): x is { path: string; label: string } => !!x && landingSet.has(x.path))
    .filter((x, i, a) => a.findIndex((y) => y.path === x.path) === i);
  const crumbs = [
    { name: t.landing.home, path: "/" },
    { name: opSlug === "venta" ? t.landing.sale : t.landing.rent, path: `/${opSlug}` },
    ...(typeSlug && landingSet.has(`/${opSlug}/${typeSlug}`) ? [{ name: TYPES[typeSlug][lang], path: `/${opSlug}/${typeSlug}` }] : []),
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [...crumbs.map((c) => ({ name: c.name, item: `${SITE_URL}${c.path}` })), { name: p.title, item: `${SITE_URL}/p/${p.id}` }]
        .map((c, i) => ({ "@type": "ListItem", position: i + 1, ...c })),
    },
    {
      "@context": "https://schema.org", "@type": "RealEstateListing",
      name: p.title, url: `${SITE_URL}/p/${p.id}`,
      description: (p.description || "").slice(0, 500) || undefined,
      image: photos.slice(0, 6),
      offers: {
        "@type": "Offer",
        price: p.salePrice ?? p.rentPrice ?? undefined,
        priceCurrency: p.currency || "USD",
        availability: "https://schema.org/InStock",
        businessFunction: p.salePrice != null ? "http://purl.org/goodrelations/v1#Sell" : "http://purl.org/goodrelations/v1#LeaseOut",
      },
      about: {
        "@type": p.propertyType === "CASA" || p.propertyType === "VILLA" ? "SingleFamilyResidence" : p.propertyType === "APARTAMENTO" || p.propertyType === "PENTHOUSE" ? "Apartment" : "Place",
        address: { "@type": "PostalAddress", addressLocality: p.sector || p.city || undefined, addressRegion: p.state || undefined, addressCountry: "PA" },
        numberOfRooms: p.bedrooms ?? undefined,
        floorSize: p.area ? { "@type": "QuantitativeValue", value: p.area, unitCode: "MTK" } : undefined,
      },
      provider: { "@type": "RealEstateAgent", name: "PanamaInmo", url: SITE_URL, telephone: "+50763183113" },
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF8F3]" style={{ fontFamily: "'Josefin Sans', sans-serif", color: "#1E1A15" }}>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PortalHeader portal={portal} lang={lang} />

      {/* ─── Breadcrumb ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <Link href={portalHref("/propiedades", portal, lang)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6155] hover:text-[#1E1A15] transition-colors uppercase tracking-[0.15em]">
          <IconArrow /> {t.detail.back}
        </Link>
      </div>

      {/* ─── Main content ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column — gallery + details */}
        <div className="lg:col-span-2 space-y-8">

          {/* Gallery */}
          {photos.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden border border-[#E9E0D0]">
              <PhotoGallery photos={photos} title={p.title} countLabel={t.detail.photos(photos.length)} />
            </div>
          )}

          {/* Title + badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {isVenta && <span className="bg-[#1E1A15] text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-[0.2em]">{t.detail.forSale}</span>}
              {isAlquiler && <span className="bg-[#8A6A3A] text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-[0.2em]">{t.detail.forRent}</span>}
              <span className="text-[10px] text-[#9C9182] font-semibold uppercase tracking-[0.2em] border border-[#E4D9C6] px-3 py-1 rounded-full">
                {t.types[p.propertyType] || t.common.property}
              </span>
              <span className="text-[10px] text-[#9C9182] font-semibold uppercase tracking-[0.2em]">{refCode}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-medium text-[#1E1A15] leading-tight mb-3" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.01em" }}>
              {p.title}
            </h1>

            {fullAddress && (
              <p className="flex items-start gap-2 text-[#5C5347] text-sm">
                <span className="mt-0.5 text-[#9C9182]"><IconPin /></span>
                <span>{fullAddress}</span>
              </p>
            )}
            {p.referencePoint && <p className="text-[#9C9182] text-xs mt-1 ml-6">{p.referencePoint}</p>}
          </div>

          {/* Specs grid */}
          {(p.area || p.landArea || p.bedrooms || p.bathrooms || p.parkingSpots || p.floors || p.yearBuilt) && (
            <div className="bg-[#F3ECDF] rounded-2xl border border-[#E9E0D0] p-6">
              <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-5">{t.detail.specs}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {p.area != null && <SpecItem value={p.area} unit={t.detail.area} />}
                {p.landArea != null && <SpecItem value={p.landArea} unit={t.detail.land} />}
                {p.bedrooms != null && <SpecItem value={p.bedrooms} unit={t.detail.beds} />}
                {p.bathrooms != null && <SpecItem value={p.bathrooms} unit={t.detail.baths} />}
                {p.parkingSpots != null && <SpecItem value={p.parkingSpots} unit={t.detail.parking} />}
                {p.floors != null && <SpecItem value={p.floors} unit={t.detail.levels} />}
                {p.yearBuilt != null && <SpecItem value={p.yearBuilt} unit={t.detail.year} />}
              </div>
            </div>
          )}

          {/* Description */}
          {p.description && (
            <div>
              <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">{t.detail.description}</p>
              <p className="text-sm text-[#4A4238] whitespace-pre-wrap leading-relaxed">{p.description}</p>
            </div>
          )}

          {/* Amenities */}
          {activeAmenities.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">{t.detail.amenities}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeAmenities.map(([, label]) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-[#4A4238] py-2 border-b border-[#EFE6D6]">
                    <span className="text-[#8A6A3A]"><IconCheck /></span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extra features */}
          {features.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">{t.detail.moreFeatures}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-[#4A4238] py-2 border-b border-[#EFE6D6]">
                    <span className="text-[#8A6A3A]"><IconCheck /></span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {videoEmbed && (
            <div>
              <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">{t.detail.video}</p>
              <div className="aspect-video rounded-2xl overflow-hidden border border-[#E9E0D0] bg-[#EDE3D2]">
                <iframe src={videoEmbed} title={`Video ${p.title}`} className="w-full h-full" loading="lazy"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            </div>
          )}

          {/* Map */}
          {(p.sector || p.city || p.address) && (
            <div>
              <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">{t.detail.location}</p>
              <div className="h-72 rounded-2xl overflow-hidden border border-[#E9E0D0] bg-[#EDE3D2]">
                <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
                  title="Mapa" className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <p className="text-[11px] text-[#9C9182] mt-2">{t.detail.approx}</p>
            </div>
          )}

          {p.salePrice != null && p.salePrice > 0 && !p.noMortgage && <MortgageCalc price={p.salePrice} lang={lang} />}

          {/* Related search pages (internal links for SEO) */}
          {related.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">{t.landing.popularTitle}</p>
              <div className="flex flex-wrap gap-2">
                {related.map((l) => (
                  <Link key={l.path} href={portalHref(l.path, portal, lang)} className="px-4 py-2 rounded-full bg-white border border-[#E9E0D0] text-sm text-[#4A4238] hover:border-[#B8945F]">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {p.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-[0.3em] mb-2">{t.detail.notes}</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{p.notes}</p>
            </div>
          )}
        </div>

        {/* Right column — sticky sidebar with prices + contact */}
        <aside className="lg:col-span-1">
          <div className="space-y-4">

            {/* Prices card */}
            <div className="bg-white border border-[#E9E0D0] rounded-2xl p-6">
              <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">{t.detail.price}</p>
              <div className="space-y-3">
                {p.salePrice != null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#9C9182] mb-0.5">{t.common.sale}</p>
                    <p className="text-3xl font-semibold text-[#1E1A15]" style={{ fontFamily: "'Cinzel', serif" }}>
                      {formatCurrency(p.salePrice, p.currency)}
                    </p>
                  </div>
                )}
                {p.rentPrice != null && (
                  <div className={p.salePrice != null ? "pt-3 border-t border-[#EFE6D6]" : ""}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#9C9182] mb-0.5">{t.common.rent}</p>
                    <p className="text-3xl font-semibold text-[#8A6A3A]" style={{ fontFamily: "'Cinzel', serif" }}>
                      {formatCurrency(p.rentPrice, p.currency)}<span className="text-base text-[#6B6155] font-normal">{t.common.perMonth}</span>
                    </p>
                  </div>
                )}
                {p.maintenanceFee != null && (
                  <div className="pt-3 border-t border-[#EFE6D6]">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#9C9182] mb-0.5">{t.detail.maintenance}</p>
                    <p className="text-base font-semibold text-[#4A4238]">
                      {formatCurrency(p.maintenanceFee, p.currency)}<span className="text-xs text-[#6B6155] font-normal">{t.common.perMonth}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {p.brochureUrl && (
              <a href={p.brochureUrl} target="_blank" rel="noopener noreferrer" download
                className="flex items-center justify-center gap-2 w-full bg-[#B8945F] hover:bg-[#8A6A3A] text-white rounded-2xl px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
                {t.detail.brochure}
              </a>
            )}

            <LeadForm lang={lang} propertyId={p.id} waHref={`https://wa.me/${BROKER.phone}?text=${waText}`} />

            {/* Contact CTA */}
            <div className="bg-[#1E1A15] text-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/pi-isotipo-blanco.png" alt="PI" className="h-10 w-auto" />
                <div>
                  <p className="text-sm font-medium tracking-[0.15em]" style={{ fontFamily: "'Cinzel', serif" }}>PANAMAINMO</p>
                  <p className="text-[10px] text-[#9C9182] uppercase tracking-[0.2em]">Real Estate &amp; Legal Advisory</p>
                </div>
              </div>
              <p className="text-[#CFC4B2] text-sm leading-relaxed mb-5">
                {t.detail.interested}
              </p>
              <a href={`https://wa.me/${BROKER.phone}?text=${waText}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-semibold w-full py-3 rounded-full text-xs uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer mb-2">
                <IconWA /> WhatsApp
              </a>
              <a href={`mailto:${BROKER.email}?subject=${encodeURIComponent(t.detail.emailSubject(p.title))}&body=${encodeURIComponent(t.detail.emailBody(p.title, `https://panamainmo.com/p/${p.id}`))}`}
                className="flex items-center justify-center gap-2 bg-transparent border border-white/25 hover:border-[#D9BE8F] text-white font-semibold w-full py-3 rounded-full text-xs uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer">
                <IconMail /> Email
              </a>
              <div className="border-t border-white/15 pt-4 mt-5 space-y-2 text-xs">
                <a href={`tel:+${BROKER.phone}`} className="flex items-center gap-2 text-[#CFC4B2] hover:text-white transition-colors"><IconPhone />{BROKER.phoneDisplay}</a>
                <a href={BROKER.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#CFC4B2] hover:text-white transition-colors"><IconInstagram />@{BROKER.instagram}</a>
                <a href={BROKER.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-[#CFC4B2] hover:text-white transition-colors"><span className="mt-0.5 shrink-0"><IconPin /></span>{BROKER.address}</a>
                <p className="flex items-center gap-2 text-[#9C9182]"><IconBadge />{t.detail.license} {BROKER.license}</p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {publisher && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10  flex items-center gap-3">
            {publisher.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={publisher.photoUrl} alt={publisher.fullName} className="w-9 h-9 rounded-full object-cover border border-[#E4D9C6]" />
            ) : (
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${publisher.color || "from-[#5C5347] to-[#4A4238]"} flex items-center justify-center text-white text-xs font-semibold`}>
                {publisher.initials || publisher.fullName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-[10px] text-[#8A6A3A] uppercase tracking-[0.2em]">{t.detail.publishedBy}</p>
              <p className="text-sm text-[#1E1A15] font-medium">{publisher.fullName}</p>
            </div>
          </div>
        )}

      <PortalFooter portal={portal} lang={lang} />
    </div>
  );
}

function SpecItem({ value, unit }: { value: number; unit: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-[#1E1A15]" style={{ fontFamily: "'Cinzel', serif" }}>{value}</p>
      <p className="text-[11px] text-[#6B6155] uppercase tracking-[0.15em] mt-0.5">{unit}</p>
    </div>
  );
}
