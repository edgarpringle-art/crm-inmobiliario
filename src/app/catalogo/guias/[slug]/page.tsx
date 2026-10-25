import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLang, isPortalRequest } from "@/components/portal/portalHost";
import { tr } from "@/components/portal/i18n";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import { SANS, SERIF, portalHref, waLink } from "@/components/portal/brand";
import { IconBack, IconCheck, IconWA } from "@/components/portal/icons";
import { SITE_URL, pageAlternates } from "@/components/portal/seo";
import { GUIDES, guideBySlug } from "@/components/portal/guides";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const lang = await getLang();
  const g = guideBySlug((await params).slug);
  if (!g) return { title: tr(lang).detail.notFound };
  const x = g[lang];
  return {
    title: `${x.title} | PanamaInmo`, description: x.summary,
    alternates: pageAlternates(`/guias/${g.slug}`, lang),
    openGraph: { title: x.title, description: x.summary, type: "article", siteName: "PanamaInmo", images: [{ url: g.img }] },
  };
}

export default async function GuiaPage({ params }: { params: Params }) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const portal = await isPortalRequest();
  const lang = await getLang();
  const t = tr(lang).guides;
  const x = g[lang];
  const h = (path: string) => portalHref(path, portal, lang);
  const ld = {
    "@context": "https://schema.org", "@type": "Article", headline: x.title, description: x.summary, image: g.img, inLanguage: lang,
    author: { "@type": "Organization", name: "PanamaInmo" },
    publisher: { "@type": "Organization", name: "PanamaInmo", logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/panamainmo-logo.png` } },
    mainEntityOfPage: pageAlternates(`/guias/${g.slug}`, lang).canonical,
  };
  const others = GUIDES.filter((o) => o.slug !== g.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <PortalHeader portal={portal} lang={lang} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link href={h("/guias")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6155] hover:text-[#1E1A15] uppercase tracking-[0.15em]">
          <IconBack /> {t.back}
        </Link>
        <p className="mt-8 text-[11px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] pi-enter">{t.heroEyebrow} · {t.minutes(g.minutes)}</p>
        <h1 className="mt-3 text-3xl sm:text-4xl leading-tight pi-enter" style={{ ...SERIF, animationDelay: "120ms" }}>{x.title}</h1>
        <p className="mt-4 text-lg text-[#6B6155] leading-relaxed pi-enter" style={{ animationDelay: "240ms" }}>{x.summary}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={g.img} alt="" className="mt-8 w-full rounded-2xl object-cover pi-enter" style={{ aspectRatio: "16/8", animationDelay: "360ms" }} />

        <div className="mt-10 space-y-10">
          {x.sections.map((s) => (
            <section key={s.h} data-reveal>
              <h2 className="text-2xl mb-4" style={SERIF}>{s.h}</h2>
              {s.p?.map((para) => <p key={para} className="text-[#4A4238] leading-relaxed mb-4">{para}</p>)}
              {s.list && (
                <ul className="space-y-2.5">
                  {s.list.map((li) => (
                    <li key={li} className="flex gap-3 text-[#4A4238] leading-relaxed">
                      <span className="mt-1 text-[#B8945F] shrink-0"><IconCheck /></span>{li}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-[#9C9182] border-t border-[#E9E0D0] pt-5">{t.disclaimer}</p>

        <div className="mt-10 rounded-3xl bg-[#1E1A15] text-white p-8 text-center" data-reveal="zoom">
          <p className="text-2xl mb-2" style={SERIF}>{t.ctaTitle}</p>
          <p className="text-[#CFC4B2] text-sm mb-6">{t.ctaText}</p>
          <a href={waLink(t.waMsg(x.title))} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-semibold px-7 py-3.5 rounded-full text-xs uppercase tracking-[0.15em] transition-colors pi-wa-ring">
            <IconWA /> {t.ctaWa}
          </a>
        </div>
      </article>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <p className="text-[11px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-5">{t.related}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {others.map((o) => (
            <Link key={o.slug} href={h(`/guias/${o.slug}`)} data-reveal
              className="bg-white rounded-2xl border border-[#E9E0D0] p-5 hover:border-[#B8945F] transition-colors">
              <p className="leading-snug" style={SERIF}>{o[lang].title}</p>
              <p className="text-xs text-[#9C9182] mt-2">{t.minutes(o.minutes)}</p>
            </Link>
          ))}
        </div>
      </section>
      <PortalFooter portal={portal} lang={lang} />
    </div>
  );
}
