import type { Metadata } from "next";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import PageHero from "@/components/portal/PageHero";
import SectionTitle from "@/components/portal/SectionTitle";
import { BROKER, SANS, SERIF } from "@/components/portal/brand";
import { IconChat, IconKey, IconScale, IconShield, IconWA } from "@/components/portal/icons";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nosotros · PanamaInmo",
  description: "Conoce a PanamaInmo: Real Estate & Legal Advisory en Panamá.",
};

interface TeamMember { fullName: string; photoUrl: string | null; initials: string | null; phone: string | null }

const VALUES = [
  { icon: IconShield, t: "Transparencia", d: "Información clara sobre precios, costos y documentos desde el primer día." },
  { icon: IconScale, t: "Respaldo legal", d: "Cada operación pasa por una revisión legal antes de firmar." },
  { icon: IconChat, t: "Cercanía", d: "Atención personal y directa, cuando la necesitas." },
  { icon: IconKey, t: "Compromiso", d: "Te acompañamos hasta la entrega de llaves y después." },
];

export default async function NosotrosPage() {
  const team = await query<TeamMember>(
    "SELECT fullName, photoUrl, initials, phone FROM Agent WHERE active = 1 ORDER BY createdAt ASC"
  ).catch(() => []);

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader />
      <PageHero eyebrow="Nosotros" title="Real Estate & Legal Advisory en Panamá"
        subtitle="Unimos el servicio inmobiliario con la asesoría legal para que comprar, vender o alquilar sea simple y seguro."
        image="https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=2000&q=75" />

      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionTitle align="left" eyebrow="Quiénes somos" title="Una inmobiliaria con respaldo legal" />
            <div className="mt-6 space-y-4 text-[#4A4238] leading-relaxed">
              <p>PanamaInmo nace para ofrecer una experiencia inmobiliaria completa: encontrar la propiedad correcta y cerrar la operación con seguridad jurídica.</p>
              <p>Trabajamos con compradores, inquilinos, propietarios e inversionistas en Ciudad de Panamá y alrededores, con atención personalizada en cada etapa.</p>
            </div>
            <p className="mt-6 text-sm text-[#6B6155]">Licencia <span className="font-semibold text-[#8A6A3A]">{BROKER.license}</span></p>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl border border-[#B8945F]/40 translate-x-3 translate-y-3" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=75" alt="Propiedad"
              className="relative rounded-3xl w-full h-80 sm:h-[420px] object-cover" />
            <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-[#1E1A15] rounded-2xl p-5 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/pi-isotipo-blanco.png" alt="PI" className="h-14 w-auto" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#F3ECDF]">
        <div className="max-w-6xl mx-auto">
          <SectionTitle eyebrow="Nuestros valores" title="Lo que nos define" />
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ icon: I, t, d }) => (
              <div key={t} className="bg-white rounded-2xl p-7 border border-[#E9E0D0]">
                <span className="w-14 h-14 rounded-full bg-[#1E1A15] text-[#D9BE8F] flex items-center justify-center mb-5"><I /></span>
                <p className="text-lg mb-2" style={SERIF}>{t}</p>
                <p className="text-sm text-[#6B6155] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {team.length > 0 && (
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <SectionTitle eyebrow="El equipo" title="Personas reales, atención directa" />
            <div className="mt-10 flex flex-wrap justify-center gap-6">
              {team.map((m) => (
                <div key={m.fullName} className="w-64 bg-white rounded-3xl border border-[#E9E0D0] overflow-hidden text-center">
                  <div className="h-64 bg-gradient-to-br from-[#EDE3D2] to-[#D9BE8F] flex items-center justify-center">
                    {m.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photoUrl} alt={m.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl text-[#1E1A15]" style={SERIF}>{m.initials || m.fullName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-lg" style={SERIF}>{m.fullName}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#8A6A3A] mt-1">Asesor inmobiliario</p>
                    {m.phone && (
                      <a href={`https://wa.me/${m.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#1E1A15] hover:text-[#8A6A3A]">
                        <IconWA className="w-4 h-4 text-[#25D366]" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <PortalFooter />
    </div>
  );
}
