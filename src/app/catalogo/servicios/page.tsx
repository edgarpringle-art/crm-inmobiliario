import type { Metadata } from "next";
import { pageAlternates } from "@/components/portal/seo";
import Link from "next/link";
import { getLang, isPortalRequest } from "@/components/portal/portalHost";
import { tr } from "@/components/portal/i18n";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import PageHero from "@/components/portal/PageHero";
import SectionTitle from "@/components/portal/SectionTitle";
import { SANS, SERIF, portalHref, waLink } from "@/components/portal/brand";
import { IconBuilding, IconCheck, IconGlobe, IconKey, IconScale, IconTag, IconWA } from "@/components/portal/icons";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tr(lang).servicesPage;
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates("/servicios", lang) };
}

// Icon and photo per service, in the same order as the dictionary list.
const SERVICE_MEDIA = [
  { icon: IconKey, img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=75" },
  { icon: IconTag, img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=75" },
  { icon: IconScale, img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=75" },
  { icon: IconBuilding, img: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=75" },
  { icon: IconGlobe, img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=75" },
];


export default async function ServiciosPage() {
  const portal = await isPortalRequest();
  const lang = await getLang();
  const t = tr(lang).servicesPage;
  const h = (path: string) => portalHref(path, portal, lang);
  const services = t.list.map((s, i) => ({ ...s, ...SERVICE_MEDIA[i] }));
  const steps = t.steps.map((s, i) => ({ ...s, n: String(i + 1).padStart(2, "0") }));
  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader portal={portal} lang={lang} />
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle}
        subtitle={t.heroSub}
        image="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=75" />

      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          {services.map(({ icon: I, title, text, items, img }, i) => (
            <div key={title} className={`grid md:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden border border-[#E9E0D0] ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div className="relative min-h-[220px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1A15]/40 to-transparent" />
              </div>
              <div className="p-7 sm:p-10">
                <span className="w-14 h-14 rounded-full bg-[#F3ECDF] text-[#8A6A3A] flex items-center justify-center mb-5"><I /></span>
                <h2 className="text-2xl font-medium mb-3" style={SERIF}>{title}</h2>
                <p className="text-[#6B6155] leading-relaxed mb-5">{text}</p>
                <ul className="space-y-2">
                  {items.map((it) => (
                    <li key={it} className="flex items-center gap-2.5 text-sm text-[#4A4238]">
                      <span className="text-[#B8945F]"><IconCheck /></span>{it}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#1E1A15]">
        <div className="max-w-6xl mx-auto">
          <SectionTitle dark eyebrow={t.stepsEyebrow} title={t.stepsTitle} />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 p-6 bg-white/[0.03]">
                <p className="text-4xl text-[#B8945F] mb-4" style={SERIF}>{s.n}</p>
                <p className="text-white text-lg mb-2" style={SERIF}>{s.t}</p>
                <p className="text-sm text-[#B5AA98] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 text-center">
        <h2 className="text-3xl font-medium mb-4" style={SERIF}>{t.helpTitle}</h2>
        <p className="text-[#6B6155] mb-8">{t.helpText}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={waLink(t.helpWaMsg)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-semibold px-7 py-3.5 rounded-full text-xs uppercase tracking-[0.15em]">
            <IconWA /> WhatsApp
          </a>
          <Link href={h("/contacto")}
            className="inline-flex items-center gap-2 border border-[#1E1A15] hover:bg-[#1E1A15] hover:text-white font-semibold px-7 py-3.5 rounded-full text-xs uppercase tracking-[0.15em] transition-colors">
            {t.contact}
          </Link>
        </div>
      </section>
      <PortalFooter portal={portal} lang={lang} />
    </div>
  );
}
