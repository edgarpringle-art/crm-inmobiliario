import type { Metadata } from "next";
import { pageAlternates } from "@/components/portal/seo";
import Link from "next/link";
import { getLang, isPortalRequest } from "@/components/portal/portalHost";
import { tr } from "@/components/portal/i18n";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import PageHero from "@/components/portal/PageHero";
import { SANS, SERIF, portalHref, waLink } from "@/components/portal/brand";
import { IconWA } from "@/components/portal/icons";
import { listPublicSearches, type PublicSearch } from "@/lib/publicSearches";
import OfferForm from "./OfferForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const t = tr(lang).wanted;
  return { title: t.metaTitle, description: t.metaDesc, alternates: pageAlternates("/buscamos", lang) };
}

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default async function BuscamosPage() {
  const portal = await isPortalRequest();
  const lang = await getLang();
  const all = tr(lang);
  const t = all.wanted;
  const searches = await listPublicSearches();

  const typeOf = (s: PublicSearch) => (s.propertyType ? all.types[s.propertyType] || s.propertyType : t.anyType);
  const budgetOf = (s: PublicSearch) => {
    const per = s.op === "ALQUILER" ? t.perMonth : "";
    if (s.budgetMin && s.budgetMax) return `${money(s.budgetMin)} – ${money(s.budgetMax)}${per}`;
    if (s.budgetMax) return t.upTo(money(s.budgetMax)) + per;
    if (s.budgetMin) return t.from(money(s.budgetMin)) + per;
    return null;
  };
  const dateOf = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "es-PA", { day: "numeric", month: "short", timeZone: "America/Panama" }) : null;

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader portal={portal} lang={lang} />
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle} subtitle={t.heroSub}
        image="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=75" />

      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* How it works */}
          <div className="bg-white rounded-2xl border border-[#E9E0D0] p-5 sm:p-6 mb-10 grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-8 items-center">
            <p className="text-lg" style={SERIF}>{t.howTitle}</p>
            <ol className="grid sm:grid-cols-3 gap-3">
              {t.how.map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-sm text-[#4A4238]">
                  <span className="w-7 h-7 rounded-full bg-[#F3ECDF] text-[#8A6A3A] flex items-center justify-center shrink-0 text-xs font-semibold">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {searches.length === 0 ? (
            <div className="text-center bg-white rounded-2xl border border-[#E9E0D0] px-6 py-14">
              <p className="text-xl mb-2" style={SERIF}>{t.empty}</p>
              <p className="text-sm text-[#6B6155] mb-6">{t.emptySub}</p>
              <Link href={portalHref("/contacto", portal, lang)}
                className="inline-flex bg-[#1E1A15] hover:bg-[#B8945F] text-white px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-colors">
                {t.emptyCta}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.25em] text-[#8A6A3A] mb-4">{t.count(searches.length)}</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {searches.map((s) => {
                  const what = [typeOf(s), s.zones.join(", ")].filter(Boolean).join(" · ");
                  const budget = budgetOf(s);
                  const specs = [s.bedrooms ? t.beds(s.bedrooms) : null, s.bathrooms ? t.baths(s.bathrooms) : null].filter(Boolean).join(" · ");
                  return (
                    <article key={s.code} className="bg-white rounded-2xl border border-[#E9E0D0] p-5 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-[#F3ECDF] text-[#8A6A3A] text-[11px] font-semibold uppercase tracking-[0.12em]">{t.op[s.op] || s.op}</span>
                        <span className="text-[11px] text-[#9C9182] tracking-wider">{s.code}</span>
                      </div>
                      <div>
                        <h2 className="text-lg leading-snug" style={SERIF}>{typeOf(s)}</h2>
                        <p className="text-sm text-[#4A4238] mt-1">{s.zones.length ? s.zones.join(" · ") : t.anyZone}</p>
                      </div>
                      {(budget || specs) && (
                        <div className="text-sm">
                          {budget && <p className="font-semibold text-[#1E1A15]">{budget}</p>}
                          {specs && <p className="text-[#6B6155]">{specs}</p>}
                        </div>
                      )}
                      {s.publishedAt && <p className="text-[11px] text-[#9C9182]">{t.published(dateOf(s.publishedAt)!)}</p>}
                      <a href={waLink(t.waMsg(s.code, what))} data-wa-direct target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white py-2.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors">
                        <IconWA /> {t.wa}
                      </a>
                      <OfferForm code={s.code} lang={lang} />
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
      <PortalFooter portal={portal} lang={lang} />
    </div>
  );
}
