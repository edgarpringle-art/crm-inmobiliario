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
import { HiHome, HiLocationMarker } from "react-icons/hi";

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

  return (
    <div>
      <PageHeader title="Propiedades" subtitle={`${properties.length} registros`}>
        <Link href="/propiedades/nuevo" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">
          + Nueva Propiedad
        </Link>
      </PageHeader>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por título, dirección, sector..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
          <option value="">Todos los estados</option>
          {PROPERTY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>
      ) : properties.length === 0 ? (
        <EmptyState title="No hay propiedades" message="Agrega tu primera propiedad para comenzar." actionLabel="Nueva Propiedad" actionHref="/propiedades/nuevo" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <Link key={prop.id} href={`/propiedades/${prop.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="bg-gray-100 p-6 flex items-center justify-center">
                <HiHome className="w-12 h-12 text-gray-400" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">{prop.title}</h3>
                  <StatusBadge label={getLabel(PROPERTY_STATUSES, prop.status)} colorClass={getStatusColor(PROPERTY_STATUSES, prop.status)} />
                </div>

                <div className="flex gap-2 mb-3">
                  <StatusBadge label={getLabel(PROPERTY_TYPES, prop.propertyType)} colorClass="bg-gray-100 text-gray-700" />
                  <StatusBadge label={getLabel(OPERATION_TYPES, prop.operationType)} colorClass={prop.operationType === "VENTA" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"} />
                </div>

                {(prop.address || prop.sector || prop.city) && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                    <HiLocationMarker className="w-4 h-4" />
                    <span>{[prop.sector, prop.city].filter(Boolean).join(", ") || prop.address}</span>
                  </div>
                )}

                <div className="text-xl font-bold text-blue-600 mb-3">
                  {prop.operationType === "ALQUILER"
                    ? `${formatCurrency(prop.rentPrice, prop.currency)}/mes`
                    : formatCurrency(prop.salePrice, prop.currency)}
                </div>

                <div className="flex gap-4 text-sm text-gray-600 mb-3">
                  {prop.bedrooms != null && <span>{prop.bedrooms} hab.</span>}
                  {prop.bathrooms != null && <span>{prop.bathrooms} baños</span>}
                  {prop.area != null && <span>{prop.area} m²</span>}
                  {prop.parkingSpots != null && <span>{prop.parkingSpots} parq.</span>}
                </div>

                <div className="text-xs text-gray-400">
                  Propietario: {prop.owner ? `${prop.owner.firstName} ${prop.owner.lastName}` : prop.ownerName || "—"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
