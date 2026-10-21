import Link from "next/link";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import PropertyCard from "@/components/portal/PropertyCard";
import SectionTitle from "@/components/portal/SectionTitle";
import { getAvailableProperties } from "@/components/portal/data";
import { BROKER, CATEGORIES, SANS, SERIF, portalHref, waLink } from "@/components/portal/brand";
import { IconArrow, IconChat, IconKey, IconScale, IconShield, IconWA } from "@/components/portal/icons";
import { optimizePhoto } from "@/lib/publicProperty";
import HeroSearch from "./HeroSearch";
import ServicesSection from "./ServicesSection";
import { isPortalRequest } from "@/components/portal/portalHost";

export const dynamic = "force-dynamic";

const HERO_IMG = "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=2400&q=80";
const WHY_IMG = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80";
const CTA_IMG = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=80";

// Bento grid: first card 2x2, the rest stretch so the grid never leaves holes.
function bentoSpan(i: number, n: number): string {
  if (i === 0) return n === 1 ? "col-span-2 md:col-span-4 row-span-2" : "col-span-2 row-span-2";
  const r = n - 1;
  const mobile = r % 2 === 1 && i === r ? "col-span-2" : "";
  const md = r === 1 ? "md:col-span-2 md:row-span-2" : r === 2 || (r === 3 && i === 3) ? "md:col-span-2" : "md:col-span-1";
  return `${mobile} ${md}`;
}

