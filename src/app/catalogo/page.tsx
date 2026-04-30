"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/constants";

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

const edgarPhone = "50763183113";

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IconWA = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const IconBed = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10M3 12h18M21 7v10M5 12V7a2 2 0 012-2h10a2 2 0 012 2v5"/>
  </svg>
);
const IconBath = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12V8a4 4 0 014-4h1M4 12v5a2 2 0 002 2h12a2 2 0 002-2v-5M20 12V9"/>
  </svg>
);
const IconArea = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0-5 5M4 16v4m0 0h4m-4 0 5-5m11 5-5-5m5 5v-4m0 4h-4"/>
  </svg>
);
const IconCar = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6M8 17H5a2 2 0 01-2-2v-4l2-5h14l2 5v4a2 2 0 01-2 2h-3M8 17v2m8-2v2M6.5 12h11"/>
  </svg>
);
const IconPin = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-7-7.8-7-11a7 7 0 1114 0c0 3.2-3 7-7 11z"/><circle cx="12" cy="10" r="2"/>
  </svg>
);
const IconHome = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconChevron = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
  </svg>
);
const IconImages = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="m21 15-5-5L5 21"/>
  </svg>
);

// ── Property Card ──────────────────────────────────────────────────────────────
function PropertyCard({ p }: { p: Property }) {
  const photo = p.photos[0];
  const loc = [p.sector, p.city].filter(Boolean).join(", ");
  const isVenta = p.operationType === "VENTA" || p.operationType === "VENTA_Y_ALQUILER";
  const isAlquiler = p.operationType === "ALQUILER" || p.operationType === "VENTA_Y_ALQUILER";
  const waText = encodeURIComponent(
    `Hola, me interesa la propiedad: ${p.title}${loc ? ` en ${loc}` : ""}\nhttps://crm-inmobiliario-eta.vercel.app/p/${p.id}`
  );

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col"
      style={{ fontFamily: "'Josefin Sans', sans-serif" }}
    >
      {/* Image */}
      <Link href={`/p/${p.id}`} className="block relative overflow-hidden bg-[#F0FDFA]" style={{ aspectRatio: "4/3" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-teal-200">
            <IconHome />
          </div>
        )}

        {/* Op badge */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isVenta && (
            <span className="bg-[#0369A1] text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg tracking-wide">
              VENTA
            </span>
          )}
          {isAlquiler && (
            <span className="bg-[#0F766E] text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg tracking-wide">
              ALQUILER
            </span>
          )}
        </div>

        {/* Photo count */}
        {p.photos.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-lg flex items-center gap-1">
            <IconImages /> {p.photos.length}
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[11px] font-semibold text-[#0F766E] uppercase tracking-widest mb-1">
          {typeLabel[p.propertyType]}
        </p>

        <Link href={`/p/${p.id}`} className="cursor-pointer">
          <h3
            className="font-semibold text-[#134E4A] leading-snug hover:text-[#0F766E] transition-colors duration-200 line-clamp-2 mb-1 text-[15px]"
            style={{ fontFamily: "'Josefin Sans', sans-serif" }}
          >
            {p.title}
          </h3>
        </Link>

        {loc && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
            <IconPin /> {loc}
          </p>
        )}

        {/* Prices */}
        <div className="flex flex-wrap gap-2 mb-3">
          {p.salePrice != null && (
            <p className="text-base font-bold text-[#0369A1]">
              {formatCurrency(p.salePrice, p.currency)}
            </p>
          )}
          {p.rentPrice != null && (
            <p className="text-base font-bold text-[#0F766E]">
              {formatCurrency(p.rentPrice, p.currency)}<span className="text-xs font-normal">/mes</span>
            </p>
          )}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
          {p.bedrooms != null && (
            <span className="flex items-center gap-1 text-gray-600">
              <IconBed />{p.bedrooms} hab
            </span>
          )}
          {p.bathrooms != null && (
            <span className="flex items-center gap-1 text-gray-600">
              <IconBath />{p.bathrooms} baños
            </span>
          )}
          {p.area != null && (
            <span className="flex items-center gap-1 text-gray-600">
              <IconArea />{p.area} m²
            </span>
          )}
          {p.parkingSpots != null && p.parkingSpots > 0 && (
            <span className="flex items-center gap-1 text-gray-600">
              <IconCar />{p.parkingSpots}
            </span>
          )}
        </div>

        {/* Amenity chips */}
        {(!!p.hasPool || !!p.hasAC || !!p.hasFurniture) && (
          <div className="flex flex-wrap gap-1 mb-4">
            {!!p.hasPool && (
              <span className="text-[10px] bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] px-2 py-0.5 rounded-full font-medium tracking-wide">
                Piscina
              </span>
            )}
            {!!p.hasAC && (
              <span className="text-[10px] bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] px-2 py-0.5 rounded-full font-medium tracking-wide">
                A/C
              </span>
            )}
            {!!p.hasFurniture && (
              <span className="text-[10px] bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] px-2 py-0.5 rounded-full font-medium tracking-wide">
                Amueblado
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <Link
            href={`/p/${p.id}`}
            className="flex-1 text-center text-sm font-semibold text-[#0F766E] border border-[#99F6E4] rounded-xl py-2 hover:bg-[#F0FDFA] transition-colors duration-200 cursor-pointer"
          >
            Ver detalles
          </Link>
          <a
            href={`https://wa.me/${edgarPhone}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
            className="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors duration-200 flex-shrink-0 cursor-pointer"
          >
            <IconWA />
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
  const [searchText, setSearchText] = useState("");

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (opFilter) params.set("op", opFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (bedsFilter) params.set("beds", bedsFilter);
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
  }, [opFilter, typeFilter, bedsFilter]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const filtered = properties.filter((p) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.sector?.toLowerCase().includes(q) ?? false) ||
      (p.city?.toLowerCase().includes(q) ?? false) ||
      (p.state?.toLowerCase().includes(q) ?? false)
    );
  });

  const waContact = encodeURIComponent("Hola, me interesa una propiedad de su catálogo.");

  return (
    <div className="min-h-screen" style={{ background: "#F8FFFE", fontFamily: "'Josefin Sans', sans-serif" }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#0369A1] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm" style={{ fontFamily: "'Cinzel', serif" }}>EP</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#134E4A] leading-tight tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
                E. Pringle Real Estate
              </p>
              <p className="text-[10px] text-gray-400 tracking-wider">Agente Licenciado · Panamá</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${edgarPhone}?text=${waContact}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer"
          >
            <IconWA />
            <span className="hidden sm:inline">Contactar</span>
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden py-14 sm:py-20 px-4"
        style={{ background: "linear-gradient(135deg, #134E4A 0%, #0F766E 50%, #0369A1 100%)" }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-[#99F6E4] text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            Catálogo de Propiedades
          </p>
          <h1
            className="text-3xl sm:text-4xl font-semibold text-white mb-3 leading-tight"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Encuentra tu propiedad<br className="hidden sm:block" /> ideal en Panamá
          </h1>
          <p className="text-white/70 text-sm mb-8">
            Venta y alquiler · Apartamentos, casas, penthouses y más
          </p>

          {/* Hero search bar */}
          <div className="relative max-w-xl mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar por título, sector, ciudad..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white text-[#134E4A] placeholder-gray-400 rounded-2xl text-sm font-medium shadow-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] transition-all duration-200"
              style={{ fontFamily: "'Josefin Sans', sans-serif" }}
            />
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Op filter pills */}
          {[
            { value: "", label: "Todo" },
            { value: "VENTA", label: "En Venta" },
            { value: "ALQUILER", label: "En Alquiler" },
          ].map((o) => (
            <button
              key={o.value}
              onClick={() => setOpFilter(o.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                opFilter === o.value
                  ? "bg-[#0F766E] text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-[#0F766E] hover:text-[#0F766E]"
              }`}
            >
              {o.label}
            </button>
          ))}

          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

          {/* Type select */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl px-4 py-2 pr-8 focus:outline-none focus:border-[#0F766E] hover:border-[#0F766E] transition-colors duration-200 cursor-pointer"
              style={{ fontFamily: "'Josefin Sans', sans-serif" }}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
              <IconChevron />
            </span>
          </div>

          {/* Beds select */}
          <div className="relative">
            <select
              value={bedsFilter}
              onChange={(e) => setBedsFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl px-4 py-2 pr-8 focus:outline-none focus:border-[#0F766E] hover:border-[#0F766E] transition-colors duration-200 cursor-pointer"
              style={{ fontFamily: "'Josefin Sans', sans-serif" }}
            >
              <option value="">Habitaciones</option>
              <option value="1">1+ hab</option>
              <option value="2">2+ hab</option>
              <option value="3">3+ hab</option>
              <option value="4">4+ hab</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
              <IconChevron />
            </span>
          </div>

          <span className="ml-auto text-xs text-gray-400 font-medium">
            {loading ? "Cargando..." : `${filtered.length} propiedad${filtered.length !== 1 ? "es" : ""}`}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="bg-[#F0FDFA] h-48" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-5 bg-gray-100 rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#F0FDFA] flex items-center justify-center text-[#99F6E4]">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <p className="text-[#134E4A] font-semibold mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
              Sin resultados
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Prueba con otros filtros o cuéntanos lo que buscas
            </p>
            <a
              href={`https://wa.me/${edgarPhone}?text=${encodeURIComponent("Hola, busco una propiedad en Panamá.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200 text-sm cursor-pointer"
            >
              <IconWA /> Consultar disponibilidad
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-gray-100 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p
            className="text-sm font-medium text-[#134E4A] mb-1 tracking-wide"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            E. Pringle Real Estate
          </p>
          <p className="text-xs text-gray-400 mb-3">Agente Licenciado · Panamá</p>
          <a
            href={`https://wa.me/${edgarPhone}?text=${encodeURIComponent("Hola, me interesa información sobre sus propiedades.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-green-600 font-semibold hover:text-green-700 transition-colors duration-200 cursor-pointer"
          >
            <IconWA /> +507 6318-3113
          </a>
        </div>
      </div>
    </div>
  );
}
