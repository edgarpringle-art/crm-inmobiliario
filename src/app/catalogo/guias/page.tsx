import type { Metadata } from "next";
import Link from "next/link";
import { getLang, isPortalRequest } from "@/components/portal/portalHost";
import { tr } from "@/components/portal/i18n";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import PageHero from "@/components/portal/PageHero";
import { SANS, SERIF, portalHref } from "@/components/portal/brand";
import { IconArrow } from "@/components/portal/icons";
import { pageAlternates } from "@/components/portal/seo";
import { GUIDES } from "@/components/portal/guides";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tr(lang).guides;
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates("/guias", lang) };
}

export default async function GuiasPage() {
  const portal = await isPortalRequest();
  const lang = await getLang();
  const t = tr(lang).guides;
  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader portal={portal} lang={lang} />
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle} subtitle={t.heroSub}
        image="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=2000&q=75" />
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GUIDES.map((g) => {
            const x = g[lang];
            return (
              <Link key={g.slug} href={portalHref(`/guias/${g.slug}`, portal, lang)} data-reveal
                className="group bg-white rounded-2xl overflow-hidden border border-[#E9E0D0] hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(30,26,21,0.35)] transition-all duration-300 flex flex-col">
                <div className="relative overflow-hidden bg-[#EDE3D2]" style={{ aspectRatio: "16/9" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.img} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.2em] mb-2">{t.minutes(g.minutes)}</p>
                  <h2 className="text-lg leading-snug mb-2 group-hover:text-[#8A6A3A] transition-colors" style={SERIF}>{x.title}</h2>
                  <p className="text-sm text-[#6B6155] leading-relaxed flex-1">{x.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1E1A15]">
                    {t.readMore} <span className="group-hover:translate-x-1 transition-transform"><IconArrow /></span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <PortalFooter portal={portal} lang={lang} />
    </div>
  );
}