export default async function CatalogoHome() {
  const portal = await isPortalRequest();
  const h = (path: string) => portalHref(path, portal);
  const properties = await getAvailableProperties();
  const featured = properties.slice(0, 6);

  const categories = CATEGORIES
    .map((c) => {
      const ofType = properties.filter((p) => p.propertyType === c.type);
      const photo = ofType.find((p) => p.photos.length)?.photos[0];
      return { ...c, count: ofType.length, img: photo ? optimizePhoto(photo, 900) : c.fallback };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader portal={portal} />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url('${HERO_IMG}')` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E1A15]/75 via-[#2A2118]/55 to-[#1E1A15]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(184,148,95,0.25),transparent_60%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-28 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-10 bg-[#D9BE8F]" />
            <p className="text-[#D9BE8F] text-[11px] font-semibold uppercase tracking-[0.4em]">Real Estate & Legal Advisory</p>
            <span className="h-px w-10 bg-[#D9BE8F]" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-white leading-[1.1] mb-6" style={SERIF}>
            Tu hogar en Panamá,<br /><span className="text-[#D9BE8F]">con respaldo legal</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Compra, venta y alquiler de propiedades con asesoría legal integrada en cada paso.
          </p>
          <HeroSearch portal={portal} />
        </div>

        {/* Trust strip */}
        <div className="relative border-t border-white/10 bg-[#1E1A15]/60 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-3 gap-4 text-center text-white">
            <div>
              <p className="text-2xl sm:text-3xl text-[#D9BE8F]" style={SERIF}>{properties.length}</p>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/70 mt-1">Propiedades disponibles</p>
            </div>
            <div className="border-x border-white/10">
              <p className="text-2xl sm:text-3xl text-[#D9BE8F]" style={SERIF}>Legal</p>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/70 mt-1">Asesoría integrada</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl text-[#D9BE8F]" style={SERIF}>{BROKER.license}</p>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/70 mt-1">Licencia</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories (photo bento) ─── */}
      {categories.length > 0 && (
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <SectionTitle eyebrow="Categorías" title="Explora por tipo" subtitle="Encuentra el espacio que va con tu estilo de vida." />
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 auto-rows-[170px] sm:auto-rows-[210px] gap-3 sm:gap-4">
              {categories.map((c, i) => (
                <Link key={c.type} href={h(`/propiedades?type=${c.type}`)}
                  className={`group relative overflow-hidden rounded-2xl ${bentoSpan(i, categories.length)}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.label} loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[900ms]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E1A15]/85 via-[#1E1A15]/25 to-transparent" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl group-hover:ring-[#D9BE8F]/60 transition" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex items-end justify-between gap-3">
                    <div>
                      <p className={`text-white font-medium ${i === 0 ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`} style={SERIF}>{c.label}</p>
                      <p className="text-[#D9BE8F] text-xs uppercase tracking-[0.2em] mt-1">{c.count} disponible{c.count !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="hidden sm:flex w-10 h-10 rounded-full bg-white/15 backdrop-blur text-white items-center justify-center group-hover:bg-[#B8945F] transition-colors shrink-0">
                      <IconArrow />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Featured ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#F3ECDF]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <SectionTitle align="left" eyebrow="Recién publicadas" title="Propiedades destacadas" />
            <Link href={h("/propiedades")}
              className="inline-flex items-center gap-2 self-start sm:self-auto text-xs font-semibold uppercase tracking-[0.2em] text-[#1E1A15] border-b border-[#B8945F] pb-1 hover:text-[#8A6A3A]">
              Ver todas <IconArrow />
            </Link>
          </div>
          {featured.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
          ) : (
            <p className="text-center text-[#6B6155] py-10">Pronto publicaremos nuevas propiedades.</p>
          )}
        </div>
      </section>

      {/* ─── Why PanamaInmo ─── */}
      <section className="bg-[#1E1A15] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2">
          <div className="px-4 sm:px-6 lg:pr-16 py-16 sm:py-24">
            <SectionTitle dark align="left" eyebrow="Por qué PanamaInmo" title="Inmobiliaria y asesoría legal, en un mismo lugar" />
            <p className="text-[#CFC4B2] mt-5 leading-relaxed max-w-xl">
              Comprar, vender o alquilar es una decisión importante. Por eso unimos la experiencia inmobiliaria con el respaldo legal, para que cada paso sea claro y seguro.
            </p>
            <div className="mt-10 grid sm:grid-cols-2 gap-6">
              {[
                { icon: IconShield, t: "Operaciones seguras", d: "Revisamos documentos y contratos antes de firmar." },
                { icon: IconChat, t: "Atención personal", d: "Te respondemos directo por WhatsApp, sin intermediarios." },
                { icon: IconKey, t: "Propiedades verificadas", d: "Publicamos con información real y actualizada." },
                { icon: IconScale, t: "Acompañamiento total", d: "Desde la primera visita hasta la entrega de llaves." },
              ].map(({ icon: I, t, d }) => (
                <div key={t} className="flex gap-4">
                  <span className="w-12 h-12 rounded-full border border-[#B8945F]/50 text-[#D9BE8F] flex items-center justify-center shrink-0"><I className="w-6 h-6" /></span>
                  <div>
                    <p className="font-medium text-white mb-1" style={SERIF}>{t}</p>
                    <p className="text-sm text-[#B5AA98] leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href={h("/nosotros")}
              className="inline-flex items-center gap-2 mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-[#D9BE8F] border-b border-[#B8945F] pb-1 hover:text-white">
              Conoce al equipo <IconArrow />
            </Link>
          </div>
          <div className="relative min-h-[320px] lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={WHY_IMG} alt="Interior de propiedad" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E1A15] via-[#1E1A15]/20 to-transparent lg:via-transparent" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/pi-isotipo-blanco.png" alt="" className="absolute bottom-8 right-8 h-20 w-auto opacity-80" />
          </div>
        </div>
      </section>

      {/* ─── Services teaser ─── */}
      <ServicesSection href={h("/servicios")} />

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden mx-4 sm:mx-6 mb-16 sm:mb-20 rounded-3xl">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${CTA_IMG}')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E1A15]/90 via-[#3A2C1C]/80 to-[#B8945F]/60" />
        <div className="relative max-w-5xl mx-auto px-6 py-14 sm:py-20 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-medium mb-4" style={SERIF}>¿Quieres vender o alquilar tu propiedad?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">Cuéntanos de tu inmueble y te asesoramos sobre precio, promoción y documentación.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={waLink("Hola PanamaInmo, quiero vender/alquilar mi propiedad.")} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-semibold px-7 py-3.5 rounded-full text-xs uppercase tracking-[0.15em] transition-colors">
              <IconWA /> Escríbenos
            </a>
            <Link href={h("/contacto")}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/40 hover:bg-white hover:text-[#1E1A15] text-white font-semibold px-7 py-3.5 rounded-full text-xs uppercase tracking-[0.15em] transition-colors">
              Formulario de contacto
            </Link>
          </div>
        </div>
      </section>

      <PortalFooter portal={portal} />
    </div>
  );
}
