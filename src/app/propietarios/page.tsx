"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import { HiUser, HiPlus, HiOfficeBuilding } from "react-icons/hi";

interface Owner {
  id: string; firstName: string; lastName: string; email: string | null;
  phone: string | null; cedula: string | null; notes: string | null;
  propertyCount: number; createdAt: string;
}

export default function PropietariosPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/owners").then((r) => r.json()).then((d) => setOwners(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, []);

  const filtered = owners.filter((o) =>
    !search || `${o.firstName} ${o.lastName} ${o.email || ""} ${o.phone || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Propietarios" subtitle={`${owners.length} registros`}>
        <Link href="/propietarios/nuevo" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200">
          <HiPlus className="w-4 h-4" /> Nuevo Propietario
        </Link>
      </PageHeader>

      <div className="mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, teléfono, email..." />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No hay propietarios" message="Registra tu primer propietario." actionLabel="Nuevo Propietario" actionHref="/propietarios/nuevo" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((owner) => {
            const initials = `${owner.firstName[0]}${owner.lastName[0]}`.toUpperCase();
            return (
              <Link key={owner.id} href={`/propietarios/${owner.id}`}
                className="card-hover bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 flex items-start gap-4 hover:border-blue-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-lg">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{owner.firstName} {owner.lastName}</h3>
                  {owner.phone && <p className="text-sm text-gray-500 mt-0.5">{owner.phone}</p>}
                  {owner.email && <p className="text-sm text-gray-400 truncate">{owner.email}</p>}
                  <div className="flex items-center gap-1.5 mt-2">
                    <HiOfficeBuilding className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400">{owner.propertyCount} propiedad(es)</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
