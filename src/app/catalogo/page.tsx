"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/constants";
import { HiSearch, HiFilter, HiPhone } from "react-icons/hi";

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
const opLabel: Record<string, string> = {
  VENTA: "En Venta", ALQUILER: "En Alquiler", VENTA_Y_ALQUILER: "Venta / Alquiler",
};
const opColor: Record<string, string> = {
  VENTA: "bg-blue-600", ALQUILER: "bg-teal-600", VENTA_Y_ALQUILER: "bg-indigo-600",
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

function PropertyCard({ p }: { p: Property }) {
  const photo = p.photos[0];
  const loc = [p.sector, p.city].filter(Boolean).join(", ");
  const price = p.salePrice != null
    ? formatCurrency(p.salePrice, p.currency)
    : p.rentPrice != null
    ? `${formatCurrency(p.rentPrice, p.currency)}/mes`
    : null;

  const waText = encodeURIComponent(
    `Hola, me interesa la propiedad: ${p.title}${loc ? ` en ${loc}` : ""}\nhttps://crm-inmobiliaria-eta.vercel.app/p/${p.id}`
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all group">
      {/* Image */}
      <Link href={`/p/${p.id}`} className="block relative aspect-[4/3] overflow-hidden bg-gray-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}
        {/* Op badge */}
        <span className={`absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-xl ${opColor[p.operationType] || "bg-gray-600"}`}>
          {opLabel[p.operationType]}
        </span>
        {/* Photo count */}
        {p.photos.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-lg">
            {p.photos.length} fotos
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{typeLabel[p.propertyType]}</p>
        <Link href={`/p/${p.id}`}>
          <h3 className="font-bold text-gray-900 leading-snug hover:text-blue-600 transition-colors line-clamp-2 mb-1">
            {p.title}
          </h3>
        </Link>
        {loc && <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">📍 {loc}</p>}

        {/* Price */}
        {price && (
          <p className={`text-lg font-bold mb-3 ${p.operationType === "ALQUILER" ? "text-teal-700" : "text-blue-700"}`}>
            {price}
          </p>
        )}

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          {p.bedrooms != null && (
            <span className="flex items-center gap-1">🛏 {p.bedrooms} hab</span>
          )}
          {p.bathrooms != null && (
            <span className="flex items-center gap-1">🚿 {p.bathrooms} baños</span>
          )}
          {p.area != null && (
            <span className="flex items-center gap-1">📐 {p.area} m²</span>
          )}
          {p.parkingSpots != null && p.parkingSpots > 0 && (
            <span className="flex items-center gap-1">🚗 {p.parkingSpots}</span>
          )}
        </div>

        {/* Amenity chips */}
        <div className="flex flex-wrap gap-1 mb-4">
          {!!p.hasPool && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Piscina</span>}
          {!!p.hasAC && <span className="text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full font-medium">A/C</span>}
          {!!p.hasFurniture && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">Amueblado</span>}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/p/${p.id}`}
            className="flex-1 text-center text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl py-2 hover:bg-blue-50 transition-colors"
          >
            Ver detalles
          </Link>
          <a
            href={`https://wa.me/${edgarPhone}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors flex-shrink-0"
            title="WhatsApp"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

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

  const waText = encodeURIComponent("Hola, me interesa una propiedad de su catálogo.");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">EP</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">E. Pringle Real Estate</p>
              <p className="text-[10px] text-gray-400">Agente Licenciado · Panamá</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${edgarPhone}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <HiPhone className="w-4 h-4" />
            <span className="hidden sm:inline">Contactar</span>
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Propiedades en Panamá</h1>
          <p className="text-white/80 text-sm">Encuentra tu próxima propiedad — venta y alquiler</p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, sector, ciudad..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Operation */}
              <select
                value={opFilter}
                onChange={(e) => setOpFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Venta y Alquiler</option>
                <option value="VENTA">En Venta</option>
                <option value="ALQUILER">En Alquiler</option>
              </select>
              {/* Type */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {/* Bedrooms */}
              <select
                value={bedsFilter}
                onChange={(e) => setBedsFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Habitaciones</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
          </div>
          {/* Results count */}
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <HiFilter className="w-3 h-3" />
            {loading ? "Cargando..." : `${filtered.length} propiedad${filtered.length !== 1 ? "es" : ""} disponible${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-semibold mb-1">Sin resultados</p>
            <p className="text-sm text-gray-400">Intenta con otros filtros o{" "}
              <a href={`https://wa.me/${edgarPhone}?text=${encodeURIComponent("Hola, busco una propiedad en Panamá.")}`} target="_blank" rel="noopener noreferrer" className="text-green-600 font-semibold hover:underline">
                contáctanos
              </a>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-white py-6 text-center">
        <p className="text-xs text-gray-400">E. Pringle Real Estate · Agente Licenciado · Panamá</p>
        <a
          href={`https://wa.me/${edgarPhone}?text=${encodeURIComponent("Hola, me interesa información sobre sus propiedades.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-2 text-xs text-green-600 font-semibold hover:underline"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          +507 6318-3113
        </a>
      </div>
    </div>
  );
}
