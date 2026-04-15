"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import {
  PROPERTY_TYPES, OPERATION_TYPES, PROPERTY_STATUSES,
  formatCurrency, getLabel, getStatusColor,
} from "@/lib/constants";
import { PRICE_RANGES_SALE, PRICE_RANGES_RENT } from "@/lib/locations";
import { HiHome, HiLocationMarker, HiFilter, HiX, HiViewGrid, HiViewList } from "react-icons/hi";

interface Property {
  id: string;
  title: string;
  propertyType: string;
  operationType: string;
  status: string;
  address: string | null;
  sector: string | null;
  city: string | null;
  salePrice: number | null;
  rentPrice: number | null;
  currency: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  owner: { id: string; firstName: string; lastName: string } | null;
  ownerName: string | null;
}

export default function PropiedadesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [bedroomFilter, setBedroomFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const activeFilters = [statusFilter, typeFilter, operationFilter, priceRange, bedroomFilter].filter(Boolean).length;

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/properties?${params}`);
      const data = await res.json();
      setProperties(data);
      setLoading(false);
    }
    fetchProperties();
  }, [search, statusFilter]);

  // Client-side filtering for advanced filters
  const filteredProperties = properties.filter((prop) => {
    if (typeFilter && prop.propertyType !== typeFilter) return false;
    if (operationFilter && prop.operationType !== operationFilter) return false;
    if (bedroomFilter) {
      const beds = parseInt(bedroomFilter);
      if (beds === 4 && (prop.bedrooms || 0) < 4) return false;
      if (beds < 4 && prop.bedrooms !== beds) return false;
    }
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      const price = operationFilter === "ALQUILER" ? prop.rentPrice : prop.salePrice;
      if (price == null || price < min || price > max) return false;
    }
    return true;
  });

  function clearFilters() {
    setStatusFilter("");
    setTypeFilter("");
    setOperationFilter("");
    setPriceRange("");
    setBedroomFilter("");
  }

  const priceRanges = operationFilter === "ALQUILER" ? PRICE_RANGES_RENT : PRICE_RANGES_SALE;

  return (
    <div>
      <PageHeader title="Propiedades" subtitle={`${filteredProperties.length} resultados`}>
        <Link href="/propiedades/nuevo" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200">
          <HiHome className="w-4 h-4" />
          Nueva Propiedad
        </Link>
      </PageHeader>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por titulo, direccion, sector, ciudad..." />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-all ${
              showFilters || activeFilters > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <HiFilter className="w-4 h-4" />
            Filtros
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition-colors ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "bg-white text-gray-400 hover:text-gray-600"}`}
            >
              <HiViewGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "bg-white text-gray-400 hover:text-gray-600"}`}
            >
              <HiViewList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Filtros Avanzados</h3>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 font-medium hover:text-red-700 flex items-center gap-1">
                <HiX className="w-3 h-3" /> Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Estado</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">Todos</option>
                {PROPERTY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">Todos</option>
                {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Operacion</label>
              <select value={operationFilter} onChange={(e) => setOperationFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">Todas</option>
                {OPERATION_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Precio</label>
              <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">Cualquier precio</option>
                {priceRanges.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Habitaciones</label>
              <select value={bedroomFilter} onChange={(e) => setBedroomFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">Cualquiera</option>
                <option value="1">1 hab.</option>
                <option value="2">2 hab.</option>
                <option value="3">3 hab.</option>
                <option value="4">4+ hab.</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>
      ) : filteredProperties.length === 0 ? (
        <EmptyState title="No hay propiedades" message="Agrega tu primera propiedad para comenzar." actionLabel="Nueva Propiedad" actionHref="/propiedades/nuevo" />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((prop) => (
            <Link key={prop.id} href={`/propiedades/${prop.id}`} className="card-hover bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100/80">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center relative">
                <HiHome className="w-16 h-16 text-gray-300" />
                <div className="absolute top-3 right-3">
                  <StatusBadge label={getLabel(PROPERTY_STATUSES, prop.status)} colorClass={getStatusColor(PROPERTY_STATUSES, prop.status)} />
                </div>
                <div className="absolute top-3 left-3">
                  <StatusBadge label={getLabel(OPERATION_TYPES, prop.operationType)} colorClass={prop.operationType === "VENTA" ? "bg-blue-600 text-white" : "bg-teal-600 text-white"} />
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{prop.title}</h3>
                <p className="text-xs text-gray-400 mb-2">{getLabel(PROPERTY_TYPES, prop.propertyType)}</p>

                {(prop.sector || prop.city) && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <HiLocationMarker className="w-4 h-4 text-gray-400" />
                    <span>{[prop.sector, prop.city].filter(Boolean).join(", ")}</span>
                  </div>
                )}

                <div className="text-xl font-bold text-blue-700 mb-3">
                  {prop.operationType === "ALQUILER"
                    ? `${formatCurrency(prop.rentPrice, prop.currency)}/mes`
                    : formatCurrency(prop.salePrice, prop.currency)}
                </div>

                <div className="flex gap-3 text-sm text-gray-500 pt-3 border-t border-gray-100">
                  {prop.bedrooms != null && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      {prop.bedrooms} hab.
                    </span>
                  )}
                  {prop.bathrooms != null && <span>{prop.bathrooms} banos</span>}
                  {prop.area != null && <span>{prop.area} m2</span>}
                  {prop.parkingSpots != null && <span>{prop.parkingSpots} parq.</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100/80">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Propiedad</th>
                <th className="px-6 py-3">Ubicacion</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Precio</th>
                <th className="px-6 py-3">Detalles</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProperties.map((prop) => (
                <tr key={prop.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/propiedades/${prop.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {prop.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {[prop.sector, prop.city].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge label={getLabel(PROPERTY_TYPES, prop.propertyType)} colorClass="bg-gray-100 text-gray-700" />
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-700">
                    {prop.operationType === "ALQUILER" ? formatCurrency(prop.rentPrice, prop.currency) : formatCurrency(prop.salePrice, prop.currency)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {[prop.bedrooms && `${prop.bedrooms} hab`, prop.bathrooms && `${prop.bathrooms} banos`, prop.area && `${prop.area}m2`].filter(Boolean).join(" | ") || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge label={getLabel(PROPERTY_STATUSES, prop.status)} colorClass={getStatusColor(PROPERTY_STATUSES, prop.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
