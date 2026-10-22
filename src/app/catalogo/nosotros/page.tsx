import type { Metadata } from "next";
import { getLang, isPortalRequest } from "@/components/portal/portalHost";
import { tr } from "@/components/portal/i18n";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import PageHero from "@/components/portal/PageHero";
import SectionTitle from "@/components/portal/SectionTitle";
import { BROKER, SANS, SERIF } from "@/components/portal/brand";
import { IconChat, IconKey, IconScale, IconShield, IconWA } from "@/components/portal/icons";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = tr(await getLang()).about;
  return { title: t.metaTitle, description: t.metaDesc };
}

interface TeamMember { fullName: string; photoUrl: string | null; initials: string | null; phone: string | null }

// Public team, in display order. Photo and WhatsApp come from the matching CRM agent (by name), if any.
const TEAM = [
  { name: "Edgar Pringle", roleKey: "broker" },
  { name: "Ana Lorena Chanis", roleKey: "lawyer" },
  { name: "Félix Olivares", roleKey: "agent" },
  { name: "Valentina Velásquez", roleKey: "support" },
] as const;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
// "Edgar Pringle" matches "Edgar Enrique Pringle Vasquez": every word of the public name must appear.
const samePerson = (publicName: string, agentName: string) => {
  const words = norm(agentName).split(/\s+/);
  return norm(publicName).split(/\s+/).every((w) => words.includes(w));
};

const VALUE_ICONS = [IconShield, IconScale, IconChat, IconKey];

export default async function NosotrosPage() {
  const portal = await isPortalRequest();
  const lang = await getLang();
  const t = tr(lang).about;
  const values = t.values.map((v, i) => ({ ...v, icon: VALUE_ICONS[i] }));
  const agents = await query<TeamMember>(
    "SELECT fullName, photoUrl, initials, phone FROM Agent ORDER BY (photoUrl IS NULL OR photoUrl = ''), active DESC, createdAt ASC"
  ).catch(() => []);
  const team = TEAM.map((m) => {
    // Exact name first; otherwise the only agent sharing the first name (CRM spelling may differ: Velázquez/Velasquez…).
    const first = norm(m.name).split(/\s+/)[0];
    const byFirst = agents.filter((x) => norm(x.fullName).split(/\s+/)[0] === first);
    const withPhoto = byFirst.filter((x) => x.photoUrl);
    const a = agents.find((x) => samePerson(m.name, x.fullName))
      || (byFirst.length === 1 ? byFirst[0] : withPhoto.length === 1 ? withPhoto[0] : undefined);
    const r = t.roles[m.roleKey] as { role: string; detail?: string | ((lic: string) => string) };
    return {
      name: m.name,
      role: r.role,
      detail: typeof r.detail === "function" ? r.detail(BROKER.license) : r.detail || null,
      photoUrl: a?.photoUrl || null,
      phone: a?.phone || null,
      initials: (m.name[0] + m.name.split(" ").pop()![0]).toUpperCase(),
    };
  });

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader portal={portal} lang={lang} />
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle}
        subtitle={t.heroSub}
        image="https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=2000&q=75" />

      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionTitle align="left" eyebrow={t.whoEyebrow} title={t.whoTitle} />
            <div className="mt-6 space-y-4 text-[#4A4238] leading-relaxed">
              <p>{t.p1}</p>
              <p>{t.p2}</p>
            </div>
            <p className="mt-6 text-sm text-[#6B6155]">{t.license} <span className="font-semibold text-[#8A6A3A]">{BROKER.license}</span></p>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl border border-[#B8945F]/40 translate-x-3 translate-y-3" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=75" alt={t.imgAlt}
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
          <SectionTitle eyebrow={t.valuesEyebrow} title={t.valuesTitle} />
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ icon: I, t: title, d }) => (
              <div key={title} className="bg-white rounded-2xl p-7 border border-[#E9E0D0]">
                <span className="w-14 h-14 rounded-full bg-[#1E1A15] text-[#D9BE8F] flex items-center justify-center mb-5"><I /></span>
                <p className="text-lg mb-2" style={SERIF}>{title}</p>
                <p className="text-sm text-[#6B6155] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {team.length > 0 && (
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <SectionTitle eyebrow={t.teamEyebrow} title={t.teamTitle} />
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-sm sm:max-w-none mx-auto">
              {team.map((m) => (
                <div key={m.name} className="bg-white rounded-3xl border border-[#E9E0D0] overflow-hidden text-center">
                  <div className="aspect-square bg-gradient-to-br from-[#EDE3D2] to-[#D9BE8F] flex items-center justify-center">
                    {m.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl text-[#1E1A15]" style={SERIF}>{m.initials}</span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-lg" style={SERIF}>{m.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#8A6A3A] mt-1">{m.role}</p>
                    {m.detail && <p className="text-xs text-[#6B6155] mt-1">{m.detail}</p>}
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
      <PortalFooter portal={portal} lang={lang} />
    </div>
  );
}
