"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/constants";
import { ZONAS } from "@/lib/zonas";

interface Property {
  id: string;
  title: string;
  propertyType: string;
  operationType: string;
  status: string;
  sector: string | null;
  city: string | null;
  state: string | null;
  salePrice: number | null;
  rentPrice: number | null;
  currency: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  hasPool: number;
  hasAC: number;
  hasFurniture: number;
  description: string | null;
  photos: string[];
}

const typeLabel: Record<string, string> = {
  APARTAMENTO: "Apartamento", PENTHOUSE: "Penthouse", CASA: "Casa", VILLA: "Villa",
  LOCAL: "Local", OFICINA: "Oficina", TERRENO: "Terreno", NAVE: "Nave", OTRO: "Otro",
};

const PROPERTY_TYPES = [
  { value: "", label: "Todos los tipos" },
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "CASA", label: "Casa" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "VILLA", label: "Villa" },
  { value: "LOCAL", label: "Local Comercial" },
  { value: "OFICINA", label: "Oficina" },
  { value: "TERRENO", label: "Terreno" },
  { value: "NAVE", label: "Nave Industrial" },
];

// Quick category cards on home
const QUICK_CATEGORIES = [
  { type: "APARTAMENTO", label: "Apartamentos", icon: "building" },
  { type: "CASA", label: "Casas", icon: "house" },
  { type: "PENTHOUSE", label: "Penthouses", icon: "tower" },
  { type: "LOCAL", label: "Locales", icon: "store" },
  { type: "OFICINA", label: "Oficinas", icon: "briefcase" },
  { type: "TERRENO", label: "Terrenos", icon: "tree" },
];

