import Link from "next/link";
import SectionTitle from "@/components/portal/SectionTitle";
import { SERIF } from "@/components/portal/brand";
import { IconArrow, IconBuilding, IconGlobe, IconKey, IconScale, IconTag } from "@/components/portal/icons";

const SERVICES = [
  { icon: IconKey, title: "Compra", text: "Te ayudamos a encontrar y negociar la propiedad ideal para vivir o invertir." },
  { icon: IconTag, title: "Venta y alquiler", text: "Promocionamos tu propiedad y te acompañamos hasta el cierre." },
  { icon: IconScale, title: "Asesoría legal", text: "Revisión de contratos, debida diligencia y acompañamiento notarial." },
  { icon: IconBuilding, title: "Administración de propiedades", text: "Cobro de alquileres, mantenimiento e inquilinos, sin que te preocupes." },
  { icon: IconGlobe, title: "Inversión en Panamá", text: "Orientación para extranjeros que quieren invertir o mudarse a Panamá." },
];

export default function ServicesSection({ href }: { href: string }) {
  // Dark intro panel + numbered list of services
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-6 lg:gap-10 items-stretch">
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-[#1E1A15] p-8 sm:p-10 flex flex-col justify-between min-h-[320px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,148,95,0.35),transparent_60%)]" />
          <div className="relative">
            <SectionTitle dark align="left" eyebrow="Servicios" title="¿Cómo te ayudamos?" />
            <p className="text-[#CFC4B2] mt-5 leading-relaxed">Un solo equipo para tu operación inmobiliaria y legal: desde la búsqueda hasta la administración de tu propiedad.</p>
          </div>
          <Link href={href} className="relative mt-8 inline-flex items-center gap-2 self-start bg-[#B8945F] hover:bg-[#A4824F] text-white px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-colors">
            Ver servicios <IconArrow />
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/pi-isotipo-blanco.png" alt="" className="absolute -bottom-6 -right-4 h-40 w-auto opacity-10" />
        </div>
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#E9E0D0] divide-y divide-[#EFE6D6]">
          {SERVICES.map(({ icon: I, title, text }, i) => (
            <Link key={title} href={href} className="group flex items-center gap-5 px-6 sm:px-8 py-5 hover:bg-[#FBF8F3] transition-colors first:rounded-t-3xl last:rounded-b-3xl">
              <span className="text-2xl text-[#D9BE8F] w-10 shrink-0" style={SERIF}>{String(i + 1).padStart(2, "0")}</span>
              <span className="w-12 h-12 rounded-full bg-[#F3ECDF] text-[#8A6A3A] flex items-center justify-center shrink-0 group-hover:bg-[#B8945F] group-hover:text-white transition-colors"><I className="w-6 h-6" /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-lg text-[#1E1A15]" style={SERIF}>{title}</span>
                <span className="block text-sm text-[#6B6155] leading-relaxed">{text}</span>
              </span>
              <span className="hidden sm:flex text-[#B8945F] group-hover:translate-x-1 transition-transform"><IconArrow /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
