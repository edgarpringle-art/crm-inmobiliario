"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BROKER, NAV, waLink } from "./brand";
import { IconBadge, IconClose, IconInstagram, IconMail, IconMenu, IconPhone, IconWA } from "./icons";

export default function PortalHeader() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/catalogo" ? pathname === "/catalogo" : pathname.startsWith(href) || (href === "/catalogo/propiedades" && pathname.startsWith("/p/"));

  return (
    <>
      {/* Utility bar */}
      <div className="hidden md:block bg-[#1E1A15] text-[#CFC4B2] text-xs">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href={`tel:+${BROKER.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors"><IconPhone /> {BROKER.phoneDisplay}</a>
            <a href={`mailto:${BROKER.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors"><IconMail /> {BROKER.email}</a>
            <a href={BROKER.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors"><IconInstagram /> @{BROKER.instagram}</a>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#B8945F]"><IconBadge /></span> Licencia <span className="text-white font-semibold tracking-wider">{BROKER.license}</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-[#FBF8F3]/95 backdrop-blur-md border-b border-[#E4D9C6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link href="/catalogo" className="shrink-0" aria-label="PanamaInmo — Inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/panamainmo-logo.png" alt="PanamaInmo — Real Estate & Legal Advisory" className="h-9 sm:h-11 w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className={`relative text-[12px] xl:text-[13px] font-medium uppercase tracking-[0.16em] transition-colors py-1 ${
                  isActive(n.href) ? "text-[#1E1A15]" : "text-[#6B6155] hover:text-[#1E1A15]"
                }`}>
                {n.label}
                {isActive(n.href) && <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#B8945F]" />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href={waLink("Hola PanamaInmo, me interesa una propiedad.")} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 bg-[#B8945F] hover:bg-[#A4824F] text-white px-3.5 xl:px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-colors">
              <IconWA /> <span className="hidden xl:inline">WhatsApp</span>
            </a>
            <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-[#1E1A15]" aria-label="Menú">
              {open ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-[#E4D9C6] bg-[#FBF8F3]">
            <div className="px-6 py-5 flex flex-col gap-4">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                  className={`text-sm font-medium uppercase tracking-[0.18em] ${isActive(n.href) ? "text-[#8A6A3A]" : "text-[#1E1A15]"}`}>
                  {n.label}
                </Link>
              ))}
              <a href={waLink("Hola PanamaInmo, me interesa una propiedad.")} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#B8945F] text-white py-3 rounded-full text-xs font-semibold uppercase tracking-[0.15em]">
                <IconWA /> WhatsApp
              </a>
              <div className="border-t border-[#E4D9C6] pt-4 flex flex-col gap-2 text-xs text-[#6B6155]">
                <a href={`tel:+${BROKER.phone}`} className="flex items-center gap-2"><IconPhone />{BROKER.phoneDisplay}</a>
                <a href={`mailto:${BROKER.email}`} className="flex items-center gap-2"><IconMail />{BROKER.email}</a>
                <span className="flex items-center gap-2"><IconBadge />Lic. {BROKER.license}</span>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