// Featured zones
const FEATURED_ZONES = [
  { name: "Costa del Este", img: "https://images.unsplash.com/photo-1565953522043-baea26b83b7e?auto=format&fit=crop&w=600&q=70" },
  { name: "Punta Pacífica", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=70" },
  { name: "Casco Viejo", img: "https://images.unsplash.com/photo-1568871391551-7e2dd2f7e0cf?auto=format&fit=crop&w=600&q=70" },
  { name: "Obarrio", img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=600&q=70" },
  { name: "San Francisco", img: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=600&q=70" },
  { name: "Coronado", img: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=70" },
];

const BROKER = {
  phone: "50763183113",
  phoneDisplay: "+507 6318-3113",
  email: "epringlerealtor@gmail.com",
  instagram: "epringle.realestate",
  instagramUrl: "https://www.instagram.com/epringle.realestate",
  license: "PN5016",
};

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const Icon = {
  search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  wa: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  phone: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mail: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>,
  instagram: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  badge: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  bed: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10M3 12h18M21 7v10M5 12V7a2 2 0 012-2h10a2 2 0 012 2v5"/></svg>,
  bath: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12V8a4 4 0 014-4h1M4 12v5a2 2 0 002 2h12a2 2 0 002-2v-5M20 12V9"/></svg>,
  area: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0-5 5M4 16v4m0 0h4m-4 0 5-5m11 5-5-5m5 5v-4m0 4h-4"/></svg>,
  car: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6M8 17H5a2 2 0 01-2-2v-4l2-5h14l2 5v4a2 2 0 01-2 2h-3M8 17v2m8-2v2M6.5 12h11"/></svg>,
  pin: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-7-7.8-7-11a7 7 0 1114 0c0 3.2-3 7-7 11z"/><circle cx="12" cy="10" r="2"/></svg>,
  building: () => <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 21V5a2 2 0 012-2h12a2 2 0 012 2v16M4 21h16M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/></svg>,
  house: () => <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  tower: () => <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 21V8l7-5 7 5v13M5 21h14M9 12h.01M15 12h.01M9 16h.01M15 16h.01"/></svg>,
  store: () => <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l1.5-5h15L21 9M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 14h6"/></svg>,
  briefcase: () => <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/></svg>,
  tree: () => <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22V14M8 14a4 4 0 010-8 4 4 0 014-4 4 4 0 014 4 4 4 0 010 8z"/></svg>,
  arrow: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>,
  images: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
  chevron: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>,
  menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>,
  close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 6l12 12M6 18L18 6"/></svg>,
};

// ── Property Card ──────────────────────────────────────────────────────────────
function PropertyCard({ p }: { p: Property }) {
  const photo = p.photos[0];
  const loc = [p.sector, p.city].filter(Boolean).join(", ");
  const isVenta = p.operationType === "VENTA" || p.operationType === "VENTA_Y_ALQUILER";
  const isAlquiler = p.operationType === "ALQUILER" || p.operationType === "VENTA_Y_ALQUILER";
  const waText = encodeURIComponent(
    `Hola, me interesa la propiedad: ${p.title}${loc ? ` en ${loc}` : ""}\nhttps://panamainmo.com/p/${p.id}`
  );

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-stone-200 hover:border-stone-300 hover:shadow-xl transition-all duration-300 group flex flex-col cursor-pointer"
      style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
      <Link href={`/p/${p.id}`} className="block relative overflow-hidden bg-stone-100" style={{ aspectRatio: "4/3" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={p.title} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300"><Icon.house /></div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isVenta && (
            <span className="bg-stone-900 text-white text-[10px] font-semibold px-3 py-1 rounded uppercase tracking-[0.15em]">Venta</span>
          )}
          {isAlquiler && (
            <span className="bg-[#0F766E] text-white text-[10px] font-semibold px-3 py-1 rounded uppercase tracking-[0.15em]">Alquiler</span>
          )}
        </div>
        {p.photos.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
            <Icon.images /> {p.photos.length}
          </span>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-2">{typeLabel[p.propertyType]}</p>
        <Link href={`/p/${p.id}`}>
          <h3 className="font-semibold text-stone-900 leading-snug hover:text-[#0F766E] transition-colors duration-200 line-clamp-2 mb-1.5 text-base"
            style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.01em" }}>
            {p.title}
          </h3>
        </Link>
        {loc && <p className="text-xs text-stone-500 flex items-center gap-1 mb-3"><Icon.pin />{loc}</p>}

        <div className="flex flex-col gap-0.5 mb-3">
          {p.salePrice != null && (
            <p className="text-lg font-bold text-stone-900">{formatCurrency(p.salePrice, p.currency)}</p>
          )}
          {p.rentPrice != null && (
            <p className="text-base font-bold text-[#0F766E]">{formatCurrency(p.rentPrice, p.currency)}<span className="text-xs font-normal text-stone-500">/mes</span></p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-stone-600 mb-4 flex-wrap pb-3 border-b border-stone-100">
          {p.bedrooms != null && <span className="flex items-center gap-1"><Icon.bed />{p.bedrooms} hab</span>}
          {p.bathrooms != null && <span className="flex items-center gap-1"><Icon.bath />{p.bathrooms} baños</span>}
          {p.area != null && <span className="flex items-center gap-1"><Icon.area />{p.area} m²</span>}
          {p.parkingSpots != null && p.parkingSpots > 0 && <span className="flex items-center gap-1"><Icon.car />{p.parkingSpots}</span>}
        </div>

        <div className="flex gap-2 mt-auto">
          <Link href={`/p/${p.id}`}
            className="flex-1 text-center text-xs font-semibold text-stone-900 border border-stone-900 rounded py-2.5 hover:bg-stone-900 hover:text-white transition-all duration-200 cursor-pointer uppercase tracking-[0.15em]">
            Ver Ficha
          </Link>
          <a href={`https://wa.me/${BROKER.phone}?text=${waText}`} target="_blank" rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
            className="flex items-center justify-center w-11 h-11 bg-green-500 hover:bg-green-600 text-white rounded transition-colors duration-200 flex-shrink-0 cursor-pointer">
            <Icon.wa />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CatalogoPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [opFilter, setOpFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [bedsFilter, setBedsFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (opFilter) params.set("op", opFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (bedsFilter) params.set("beds", bedsFilter);
    if (zoneFilter) params.set("zone", zoneFilter);
    const url = `/api/catalogo${params.toString() ? "?" + params.toString() : ""}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [opFilter, typeFilter, bedsFilter, zoneFilter]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const filtered = useMemo(() => properties.filter((p) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.sector?.toLowerCase().includes(q) ?? false) ||
      (p.city?.toLowerCase().includes(q) ?? false) ||
      (p.state?.toLowerCase().includes(q) ?? false)
    );
  }), [properties, searchText]);

  const propsScroll = () => {
    const el = document.getElementById("propiedades");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setCategoryAndScroll = (type: string) => {
    setTypeFilter(type);
    setTimeout(propsScroll, 100);
  };

  const setZoneAndScroll = (z: string) => {
    setZoneFilter(z);
    setTimeout(propsScroll, 100);
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Josefin Sans', sans-serif", color: "#1c1917" }}>

      {/* ─── Top utility bar (desktop) ─── */}
      <div className="hidden md:block bg-stone-900 text-stone-300 text-xs">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a href={`tel:+${BROKER.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Icon.phone /> {BROKER.phoneDisplay}
            </a>
            <a href={`mailto:${BROKER.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Icon.mail /> {BROKER.email}
            </a>
            <a href={BROKER.instagramUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Icon.instagram /> @{BROKER.instagram}
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-stone-400">
            <Icon.badge /> Licencia <span className="text-white font-semibold tracking-wider">{BROKER.license}</span>
          </div>
        </div>
      </div>

      {/* ─── Main navbar ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/catalogo" className="flex items-center gap-3 cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="EP" className="w-10 h-10 sm:w-11 sm:h-11" />
            <div className="border-l border-stone-300 pl-3">
              <p className="text-sm sm:text-base font-medium text-stone-900 leading-tight tracking-[0.18em]"
                style={{ fontFamily: "'Cinzel', serif" }}>
                EDGAR PRINGLE
              </p>
              <p className="text-[10px] sm:text-[11px] text-stone-500 tracking-[0.2em] uppercase">Real Estate · Panamá</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => { setOpFilter(""); propsScroll(); }}
              className="text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors uppercase tracking-[0.15em] cursor-pointer">
              Propiedades
            </button>
            <button onClick={() => { setOpFilter("VENTA"); propsScroll(); }}
              className="text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors uppercase tracking-[0.15em] cursor-pointer">
              Comprar
            </button>
            <button onClick={() => { setOpFilter("ALQUILER"); propsScroll(); }}
              className="text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors uppercase tracking-[0.15em] cursor-pointer">
              Alquilar
            </button>
            <a href={`https://wa.me/${BROKER.phone}`} target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors uppercase tracking-[0.15em] cursor-pointer">
              Contacto
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a href={`https://wa.me/${BROKER.phone}?text=${encodeURIComponent("Hola, me interesa una propiedad de su catálogo.")}`}
              target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer">
              <Icon.wa /> WhatsApp
            </a>
            <button onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2 text-stone-900 cursor-pointer" aria-label="Menu">
              {mobileMenu ? <Icon.close /> : <Icon.menu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-stone-200 bg-white">
            <div className="px-6 py-4 flex flex-col gap-4">
              <button onClick={() => { setOpFilter(""); propsScroll(); setMobileMenu(false); }}
                className="text-left text-sm font-medium text-stone-700 uppercase tracking-[0.15em] cursor-pointer">Propiedades</button>
              <button onClick={() => { setOpFilter("VENTA"); propsScroll(); setMobileMenu(false); }}
                className="text-left text-sm font-medium text-stone-700 uppercase tracking-[0.15em] cursor-pointer">Comprar</button>
              <button onClick={() => { setOpFilter("ALQUILER"); propsScroll(); setMobileMenu(false); }}
                className="text-left text-sm font-medium text-stone-700 uppercase tracking-[0.15em] cursor-pointer">Alquilar</button>
              <div className="border-t border-stone-200 pt-3 flex flex-col gap-2 text-xs text-stone-500">
                <a href={`tel:+${BROKER.phone}`} className="flex items-center gap-2"><Icon.phone />{BROKER.phoneDisplay}</a>
                <a href={`mailto:${BROKER.email}`} className="flex items-center gap-2"><Icon.mail />{BROKER.email}</a>
                <a href={BROKER.instagramUrl} className="flex items-center gap-2" target="_blank" rel="noopener noreferrer"><Icon.instagram />@{BROKER.instagram}</a>
                <span className="flex items-center gap-2 text-stone-400"><Icon.badge />Lic. {BROKER.license}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=2400&q=80')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/60 to-stone-900/85" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36 text-center">
          <p className="text-[#99F6E4] text-[11px] font-semibold uppercase tracking-[0.4em] mb-5">
            Bienes Raíces · Panamá
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-white leading-tight mb-5"
            style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.01em" }}>
            Encuentra tu próximo<br />hogar en Panamá
          </h1>
          <p className="text-white/80 text-sm sm:text-base mb-10 max-w-xl mx-auto leading-relaxed">
            Asesoría profesional en compra, venta y alquiler de propiedades. Apartamentos, casas, penthouses y más.
          </p>

          {/* Search box */}
          <div className="bg-white rounded-lg shadow-2xl p-2 sm:p-3 max-w-3xl mx-auto">
            {/* Op tabs */}
            <div className="flex gap-1 mb-2 p-1 bg-stone-100 rounded">
              {[
                { v: "", l: "Todo" },
                { v: "VENTA", l: "Comprar" },
                { v: "ALQUILER", l: "Alquilar" },
              ].map((o) => (
                <button key={o.v} onClick={() => setOpFilter(o.v)}
                  className={`flex-1 py-2 text-xs font-semibold uppercase tracking-[0.15em] rounded transition-all duration-200 cursor-pointer ${
                    opFilter === o.v ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
                  }`}>
                  {o.l}
                </button>
              ))}
            </div>

            {/* Search inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"><Icon.search /></span>
                <input type="text" placeholder="Buscar por nombre o sector..." value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 text-sm border border-stone-200 rounded text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-900 transition-colors duration-200"
                  style={{ fontFamily: "'Josefin Sans', sans-serif" }}
                />
              </div>
              <div className="sm:col-span-3 relative">
                <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-stone-200 text-stone-700 text-sm rounded px-3 py-3 pr-9 focus:outline-none focus:border-stone-900 transition-colors duration-200 cursor-pointer">
                  <option value="">Todas las zonas</option>
                  {ZONAS.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.zones.map((z) => <option key={z} value={z}>{z}</option>)}
                    </optgroup>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><Icon.chevron /></span>
              </div>
              <div className="sm:col-span-2 relative">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-stone-200 text-stone-700 text-sm rounded px-3 py-3 pr-9 focus:outline-none focus:border-stone-900 transition-colors duration-200 cursor-pointer">
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><Icon.chevron /></span>
              </div>
              <button onClick={propsScroll}
                className="sm:col-span-2 flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-[0.15em] rounded px-4 py-3 transition-colors duration-200 cursor-pointer">
                <Icon.search /> Buscar
              </button>
            </div>
          </div>

          <p className="text-white/50 text-[10px] tracking-[0.2em] uppercase mt-6">
            Licencia <span className="text-white">{BROKER.license}</span> · Panamá
          </p>
        </div>
      </section>

      {/* ─── Quick categories ─── */}
      <section className="bg-stone-50 py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#0F766E] text-[10px] font-semibold uppercase tracking-[0.3em] mb-3">Categorías</p>
            <h2 className="text-2xl sm:text-3xl font-medium text-stone-900 mb-2"
              style={{ fontFamily: "'Cinzel', serif" }}>
              Explora por Tipo
            </h2>
            <p className="text-stone-500 text-sm">Selecciona la categoría que buscas</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {QUICK_CATEGORIES.map((c) => {
              const I = Icon[c.icon as keyof typeof Icon];
              const count = properties.filter((p) => p.propertyType === c.type).length;
              return (
                <button key={c.type} onClick={() => setCategoryAndScroll(c.type)}
                  className="group bg-white border border-stone-200 hover:border-stone-900 p-5 rounded-lg text-center transition-all duration-200 hover:shadow-md cursor-pointer">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-stone-50 group-hover:bg-stone-900 flex items-center justify-center text-stone-700 group-hover:text-white transition-colors duration-200">
                    {I && <I />}
                  </div>
                  <p className="text-sm font-semibold text-stone-900 mb-0.5"
                    style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>{c.label}</p>
                  <p className="text-[11px] text-stone-400 tracking-wide">{count} disponible{count !== 1 ? "s" : ""}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Properties grid ─── */}
      <section id="propiedades" className="py-14 sm:py-16 px-4 sm:px-6 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-4">
            <div>
              <p className="text-[#0F766E] text-[10px] font-semibold uppercase tracking-[0.3em] mb-2">Listado</p>
              <h2 className="text-2xl sm:text-3xl font-medium text-stone-900"
                style={{ fontFamily: "'Cinzel', serif" }}>
                Propiedades Disponibles
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                {loading ? "Cargando..." : `${filtered.length} propiedad${filtered.length !== 1 ? "es" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Active filters */}
            <div className="flex flex-wrap gap-2 items-center">
              {(opFilter || typeFilter || zoneFilter || bedsFilter || searchText) && (
                <button onClick={() => { setOpFilter(""); setTypeFilter(""); setZoneFilter(""); setBedsFilter(""); setSearchText(""); }}
                  className="text-xs text-stone-500 hover:text-stone-900 underline cursor-pointer">
                  Limpiar filtros
                </button>
              )}
              <div className="relative">
                <select value={bedsFilter} onChange={(e) => setBedsFilter(e.target.value)}
                  className="appearance-none bg-white border border-stone-200 text-stone-700 text-xs font-medium rounded px-3 py-2 pr-8 focus:outline-none focus:border-stone-900 cursor-pointer">
                  <option value="">Habitaciones</option>
                  <option value="1">1+ hab</option>
                  <option value="2">2+ hab</option>
                  <option value="3">3+ hab</option>
                  <option value="4">4+ hab</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-stone-400"><Icon.chevron /></span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-stone-200 animate-pulse">
                  <div className="bg-stone-100 h-56" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-stone-100 rounded w-1/3" />
                    <div className="h-4 bg-stone-100 rounded w-3/4" />
                    <div className="h-4 bg-stone-100 rounded w-1/2" />
                    <div className="h-5 bg-stone-100 rounded w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 border border-stone-100 rounded-xl bg-stone-50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center text-stone-300 border border-stone-200"><Icon.house /></div>
              <p className="text-stone-900 font-semibold mb-1" style={{ fontFamily: "'Cinzel', serif" }}>Sin resultados</p>
              <p className="text-sm text-stone-500 mb-4">Prueba con otros filtros o cuéntanos qué estás buscando</p>
              <a href={`https://wa.me/${BROKER.phone}?text=${encodeURIComponent("Hola, busco una propiedad en Panamá.")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold px-6 py-3 rounded text-xs uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer">
                <Icon.wa /> Consultar disponibilidad
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ─── Featured zones ─── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#0F766E] text-[10px] font-semibold uppercase tracking-[0.3em] mb-3">Ubicaciones</p>
            <h2 className="text-2xl sm:text-3xl font-medium text-stone-900 mb-2"
              style={{ fontFamily: "'Cinzel', serif" }}>
              Zonas Destacadas
            </h2>
            <p className="text-stone-500 text-sm">Las áreas más buscadas en Panamá</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {FEATURED_ZONES.map((z) => {
              const count = properties.filter((p) => p.sector === z.name || p.city === z.name).length;
              return (
                <button key={z.name} onClick={() => setZoneAndScroll(z.name)}
                  className="group relative h-44 rounded-lg overflow-hidden cursor-pointer border border-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={z.img} alt={z.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                    <p className="text-white text-base font-semibold mb-0.5" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.03em" }}>{z.name}</p>
                    <p className="text-white/70 text-[10px] tracking-[0.2em] uppercase">{count} propiedad{count !== 1 ? "es" : ""}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── About / Trust ─── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="EP" className="w-16 h-16 mx-auto mb-6" />
          <p className="text-[#0F766E] text-[10px] font-semibold uppercase tracking-[0.3em] mb-3">Sobre Edgar Pringle</p>
          <h2 className="text-2xl sm:text-3xl font-medium text-stone-900 mb-5"
            style={{ fontFamily: "'Cinzel', serif" }}>
            Asesoría inmobiliaria con experiencia
          </h2>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-8">
            Agente inmobiliario licenciado en Panamá. Te acompaño en cada paso del proceso de compra, venta o alquiler — con transparencia, dedicación y conocimiento profundo del mercado local.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={`https://wa.me/${BROKER.phone}?text=${encodeURIComponent("Hola Edgar, me interesa información sobre tus servicios.")}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-7 py-3 rounded text-xs uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer">
              <Icon.wa /> WhatsApp
            </a>
            <a href={`mailto:${BROKER.email}`}
              className="inline-flex items-center gap-2 bg-white border border-stone-900 hover:bg-stone-900 hover:text-white text-stone-900 font-semibold px-7 py-3 rounded text-xs uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer">
              <Icon.mail /> Escribir
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-stone-900 text-stone-400 pt-14 pb-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="EP" className="w-12 h-12 invert" />
              <div className="border-l border-stone-700 pl-3">
                <p className="text-white text-base font-medium tracking-[0.2em]" style={{ fontFamily: "'Cinzel', serif" }}>EDGAR PRINGLE</p>
                <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em]">Real Estate · Panamá</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-stone-400 max-w-md mb-4">
              Asesoría inmobiliaria profesional en Panamá. Compra, venta y alquiler de propiedades con transparencia y dedicación.
            </p>
            <p className="text-xs text-stone-500">
              <span className="uppercase tracking-[0.15em]">Licencia</span> <span className="text-white font-semibold ml-1">{BROKER.license}</span>
            </p>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-4">Contacto</p>
            <ul className="space-y-3 text-sm">
              <li><a href={`tel:+${BROKER.phone}`} className="flex items-center gap-2 hover:text-white transition-colors"><Icon.phone />{BROKER.phoneDisplay}</a></li>
              <li><a href={`mailto:${BROKER.email}`} className="flex items-center gap-2 hover:text-white transition-colors break-all"><Icon.mail /><span className="break-all">{BROKER.email}</span></a></li>
              <li><a href={BROKER.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><Icon.instagram />@{BROKER.instagram}</a></li>
              <li><a href={`https://wa.me/${BROKER.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><Icon.wa />WhatsApp</a></li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-4">Explorar</p>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => { setOpFilter(""); propsScroll(); }} className="hover:text-white transition-colors cursor-pointer">Todas las propiedades</button></li>
              <li><button onClick={() => { setOpFilter("VENTA"); propsScroll(); }} className="hover:text-white transition-colors cursor-pointer">En venta</button></li>
              <li><button onClick={() => { setOpFilter("ALQUILER"); propsScroll(); }} className="hover:text-white transition-colors cursor-pointer">En alquiler</button></li>
              <li><button onClick={() => setCategoryAndScroll("APARTAMENTO")} className="hover:text-white transition-colors cursor-pointer">Apartamentos</button></li>
              <li><button onClick={() => setCategoryAndScroll("CASA")} className="hover:text-white transition-colors cursor-pointer">Casas</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Edgar Pringle Real Estate. Todos los derechos reservados.</p>
          <p className="tracking-[0.2em] uppercase">Panamá · Lic. {BROKER.license}</p>
        </div>
      </footer>
    </div>
  );
}
