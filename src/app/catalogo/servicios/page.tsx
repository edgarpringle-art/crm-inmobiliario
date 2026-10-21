import type { Metadata } from "next";
import Link from "next/link";
import { isPortalRequest } from "@/components/portal/portalHost";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import PageHero from "@/components/portal/PageHero";
import SectionTitle from "@/components/portal/SectionTitle";
import { SANS, SERIF, portalHref, waLink } from "@/components/portal/brand";
import { IconBuilding, IconCheck, IconGlobe, IconKey, IconScale, IconTag, IconWA } from "@/components/portal/icons";

export const metadata: Metadata = {
  title: "Servicios · PanamaInmo",
  description: "Compra, venta, alquiler y asesoría legal inmobiliaria en Panamá.",
};

const SERVICES = [
  {
    icon: IconKey, title: "Compra de propiedades",
    text: "Te ayudamos a encontrar la propiedad ideal para vivir o invertir, y a negociar las mejores condiciones.",
    items: ["Búsqueda según tu presupuesto y zona", "Visitas coordinadas y acompañadas", "Análisis de precio por zona", "Negociación de la oferta"],
    img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=75",
  },
  {
    icon: IconTag, title: "Venta y alquiler para propietarios",
    text: "Promocionamos tu inmueble con buenas fotos y en los canales correctos, y filtramos a los interesados.",
    items: ["Valoración y estrategia de precio", "Publicación en portales y redes", "Filtro de compradores e inquilinos", "Acompañamiento hasta el cierre"],
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=75",
  },
  {
    icon: IconScale, title: "Asesoría legal inmobiliaria",
    text: "Revisamos la documentación y los contratos para que tu operación sea segura de principio a fin.",
    items: ["Contratos de compraventa y arrendamiento", "Debida diligencia de la propiedad", "Revisión en Registro Público", "Acompañamiento notarial"],
    img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=75",
  },
  {
    icon: IconBuilding, title: "Administración de propiedades",
    text: "Nos encargamos de tu inmueble alquilado para que recibas tu renta sin preocupaciones.",
    items: ["Cobro y control de alquileres", "Mantenimiento y reparaciones", "Inspecciones periódicas", "Relación con el inquilino y el PH"],
    img: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=75",
  },
  {
    icon: IconGlobe, title: "Inversión en Panamá",
    text: "Orientación para extranjeros y locales que quieren invertir en bienes raíces o mudarse a Panamá.",
    items: ["Zonas con mejor potencial", "Proyectos en preventa", "Opciones para renta", "Coordinación con bancos y abogados"],
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=75",
  },
];

const STEPS = [
  { n: "01", t: "Conversamos", d: "Nos cuentas qué necesitas por WhatsApp, llamada o formulario." },
  { n: "02", t: "Buscamos o promocionamos", d: "Seleccionamos opciones o publicamos tu propiedad." },
  { n: "03", t: "Revisamos lo legal", d: "Validamos documentos y preparamos el contrato." },
  { n: "04", t: "Cerramos", d: "Te acompañamos en la firma y la entrega." },
];

export default async function ServiciosPage() {
  const portal = await isPortalRequest();
  const h = (path: string) => portalHref(path, portal);
  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader portal={portal} />
      <PageHero eyebrow="Servicios" title="Todo lo que necesitas para tu operación inmobiliaria"
        subtitle="Un solo equipo para comprar, vender o alquilar, con asesoría legal integrada."
        image="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=75" />

      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
          {SERVICES.map(({ icon: I, title, text, items, img }, i) => (
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
          <SectionTitle dark eyebrow="Cómo trabajamos" title="Un proceso claro, paso a paso" />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
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
        <h2 className="text-3xl font-medium mb-4" style={SERIF}>¿No sabes cuál servicio necesitas?</h2>
        <p className="text-[#6B6155] mb-8">Escríbenos y lo definimos juntos en una llamada.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={waLink("Hola PanamaInmo, quisiera asesoría.")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-semibold px-7 py-3.5 rounded-full text-xs uppercase tracking-[0.15em]">
            <IconWA /> WhatsApp
          </a>
          <Link href={h("/contacto")}
            className="inline-flex items-center gap-2 border border-[#1E1A15] hover:bg-[#1E1A15] hover:text-white font-semibold px-7 py-3.5 rounded-full text-xs uppercase tracking-[0.15em] transition-colors">
            Contacto
          </Link>
        </div>
      </section>
      <PortalFooter portal={portal} />
    </div>
  );
}
