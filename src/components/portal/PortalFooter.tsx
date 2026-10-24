import Link from "next/link";
import { BROKER, portalHref, waLink } from "./brand";
import { IconInstagram, IconMail, IconPhone, IconWA } from "./icons";
import { tr, type Lang } from "./i18n";

export default function PortalFooter({ portal = false, lang = "es" }: { portal?: boolean; lang?: Lang }) {
  const t = tr(lang);
  const h = (path: string) => portalHref(path, portal);
  return (
    <footer className="bg-[#1E1A15] text-[#B5AA98] pt-16 pb-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
        <div className="lg:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/panamainmo-logo-blanco.png" alt="PanamaInmo" className="h-10 w-auto mb-5" />
          <p className="text-sm leading-relaxed max-w-md mb-4">
            {t.footer.tagline}
          </p>
          <p className="text-xs">
            <span className="uppercase tracking-[0.15em]">{t.footer.license}</span> <span className="text-[#D9BE8F] font-semibold ml-1">{BROKER.license}</span>
          </p>
        </div>

        <div>
          <p className="text-[#D9BE8F] text-xs font-semibold uppercase tracking-[0.2em] mb-4">{t.footer.explore}</p>
          <ul className="space-y-3 text-sm">
            <li><Link href={h("/propiedades")} className="hover:text-white transition-colors">{t.footer.all}</Link></li>
            <li><Link href={h("/venta")} className="hover:text-white transition-colors">{t.footer.sale}</Link></li>
            <li><Link href={h("/alquiler")} className="hover:text-white transition-colors">{t.footer.rent}</Link></li>
            <li><Link href={h("/venta/apartamentos")} className="hover:text-white transition-colors">{t.footer.apartments}</Link></li>
            <li><Link href={h("/venta/casas")} className="hover:text-white transition-colors">{t.footer.houses}</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[#D9BE8F] text-xs font-semibold uppercase tracking-[0.2em] mb-4">{t.footer.company}</p>
          <ul className="space-y-3 text-sm">
            <li><Link href={h("/servicios")} className="hover:text-white transition-colors">{t.nav.services}</Link></li>
            <li><Link href={h("/nosotros")} className="hover:text-white transition-colors">{t.nav.about}</Link></li>
            <li><Link href={h("/buscamos")} className="hover:text-white transition-colors">{t.nav.wanted}</Link></li>
            <li><Link href={h("/contacto")} className="hover:text-white transition-colors">{t.nav.contact}</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[#D9BE8F] text-xs font-semibold uppercase tracking-[0.2em] mb-4">{t.footer.contact}</p>
          <ul className="space-y-3 text-sm">
            <li><a href={`tel:+${BROKER.phone}`} className="flex items-center gap-2 hover:text-white transition-colors"><IconPhone />{BROKER.phoneDisplay}</a></li>
            <li><a href={`mailto:${BROKER.email}`} className="flex items-center gap-2 hover:text-white transition-colors"><IconMail /><span className="break-all">{BROKER.email}</span></a></li>
            <li><a href={BROKER.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><IconInstagram />@{BROKER.instagram}</a></li>
            <li><a href={waLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><IconWA className="w-3.5 h-3.5" />WhatsApp</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8C826F]">
        <p>© {new Date().getFullYear()} PanamaInmo. {t.footer.rights}</p>
        <p className="tracking-[0.2em] uppercase">Panamá · {t.footer.license} {BROKER.license}</p>
      </div>
    </footer>
  );
}
