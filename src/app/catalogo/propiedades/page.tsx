import type { Metadata } from "next";
import { pageAlternates } from "@/components/portal/seo";
import { getLang, isPortalRequest } from "@/components/portal/portalHost";
import { tr } from "@/components/portal/i18n";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import { getAvailableProperties } from "@/components/portal/data";
import Link from "next/link";
import { SANS, SERIF, portalHref, waLink } from "@/components/portal/brand";
import Listing from "./Listing";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tr(lang).listing;
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates("/propiedades", lang) };
}

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

export default async function PropiedadesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const portal = await isPortalRequest();
  const lang = await getLang();
  const t = tr(lang).listing;
  const properties = await getAvailableProperties();

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader portal={portal} lang={lang} />
      <section className="relative bg-[#1E1A15] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,148,95,0.35),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-[#D9BE8F] text-[11px] font-semibold uppercase tracking-[0.35em] mb-3">{t.heroEyebrow}</p>
          <h1 className="text-3xl sm:text-5xl text-white font-medium" style={SERIF}>{t.heroTitle}</h1>
          <p className="text-[#CFC4B2] mt-3 max-w-xl">{t.heroSub}</p>
        </div>
      </section>
      <Listing
        properties={properties}
        lang={lang}
        basePath={portalHref("/propiedades", portal, lang)}
        initial={{ op: one(sp.op), type: one(sp.type), prov: one(sp.prov), dist: one(sp.dist), zone: one(sp.zone), q: one(sp.q), beds: one(sp.beds) }}
      />
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-3xl bg-[#1E1A15] px-6 sm:px-12 py-10 sm:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(184,148,95,0.35),transparent_60%)]" />
          <div className="relative">
            <p className="text-[#D9BE8F] text-[11px] font-semibold uppercase tracking-[0.35em] mb-2">{t.ctaEyebrow}</p>
            <h2 className="text-2xl sm:text-3xl text-white" style={SERIF}>{t.ctaTitle}</h2>
            <p className="text-[#CFC4B2] mt-2 max-w-xl">{t.ctaText}</p>
          </div>
          <div className="relative shrink-0 flex flex-wrap gap-3">
            <a href={waLink(t.ctaWaMsg)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#1EBE5A] text-white px-7 py-3.5 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-colors">
              WhatsApp
            </a>
            <Link href={portalHref("/contacto", portal, lang)}
              className="inline-flex items-center justify-center bg-[#B8945F] hover:bg-[#A4824F] text-white px-7 py-3.5 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-colors">
              {t.ctaContact}
            </Link>
          </div>
        </div>
      </section>
      <PortalFooter portal={portal} lang={lang} />
    </div>
  );
}
