import type { Metadata } from "next";
import { getLang, isPortalRequest } from "@/components/portal/portalHost";
import { tr } from "@/components/portal/i18n";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import PageHero from "@/components/portal/PageHero";
import SectionTitle from "@/components/portal/SectionTitle";
import { SANS, SERIF } from "@/components/portal/brand";
import { IconChat, IconGlobe, IconScale, IconTag } from "@/components/portal/icons";
import { pageAlternates } from "@/components/portal/seo";
import SellForm from "./SellForm";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tr(lang).sell;
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates("/vender", lang) };
}

const ICONS = [IconTag, IconGlobe, IconScale, IconChat];

export default async function VenderPage() {
  const portal = await isPortalRequest();
  const lang = await getLang();
  const t = tr(lang).sell;
  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader portal={portal} lang={lang} />
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle} subtitle={t.heroSub}
        image="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=75" />

      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div>
            <SectionTitle align="left" eyebrow={t.whyEyebrow} title={t.whyTitle} />
            <div className="mt-8 space-y-6">
              {t.points.map((p, i) => {
                const I = ICONS[i];
                return (
                  <div key={p.t} data-reveal className="flex gap-4">
                    <span className="w-12 h-12 rounded-full bg-[#F3ECDF] text-[#8A6A3A] flex items-center justify-center shrink-0"><I className="w-6 h-6" /></span>
                    <div>
                      <p className="text-lg" style={SERIF}>{p.t}</p>
                      <p className="text-sm text-[#6B6155] leading-relaxed">{p.d}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-12 bg-[#1E1A15] text-white rounded-3xl p-8" data-reveal>
              <p className="text-[#D9BE8F] text-[11px] font-semibold uppercase tracking-[0.3em] mb-5">{t.stepsTitle}</p>
              <ol className="space-y-5">
                {t.steps.map((s, i) => (
                  <li key={s.t} className="flex gap-4">
                    <span className="text-2xl text-[#D9BE8F] w-9 shrink-0" style={SERIF}>{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block" style={SERIF}>{s.t}</span>
                      <span className="block text-sm text-[#CFC4B2]">{s.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="lg:sticky lg:top-28" data-reveal="right">
            <SellForm lang={lang} />
          </div>
        </div>
      </section>
      <PortalFooter portal={portal} lang={lang} />
    </div>
  );
}
