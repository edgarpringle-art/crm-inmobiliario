import Link from "next/link";
import SectionTitle from "@/components/portal/SectionTitle";
import { SERIF } from "@/components/portal/brand";
import { tr, type Lang } from "@/components/portal/i18n";
import { IconArrow, IconBuilding, IconGlobe, IconKey, IconScale, IconTag } from "@/components/portal/icons";

const ICONS = [IconKey, IconTag, IconScale, IconBuilding, IconGlobe];

export default function ServicesSection({ href, lang = "es" }: { href: string; lang?: Lang }) {
  const t = tr(lang).servicesTeaser;
  const services = t.items.map((it, i) => ({ ...it, icon: ICONS[i] }));
  // Dark intro panel + numbered list of services
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-6 lg:gap-10 items-stretch">
        <div data-reveal="left" className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-[#1E1A15] p-8 sm:p-10 flex flex-col justify-between min-h-[320px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,148,95,0.35),transparent_60%)]" />
          <div className="relative">
            <SectionTitle dark align="left" eyebrow={t.eyebrow} title={t.title} />
            <p className="text-[#CFC4B2] mt-5 leading-relaxed">{t.text}</p>
          </div>
          <Link href={href} className="relative mt-8 inline-flex items-center gap-2 self-start bg-[#B8945F] hover:bg-[#A4824F] text-white px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-colors pi-shine">
            {t.cta} <IconArrow />
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/pi-isotipo-blanco.png" alt="" className="absolute -bottom-6 -right-4 h-40 w-auto opacity-10" />
        </div>
        <div data-reveal="right" className="lg:col-span-3 bg-white rounded-3xl border border-[#E9E0D0] divide-y divide-[#EFE6D6]">
          {services.map(({ icon: I, title, text }, i) => (
            <Link key={title} href={href} className="group flex items-center gap-5 px-6 sm:px-8 py-5 hover:bg-[#FBF8F3] transition-colors first:rounded-t-3xl last:rounded-b-3xl">
              <span className="text-2xl text-[#D9BE8F] w-10 shrink-0 transition-colors group-hover:text-[#8A6A3A]" style={SERIF}>{String(i + 1).padStart(2, "0")}</span>
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
