import type { Metadata } from "next";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import PageHero from "@/components/portal/PageHero";
import LeadForm from "@/components/portal/LeadForm";
import { BROKER, SANS, SERIF, waLink } from "@/components/portal/brand";
import { IconBadge, IconInstagram, IconMail, IconPhone, IconWA } from "@/components/portal/icons";

export const metadata: Metadata = {
  title: "Contacto · PanamaInmo",
  description: "Escríbenos para comprar, vender o alquilar tu propiedad en Panamá.",
};

export default function ContactoPage() {
  const items = [
    { icon: IconWA, label: "WhatsApp", value: BROKER.phoneDisplay, href: waLink("Hola PanamaInmo") },
    { icon: IconPhone, label: "Teléfono", value: BROKER.phoneDisplay, href: `tel:+${BROKER.phone}` },
    { icon: IconMail, label: "Email", value: BROKER.email, href: `mailto:${BROKER.email}` },
    { icon: IconInstagram, label: "Instagram", value: `@${BROKER.instagram}`, href: BROKER.instagramUrl },
  ];

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader />
      <PageHero eyebrow="Contacto" title="Hablemos de tu próxima propiedad"
        subtitle="Déjanos tus datos y te respondemos a la brevedad, o escríbenos directo por WhatsApp."
        image="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=75" />

      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl mb-2" style={SERIF}>Datos de contacto</h2>
            {items.map(({ icon: I, label, value, href }) => (
              <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                className="flex items-center gap-4 bg-white rounded-2xl border border-[#E9E0D0] p-4 hover:border-[#B8945F] transition-colors">
                <span className="w-12 h-12 rounded-full bg-[#F3ECDF] text-[#8A6A3A] flex items-center justify-center shrink-0"><I className="w-5 h-5" /></span>
                <span>
                  <span className="block text-[11px] uppercase tracking-[0.2em] text-[#8A6A3A]">{label}</span>
                  <span className="block text-sm text-[#1E1A15] break-all">{value}</span>
                </span>
              </a>
            ))}
            <p className="flex items-center gap-2 text-xs text-[#6B6155] pt-2"><IconBadge /> Licencia {BROKER.license} · Panamá</p>
          </div>
          <div className="lg:col-span-3">
            <LeadForm waHref={waLink("Hola PanamaInmo")} title="Envíanos un mensaje" cta="Enviar mensaje" />
          </div>
        </div>
      </section>
      <PortalFooter />
    </div>
  );
}
